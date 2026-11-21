import { useCallback, useEffect, useState } from 'react'
import { useUser } from '../../../context/UserContext'
import type {
  BuildingCategoryResposne,
  BuildingGeojsonItem,
  BuildingGeojsonResponse,
} from '../../../model/Building.model'

const API_URL = 'http://localhost:8081/api'

/**
 * Tải danh sách building của một venue.
 * Backend bắt buộc có query `venueId` nên chưa chọn venue (null) thì không gọi API.
 */
export function useBuildings(venueId: number | null) {
  const { token } = useUser()
  const [buildings, setBuildings] = useState<BuildingGeojsonItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    if (!token || venueId === null) {
      setBuildings(null)
      setIsLoading(false)
      setError('')
      return
    }

    const controller = new AbortController()
    setBuildings(null)
    setIsLoading(true)
    setError('')

    fetch(`${API_URL}/buildings?venueId=${venueId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Lỗi ${res.status}`)
        return res.json() as Promise<BuildingGeojsonResponse>
      })
      .then((json) => {
        if (controller.signal.aborted) return
        setBuildings(json.features ?? [])
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        console.error('Lỗi tải building:', err)
        setBuildings([])
        setError(err instanceof Error ? err.message : 'Không tải được dữ liệu')
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [token, venueId, reloadKey])

  return { buildings, isLoading, error, refetch }
}

/** Tải danh mục tòa nhà (dùng cho bộ lọc và form). */
export function useBuildingCategories() {
  const { token } = useUser()
  const [categories, setCategories] = useState<BuildingCategoryResposne[]>([])

  useEffect(() => {
    if (!token) {
      setCategories([])
      return
    }
    const controller = new AbortController()

    fetch(`${API_URL}/building-categories`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Lỗi ${res.status}`)
        return res.json() as Promise<BuildingCategoryResposne[]>
      })
      .then((data) => {
        if (!controller.signal.aborted) setCategories(Array.isArray(data) ? data : [])
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) console.error('Lỗi tải building category:', err)
      })

    return () => controller.abort()
  }, [token])

  return categories
}
