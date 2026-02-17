import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthContext } from './AuthContext'

const RequireAuth = () => {
  const { currentUser, loading } = useAuthContext()
  const location = useLocation()

  if (loading) {
    return <div className="screen-center">Loading...</div>
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default RequireAuth

