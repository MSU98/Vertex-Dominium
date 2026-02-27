import useAuth from './useAuth'
import type { MembershipPlan, MembershipStatus, UserRole } from '../types/User'
import type { PortalModule } from '../types/Access'

const planRank: Record<Exclude<MembershipPlan, null>, number> = {
  initium: 1,
  ascensio: 2,
  dominus: 3,
}

const minRankByModule: Record<PortalModule, number> = {
  dashboard: 1,
  courses: 1,
  feed: 1,
  forum: 1,
  profile: 1,
  profileExtended: 2,
  dominusArea: 3,
}

const hasActiveMembership = (status: MembershipStatus | null) => status === 'active'

const resolveRank = (plan: MembershipPlan) => (plan ? planRank[plan] : 0)

const canAccessModule = (
  module: PortalModule,
  role: UserRole | null,
  membershipPlan: MembershipPlan,
  membershipStatus: MembershipStatus | null,
) => {
  if (role === 'admin') return true
  if (!hasActiveMembership(membershipStatus)) return false
  return resolveRank(membershipPlan) >= minRankByModule[module]
}

export const useModuleAccess = () => {
  const { role, membershipPlan, membershipStatus } = useAuth()

  return {
    canAccess: (module: PortalModule) =>
      canAccessModule(module, role, membershipPlan, membershipStatus),
  }
}

export default useModuleAccess
