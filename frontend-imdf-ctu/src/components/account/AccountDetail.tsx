import { useNavigate } from 'react-router'
import { useUser } from '../../context/UserContext'

export default function AccountDetail() {
  const { authData, logout } = useUser()

  const navigate = useNavigate()

  return (
    <div className="account-detail">
      <div className="account-info">
        <h2 className="account-info-title">Account Information</h2>
        <p className="account-info-item">
          <strong>Email:</strong> {authData?.email}
        </p>
        <p className="account-info-item">
          <strong>Role:</strong> {authData?.role}
        </p>
        <p className="account-info-item">
          <strong>Token:</strong> {authData?.token}
        </p>
        <button
          className="logout-button"
          onClick={() => {
            logout()
            navigate('/signin')
          }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}
