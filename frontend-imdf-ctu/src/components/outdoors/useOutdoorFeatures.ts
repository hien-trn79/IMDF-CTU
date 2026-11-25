import { useEffect, useMemo, useRef, useState } from 'react'
import { useLevel } from '../../context/LevelContext'
import { useUser } from '../../context/UserContext'
import { authHeaders } from '../../services/authHeaders'

export function useOutdoorFeatures(
  selectedBuildingId?: number,
  selectedLevelOrdinal?: number,
  _selectedLevelGeometry?: GeoJSON.Geometry
) {
  const { unitGeoJson, isLoadingUnits, selectedTables, selectedLevelId, dataVersion } = useLevel()
  const { token } = useUser()
  const [tableFeatures, setTableFeatures] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Cache dữ liệu theo key: table-buildingId-levelId để load tức thì khi chuyển tab/tầng
  const cacheRef = useRef<Map<string, any[]>>(new Map())

  // Xóa cache khi dataVersion thay đổi (do thêm/sửa/xóa)
  useEffect(() => {
    cacheRef.current.clear()
  }, [dataVersion])

  useEffect(() => {
    if (!selectedLevelId || selectedTables.length === 0) {
      setTableFeatures([])
      return
    }

    const controller = new AbortController()
    const fetchRows = async () => {
      const apiTables = selectedTables.filter((table) => table !== 'unit')
      if (apiTables.length === 0) {
        setTableFeatures([])
        return
      }

      // Kiểm tra xem tất cả các table cần lấy đã có trong cache chưa
      const missingTables: string[] = []
      const cachedResults: any[] = []

      for (const table of apiTables) {
        const cacheKey = `${table}-${selectedBuildingId}-${selectedLevelId}`
        if (cacheRef.current.has(cacheKey)) {
          cachedResults.push(...(cacheRef.current.get(cacheKey) || []))
        } else {
          missingTables.push(table)
        }
      }

      // Nếu tất cả đã có trong cache, set luôn không cần gọi API (tốc độ tức thì)
      if (missingTables.length === 0) {
        setTableFeatures(cachedResults)
        return
      }

      setIsLoading(true)
      try {
        const newResults = await Promise.all(
          missingTables.map(async (table) => {
            const query =
              table === 'level'
                ? `?buildingId=${selectedBuildingId}&page=0&size=100&sort=id,ASC`
                : `?levelId=${selectedLevelId}`
            const endpoint = table === 'level' ? 'levels' : table
            const response = await fetch(`http://localhost:8081/api/${endpoint}${query}`, {
              headers: authHeaders(token ?? ''),
              signal: controller.signal,
            })
            if (!response.ok) throw new Error(`HTTP ${response.status} khi tải ${table}`)

            const data = await response.json()
            const rows = Array.isArray(data)
              ? data
              : (data.content ?? data.data?.content ?? data.features ?? data.data?.features ?? [])

            const filtered = rows
              .filter((row: any) =>
                belongsToSelectedLevel(row, table, selectedLevelId, selectedLevelOrdinal)
              )
              .map((row: any, index: number) => ({
                feature: toGeoJsonFeature(table, row),
                layer: { id: `api-${table}`, layerName: table },
                index,
              }))

            // Lưu vào cache
            const cacheKey = `${table}-${selectedBuildingId}-${selectedLevelId}`
            cacheRef.current.set(cacheKey, filtered)
            return filtered
          })
        )

        if (!controller.signal.aborted) {
          setTableFeatures([...cachedResults, ...newResults.flat()])
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Lỗi khi tải các bảng outdoor:', error)
          setTableFeatures([])
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    fetchRows()
    return () => controller.abort()
  }, [
    selectedTables,
    selectedLevelId,
    selectedLevelOrdinal,
    dataVersion,
    token,
    selectedBuildingId,
  ])

  const features = useMemo(() => {
    const unitFeatures = selectedTables.includes('unit')
      ? (unitGeoJson?.features ?? []).map((feature, index) => ({
          feature,
          layer: { id: 'api-units', layerName: 'unit' },
          index,
        }))
      : []
    return [...unitFeatures, ...tableFeatures]
  }, [selectedTables, tableFeatures, unitGeoJson])

  return { features, isLoading: isLoading || isLoadingUnits }
}

function toGeoJsonFeature(table: string, row: any) {
  if (row?.type === 'Feature' && row.geometry) {
    return { ...row, id: String(row.id), properties: row.properties ?? {} }
  }
  const geometry =
    table === 'amenity' || table === 'amenities' ? parseWktPoint(row.geometry) : row.geometry
  return {
    type: 'Feature',
    id: String(row.id),
    geometry: geometry ?? { type: 'Point', coordinates: [] },
    properties: { ...row },
  }
}

// Tối ưu hóa cực nhanh O(1) thay vì lặp kiểm tra điểm trong đa giác (pointInRing) nặng nề
function belongsToSelectedLevel(
  row: any,
  table: string,
  selectedLevelId: string | null,
  selectedLevelOrdinal?: number
) {
  if (!selectedLevelId) return false
  const properties = row?.properties ?? row

  if (table === 'level') {
    const ordinal = properties?.ordinal ?? row?.ordinal
    return selectedLevelOrdinal !== undefined && Number(ordinal) === Number(selectedLevelOrdinal)
  }

  // Nếu có levelId
  const rowLevelId =
    properties?.levelId ??
    properties?.level_id ??
    properties?.level ??
    row?.levelId ??
    row?.level_id ??
    row?.level

  if (rowLevelId !== undefined && rowLevelId !== null) {
    return String(rowLevelId) === String(selectedLevelId)
  }

  // Nếu có ordinal
  const rowOrdinal = properties?.ordinal ?? row?.ordinal
  if (rowOrdinal !== undefined && rowOrdinal !== null && selectedLevelOrdinal !== undefined) {
    return Number(rowOrdinal) === Number(selectedLevelOrdinal)
  }

  // Backend đã lọc theo ?levelId=${selectedLevelId} ở URL endpoint
  return true
}

function parseWktPoint(value: unknown) {
  if (typeof value !== 'string') return value
  const match = value.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i)
  return match ? { type: 'Point', coordinates: [Number(match[1]), Number(match[2])] } : undefined
}
