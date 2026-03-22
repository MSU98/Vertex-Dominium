import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { NavLink, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { auth } from '../../lib/firebase'
import { routes } from '../../routes/paths'

const navGroups = [
  {
    label: 'Medlemskap',
    items: [
      { label: 'Översikt', to: routes.dashboard },
      { label: 'Medlemskap', to: routes.membership },
      { label: 'Profil', to: routes.profile },
    ],
  },
  {
    label: 'Nätverk',
    items: [
      { label: 'Kurser', to: routes.courses },
      { label: 'Flöde', to: routes.feed },
      { label: 'Forum', to: routes.forum },
    ],
  },
]

const toLabel = (value: string | null | undefined) => {
  if (!value) return 'Väntar'
  return value.charAt(0).toUpperCase() + value.slice(1)
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

const Sidebar = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = profile?.role === 'admin'
  const displayName = toDisplayName(profile?.fullName, profile?.email)
  const planLabel = toLabel(profile?.membershipPlan ?? profile?.role)
  const statusLabel = toLabel(profile?.membershipStatus)

  const handleSignOut = async () => {
    if (!auth) return

    await signOut(auth)
    setMenuOpen(false)
    navigate(routes.login, { replace: true })
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <img className="brand-mark" src="/vertex-logo.png" alt="Vertex Dominium" />
        <div>
          <p className="eyebrow">Medlemsportal</p>
          <strong>Vertex Dominium</strong>
        </div>
      </div>

      <div className="nav-groups">
        {navGroups.map((group) => (
          <div key={group.label} className="nav-section">
            <p className="nav-section-label">{group.label}</p>
            <nav className="nav">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}

        {isAdmin && (
          <div className="nav-section">
            <p className="nav-section-label">Admin</p>
            <nav className="nav">
              <NavLink
                to={routes.adminDnApplications}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Ansökningar
              </NavLink>
              <NavLink
                to={routes.adminReviews}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Granskningar
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="member-card">
          {profile?.avatarUrl ? (
            <img className="member-avatar-image" src={profile.avatarUrl} alt={displayName} />
          ) : (
            <div className="member-avatar">{displayName.charAt(0).toUpperCase()}</div>
          )}
          <p className="member-name">{displayName}</p>
          <p className="member-email">{profile?.email ?? 'Ingen e-post kopplad'}</p>
          <span className="member-plan-badge">{planLabel}</span>
          <p className="member-status">Status: {statusLabel}</p>

          <div className="member-menu-wrap">
            <button
              type="button"
              className="member-menu-button"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span>Konto</span>
              <span className={`member-menu-chevron ${menuOpen ? 'open' : ''}`}>+</span>
            </button>
            {menuOpen && (
              <div className="member-menu">
                <button type="button" className="member-menu-item" onClick={handleSignOut}>
                  Logga ut
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
