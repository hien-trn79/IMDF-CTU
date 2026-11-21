import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { AddressResponse } from '../model/imdf models/Address.model'
import type { AmenityCategoryResponse } from '../model/imdf models/Amenity.model'
import type { RestrictionCategoryResponse } from '../model/imdf models/Restriction.model'
import type { VenueCategoryResponse, VenueGeojsonResponse } from '../model/imdf models/Venue.model'
import { useUser } from './UserContext'
import type { FeatureResponse } from '../model/imdf models/Feature.model'
import type { BuildingCategoryResposne } from '../model/Building.model'
import type { UnitCategoriesResponse } from '../model/imdf models/Unit.model'
import type { levelCategoryResponse } from '../model/imdf models/Level.model'

const API_URL = 'http://localhost:8081/api'

interface DashboardContextValue {
  restrictionCateData: RestrictionCategoryResponse[] | null
  setRestrictionCateData: (data: RestrictionCategoryResponse[] | null) => void

  venueCateData: VenueCategoryResponse[] | null
  setVenueCateData: (data: VenueCategoryResponse[] | null) => void

  venueData: VenueGeojsonResponse | null
  setVenueData: (data: VenueGeojsonResponse | null) => void

  buildingCateData: BuildingCategoryResposne[] | null
  setBuildingCateData: (data: BuildingCategoryResposne[] | null) => void

  unitCateData: UnitCategoriesResponse[] | null
  setUnitCateData: (data: UnitCategoriesResponse[] | null) => void

  levelCateData: levelCategoryResponse[] | null
  setLevelCateData: (data: levelCategoryResponse[] | null) => void

  addressData: AddressResponse[] | null
  setAddressData: (data: AddressResponse[] | null) => void

  featureData: FeatureResponse[] | null
  setFeatureData: (data: FeatureResponse[] | null) => void

  amenityCateData: AmenityCategoryResponse[] | null
  setAmenityCateData: (data: AmenityCategoryResponse[] | null) => void

  /** true trong lúc đang tải dữ liệu lần đầu (hoặc khi refetch) */
  isLoading: boolean
  /** Danh sách các API tải lỗi, rỗng nếu mọi thứ ổn */
  errors: string[]
  /** Tải lại toàn bộ dữ liệu (dùng sau khi thêm/sửa/xóa hoặc khi bấm "Thử lại") */
  refetch: () => void
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined)

async function getJson<T>(path: string, token: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }, // KHÔNG đặt method trong headers
    signal,
  })
  if (!response.ok) throw new Error(`${path} (${response.status})`)
  return response.json() as Promise<T>
}

export function DashboardContextProvider({ children }: { children: React.ReactNode }) {
  const { token } = useUser()

  const [restrictionCateData, setRestrictionCateData] = useState<
    RestrictionCategoryResponse[] | null
  >(null)
  const [featureData, setFeatureData] = useState<FeatureResponse[] | null>(null)
  const [venueCateData, setVenueCateData] = useState<VenueCategoryResponse[] | null>(null)
  const [venueData, setVenueData] = useState<VenueGeojsonResponse | null>(null)
  const [addressData, setAddressData] = useState<AddressResponse[] | null>(null)
  const [amenityCateData, setAmenityCateData] = useState<AmenityCategoryResponse[] | null>(null)

  const [buildingCateData, setBuildingCateData] = useState<BuildingCategoryResposne[] | null>(null)
  const [unitCateData, setUnitCateData] = useState<UnitCategoriesResponse[] | null>(null)
  const [levelCateData, setLevelCateData] = useState<levelCategoryResponse[] | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [reloadKey, setReloadKey] = useState(0)

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    // Chưa đăng nhập (hoặc vừa đăng xuất): xóa dữ liệu cũ, không gọi API
    if (!token) {
      setRestrictionCateData(null)
      setVenueCateData(null)
      setVenueData(null)
      setAddressData(null)
      setAmenityCateData(null)
      setFeatureData(null)

      setBuildingCateData(null)
      setUnitCateData(null)
      setLevelCateData(null)

      setErrors([])
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const { signal } = controller

    setIsLoading(true)
    setErrors([])

    // Gọi song song; một API lỗi không làm hỏng các API còn lại
    Promise.allSettled([
      getJson<VenueCategoryResponse[]>('/venue-categories', token, signal),
      getJson<VenueGeojsonResponse>('/venues', token, signal),
      getJson<AddressResponse[]>('/addresses', token, signal),
      getJson<AmenityCategoryResponse[]>('/amenity-categories', token, signal),
      getJson<RestrictionCategoryResponse[]>('/restriction-categories', token, signal),
      getJson<FeatureResponse[]>('/features', token, signal),

      getJson<BuildingCategoryResposne[]>('/building-categories', token, signal),
      getJson<levelCategoryResponse[]>('/level-categories', token, signal),
      getJson<UnitCategoriesResponse[]>('/unit-categories', token, signal),
    ]).then((results) => {
      if (signal.aborted) return // effect đã bị thay thế, bỏ kết quả cũ

      const [
        venueCate,
        venues,
        addresses,
        amenityCate,
        restrictionCate,
        featureData,
        buildingCate,
        levelCate,
        unitCate,
      ] = results
      const failed: string[] = []

      const apply = <T,>(r: PromiseSettledResult<T>, setter: (v: T) => void) => {
        if (r.status === 'fulfilled') setter(r.value)
        else failed.push(String(r.reason?.message ?? r.reason))
      }

      apply(venueCate, setVenueCateData)
      apply(venues, setVenueData)
      apply(addresses, setAddressData)
      apply(amenityCate, setAmenityCateData)
      apply(featureData, setFeatureData)
      apply(restrictionCate, setRestrictionCateData)
      apply(buildingCate, setBuildingCateData)
      apply(levelCate, setLevelCateData)
      apply(unitCate, setUnitCateData)

      failed.forEach((msg) => console.error('Dashboard fetch lỗi:', msg))
      setErrors(failed)
      setIsLoading(false)
    })

    // Chỉ huỷ request đang chạy, KHÔNG xóa dữ liệu đã có
    return () => controller.abort()
  }, [token, reloadKey])

  return (
    <DashboardContext.Provider
      value={{
        restrictionCateData,
        setRestrictionCateData,
        venueCateData,
        setVenueCateData,
        venueData,
        featureData,
        setFeatureData,
        setVenueData,
        buildingCateData,
        setBuildingCateData,
        unitCateData,
        setUnitCateData,
        levelCateData,
        setLevelCateData,
        addressData,
        setAddressData,
        amenityCateData,
        setAmenityCateData,
        isLoading,
        errors,
        refetch,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) throw new Error('useDashboard must be used within a DashboardContextProvider')
  return context
}
