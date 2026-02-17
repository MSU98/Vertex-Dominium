import { NavLink } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { routes } from '../../routes/paths'

const navItems = [
  { label: 'Dashboard', to: routes.dashboard },
  { label: 'Courses', to: routes.courses },
  { label: 'Feed', to: routes.feed },
  { label: 'Forum', to: routes.forum },
]

const Sidebar = () => {
  const { profile } = useAuth()

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="dot" />
        <div>
          <p className="eyebrow">Vertex</p>
          <strong>Dominium</strong>
        </div>
      </div>

      <nav className="nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="muted">Role: {profile?.role ?? 'pending'}</p>
        <p className="muted">Membership: {profile?.membershipStatus ?? 'pending'}</p>
      </div>
    </aside>
  )
}

export default Sidebar
