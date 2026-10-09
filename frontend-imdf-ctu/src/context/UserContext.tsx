import { createContext, useContext, useState, type ReactNode } from 'react'
import type { UserResponse } from '../model/User.model'

interface UserContextType {
  email: string | null
  token: string | null
  role: string | null
  authData: UserResponse | null
  setAuthData: ({ user }: { user: UserResponse | null }) => void
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  // Đọc dữ liệu ban đầu từ localStorage
  const [user, setUser] = useState<UserResponse | null>(() => {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  })

  // Hàm cập nhật auth data (dùng khi đăng nhập hoặc lấy thông tin mới)
  const setAuthData = ({ user }: { user: UserResponse | null }) => {
    setUser(user)
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }

  // Ham logout, xóa dữ liệu người dùng khỏi localStorage và cập nhật state
  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }
  return (
    <UserContext.Provider
      value={{
        email: user?.email || null,
        token: user?.token || null,
        role: user?.role || null,
        authData: user,
        setAuthData,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

// Custom hook để sử dụng UserContext
export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser phải được sử dụng trong UserProvider')
  }

  return context
}
