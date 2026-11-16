import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AmenityGeojson,
  AnchorGeojson,
  BuildingGeoJsonItem,
  LevelGeoJson,
  UnitGeoJson,
} from '../model/geoJsonEntity.model'
import {
  buildFloorEntries,
  pickSuggestions,
  searchEntries,
  type SearchEntry,
  type SearchResultItem,
} from '../utils/searchUtils'
import { useOutdoorRouting } from '../components/map/UseOutdoorRouting'
import type { IndoorGeoJsonResponse } from '../services/indoorRoutingService'

// Định vị GPS + tìm đường (userLocation, locate, routeData, calculateRoute, clearRoute...)
type OutdoorRouting = ReturnType<typeof useOutdoorRouting>

interface NavigateContextType extends OutdoorRouting {
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

  // Tìm kiếm (tìm trên TẤT CẢ các tầng đã nạp, kể cả khi chưa zoom vào bản đồ)
  searchItems: (query: string) => SearchResultItem[]
  suggestions: SearchResultItem[]
  isSearchReady: boolean
  prepareSearch: () => Promise<void>
  selectDestination: (item: SearchResultItem) => void
  selectedDestination: SearchResultItem | null
  indoorRouteData: IndoorGeoJsonResponse | null
  setIndoorRouteData: (data: IndoorGeoJsonResponse | null) => void
  indoorRouteError: string | null
  setIndoorRouteError: (error: string | null) => void

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

// Tên cũ (PageMap.tsx đang import tên này) => trỏ cùng 1 bảng, sửa 1 chỗ là đủ
export const FLOOR_LEVEL_IDS = FLOORS_LEVEL_ID

interface FloorData {
  unitData: UnitGeoJson
  anchorData: AnchorGeojson
  amenityData: AmenityGeojson
}

const floorNameOf = (levelId: number): string | undefined =>
  Object.keys(FLOORS_LEVEL_ID).find((name) => FLOORS_LEVEL_ID[name] === levelId)

const floorLabelOf = (levelId: number): string => {
  const name = floorNameOf(levelId)
  if (!name) return ''
  return name === 'G' ? 'Tầng trệt' : `Tầng ${name}`
}

// Báo lỗi khi fetch dữ liệu bị hủy (ví dụ khi người dùng chuyển tầng trước khi fetch xong)
const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError'

const NavigateContext = createContext<NavigateContextType | undefined>(undefined)

const API_BASE_URL = 'http://localhost:8081/api'

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`)
  return res.json() as Promise<T>
}

// Gọi song song 3 API units / anchors / amenities của 1 tầng
async function fetchFloor(levelId: number, signal: AbortSignal): Promise<FloorData> {
  const [unitData, anchorData, amenityData] = await Promise.all([
    fetchJson<UnitGeoJson>(`${API_BASE_URL}/units?levelId=${levelId}`, signal),
    fetchJson<AnchorGeojson>(`${API_BASE_URL}/anchors?levelId=${levelId}`, signal),
    fetchJson<AmenityGeojson>(`${API_BASE_URL}/amenities?levelId=${levelId}`, signal),
  ])
  return { unitData, anchorData, amenityData }
}

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
  const [indoorRouteData, setIndoorRouteData] = useState<IndoorGeoJsonResponse | null>(null)
  const [indoorRouteError, setIndoorRouteError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showDirectionsModal, setShowDirectionsModal] = useState<boolean>(false)

  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false)
  const [failedLevelId, setFailedLevelId] = useState<number | null>(null)

  const routing = useOutdoorRouting()
  const clearRoute = useCallback(() => {
    routing.clearRoute()
    setIndoorRouteData(null)
    setIndoorRouteError(null)
  }, [routing])

  // Cache du lieu theo ordinal de tranh goi API lan nua
  const dataCache = useMemo(() => new Map<number, FloorData>(), [])

  // Tăng mỗi khi cache có thêm tầng mới => tính lại chỉ mục tìm kiếm
  const [indexVersion, setIndexVersion] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  // Request nạp nền dữ liệu các tầng cho tìm kiếm
  const prefetchRef = useRef<AbortController | null>(null)

  // Huy request dang fetch neu nguoi dung chuyen tang (va khi provider bi go)
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      prefetchRef.current?.abort()
      prefetchRef.current = null
    }
  }, [])

  // Du lieu building [GET] /buildings/{buildingId}: tai doc lap voi du lieu tang.
  // (Truoc day chi tai khi tang chua co trong cache, nhung tang co the da duoc nap nen
  // bang prepareSearch => buildingData khong bao gio duoc tai => modal thong tin khong hien.)
  useEffect(() => {
    if (currentBuildingId === null) {
      setBuildingData(null)
      return
    }

    const controller = new AbortController()
    fetchJson<BuildingGeoJsonItem>(
      `${API_BASE_URL}/buildings/${currentBuildingId}`,
      controller.signal
    )
      .then((building) => {
        if (!controller.signal.aborted) setBuildingData(building)
      })
      .catch((error) => {
        if (!isAbortError(error)) {
          console.error('NavigateContext: Lỗi khi tải dữ liệu toà nhà:', error)
        }
      })

    return () => controller.abort()
  }, [currentBuildingId])

  const applyFloorData = useCallback((levelId: number, data: FloorData | null) => {
    setUnitData(data?.unitData ?? null)
    setAnchorData(data?.anchorData ?? null)
    setAmenityData(data?.amenityData ?? null)
    // Tầng mà dữ liệu bên trên thực sự thuộc về (PageMap dùng làm key vẽ lại lớp unit)
    setLoadedLevelId(data ? levelId : null)
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
        // Gọi song song 3 API của tầng, giữ nguyên dữ liệu tầng cũ trên bản đồ cho đến khi tầng mới về
        const floor = await fetchFloor(levelId, signal)

        if (signal.aborted) return

        dataCache.set(levelId, floor)
        setIndexVersion((v) => v + 1)
        applyFloorData(levelId, floor)
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

  // Nạp nền dữ liệu các tầng chưa có trong cache để tìm kiếm được trên mọi tầng.
  // Gọi nhiều lần vẫn an toàn (đang chạy hoặc đã đủ cache thì bỏ qua).
  const prepareSearch = useCallback(async () => {
    const pending = Object.values(FLOORS_LEVEL_ID).filter((id) => !dataCache.has(id))
    if (pending.length === 0) return
    if (prefetchRef.current && !prefetchRef.current.signal.aborted) return

    const controller = new AbortController()
    prefetchRef.current = controller

    try {
      await Promise.all(
        pending.map(async (levelId) => {
          try {
            const data = await fetchFloor(levelId, controller.signal)
            if (controller.signal.aborted) return
            dataCache.set(levelId, data)
            setIndexVersion((v) => v + 1)
          } catch (error) {
            if (!isAbortError(error)) {
              console.error(
                `NavigateContext: Không nạp được dữ liệu tìm kiếm tầng ${levelId}:`,
                error
              )
            }
          }
        })
      )
    } finally {
      if (prefetchRef.current === controller) prefetchRef.current = null
    }
  }, [dataCache])

  // Nạp nền ngay khi ứng dụng mở
  useEffect(() => {
    void prepareSearch()
  }, [prepareSearch])

  // Chỉ mục tìm kiếm của mọi tầng đã nạp (unit + anchor + amenity)
  const entries = useMemo<SearchEntry[]>(() => {
    const result: SearchEntry[] = []
    dataCache.forEach((data, levelId) => {
      result.push(...buildFloorEntries(levelId, floorLabelOf(levelId), data))
    })
    return result
    // indexVersion đổi khi cache thay đổi (dataCache là Map nên React không tự theo dõi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataCache, indexVersion])

  // Tìm kiếm nhanh theo ký hiệu / tên phòng, tiện ích trên mọi tầng (không phân biệt dấu, hoa thường)
  const searchItems = useCallback(
    (query: string): SearchResultItem[] => searchEntries(entries, query, { currentLevelId }),
    [entries, currentLevelId]
  )

  // Gợi ý khi chưa gõ gì
  const suggestions = useMemo(
    () => pickSuggestions(entries, currentLevelId, 6),
    [entries, currentLevelId]
  )

  // Chọn điểm đến: chuyển sang đúng tầng của kết quả rồi đánh dấu điểm đến
  const selectDestination = useCallback(
    (item: SearchResultItem) => {
      clearRoute() // đổi điểm đến => đường cũ không còn đúng
      if (item.levelId !== undefined) {
        const floor = floorNameOf(item.levelId)
        if (floor) setSelectedFloor(floor)
      }
      // Tạo object mới để chọn lại cùng 1 địa điểm vẫn kích hoạt bay tới và mở popup
      setSelectedDestination({ ...item })
    },
    [clearRoute]
  )

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
      suggestions,
      isSearchReady: entries.length > 0,
      prepareSearch,
      selectDestination,
      selectedDestination,
      indoorRouteData,
      setIndoorRouteData,
      indoorRouteError,
      setIndoorRouteError,

      isLoading,
      isLocationModalOpen,
      setIsLocationModalOpen,

      showDirectionsModal,
      setShowDirectionsModal,

      ...routing,
      clearRoute,
    }),
    [
      currentBuildingId,
      currentLevelId,
      loadedLevelId,
      clearFloorData,
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
      suggestions,
      entries.length,
      prepareSearch,
      selectDestination,
      selectedDestination,
      indoorRouteData,
      indoorRouteError,

      isLoading,
      showDirectionsModal,
      isLocationModalOpen,
      routing,
      clearRoute,
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
