import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { DestinationItem, RouteData } from '../model/Navigation.model'
import {
  calculateRoutePath,
  calculateDistanceMeters,
  formatDistance,
  formatDuration,
  fetchAllSearchableLocations,
  isIndoorDestination,
  searchLocations,
  searchExternalLocations,
} from '../services/mapNavigationService'
import { fetchIndoorShortestPath } from '../services/indoorRoutingService'
import { useUser } from './UserContext'

interface MapNavigationContextType {
  allLocations: DestinationItem[]
  isLoadingLocations: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchResults: DestinationItem[]
  isSearchingLocations: boolean
  userLocation: [number, number] | null // null = chưa định vị
  setUserLocation: (loc: [number, number] | null) => void
  showUserLocation: boolean
  setShowUserLocation: (show: boolean) => void
  isLocating: boolean
  locationError: string | null
  clearLocationError: () => void
  refreshUserLocation: () => void
  selectedDestination: DestinationItem | null
  setSelectedDestination: (dest: DestinationItem | null) => void
  routeData: RouteData | null
  isRouting: boolean
  routeError: string | null
  selectDestinationAndRoute: (dest: DestinationItem) => Promise<void>
  calculateRoute: (dest?: DestinationItem) => Promise<void>
  calculateRouteWithOrigin: (
    origin: [number, number],
    dest: DestinationItem,
    originDestination?: DestinationItem
  ) => Promise<void>
  clearRoute: () => void
  showLocationModal: boolean
  setShowLocationModal: (show: boolean) => void
  showDirectionsModal: boolean
  setShowDirectionsModal: (show: boolean) => void
  // Indoor floor selection
  selectedFloor: string
  setSelectedFloor: (floor: string) => void
}

const MapNavigationContext = createContext<MapNavigationContextType | undefined>(undefined)

