export type UserRole = 'ADMIN' | 'USER'

export interface UserResponse {
  email: string
  token: string
  role: string
}

export interface AdminUserResponse {
  id: number
  fullName: string
  username: string
  email: string
  role: string
}

export interface AccountUser {
  id: number
  username: string
  fullName?: string
  email?: string
  numberPhone?: string
  role: UserRole | string
  isActive: boolean
  createdAt?: string
}

export interface UserPayload {
  username: string
  password?: string
  fullName?: string
  email?: string
  numberPhone?: string
  role: string
  isActive: boolean
}

export type ModalMode = 'create' | 'view' | 'edit'

export type Notify = (
  type: 'success' | 'error' | 'info',
  message: string,
  description?: string
) => void
