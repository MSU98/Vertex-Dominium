import useAuth from '../../hooks/useAuth'
import { useModuleAccess } from '../../hooks/useModuleAccess'

const ProfilePage = () => {
  const { profile } = useAuth()
  const { canAccess } = useModuleAccess()
  const showExtendedProfile = canAccess('profileExtended')
  const badge =
    profile?.membershipPlan === 'dominus'
      ? 'Dominus-markering'
      : profile?.membershipPlan === 'ascensio'
        ? 'Ascensio-markering'
      : null

  return (
    <section className="page">
      <div className="card">
        <p className="eyebrow">Profil</p>
        <h2>{profile?.fullName ?? 'Medlemsprofil'}</h2>
        {badge && <p className="muted">{badge}</p>}
        <p className="muted">E-post: {profile?.email ?? '-'}</p>
        <p className="muted">Plan: {profile?.membershipPlan ?? 'ingen'}</p>
        {showExtendedProfile ? (
          <>
            <p className="muted">Företag: {profile?.company ?? '-'}</p>
            <p className="muted">LinkedIn: {profile?.linkedin ?? '-'}</p>
            <p className="muted">
              Beskrivning: {profile?.professionalDescription ?? 'Ingen beskrivning angiven.'}
            </p>
          </>
        ) : (
          <p className="muted">Utökade profilfält låses upp med Ascensio eller högre.</p>
        )}
      </div>
    </section>
  )
}

export default ProfilePage