export const MapNavigationProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useUser()
  const [allLocations, setAllLocations] = useState<DestinationItem[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DestinationItem[]>([])
  const [isSearchingLocations, setIsSearchingLocations] = useState(false)

  // Vị trí cá nhân: null mặc định, không hiển thị cho đến khi người dùng nhấn nút định vị
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [showUserLocation, setShowUserLocation] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const [selectedDestination, setSelectedDestination] = useState<DestinationItem | null>(null)
  const [routeData, setRouteData] = useState<RouteData | null>(null)
  const [isRouting, setIsRouting] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showDirectionsModal, setShowDirectionsModal] = useState(false)

  // Indoor floor selection
  const [selectedFloor, setSelectedFloor] = useState('G')

  useEffect(() => {
    let active = true
    fetchAllSearchableLocations()
      .then((locations) => {
        if (active) setAllLocations(locations)
      })
      .catch((error) => {
        console.error('Không thể tải dữ liệu địa điểm cho Tab Map:', error)
        if (active) setAllLocations([])
      })
      .finally(() => {
        if (active) setIsLoadingLocations(false)
      })
    return () => {
      active = false
    }
  }, [])

  // 2. Tìm kiếm tự động khi `searchQuery` thay đổi
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearchingLocations(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      const localResults = searchLocations(searchQuery, allLocations)
      setSearchResults(localResults)
      setIsSearchingLocations(true)
      try {
        const externalResults = await searchExternalLocations(searchQuery, controller.signal)
        const localTitles = new Set(localResults.map((item) => item.title.toLowerCase()))
        setSearchResults([
          ...localResults,
          ...externalResults.filter((item) => !localTitles.has(item.title.toLowerCase())),
        ])
      } catch (err) {
        if ((err as DOMException).name !== 'AbortError') {
          console.warn('Không thể tìm địa điểm bên ngoài:', err)
        }
      } finally {
        if (!controller.signal.aborted) setIsSearchingLocations(false)
      }
    }, 350)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [searchQuery, allLocations])

  // 3. Lấy vị trí định vị cá nhân từ GPS (chỉ khi người dùng yêu cầu)
  const refreshUserLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('Trình duyệt không hỗ trợ định vị GPS.')
      setUserLocation(null)
      setShowUserLocation(false)
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setUserLocation([latitude, longitude])
        setShowUserLocation(true)
        setLocationError(null)
        setIsLocating(false)
      },
      (err) => {
        console.warn('Không thể truy cập GPS:', err.message)
        const message =
          err.code === err.PERMISSION_DENIED
            ? 'Vị trí đang bị tắt hoặc trang chưa được cấp quyền. Hãy bật Location/GPS trong thiết bị, cho phép vị trí cho trang này rồi thử lại.'
            : err.code === err.TIMEOUT
              ? 'Không nhận được tín hiệu vị trí kịp thời. Hãy bật GPS và thử lại ở nơi thoáng.'
              : 'Không thể lấy vị trí hiện tại. Hãy bật Location/GPS và thử lại.'
        setLocationError(message)
        setUserLocation(null)
        setShowUserLocation(false)
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    )
  }, [])

  const clearLocationError = useCallback(() => {
    setLocationError(null)
  }, [])

  // KHÔNG tự động định vị khi khởi tạo - chỉ định vị khi người dùng nhấn nút

  // 5. Chọn điểm đến và hiển thị modal thông tin (KHÔNG tự động tìm đường)
  const selectDestinationAndRoute = useCallback(async (dest: DestinationItem) => {
    setSelectedDestination(dest)
    setShowLocationModal(true)
  }, [])

  // 6. Xoá đường đi
  const clearRoute = useCallback(() => {
    setRouteData(null)
    setRouteError(null)
  }, [])

  const calculateRouteWithOrigin = useCallback(
    async (
      origin: [number, number],
      dest: DestinationItem,
      originDestination?: DestinationItem
    ) => {
      setIsRouting(true)
      setRouteError(null)

      try {
        const sourceLevelId = Number(
          originDestination?.rawProperties?.levelId ?? originDestination?.rawProperties?.level_id
        )
        const targetLevelId = Number(dest.rawProperties?.levelId ?? dest.rawProperties?.level_id)
        const sourceAnchorId = Number(originDestination?.rawProperties?.anchorId)
        const targetAnchorId = Number(dest.rawProperties?.anchorId)
        const indoorToIndoor =
          originDestination !== undefined &&
          isIndoorDestination(originDestination) &&
          isIndoorDestination(dest)

        if (indoorToIndoor) {
          if (
            !Number.isInteger(sourceLevelId) ||
            !Number.isInteger(targetLevelId) ||
            !Number.isInteger(sourceAnchorId) ||
            !Number.isInteger(targetAnchorId)
          ) {
            throw new Error('Hai phòng chưa có đủ anchor hoặc thông tin tầng để tìm đường.')
          }
          if (sourceLevelId !== targetLevelId) {
            throw new Error('Hiện chỉ hỗ trợ tìm đường giữa hai phòng cùng tầng.')
          }

          const response = await fetchIndoorShortestPath(
            {
              sourceAnchorId,
              targetAnchorId,
              sourceLevelId,
              targetLevelId,
              isOutdoorIncluded: false,
            },
            token ?? undefined
          )
          const features = (response.features ?? []).filter(
            (feature) =>
              feature.geometry?.type === 'LineString' && feature.geometry.coordinates.length >= 2
          )
          if (features.length === 0) {
            throw new Error('Backend không trả về đường đi indoor cho hai phòng đã chọn.')
          }

          const coordinates = features.flatMap((feature) =>
            feature.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
          )
          let distanceMeters = 0
          features.forEach((feature) => {
            const points = feature.geometry.coordinates
            for (let index = 1; index < points.length; index += 1) {
              distanceMeters += calculateDistanceMeters(
                [points[index - 1][1], points[index - 1][0]],
                [points[index][1], points[index][0]]
              )
            }
          })
          const durationSeconds = Math.max(1, Math.round(distanceMeters / 1.2))
          const route: RouteData = {
            coordinates,
            distanceMeters,
            durationSeconds,
            distanceText: formatDistance(distanceMeters),
            durationText: formatDuration(durationSeconds),
            startPoint: origin,
            endPoint: dest.coordinates,
            destination: dest,
            indoorCoordinates: coordinates,
            indoorGeoJsonFeatures: features,
            hasIndoorTransition: false,
            steps: [
              {
                instruction: `Đi theo hành lang đến ${dest.title}`,
                distance: distanceMeters,
                duration: durationSeconds,
                isIndoor: true,
              },
              {
                instruction: `Đã đến ${dest.title}`,
                distance: 0,
                duration: 0,
                isIndoor: true,
              },
            ],
          }
          setRouteData(route)
          setSelectedFloor(dest.level === '0' ? 'G' : (dest.level ?? 'G'))
          setShowDirectionsModal(false)
          return
        }

        const route = await calculateRoutePath(origin, dest.coordinates, dest)
        setRouteData(route)
        setShowDirectionsModal(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể tìm đường đi.'
        console.error('Không thể tính đường đi:', error)
        setRouteError(message)
      } finally {
        setIsRouting(false)
      }
    },
    [token]
  )

  const calculateRoute = useCallback(
    async (dest?: DestinationItem) => {
      const target = dest ?? selectedDestination
      if (!target || !userLocation) {
        setRouteError('Vui lòng chọn điểm đến và xác định vị trí bắt đầu.')
        return
      }
      await calculateRouteWithOrigin(userLocation, target)
    },
    [calculateRouteWithOrigin, selectedDestination, userLocation]
  )

  return (
    <MapNavigationContext.Provider
      value={{
        allLocations,
        isLoadingLocations,
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearchingLocations,
        userLocation,
        setUserLocation,
        showUserLocation,
        setShowUserLocation,
        isLocating,
        locationError,
        clearLocationError,
        refreshUserLocation,
        selectedDestination,
        setSelectedDestination,
        routeData,
        isRouting,
        routeError,
        selectDestinationAndRoute,
        calculateRoute,
        calculateRouteWithOrigin,
        clearRoute,
        showLocationModal,
        setShowLocationModal,
        showDirectionsModal,
        setShowDirectionsModal,
        selectedFloor,
        setSelectedFloor,
      }}
    >
      {children}
    </MapNavigationContext.Provider>
  )
}

export const useMapNavigation = () => {
  const context = useContext(MapNavigationContext)
  if (!context) {
    throw new Error('useMapNavigation phải được sử dụng trong MapNavigationProvider')
  }
  return context
}
