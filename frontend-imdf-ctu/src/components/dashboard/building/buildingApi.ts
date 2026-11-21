import type { MultiPolygonGeometry, PointGeometry } from './buildingGeojson'

const API_URL = 'http://localhost:8081/api'

/** Body của POST /api/buildings và PUT /api/buildings/{id} */
export interface BuildingRequest {
  buildingName: string
  displayPoint: PointGeometry
  geometry: MultiPolygonGeometry
  /** Không bắt buộc: bỏ trống thì không gửi trường này */
  featureId?: number
  addressId: number
  restrictionCategoryId: number
  buildingCategoryId: number
  venueId: number
}

// Cố đọc thông báo lỗi từ backend (JSON có message/error hoặc văn bản thuần)
async function readError(response: Response): Promise<string> {
  let detail = ''
  try {
    const body = await response.text()
    try {
      const json = JSON.parse(body) as { message?: string; error?: string }
      detail = json.message ?? json.error ?? ''
    } catch {
      detail = body
    }
  } catch {
    // bỏ qua
  }
  return detail.slice(0, 200) || `Lỗi ${response.status}`
}

async function request(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  token: string,
  body?: unknown
): Promise<void> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) throw new Error(await readError(response))
}

export const createBuilding = (token: string, payload: BuildingRequest) =>
  request('/buildings', 'POST', token, payload)

export const updateBuilding = (token: string, id: number | string, payload: BuildingRequest) =>
  request(`/buildings/${id}`, 'PUT', token, payload)

export const deleteBuilding = (token: string, id: number | string) =>
  request(`/buildings/${id}`, 'DELETE', token)
