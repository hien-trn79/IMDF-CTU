import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AmenityGeojson,
  AnchorGeojson,
  BuildingGeoJsonItem,
  LevelGeoJson,
  UnitGeoJson,
} from '../model/geoJsonEntity.model'

interface SearchResultItem {
  id: string
  title: string
  subtitle: string
  category: string
  levelOrdinal: number
  coordinates?: [number, number]
  geometry?: GeoJSON.Geometry
  rawProperties?: Record<string, any>
}

interface NavigateContextType {
  // Lấy thông tin building, sau đó sẽ set FLOORS_LEVEL_ID
  currentBuildingId: number | null
  setCurrentBuildingId: (id: number | null) => void

  // Lấy ID của tầng hiện tại
  currentLevelId: number
  loadedLevelId: number | null
  setLoadedLevelId: (id: number) => void
  setCurrentLevelId: (id: number) => void
  availableLevels: LevelGeoJson['features'] | undefined
  setAvailableLevels: (levels: LevelGeoJson['features']) => void
  selectedFloor: string | null
  setSelectedFloor: (floor: string) => void

  buildingData: BuildingGeoJsonItem | null
  levelData: LevelGeoJson | null
  unitData: UnitGeoJson | null
  anchorData: AnchorGeojson | null
  amenityData: AmenityGeojson | null

  // Action
  clearFloorData: () => void
  loadFloorData: (levelId: number) => Promise<void>
  searchItems: (query: string) => SearchResultItem[]
  selectDestination: (item: SearchResultItem) => void
  selectedDestination: SearchResultItem | null

  // Loading & Map instance
  isLoading: boolean
  showDirectionsModal: boolean
  setShowDirectionsModal: (show: boolean) => void
  failedLevelId: number | null

  // Hiển thị Modal
  isLocationModalOpen: boolean
  setIsLocationModalOpen: (open: boolean) => void
}

export const FLOORS_LEVEL_ID: Record<string, number> = {
  G: 4,
  1: 3,
}

interface FloorData {
  unitData: UnitGeoJson
  anchorData: AnchorGeojson
  amenityData: AmenityGeojson
}

