import type { AreaGeometry } from './buildingGeojson'
import { apiRequest } from './apiRequest'

/** Body của POST /api/venues và PUT /api/venues/{id} (đối chiếu lại với Swagger) */
export interface VenueRequest {
  venueName: string
  geometry: AreaGeometry
  /** Không bắt buộc: bỏ trống thì không gửi trường này */
  featureId?: number
  addressId: number
  restrictionCategoryId: number
  venueCategoryId: number
}

export const createVenue = (token: string, payload: VenueRequest) =>
  apiRequest('/venues', 'POST', token, payload)

export const updateVenue = (token: string, id: number | string, payload: VenueRequest) =>
  apiRequest(`/venues/${id}`, 'PUT', token, payload)

export const deleteVenue = (token: string, id: number | string) =>
  apiRequest(`/venues/${id}`, 'DELETE', token)
