import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { auth } from '../../lib/firebase'
import { routes } from '../../routes/paths'

type HeaderAccountMenuProps = {
  showMemberNav: boolean
}

const toDisplayName = (fullName: string | undefined, email: string | undefined) => {
  if (fullName?.trim()) return fullName.trim()
  if (!email) return 'Medlem'

  return email
    .split('@')[0]
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const HeaderAccountMenu = ({ showMemberNav }: HeaderAccountMenuProps) => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const displayName = toDisplayName(profile?.fullName, profile?.email)

  const handleSignOut = async () => {
    if (!auth) return

    await signOut(auth)
    setMenuOpen(false)
    navigate(routes.login, { replace: true })
  }

  if (!showMemberNav) {
    return 'MENY'
  }

  return (
    <div className="top-account-wrap">
      <button
        type="button"
        className="top-account-button"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {profile?.avatarUrl ? (
          <img className="top-account-avatar" src={profile.avatarUrl} alt={displayName} />
        ) : (
          <span className="top-account-avatar top-account-fallback">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <span>{displayName}</span>
      </button>
      {menuOpen && (
        <div className="top-account-menu">
          <Link to={routes.profile} className="top-account-menu-item" onClick={() => setMenuOpen(false)}>
            Min profil
          </Link>
          <button type="button" className="top-account-menu-item" onClick={handleSignOut}>
            Logga ut
          </button>
        </div>
      )}
    </div>
  )
}

export default HeaderAccountMenu
