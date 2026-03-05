import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import useAuth from '../../hooks/useAuth'
import { useModuleAccess } from '../../hooks/useModuleAccess'
import BrandPageShell from '../../components/ui/BrandPageShell'
import { auth } from '../../lib/firebase'
import { routes } from '../../routes/paths'

const ProfilePage = () => {
  const { profile } = useAuth()
  const { canAccess } = useModuleAccess()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const showExtendedProfile = canAccess('profileExtended')
  const badge =
    profile?.membershipPlan === 'dominus'
      ? 'Dominus badge'
      : profile?.membershipPlan === 'ascensio'
      ? 'Ascensio badge'
      : null

  const handleLogout = async () => {
    const authClient = auth
    if (!authClient || loggingOut) return

    setLoggingOut(true)
    setLogoutError(null)
    try {
      await signOut(authClient)
      navigate(routes.home, { replace: true })
    } catch (error) {
      console.error(error)
      setLogoutError('Could not log out. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

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
        <div className="actions">
          <button className="btn ghost" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? 'LOGGING OUT...' : 'LOGGA UT'}
          </button>
        </div>
        {logoutError && <p className="error">{logoutError}</p>}
      </article>
    </BrandPageShell>
  )
}

export default ProfilePage
