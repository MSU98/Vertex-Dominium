import useAuth from '../../hooks/useAuth'
import { useModuleAccess } from '../../hooks/useModuleAccess'
import BrandPageShell from '../../components/ui/BrandPageShell'

const ProfilePage = () => {
  const { profile } = useAuth()
  const { canAccess } = useModuleAccess()
  const showExtendedProfile = canAccess('profileExtended')
  const badge =
    profile?.membershipPlan === 'dominus'
      ? 'Dominus badge'
      : profile?.membershipPlan === 'ascensio'
      ? 'Ascensio badge'
      : null

  return (
    <BrandPageShell title="PROFILE" subtitle="Din medlemsprofil i Vertex Dominium." memberNav>
      <article className="brand-panel">
        <h3>{profile?.fullName ?? 'Member profile'}</h3>
        {badge && <p>{badge}</p>}
        <p>Email: {profile?.email ?? '-'}</p>
        <p>Plan: {profile?.membershipPlan ?? 'none'}</p>
        {showExtendedProfile ? (
          <>
            <p>Company: {profile?.company ?? '-'}</p>
            <p>LinkedIn: {profile?.linkedin ?? '-'}</p>
            <p>Description: {profile?.professionalDescription ?? 'No description provided.'}</p>
          </>
        ) : (
          <p>Extended profile fields unlock with Ascensio or higher.</p>
        )}
      </article>
    </BrandPageShell>
  )
}

export default ProfilePage
