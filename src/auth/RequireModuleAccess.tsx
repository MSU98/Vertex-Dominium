import { Navigate, Outlet } from 'react-router-dom'
import { routes } from '../routes/paths'
import useModuleAccess from '../hooks/useModuleAccess'
import type { PortalModule } from '../types/Access'

type RequireModuleAccessProps = {
  module: PortalModule
}

const RequireModuleAccess = ({ module }: RequireModuleAccessProps) => {
  const { canAccess } = useModuleAccess()

  if (!canAccess(module)) {
    return <Navigate to={routes.membership} replace />
  }

  return <Outlet />
}

export default RequireModuleAccess
