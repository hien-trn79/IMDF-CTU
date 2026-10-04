import type { GridLineRequest, GridLineResponse } from '../model/GridLine.model.ts'

const API_BASE = '/api/grid-lines'

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

export const gridLineService = {
  async getAll(): Promise<GridLineResponse[]> {
    const res = await fetch(API_BASE, { headers: { Accept: 'application/json' } })
    return handleResponse<GridLineResponse[]>(res)
  },

  async getById(id: number): Promise<GridLineResponse> {
    const res = await fetch(`${API_BASE}/${id}`, { headers: { Accept: 'application/json' } })
    return handleResponse<GridLineResponse>(res)
  },

  async create(data: GridLineRequest): Promise<GridLineResponse> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<GridLineResponse>(res)
  },

  async update(id: number, data: GridLineRequest): Promise<GridLineResponse> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<GridLineResponse>(res)
  },

  async delete(id: number): Promise<boolean> {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
    return handleResponse<boolean>(res)
  },
}
