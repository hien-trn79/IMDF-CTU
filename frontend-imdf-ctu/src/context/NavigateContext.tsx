import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
// import type {
//   AmenityGeojson,
//   AnchorGeojson,
//   LevelGeoJson,
//   UnitGeoJson,
// } from '../model/geoJsonEntity.model'
import {
  buildFloorEntries,
  pickSuggestions,
  searchEntries,
  type SearchEntry,
  type SearchResultItem,
} from '../utils/searchUtils'
import { useOutdoorRouting } from '../components/map/UseOutdoorRouting'
import type { IndoorGeoJsonResponse } from '../services/indoorRoutingService'
import type { BuildingGeojsonItem, BuildingGeojsonResponse } from '../model/Building.model'
import type { LevelGeoJson } from '../model/imdf models/Level.model'
import type { UnitGeojson } from '../model/imdf models/Unit.model'
import type { AnchorGeojson } from '../model/imdf models/Anchor.model'
import type { AmenityGeojson } from '../model/imdf models/Amenity.model'

// Định vị GPS + tìm đường (userLocation, locate, routeData, calculateRoute, clearRoute...)
type OutdoorRouting = ReturnType<typeof useOutdoorRouting>

interface NavigateContextType extends OutdoorRouting {
  currentBuildingId: number | null
  setCurrentBuildingId: (id: number | null) => void

  // Lấy ID của tầng hiện tại
  currentLevelId: number
  loadedLevelId: number | null
  setLoadedLevelId: (id: number) => void
  setCurrentLevelId: (id: number) => void
  selectedFloor: string | null
  setSelectedFloor: (floor: string | null) => void
  floorLevelIds: Record<string, number>

  // Venue
  currentVenueId: number
  setCurrentVenueId: (id: number) => void

