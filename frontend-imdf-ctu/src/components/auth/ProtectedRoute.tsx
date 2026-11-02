import { Navigate, Outlet, useLocation } from 'react-router'
import { useUser } from '../../context/UserContext'

const AUTH_REQUIRED_MESSAGE = 'Vui lòng đăng nhập để truy cập trang quản trị.'

interface ProtectedRouteProps {
  requiredRole?: string
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { token, role } = useUser()
  const location = useLocation()

  if (!token) {
    return (
      <Navigate
        to="/signin"
        replace
        state={{
          authMessage: AUTH_REQUIRED_MESSAGE,
          from: location.pathname,
        }}
      />
    )
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/map" replace />
  }

  return <Outlet />
}
