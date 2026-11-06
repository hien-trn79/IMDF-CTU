import type {
  NetworkNodeRequest,
  NetworkNodeResponse,
} from '../model/route models/NetworkNode.model'
import { authHeaders } from './authHeaders'
import { pointToWkbHex } from '../utils/wkbEncoder'

const API_BASE = 'http://localhost:8081/api/network-nodes'

export function normalizeNode(feature: NetworkNodeResponse): NetworkNodeResponse {
  return {
    ...feature,
    geom:
      feature.geom ||
      pointToWkbHex(feature.geometry.coordinates[0], feature.geometry.coordinates[1]),
    isConnector: feature.isConnector ?? feature.properties.isConnector,
    indoorRouteId: feature.indoorRouteId ?? feature.properties.routeId,
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `Lỗi máy chủ (${res.status})`
    try {
      const body = await res.json()
      if (body?.message) msg = body.message
      else if (typeof body === 'string') msg = body
    } catch {
      const text = await res.text().catch(() => '')
      if (text) msg = text
    }
    throw new Error(msg)
  }
  const ct = res.headers.get('content-type')
  if (ct?.includes('application/json')) return res.json()
  const text = await res.text()
  if (text === 'true') return true as unknown as T
  if (text === 'false') return false as unknown as T
  return text as unknown as T
}

export const networkNodeService = {
  async getAll(token: string): Promise<NetworkNodeResponse[]> {
    const res = await fetch(API_BASE, { headers: authHeaders(token) })
    const data = await handleResponse<{ features: NetworkNodeResponse[] }>(res)
    return data.features.map(normalizeNode)
  },

  async getById(id: number, token: string): Promise<NetworkNodeResponse> {
    const res = await fetch(`${API_BASE}/${id}`, { headers: authHeaders(token) })
    return normalizeNode(await handleResponse<NetworkNodeResponse>(res))
  },

  async create(data: NetworkNodeRequest, token: string): Promise<NetworkNodeResponse> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: authHeaders(token, true),
      body: JSON.stringify(data),
    })
    return normalizeNode(await handleResponse<NetworkNodeResponse>(res))
  },

  async update(id: number, data: NetworkNodeRequest, token: string): Promise<NetworkNodeResponse> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: authHeaders(token, true),
      body: JSON.stringify(data),
    })
    return normalizeNode(await handleResponse<NetworkNodeResponse>(res))
  },

  async delete(id: number, token: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: authHeaders(token) })
    return handleResponse<boolean>(res)
  },
}
