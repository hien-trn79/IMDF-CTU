import { useEffect, useMemo, useState } from 'react'
import { useLevel } from '../../context/LevelContext'
import { useUser } from '../../context/UserContext'
import { authHeaders } from '../../services/authHeaders'

export function useOutdoorFeatures(
  selectedBuildingId?: number,
  selectedLevelOrdinal?: number,
  selectedLevelGeometry?: GeoJSON.Geometry
) {
  const { unitGeoJson, isLoadingUnits, selectedTables, selectedLevelId, dataVersion } = useLevel()
  const { token } = useUser()
  const [tableFeatures, setTableFeatures] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!selectedLevelId || selectedTables.length === 0) {
      setTableFeatures([])
      return
    }

    const controller = new AbortController()
    const fetchRows = async () => {
      setIsLoading(true)
      try {
        const apiTables = selectedTables.filter((table) => table !== 'unit')
        const tableResults = await Promise.all(
          apiTables.map(async (table) => {
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
            return rows
              .filter((row: any) =>
                belongsToSelectedLevel(
                  row,
                  table,
                  selectedLevelId,
                  selectedLevelOrdinal,
                  selectedLevelGeometry
                )
              )
              .map((row: any, index: number) => ({
                feature: toGeoJsonFeature(table, row),
                layer: { id: `api-${table}`, layerName: table },
                index,
              }))
          })
        )
        setTableFeatures(tableResults.flat())
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
    selectedLevelGeometry,
    dataVersion,
    token,
    selectedBuildingId,
  ])

  const features = useMemo(() => {
    const unitFeatures =
      selectedTables.includes('unit')
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
  const geometry = table === 'amenity' || table === 'amenities' ? parseWktPoint(row.geometry) : row.geometry
  return {
    type: 'Feature',
    id: String(row.id),
    geometry: geometry ?? { type: 'Point', coordinates: [] },
    properties: { ...row },
  }
}

function belongsToSelectedLevel(
  row: any,
  table: string,
  selectedLevelId: string | null,
  selectedLevelOrdinal?: number,
  selectedLevelGeometry?: GeoJSON.Geometry
) {
  if (!selectedLevelId) return false
  const properties = row?.properties ?? row
  const ordinal = properties?.ordinal ?? row?.ordinal

  if (table === 'level') {
    return selectedLevelOrdinal !== undefined && Number(ordinal) === Number(selectedLevelOrdinal)
  }

  const candidates = [
    row?.levelId,
    row?.level,
    row?.level_id,
    properties?.levelId,
    properties?.level,
    properties?.level_id,
  ]
    .filter((value) => value !== undefined && value !== null)
    .map(String)
  return (
    candidates.includes(String(selectedLevelId)) ||
    (selectedLevelOrdinal !== undefined && candidates.includes(String(selectedLevelOrdinal))) ||
    String(row?.id) === String(selectedLevelId) ||
    (selectedLevelGeometry != null && geometryIsInside(row?.geometry, selectedLevelGeometry))
  )
}

function geometryIsInside(candidate: any, boundary: GeoJSON.Geometry) {
  const point = firstCoordinate(candidate?.coordinates)
  if (!point) return false
  return ringsOf((boundary as GeoJSON.Geometry & { coordinates?: unknown }).coordinates).some(
    (ring) => pointInRing(point, ring)
  )
}

function firstCoordinate(value: any): [number, number] | null {
  if (!Array.isArray(value)) return null
  if (typeof value[0] === 'number' && typeof value[1] === 'number') {
    return [value[0], value[1]]
  }
  for (const child of value) {
    const point = firstCoordinate(child)
    if (point) return point
  }
  return null
}

function ringsOf(value: any): number[][][] {
  if (!Array.isArray(value)) return []
  if (
    value.length > 2 &&
    value.every((point: any) => Array.isArray(point) && typeof point[0] === 'number')
  ) {
    return [value]
  }
  return value.flatMap((child: any) => ringsOf(child))
}

function pointInRing(point: [number, number], ring: number[][]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    const intersects =
      yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

function parseWktPoint(value: unknown) {
  if (typeof value !== 'string') return value
  const match = value.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i)
  return match ? { type: 'Point', coordinates: [Number(match[1]), Number(match[2])] } : undefined
}
