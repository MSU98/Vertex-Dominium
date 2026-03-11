import { Link } from 'react-router-dom'
import BrandPageShell from '../../components/ui/BrandPageShell'
import { routes } from '../../routes/paths'

const LandingPage = () => (
  <BrandPageShell title="VERTEX DOMINIUM" subtitle="Private business network for founders and operators.">
    <article className="brand-panel">
      <p>
        A private business network where founders and operators build leverage through trusted
        relationships, curated deal flow, and strategic learning.
      </p>
      <div className="actions">
        <Link className="btn primary" to={routes.register}>
          Become a member
        </Link>
        <Link className="btn ghost" to={routes.login}>
          Log in
        </Link>
      </div>
    </article>

    <article className="brand-panel">
      <h3>Community + capability + capital access</h3>
      <p>
        Vertex Dominium combines structured education, network-driven opportunities, and member
        collaboration modules for long-term business growth.
      </p>
    </article>

    <article className="brand-panel">
      <h3>Choose your level</h3>
      <p>Initium, Ascensio, and Dominus define access depth in the portal.</p>
      <ul className="muted">
        <li>Initium: core courses, feed read access, forum basics, profile basics.</li>
        <li>Ascensio: everything in Initium plus extended profile and badge.</li>
        <li>Dominus: everything in Ascensio plus Dominus-only areas and badge.</li>
      </ul>
    </article>

    <article className="brand-panel">
      <h3>Enter the member portal</h3>
      <div className="actions">
        <Link className="btn primary" to={routes.register}>
          Become a member
        </Link>
        <Link className="btn ghost" to={routes.login}>
          Log in
        </Link>
      </div>
    </article>

    <article className="brand-panel">
      <h3>Speak with the team</h3>
      <p>Email: contact@vertexdominium.com</p>
      <Link className="btn ghost" to={routes.contact}>
        Contact page
      </Link>
    </article>
  </BrandPageShell>
)

export default LandingPage
