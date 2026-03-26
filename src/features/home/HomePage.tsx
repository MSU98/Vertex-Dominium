import { NavLink } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { routes } from '../../routes/paths'
import HeaderAccountMenu from '../../components/ui/HeaderAccountMenu'

const memberLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'member-top-link active' : 'member-top-link'

const HomePage = () => {
  const { currentUser, profile } = useAuth()
  const showMemberNav = Boolean(currentUser)
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="landing">
      <div className="landing-hero">
        <header className="landing-nav membership-nav">
          <div className="landing-nav-left">
            <HeaderAccountMenu showMemberNav={showMemberNav} />
          </div>
          <div className="landing-nav-logo">
            <img src="/vertex-logo.png" alt="Vertex Dominium" />
          </div>
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

        <div className="landing-title-wrap">
          <p className="landing-kicker">STRATEGY. JUDGEMENT. LEGACY.</p>
          <h1 className="landing-title">VERTEX DOMINIUM</h1>
        </div>
      </div>

      <section className="landing-content">
        <h2>STRATEGY. JUDGEMENT. LEGACY.</h2>
        <p>
          Vertex Dominium är ett exklusivt medlemsnätverk för entreprenörer, investerare och
          beslutsfattare. Plattformen är byggd för medlemmar som vill utveckla sitt kapital, sitt
          inflytande och sitt omdöme i ett rum med hög kvalitet.
        </p>
        <p>
          Medlemskapet är uppdelat i Initium, Ascensio och Dominus med tydlig tillgång till
          moduler, innehåll och samarbetsytor. Portalen är byggd för tillväxt, relationer och
          strategisk riktning.
        </p>
      </section>

      <section className="landing-bottom-grid">
        <article>
          <h3>VÅR VISION</h3>
          <p>
            Vi bygger ett modernt hus för beslutskraftiga medlemmar som vill kombinera strategi,
            kompetens och tillgång till rätt sammanhang.
          </p>
        </article>
        <article>
          <h3>EXKLUSIVA INVESTERINGS-MÖJLIGHETER</h3>
          <p>
            Dominus-nivån öppnar för kuraterade möjligheter och privata ytor. Fokus ligger på
            kvalitet, struktur och långsiktig värdeuppbyggnad.
          </p>
        </article>
      </section>
    </div>
  )
}

export default HomePage
