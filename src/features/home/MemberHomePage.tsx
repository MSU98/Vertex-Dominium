import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { routes } from '../../routes/paths'
import { useModuleAccess } from '../../hooks/useModuleAccess'
import type { PortalModule } from '../../types/Access'

const modules: { key: PortalModule; label: string; to: string }[] = [
  { key: 'dashboard', label: 'Dashboard', to: routes.dashboard },
  { key: 'courses', label: 'Courses', to: routes.courses },
  { key: 'feed', label: 'Feed', to: routes.feed },
  { key: 'forum', label: 'Forum', to: routes.forum },
  { key: 'profile', label: 'Profile', to: routes.profile },
]

const MemberHomePage = () => {
  const { profile } = useAuth()
  const { canAccess } = useModuleAccess()

  return (
    <section className="page">
      <div className="card">
        <p className="eyebrow">Member home</p>
        <h1>Portal overview</h1>
        <p className="muted">
          This is the internal Vertex Dominium home page. Content here is static and can be edited
          by developers as product messaging evolves.
        </p>
        <p className="muted">
          Plan: {profile?.membershipPlan ?? 'none'} | Status: {profile?.membershipStatus ?? 'unknown'}
        </p>
      </div>

      <div className="card">
        <p className="eyebrow">Quick links</p>
        <div className="page" style={{ gap: '12px' }}>
          {modules.map((item) => {
            const unlocked = canAccess(item.key)
            return (
              <div key={item.key} className="card" style={{ padding: '16px' }}>
                <h3>{item.label}</h3>
                <p className="muted">{unlocked ? 'Unlocked' : 'Locked'}</p>
                <Link className="btn ghost" to={unlocked ? item.to : routes.membership}>
                  {unlocked ? 'Open module' : 'Go to membership'}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default MemberHomePage
