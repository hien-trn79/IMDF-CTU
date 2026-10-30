import type { AccountUser, UserPayload } from '../../model/User.model'

const BASE_URL = 'http://localhost:8081/api/admin'

async function request<T>(path: string, token: string | null, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })
  if (!res.ok) {
    let msg = `Yêu cầu thất bại (${res.status})`
    try {
      const body = await res.json()
      msg = body?.message || body?.error || msg
    } catch {
      console.warn('Không thể phân tích phản hồi JSON', res)
    }
    throw new Error(msg)
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalize = (u: any): AccountUser => ({
  ...u,
  username: u.username ?? u.userName ?? u.email,
  fullName: u.fullName ?? u.fullname ?? u.name,
  isActive: u.isActive ?? u.active ?? false,
})

export const adminApi = {
  getMe: async (token: string | null) => normalize(await request<AccountUser>('/me', token)),
  getUsers: async (token: string | null) =>
    (await request<AccountUser[]>('/users', token)).map(normalize),
  getUser: async (token: string | null, id: number) =>
    normalize(await request<AccountUser>(`/users/${id}`, token)),
  create: (token: string | null, data: UserPayload) =>
    request<AccountUser>('/users', token, { method: 'POST', body: JSON.stringify(data) }),
  update: (token: string | null, id: number, data: UserPayload) =>
    request<AccountUser>(`/users/${id}`, token, { method: 'PUT', body: JSON.stringify(data) }),
}
