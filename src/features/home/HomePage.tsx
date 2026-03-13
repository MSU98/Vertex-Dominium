import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { routes } from '../../routes/paths'
import HeaderAccountMenu from '../../components/ui/HeaderAccountMenu'

const HomePage = () => {
  const { currentUser, profile } = useAuth()
  const showMemberNav = Boolean(currentUser)
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="landing">
      <div className="landing-hero">
        <header className="landing-nav">
          <div className="landing-nav-left">
            <HeaderAccountMenu showMemberNav={showMemberNav} />
          </div>
          <div className="landing-nav-logo">
            <img src="/vertex-logo.png" alt="Vertex Dominium" />
          </div>
          <nav className="landing-nav-right membership-top-links">
            {showMemberNav ? (
              <>
                <Link to={routes.hem}>HEM</Link>
                <Link to={routes.dashboard}>DASHBOARD</Link>
                <Link to={routes.membership}>MEMBERSHIP</Link>
                <Link to={routes.courses}>COURSES</Link>
                <Link to={routes.feed}>FEED</Link>
                <Link to={routes.forum}>FORUM</Link>
                <Link to={routes.profile}>PROFILE</Link>
                {isAdmin && <Link to={routes.adminReviews}>REVIEWS</Link>}
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

        <div className="landing-title-wrap">
          <p className="landing-kicker">STRATEGY. JUDGEMENT. LEGACY.</p>
          <h1 className="landing-title">VERTEX DOMINIUM</h1>
        </div>
      </div>

      <section className="landing-content">
        <h2>STRATEGY. JUDGEMENT. LEGACY.</h2>
        <p>
          Vertex Dominium ar ett exklusivt medlemsnatverk for entreprenorer, investerare och
          beslutsfattare. Plattformen ar byggd for medlemmar som vill utveckla sitt kapital, sitt
          inflytande och sitt omdome i ett rum med hog kvalitet.
        </p>
        <p>
          Medlemskapet ar uppdelat i Initium, Ascensio och Dominus med tydlig tillgang till
          moduler, innehall och samarbetsytor. Portalen ar byggd for tillvaxt, relationer och
          strategisk riktning.
        </p>
      </section>

      <section className="landing-bottom-grid">
        <article>
          <h3>VAR VISION</h3>
          <p>
            Vi bygger ett modernt hus for beslutskraftiga medlemmar som vill kombinera strategi,
            kompetens och tillgang till ratt sammanhang.
          </p>
        </article>
        <article>
          <h3>EXKLUSIVA INVESTERINGS-MOJLIGHETER</h3>
          <p>
            Dominus-nivan oppnar for kuraterade mojligheter och privata ytor. Fokus ligger pa
            kvalitet, struktur och langsiktig vardeuppbyggnad.
          </p>
        </article>
      </section>
    </div>
  )
}

export default HomePage
