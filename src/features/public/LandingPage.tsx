import { Link } from 'react-router-dom'
import BrandPageShell from '../../components/ui/BrandPageShell'
import { routes } from '../../routes/paths'

const LandingPage = () => (
  <BrandPageShell title="VERTEX DOMINIUM" subtitle="Privat affärsnätverk för grundare och operatörer.">
    <article className="brand-panel">
      <p>
        Ett privat affärsnätverk där grundare och operatörer bygger inflytande genom betrodda
        relationer, kurerat dealflöde och strategiskt lärande.
      </p>
      <div className="actions">
        <Link className="btn primary" to={routes.register}>
          Bli medlem
        </Link>
        <Link className="btn ghost" to={routes.login}>
          Logga in
        </Link>
      </div>
    </article>

    <article className="brand-panel">
      <h3>Gemenskap + kompetens + kapitaltillgång</h3>
      <p>
        Vertex Dominium kombinerar strukturerad utbildning, nätverksdrivna möjligheter och
        samarbetsmoduler för långsiktig affärstillväxt.
      </p>
    </article>

    <article className="brand-panel">
      <h3>Välj din nivå</h3>
      <p>Initium, Ascensio och Dominus definierar åtkomstdjup i portalen.</p>
      <ul className="muted">
        <li>Initium: grundkurser, flödesläsning, forum och profilgrunder.</li>
        <li>Ascensio: allt i Initium plus utökad profil och märke.</li>
        <li>Dominus: allt i Ascensio plus Dominus-exklusiva ytor och märke.</li>
      </ul>
    </article>

    <article className="brand-panel">
      <h3>Gå till medlemsportalen</h3>
      <div className="actions">
        <Link className="btn primary" to={routes.register}>
          Bli medlem
        </Link>
        <Link className="btn ghost" to={routes.login}>
          Logga in
        </Link>
      </div>
    </article>

    <article className="brand-panel">
      <h3>Kontakta oss</h3>
      <p>E-post: contact@vertexdominium.com</p>
      <Link className="btn ghost" to={routes.contact}>
        Kontaktsida
      </Link>
    </article>
  </BrandPageShell>
)

export default LandingPage
