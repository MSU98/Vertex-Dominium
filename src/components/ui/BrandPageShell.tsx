import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { routes } from '../../routes/paths'

type BrandPageShellProps = {
  title: string
  subtitle?: string
  memberNav?: boolean
  children: ReactNode
}

const BrandPageShell = ({ title, subtitle, memberNav = false, children }: BrandPageShellProps) => {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="brand-page">
      <header className="landing-nav membership-nav">
        <div className="landing-nav-left">MENY</div>
        <div className="landing-nav-logo">
          <img src="/vertex-logo.png" alt="Vertex Dominium" />
        </div>
        <nav className="landing-nav-right membership-top-links">
          {memberNav ? (
            <>
              <Link to={routes.hem}>HEM</Link>
              <Link to={routes.dashboard}>DASHBOARD</Link>
              <Link to={routes.membership}>MEMBERSHIP</Link>
              <Link to={routes.courses}>COURSES</Link>
              <Link to={routes.feed}>FEED</Link>
              <Link to={routes.forum}>FORUM</Link>
              <Link to={routes.profile}>PROFILE</Link>
              {isAdmin && <Link to={routes.adminDnApplications}>ADMIN</Link>}
            </>
          ) : (
            <>
              <Link to={routes.hem}>HEM</Link>
              <Link to={routes.about}>OM OSS</Link>
              <Link to={routes.membership}>MEDLEMSPORTAL</Link>
              <Link to={routes.contact}>KONTAKT</Link>
              <Link to={routes.login}>LOGGA IN</Link>
            </>
          )}
        </nav>
      </header>

      <section className="brand-page-intro">
        <h1>VERTEX DOMINIUM</h1>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </section>

      <section className="brand-page-content">{children}</section>
    </div>
  )
}

export default BrandPageShell