  buildings: BuildingGeojsonResponse | undefined
  buildingData: BuildingGeojsonItem | null
  levelsData: LevelGeoJson | null
  unitsData: UnitGeojson | null
  anchorsData: AnchorGeojson | null
  amenitiesData: AmenityGeojson | null

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

interface FloorData {
  unitsData: UnitGeojson
  anchorsData: AnchorGeojson
  amenitiesData: AmenityGeojson
}

interface SearchLevelInfo {
  buildingId: number
  ordinal: number
}

const floorNameOf = (levelId: number, levels: LevelGeoJson['features']): string | undefined => {
  const level = levels.find((feature) => Number(feature.id) === levelId)
  const ordinal = level?.properties.ordinal
  if (typeof ordinal !== 'number') return undefined
  return ordinal === 0 ? 'G' : String(ordinal)
}

const floorLabelOf = (levelId: number, levels: LevelGeoJson['features']): string => {
  const name = floorNameOf(levelId, levels)
  if (name === 'G') return 'Tầng trệt'
  return name ? `Tầng ${name}` : `Tầng ${levelId}`
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
  const [unitsData, anchorsData, amenitiesData] = await Promise.all([
    fetchJson<UnitGeojson>(`${API_BASE_URL}/units?levelId=${levelId}`, signal),
    fetchJson<AnchorGeojson>(`${API_BASE_URL}/anchors?levelId=${levelId}`, signal),
    fetchJson<AmenityGeojson>(`${API_BASE_URL}/amenities?levelId=${levelId}`, signal),
  ])
  return { unitsData, anchorsData, amenitiesData }
}

export const NavigateProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentBuildingId, setCurrentBuildingId] = useState<number | null>(1)

  const [currentLevelId, setCurrentLevelId] = useState<number>(0)
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null)

  // Venue
  const [currentVenueId, setCurrentVenueId] = useState<number>(2)

  const [buildings, setBuildings] = useState<BuildingGeojsonResponse>()
  const [buildingData, setBuildingData] = useState<BuildingGeojsonItem | null>(null)
  const [levelsData, setLevelData] = useState<LevelGeoJson | null>(null)
  const [allLevelsData, setAllLevelsData] = useState<LevelGeoJson['features']>([])
  const [allUnitsData, setAllUnitsData] = useState<UnitGeojson | null>(null)
  const [unitsData, setUnitsData] = useState<UnitGeojson | null>(null)

  const [anchorsData, setAnchorsData] = useState<AnchorGeojson | null>(null)
  const [amenitiesData, setAmenitiesData] = useState<AmenityGeojson | null>(null)
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
  }, [routing.clearRoute])

  // Cache du lieu theo ordinal de tranh goi API lan nua
  const dataCache = useMemo(() => new Map<number, FloorData>(), [])

  // Tăng mỗi khi cache có thêm tầng mới => tính lại chỉ mục tìm kiếm
  const [indexVersion, setIndexVersion] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  // Request nạp nền dữ liệu các tầng cho tìm kiếm
  const prefetchRef = useRef<AbortController | null>(null)
  const pendingDestinationRef = useRef<SearchResultItem | null>(null)

  // Huy request dang fetch neu nguoi dung chuyen tang (va khi provider bi go)
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      prefetchRef.current?.abort()
      prefetchRef.current = null
    }
  }, [])

  const floorLevelIds = useMemo(() => {
    const result: Record<string, number> = {}
    for (const level of levelsData?.features ?? []) {
      const id = Number(level.id)
      const ordinal = level.properties.ordinal
      if (!Number.isInteger(id) || typeof ordinal !== 'number') continue
      result[ordinal === 0 ? 'G' : String(ordinal)] = id
    }
    return result
  }, [levelsData])

  const searchLevelsById = useMemo(() => {
    const buildingIds = new Set((buildings?.features ?? []).map((building) => Number(building.id)))
    const result: Record<number, SearchLevelInfo> = {}
    for (const level of allLevelsData) {
      const id = Number(level.id)
      const buildingId = Number(level.properties.buildingId)
      const ordinal = level.properties.ordinal
      if (
        !Number.isInteger(id) ||
        !Number.isInteger(buildingId) ||
        !Number.isInteger(ordinal) ||
        !buildingIds.has(buildingId)
      ) {
        continue
      }
      result[id] = { buildingId, ordinal }
    }
    return result
  }, [allLevelsData, buildings])

  useEffect(() => {
    const controller = new AbortController()
    setBuildings(undefined)
    setAllLevelsData([])
    setAllUnitsData(null)

    if (currentVenueId === null) {
      console.warn('NavigateContext: currentVenueId is null, cannot fetch building data')
      return () => controller.abort()
    }

    const loadBuildingsAndLevels = async () => {
      try {
        const data = await fetchJson<BuildingGeojsonResponse>(
          `${API_BASE_URL}/buildings?venueId=${currentVenueId}`,
          controller.signal
        )
        if (controller.signal.aborted) return
        setBuildings(data)

        const levelResponses = await Promise.all(
          data.features.map(async (building) => {
            try {
              return await fetchJson<LevelGeoJson>(
                `${API_BASE_URL}/levels?buildingId=${building.id}`,
                controller.signal
              )
            } catch (error) {
              if (!isAbortError(error)) {
                console.error(
                  `NavigateContext: Không tải được danh sách tầng của tòa nhà ${building.id}:`,
                  error
                )
              }
              return null
            }
          })
        )
        if (!controller.signal.aborted) {
          setAllLevelsData(levelResponses.flatMap((response) => response?.features ?? []))
        }
      } catch (error) {
        if (!isAbortError(error)) {
          console.error('NavigateContext: Lỗi khi tải danh sách tòa nhà:', error)
        }
      }
    }

    void loadBuildingsAndLevels()

    fetchJson<UnitGeojson>(`${API_BASE_URL}/units/all`, controller.signal)
      .then((units) => {
        if (!controller.signal.aborted) setAllUnitsData(units)
      })
      .catch((error) => {
        if (!isAbortError(error)) {
          console.error('NavigateContext: Lỗi khi tải danh sách unit phục vụ tìm kiếm:', error)
        }
      })

    return () => controller.abort()
  }, [currentVenueId])

  // Tải building và levels theo building đang được chọn.
  useEffect(() => {
    const controller = new AbortController()
    setBuildingData(null)
    setLevelData(null)
    setSelectedFloor(null)
    setUnitsData(null)
    setAnchorsData(null)
    setAmenitiesData(null)
    setCurrentLevelId(0)
    setLoadedLevelId(null)
    setFailedLevelId(null)
    setIsLoading(false)
    const pendingDestination = pendingDestinationRef.current
    if (pendingDestination?.buildingId === currentBuildingId) {
      setSelectedDestination(pendingDestination)
      setIsLocationModalOpen(true)
    } else {
      pendingDestinationRef.current = null
      setSelectedDestination(null)
      setIsLocationModalOpen(false)
    }
    abortRef.current?.abort()
    abortRef.current = null
    prefetchRef.current?.abort()
    prefetchRef.current = null
    dataCache.clear()
    setIndexVersion((version) => version + 1)
    clearRoute()

    if (currentVenueId === null) {
      console.warn('NavigateContext: currentVenueId is null, cannot fetch building data')
      return () => controller.abort()
    }

    if (currentBuildingId !== null) {
      fetchJson<BuildingGeojsonItem>(
        `${API_BASE_URL}/buildings/${currentBuildingId}`,
        controller.signal
      )
        .then((building) => {
          if (!controller.signal.aborted) setBuildingData(building)
        })
        .catch((error) => {
          if (!isAbortError(error)) {
            console.error('NavigateContext: Lỗi khi tải dữ liệu tòa nhà:', error)
          }
        })

      fetchJson<LevelGeoJson>(
        `${API_BASE_URL}/levels?buildingId=${currentBuildingId}`,
        controller.signal
      )
        .then((levels) => {
          if (!controller.signal.aborted) setLevelData(levels)
        })
        .catch((error) => {
          if (!isAbortError(error)) {
            console.error('NavigateContext: Lỗi khi tải danh sách tầng:', error)
          }
        })
    }

    return () => controller.abort()
  }, [currentBuildingId, currentVenueId, dataCache, clearRoute])

  useEffect(() => {
    const floors = Object.keys(floorLevelIds).sort((a, b) => {
      const ordinal = (floor: string) => (floor === 'G' ? 0 : Number(floor))
      return ordinal(a) - ordinal(b)
    })
    if (floors.length === 0) {
      setSelectedFloor(null)
      setCurrentLevelId(0)
      return
    }
    const nextFloor =
      selectedFloor && Object.prototype.hasOwnProperty.call(floorLevelIds, selectedFloor)
        ? selectedFloor
        : floors[0]
    if (selectedFloor !== nextFloor) setSelectedFloor(nextFloor)
    setCurrentLevelId(floorLevelIds[nextFloor])
  }, [floorLevelIds, selectedFloor])

  useEffect(() => {
    const pendingDestination = pendingDestinationRef.current
    if (
      !pendingDestination ||
      pendingDestination.buildingId !== currentBuildingId ||
      pendingDestination.levelId === undefined
    ) {
      return
    }

    const floor = floorNameOf(pendingDestination.levelId, levelsData?.features ?? [])
    if (!floor) return
    setSelectedFloor(floor)
    pendingDestinationRef.current = null
  }, [currentBuildingId, levelsData])

  const applyFloorData = useCallback((levelId: number, data: FloorData | null) => {
    setUnitsData(data?.unitsData ?? null)
    setAnchorsData(data?.anchorsData ?? null)
    setAmenitiesData(data?.amenitiesData ?? null)
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
    const pending = Object.values(floorLevelIds).filter((id) => !dataCache.has(id))
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
  }, [dataCache, floorLevelIds])

  useEffect(() => {
    if (Object.keys(floorLevelIds).length > 0) void prepareSearch()
  }, [floorLevelIds, prepareSearch])

  // Chỉ mục tìm kiếm của mọi tầng đã nạp (unit + anchor + amenity)
  const entries = useMemo<SearchEntry[]>(() => {
    const result: SearchEntry[] = []
    const unitsByLevel = new Map<number, UnitGeojson['features']>()

    for (const unit of allUnitsData?.features ?? []) {
      const levelId = Number(unit.properties.levelId)
      if (!Number.isInteger(levelId) || !searchLevelsById[levelId]) continue
      const units = unitsByLevel.get(levelId) ?? []
      units.push(unit)
      unitsByLevel.set(levelId, units)
    }

    unitsByLevel.forEach((units, levelId) => {
      const levelInfo = searchLevelsById[levelId]
      const floorLabel = levelInfo.ordinal === 0 ? 'Tầng trệt' : `Tầng ${levelInfo.ordinal}`
      result.push(
        ...buildFloorEntries(levelId, floorLabel, {
          unitData: { features: units },
          buildingId: levelInfo.buildingId,
        })
      )
    })

    dataCache.forEach((data, levelId) => {
      const buildingId = searchLevelsById[levelId]?.buildingId
      result.push(
        ...buildFloorEntries(levelId, floorLabelOf(levelId, levelsData?.features ?? []), {
          anchorData: data.anchorsData,
          amenityData: data.amenitiesData,
          buildingId,
        })
      )
    })
    return result
    // indexVersion đổi khi cache thay đổi (dataCache là Map nên React không tự theo dõi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUnitsData, dataCache, indexVersion, levelsData, searchLevelsById])

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
      const destination = { ...item }
      pendingDestinationRef.current = null

      if (item.buildingId !== undefined && item.buildingId !== currentBuildingId) {
        pendingDestinationRef.current = destination
        setCurrentBuildingId(item.buildingId)
      } else if (item.levelId !== undefined) {
        const floor = floorNameOf(item.levelId, levelsData?.features ?? [])
        if (floor) setSelectedFloor(floor)
      }
      // Tạo object mới để chọn lại cùng 1 địa điểm vẫn kích hoạt bay tới và mở popup
      setSelectedDestination(destination)
    },
    [clearRoute, currentBuildingId, levelsData]
  )

  const value = useMemo<NavigateContextType>(
    () => ({
      // venue
      currentVenueId,
      setCurrentVenueId,

      buildings,
      buildingData,
      levelsData,
      unitsData,
      anchorsData,
      amenitiesData,

      currentBuildingId,
      setCurrentBuildingId,

      selectedFloor,
      setSelectedFloor,
      currentLevelId,
      floorLevelIds,
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
      currentVenueId,
      currentLevelId,
      loadedLevelId,
      clearFloorData,
      selectedFloor,
      floorLevelIds,
      failedLevelId,

      buildingData,
      levelsData,
      unitsData,
      anchorsData,
      amenitiesData,

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
