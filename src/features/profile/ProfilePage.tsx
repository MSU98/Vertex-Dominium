import useAuth from '../../hooks/useAuth'
import { useModuleAccess } from '../../hooks/useModuleAccess'

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
    <section className="page">
      <div className="card">
        <p className="eyebrow">Profile</p>
        <h2>{profile?.fullName ?? 'Member profile'}</h2>
        {badge && <p className="muted">{badge}</p>}
        <p className="muted">Email: {profile?.email ?? '-'}</p>
        <p className="muted">Plan: {profile?.membershipPlan ?? 'none'}</p>
        {showExtendedProfile ? (
          <>
            <p className="muted">Company: {profile?.company ?? '-'}</p>
            <p className="muted">LinkedIn: {profile?.linkedin ?? '-'}</p>
            <p className="muted">
              Description: {profile?.professionalDescription ?? 'No description provided.'}
            </p>
          </>
        ) : (
          <p className="muted">Extended profile fields unlock with Ascensio or higher.</p>
        )}
      </div>
    </section>
  )
}

export default ProfilePage
