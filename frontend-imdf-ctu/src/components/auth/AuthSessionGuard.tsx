import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useUser } from '../../context/UserContext'

const SESSION_EXPIRED_MESSAGE =
  'Phiên đăng nhập đã hết hạn hoặc tài khoản không còn tồn tại. Vui lòng đăng nhập lại.'

function getTokenExpiration(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: number
    }
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

export default function AuthSessionGuard() {
  const { token, logout } = useUser()
  const location = useLocation()
  const navigate = useNavigate()
  const handledUnauthorized = useRef(false)

  const redirectToSignIn = () => {
    if (handledUnauthorized.current) return
    handledUnauthorized.current = true
    logout()
    navigate('/signin', {
      replace: true,
      state: { authMessage: SESSION_EXPIRED_MESSAGE },
    })
  }

  const redirectToMap = () => {
    if (location.pathname === '/map' || handledUnauthorized.current) return
    handledUnauthorized.current = true
    navigate('/map', { replace: true })
  }

  useEffect(() => {
    handledUnauthorized.current = false
    if (!token) return

    const expiresAt = getTokenExpiration(token)
    if (!expiresAt || expiresAt <= Date.now()) {
      redirectToSignIn()
      return
    }

    const timeoutId = window.setTimeout(redirectToSignIn, expiresAt - Date.now())
    return () => window.clearTimeout(timeoutId)
  }, [token])

  useEffect(() => {
    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      const request = new Request(...args)
      const response = await originalFetch(request)
      const authorization = request.headers.get('Authorization')

      if (authorization?.startsWith('Bearer ')) {
        if (response.status === 401) {
          redirectToSignIn()
        } else if (response.status === 403) {
          redirectToMap()
        }
      }

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [location.pathname])

  return null
}
