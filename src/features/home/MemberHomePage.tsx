import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { routes } from '../../routes/paths'
import { useModuleAccess } from '../../hooks/useModuleAccess'
import type { PortalModule } from '../../types/Access'
import BrandPageShell from '../../components/ui/BrandPageShell'

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
    <BrandPageShell title="MEMBER HOME" subtitle="Portal overview for current members." memberNav>
      <article className="brand-panel">
        <p>
          This is the internal Vertex Dominium home page. Content here is static and can be edited
          by developers as product messaging evolves.
        </p>
        <p>
          Plan: {profile?.membershipPlan ?? 'none'} | Status: {profile?.membershipStatus ?? 'unknown'}
        </p>
      </article>

      <article className="brand-panel">
        <h3>Quick links</h3>
        <div className="brand-panel-grid">
          {modules.map((item) => {
            const unlocked = canAccess(item.key)
            return (
              <div key={item.key} className="brand-panel-sub">
                <h3>{item.label}</h3>
                <p className="muted">{unlocked ? 'Unlocked' : 'Locked'}</p>
                <Link className="btn ghost" to={unlocked ? item.to : routes.membership}>
                  {unlocked ? 'Open module' : 'Go to membership'}
                </Link>
              </div>
            )
          })}
        </div>
      </article>
    </BrandPageShell>
  )
}

export default MemberHomePage
