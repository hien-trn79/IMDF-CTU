import { authHeaders } from './authHeaders'

export interface UnitRequestPayload {
  unitName: string
  geometry: GeoJSON.Geometry
  displayPoint: GeoJSON.Geometry
  featureId: number | null
  levelId: number
  unitCategoryId: number
  restrictionCategoryId: number
}

const toJson = (value: string, fieldName: string): GeoJSON.Geometry => {
  try {
    return JSON.parse(value) as GeoJSON.Geometry
  } catch {
    throw new Error(`${fieldName} phải là JSON hợp lệ.`)
  }
}

export const unitService = {
  async create(payload: UnitRequestPayload, token?: string) {
    const response = await fetch('/api/units', {
      method: 'POST',
      headers: { ...authHeaders(token ?? ''), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(`Tạo Unit thất bại (HTTP ${response.status}).`)
    return response.json()
  },

  async update(id: string | number, payload: UnitRequestPayload, token?: string) {
    const response = await fetch(`/api/units/${id}`, {
      method: 'PUT',
      headers: { ...authHeaders(token ?? ''), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(`Cập nhật Unit thất bại (HTTP ${response.status}).`)
    return response.json()
  },

  async delete(id: string | number, token?: string) {
    const response = await fetch(`/api/units/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token ?? ''),
    })
    if (!response.ok) throw new Error(`Xóa Unit thất bại (HTTP ${response.status}).`)
  },

  parseGeometry(value: string, fieldName: string) {
    return toJson(value, fieldName)
  },
}
