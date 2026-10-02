import type { IndoorRouteRequest, IndoorRouteResponse } from '../model/IndoorRoute.model'

const API_BASE = '/api/indoor-routes'

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

export const indoorRouteService = {
  async getAll(): Promise<IndoorRouteResponse[]> {
    const res = await fetch(API_BASE, { headers: { Accept: 'application/json' } })
    return handleResponse<IndoorRouteResponse[]>(res)
  },

  async getById(id: number): Promise<IndoorRouteResponse> {
    const res = await fetch(`${API_BASE}/${id}`, { headers: { Accept: 'application/json' } })
    return handleResponse<IndoorRouteResponse>(res)
  },

  async create(data: IndoorRouteRequest): Promise<IndoorRouteResponse> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<IndoorRouteResponse>(res)
  },

  async update(id: number, data: IndoorRouteRequest): Promise<IndoorRouteResponse> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<IndoorRouteResponse>(res)
  },

  async delete(id: number): Promise<boolean> {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
    return handleResponse<boolean>(res)
  },
}