// Báo lỗi khi fetch dữ liệu bị hủy (ví dụ khi người dùng chuyển tầng trước khi fetch xong)
const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError'

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`)
  return res.json() as Promise<T>
}

const NavigateContext = createContext<NavigateContextType | undefined>(undefined)

const API_BASE_URL = 'http://localhost:8081/api'

export const NavigateProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentBuildingId, setCurrentBuildingId] = useState<number | null>(1)

  const [currentLevelId, setCurrentLevelId] = useState<number>(FLOORS_LEVEL_ID.G)
  const [availableLevels, setAvailableLevels] = useState<LevelGeoJson['features']>()
  const [selectedFloor, setSelectedFloor] = useState<string>('G')

  const [buildingData, setBuildingData] = useState<BuildingGeoJsonItem | null>(null)
  const [levelData, setLevelData] = useState<LevelGeoJson | null>(null)
  const [unitData, setUnitData] = useState<UnitGeoJson | null>(null)
  const [anchorData, setAnchorData] = useState<AnchorGeojson | null>(null)
  const [amenityData, setAmenityData] = useState<AmenityGeojson | null>(null)
  const [loadedLevelId, setLoadedLevelId] = useState<number | null>(null)

  const [selectedDestination, setSelectedDestination] = useState<SearchResultItem | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showDirectionsModal, setShowDirectionsModal] = useState<boolean>(false)

  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false)
  const [failedLevelId, setFailedLevelId] = useState<number | null>(null)

  // Cache du lieu theo ordinal de tranh goi API lan nua
  const dataCache = useMemo(() => new Map<number, FloorData>(), [])

  const abortRef = useRef<AbortController | null>(null)

  // Huy request dang fetch neu nguoi dung chuyen tang
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [])

  const applyFloorData = useCallback((levelId: number, data: FloorData | null) => {
    setUnitData(data?.unitData ?? null)
    setAnchorData(data?.anchorData ?? null)
    setAmenityData(data?.amenityData ?? null)
    setCurrentLevelId(levelId)
  }, [])

  // Xoa du lieu hien tai(dung cho tang chua co co so)
  const clearFloorData = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null

    applyFloorData(0, null)

    setFailedLevelId(null)
    setIsLoading(false)
  }, [applyFloorData])

  // Tải dữ liệu 1 tầng. Gọi liên tiếp => request cũ bị huỷ, chỉ request mới nhất được áp dụng.
  const loadFloorData = useCallback(
    async (levelId: number) => {
      abortRef.current?.abort()
      setCurrentLevelId(levelId)
      setFailedLevelId(null)
      // Đã có cache: hiển thị ngay, không loading => chuyển tầng tức thì
      const cached = dataCache.get(levelId)
      if (cached) {
        abortRef.current = null
        applyFloorData(levelId, cached)
        setIsLoading(false)
        return
      }

      const controller = new AbortController()
      abortRef.current = controller
      const { signal } = controller
      setIsLoading(true)

      try {
        // Truy van lan luot tao du lieu building [GET] /buildings/{buildingId}, sau do lay du lieu tang [GET] /levels?buildingId={buildingId}
        const building = await fetchJson<BuildingGeoJsonItem>(
          `${API_BASE_URL}/buildings/${currentBuildingId}`,
          signal
        )
        if (signal.aborted) return
        setBuildingData(building)
        // Gọi song song, giữ nguyên dữ liệu tầng cũ trên bản đồ cho đến khi tầng mới về
        const [unit, anchor, amenity] = await Promise.all([
          fetchJson<UnitGeoJson>(`${API_BASE_URL}/units?levelId=${levelId}`, signal),
          fetchJson<AnchorGeojson>(`${API_BASE_URL}/anchors?levelId=${levelId}`, signal),
          fetchJson<AmenityGeojson>(`${API_BASE_URL}/amenities?levelId=${levelId}`, signal),
        ])

        if (signal.aborted) return

        const data: FloorData = { unitData: unit, anchorData: anchor, amenityData: amenity }
        dataCache.set(levelId, data)
        applyFloorData(levelId, data)
      } catch (error) {
        // Bị huỷ do đổi tầng: không phải lỗi, bỏ qua
        if (isAbortError(error) || signal.aborted) return

        console.error('NavigateContext: Lỗi khi tải dữ liệu tầng:', error)
        applyFloorData(levelId, null)
        setFailedLevelId(levelId)
      } finally {
        // Chỉ tắt loading nếu đây vẫn là request mới nhất
        if (abortRef.current === controller) {
          abortRef.current = null
          setIsLoading(false)
        }
      }
    },
    [dataCache, applyFloorData]
  )

  // Tìm kiếm nhanh dựa trên ký hiệu phòng học
  const searchItems = useCallback(
    (query: string): SearchResultItem[] => {
      if (!query.trim()) return []

      const q = query.toLowerCase().trim()
      const results: SearchResultItem[] = []

      // Tìm trong amenityData trước
      amenityData?.features?.forEach((feature) => {
        const p = feature.properties
        const nameMatch = p.amenityName?.toLowerCase().includes(q)
        const cateMatch = p.amenityCateName?.toLowerCase().includes(q)
        const unitMatch = p.unitName?.toLowerCase().includes(q)

        if (nameMatch || cateMatch || unitMatch) {
          results.push({
            id: `amenity-${feature.id}`,
            title: p.amenityName,
            subtitle: p.unitName ? `${p.unitName} - ${p.amenityCateName}` : p.amenityCateName,
            category: 'amenity',
            levelOrdinal: p.ordinal,
            geometry: feature.geometry,
            rawProperties: p,
          })
        }
      })

      // Tìm trong anchorData
      anchorData?.features?.forEach((feature) => {
        const p = feature.properties
        const nameMatch = p.anchorName?.toLowerCase().includes(q)
        const unitMatch = p.unitName?.toLowerCase().includes(q)

        if (nameMatch || unitMatch) {
          results.push({
            id: `anchor-${feature.id}`, // vd: anchor-1
            title: p.anchorName,
            subtitle: p.unitName || p.anchorName,
            category: 'anchor',
            levelOrdinal: p.ordinal,
            geometry: feature.geometry,
            rawProperties: p,
          })
        }
      })

      return results
    },
    [amenityData, anchorData]
  )
  // Chọn điểm đến
  const selectDestination = useCallback((item: SearchResultItem) => {
    setSelectedDestination(item)
  }, [])

  const value = useMemo<NavigateContextType>(
    () => ({
      buildingData,
      levelData,
      unitData,
      anchorData,
      amenityData,

      currentBuildingId,
      setCurrentBuildingId,

      selectedFloor,
      setSelectedFloor,
      currentLevelId,
      availableLevels,
      setAvailableLevels,
      setCurrentLevelId,
      loadedLevelId,
      setLoadedLevelId,
      clearFloorData,
      loadFloorData,
      failedLevelId,

      searchItems,
      selectDestination,
      selectedDestination,

      isLoading,
      isLocationModalOpen,
      setIsLocationModalOpen,

      showDirectionsModal,
      setShowDirectionsModal,
    }),
    [
      currentLevelId,
      setCurrentLevelId,
      loadedLevelId,
      setLoadedLevelId,
      clearFloorData,
      setAvailableLevels,
      availableLevels,
      selectedFloor,
      failedLevelId,

      buildingData,
      levelData,
      unitData,
      anchorData,
      amenityData,

      loadFloorData,
      searchItems,
      selectDestination,
      selectedDestination,

      isLoading,
      showDirectionsModal,
      setShowDirectionsModal,
      isLocationModalOpen,
      setIsLocationModalOpen,
    ]
  )

  return <NavigateContext.Provider value={value}>{children}</NavigateContext.Provider>
}

export const useNavigateContext = () => {
  const context = useContext(NavigateContext)

  if (!context) {
    throw new Error('useNavigateContext must be used within a NavigateProvider')
  }

  return context
}
