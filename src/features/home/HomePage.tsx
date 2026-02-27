import { Link } from 'react-router-dom'
import { routes } from '../../routes/paths'

const HomePage = () => (
  <div className="landing">
    <div className="landing-hero">
      <header className="landing-nav">
        <div className="landing-nav-left">MENY</div>
        <div className="landing-nav-logo">
          <img src="/vertex-logo.png" alt="Vertex Dominium" />
        </div>
        <nav className="landing-nav-right">
          <Link to={routes.hem}>HEM</Link>
          <Link to={routes.about}>OM OSS</Link>
          <Link to={routes.membership}>MEDLEMSPORTAL</Link>
          <Link to={routes.contact}>KONTAKT</Link>
          <Link to={routes.login}>LOGGA IN</Link>
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
          Dominus-nivan oppnar for kuraterade mojligheter och privata ytor. Fokus ligger pa kvalitet,
          struktur och langsiktig vardeuppbyggnad.
        </p>
      </article>
    </section>
  </div>
)

export default HomePage
