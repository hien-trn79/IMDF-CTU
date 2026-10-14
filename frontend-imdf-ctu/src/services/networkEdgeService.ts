import type { NetworkEdgeRequest, NetworkEdgeResponse } from '../model/NetworkEdge.model'
import { authHeaders } from './authHeaders'

const API_BASE = '/api/network-edges'

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

export const networkEdgeService = {
  async getAll(token: string): Promise<NetworkEdgeResponse[]> {
    const res = await fetch(API_BASE, { headers: authHeaders(token) })
    return handleResponse<NetworkEdgeResponse[]>(res)
  },

  async getById(id: number, token: string): Promise<NetworkEdgeResponse> {
    const res = await fetch(`${API_BASE}/${id}`, { headers: authHeaders(token) })
    return handleResponse<NetworkEdgeResponse>(res)
  },

  async create(data: NetworkEdgeRequest, token: string): Promise<NetworkEdgeResponse> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: authHeaders(token, true),
      body: JSON.stringify(data),
    })
    return handleResponse<NetworkEdgeResponse>(res)
  },

  async update(id: number, data: NetworkEdgeRequest, token: string): Promise<NetworkEdgeResponse> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: authHeaders(token, true),
      body: JSON.stringify(data),
    })
    return handleResponse<NetworkEdgeResponse>(res)
  },

  async delete(id: number, token: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: authHeaders(token) })
    return handleResponse<boolean>(res)
  },
}
