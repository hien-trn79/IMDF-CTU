import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { DestinationItem, RouteData } from '../model/Navigation.model'
import {
  calculateRoutePath,
  fetchAllSearchableLocations,
  searchLocations,
  searchExternalLocations,
} from '../services/mapNavigationService'
import { useLayer } from './LayerContext'

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
  calculateRouteWithOrigin: (origin: [number, number], dest: DestinationItem) => Promise<void>
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
  const { geoServerUrl } = useLayer()

  const [allLocations, setAllLocations] = useState<DestinationItem[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)

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

  // 1. Tải danh sách địa điểm và phòng học từ GeoServer
  useEffect(() => {
    let active = true
    setIsLoadingLocations(true)

    fetchAllSearchableLocations(geoServerUrl)
      .then((items) => {
        if (active) {
          setAllLocations(items)
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải danh sách địa điểm:', err)
      })
      .finally(() => {
        if (active) setIsLoadingLocations(false)
      })

    return () => {
      active = false
    }
  }, [geoServerUrl])

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

  // 4. Tìm đường đi đến đích (từ vị trí cá nhân)
  const calculateRoute = useCallback(
    async (dest?: DestinationItem) => {
      const target = dest || selectedDestination
      if (!target) return

      if (!userLocation) {
        setRouteError('Vui lòng bật định vị để chọn điểm bắt đầu.')
        return
      }
      const origin = userLocation

      setIsRouting(true)
      setRouteError(null)

      try {
        const route = await calculateRoutePath(origin, target.coordinates, target)
        setRouteData(route)
        setShowLocationModal(true)
      } catch (err: any) {
        console.error('Lỗi khi tìm đường:', err)
        setRouteError(err?.message || 'Không thể tìm đường đi đến địa điểm này')
      } finally {
        setIsRouting(false)
      }
    },
    [selectedDestination, userLocation]
  )

  // 4b. Tìm đường đi từ điểm bắt đầu tuỳ chọn
  const calculateRouteWithOrigin = useCallback(
    async (origin: [number, number], dest: DestinationItem) => {
      setIsRouting(true)
      setRouteError(null)

      try {
        const route = await calculateRoutePath(origin, dest.coordinates, dest)
        setRouteData(route)
        setSelectedDestination(dest)
        setShowLocationModal(true)
        setShowDirectionsModal(false)
      } catch (err: any) {
        console.error('Lỗi khi tìm đường:', err)
        setRouteError(err?.message || 'Không thể tìm đường đi đến địa điểm này')
      } finally {
        setIsRouting(false)
      }
    },
    []
  )

  // 5. Chọn điểm đến và hiển thị modal thông tin (KHÔNG tự động tìm đường)
  const selectDestinationAndRoute = useCallback(
    async (dest: DestinationItem) => {
      setSelectedDestination(dest)
      setShowLocationModal(true)
    },
    []
  )

  // 6. Xoá đường đi
  const clearRoute = useCallback(() => {
    setRouteData(null)
    setRouteError(null)
  }, [])

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
