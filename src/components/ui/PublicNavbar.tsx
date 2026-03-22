import { Link, NavLink } from 'react-router-dom'
import { routes } from '../../routes/paths'

const PublicNavbar = () => (
  <header className="public-nav">
    <div className="public-nav-inner">
      <Link to={routes.home} className="brand">
        <span className="dot" />
        <div>
          <p className="eyebrow">Vertex</p>
          <strong>Dominium</strong>
        </div>
      </Link>

      <nav className="public-nav-links">
        <NavLink to={routes.home} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Hem
        </NavLink>
        <NavLink to={routes.about} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Om oss
        </NavLink>
        <NavLink to={routes.contact} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Kontakt
        </NavLink>
      </nav>

      <div className="actions" style={{ marginTop: 0 }}>
        <Link className="btn ghost" to={routes.login}>
          Logga in
        </Link>
        <Link className="btn primary" to={routes.register}>
          Bli medlem
        </Link>
      </div>
    </div>
  </header>
)

export default PublicNavbar
