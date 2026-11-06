import type { GridLineRequest, GridLineResponse } from '../model/GridLine.model'
import { authHeaders } from './authHeaders'

const API_BASE = 'http://localhost:8081/api/grid-lines'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Lỗi máy chủ (${res.status})`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      const text = await res.text().catch(() => '')
      if (text) message = text
    }
    throw new Error(message)
  }
  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) return res.json()
  return (await res.text()) as T
}

export const gridLineService = {
  async getAll(token: string): Promise<GridLineResponse[]> {
    return handleResponse(await fetch(API_BASE, { headers: authHeaders(token) }))
  },
  async getById(id: number, token: string): Promise<GridLineResponse> {
    return handleResponse(await fetch(`${API_BASE}/${id}`, { headers: authHeaders(token) }))
  },
  async create(data: GridLineRequest, token: string): Promise<GridLineResponse> {
    return handleResponse(
      await fetch(API_BASE, {
        method: 'POST',
        headers: authHeaders(token, true),
        body: JSON.stringify(data),
      })
    )
  },
  async update(id: number, data: GridLineRequest, token: string): Promise<GridLineResponse> {
    return handleResponse(
      await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: authHeaders(token, true),
        body: JSON.stringify(data),
      })
    )
  },
  async delete(id: number, token: string): Promise<boolean> {
    return handleResponse(
      await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: authHeaders(token) })
    )
  },
}
