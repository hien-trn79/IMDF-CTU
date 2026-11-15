import { useCallback, useMemo, useRef, useState } from 'react'
import {
  fetchOutdoorRoute,
  isIndoor,
  toOutdoorPoint,
  type LatLng,
  type RouteData,
} from './OutdoorRoutingService'
import type { SearchResultItem } from '../../utils/searchUtils'

export function useOutdoorRouting() {
  const [userLocation, setUserLocation] = useState<LatLng | null>(null)

  const [isLocating, setIsLocating] = useState(false)

  const [locationError, setLocationError] = useState<string | null>(null)
  const [routeData, setRouteData] = useState<RouteData | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [isRouting, setIsRouting] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // lay vi tri hien tai
  const locate = useCallback(
    () =>
      new Promise<LatLng | null>((resolve) => {
        if (!navigator.geolocation) {
          setLocationError('Trình duyệt không hỗ trợ định vị GPS')
          return resolve(null)
        }

        setIsLocating(true)
        setLocationError(null)

        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            const position: LatLng = [coords.latitude, coords.longitude]
            setUserLocation(position)
            setIsLocating(false)
            resolve(position)
          },
          () => {
            setLocationError(
              'Không thể đọc được vị trí. Vui lòng cho phép hệ thống truy cập vị trí của bạn!'
            )
            setIsLocating(false)
            resolve(null)
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
      }),
    []
  )
  // Hủy tuyến đường

  const clearRoute = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setRouteData(null)
    setRouteError(null)
    setIsRouting(false)
  }, [])

  // Trả về true nếu tìm được đường đi. Gọi liên tiếp => hủy request cũ.
  const calculateRoute = useCallback(
    async (origin: SearchResultItem, destination: SearchResultItem): Promise<boolean> => {
      abortRef.current?.abort()

      if (isIndoor(origin) && isIndoor(destination)) {
        // gọi dịch vụ tìm đường nội tuyến ở đây.
        setRouteError(
          'Không thể tìm đường đi giữa 2 điểm trong nhà. Vui lòng chọn điểm ngoài trời làm điểm xuất phát hoặc điểm đến.'
        )
        return false
      }

      const controller = new AbortController()
      abortRef.current = controller
      setIsRouting(true)
      setRouteError(null)

      try {
        const route = await fetchOutdoorRoute(
          toOutdoorPoint(origin),
          toOutdoorPoint(destination),
          controller.signal
        )
        if (controller.signal.aborted) return false
        setRouteData(route)
        return true
      } catch (error) {
        if (controller.signal.aborted) return false
        console.error('Lỗi khi tìm đường đi bên ngoài:', error)
        setRouteError('Không thể tìm đường đi bên ngoài. Vui lòng thử lại sau.')
        setRouteData(null)
        return false
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
          setIsRouting(false)
        }
      }
    },
    []
  )

  return useMemo(
    () => ({
      userLocation,
      isLocating,
      locationError,
      locate,
      routeData,
      isRouting,
      routeError,
      calculateRoute,
      clearRoute,
    }),
    [
      userLocation,
      isLocating,
      locationError,
      locate,
      routeData,
      isRouting,
      routeError,
      calculateRoute,
      clearRoute,
    ]
  )
}
