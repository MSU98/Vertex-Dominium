import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { routes } from '../../routes/paths'
import HeaderAccountMenu from './HeaderAccountMenu'

type BrandPageShellProps = {
  title: string
  subtitle?: string
  memberNav?: boolean
  children: ReactNode
}

const memberLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'member-top-link active' : 'member-top-link'

const BrandPageShell = ({ title, subtitle, memberNav = false, children }: BrandPageShellProps) => {
  const { currentUser, profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const showMemberNav = memberNav || Boolean(currentUser)

  return (
    <div className="brand-page">
      <header className="landing-nav membership-nav">
        <div className="landing-nav-left">
          <HeaderAccountMenu showMemberNav={showMemberNav} />
        </div>
        <NavLink to={routes.hem} className="landing-nav-logo">
          <img src="/vertex-logo.png" alt="Vertex Dominium" />
        </NavLink>
        <nav className="landing-nav-right membership-top-links">
          {showMemberNav ? (
            <>
              <NavLink to={routes.hem} className={memberLinkClass}>
                HEM
              </NavLink>
              <NavLink to={routes.dashboard} className={memberLinkClass}>
                ÖVERSIKT
              </NavLink>
              <NavLink to={routes.membership} className={memberLinkClass}>
                MEDLEMSKAP
              </NavLink>
              <NavLink to={routes.courses} className={memberLinkClass}>
                KURSER
              </NavLink>
              <NavLink to={routes.feed} className={memberLinkClass}>
                FLÖDE
              </NavLink>
              <NavLink to={routes.forum} className={memberLinkClass}>
                FORUM
              </NavLink>
              <NavLink to={routes.messages} className={memberLinkClass}>
                MEDDELANDEN
              </NavLink>
              <NavLink to={routes.profile} className={memberLinkClass}>
                PROFIL
              </NavLink>
              {isAdmin && (
                <NavLink to={routes.adminReviews} className={memberLinkClass}>
                  GRANSKNINGAR
                </NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink to={routes.hem} className={memberLinkClass}>
                HEM
              </NavLink>
              <NavLink to={routes.about} className={memberLinkClass}>
                OM OSS
              </NavLink>
              <NavLink to={routes.membership} className={memberLinkClass}>
                MEDLEMSPORTAL
              </NavLink>
              <NavLink to={routes.contact} className={memberLinkClass}>
                KONTAKT
              </NavLink>
              <NavLink to={routes.login} className={memberLinkClass}>
                LOGGA IN
              </NavLink>
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
