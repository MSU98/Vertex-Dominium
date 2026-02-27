import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from './AuthContext'
import { routes } from '../routes/paths'
import type { UserRole } from '../types/User'

type RequireRoleProps = {
  allowedRoles: UserRole[]
}

const RequireRole = ({ allowedRoles }: RequireRoleProps) => {
  // Guard children by membership role.
  const { currentUser, role, loading } = useAuthContext()

  if (loading) {
    return <div className="screen-center">Checking access...</div>
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={currentUser ? routes.home : routes.login} replace />
  }

  return <Outlet />
}

export default RequireRole
