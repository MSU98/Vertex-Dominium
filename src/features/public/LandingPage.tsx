import { Link } from 'react-router-dom'
import { routes } from '../../routes/paths'

const LandingPage = () => (
  <section className="page">
    <div className="card">
      <p className="eyebrow">Hero</p>
      <h1>Vertex Dominium</h1>
      <p className="muted">
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
    </div>

    <div className="card">
      <p className="eyebrow">What is Vertex Dominium</p>
      <h2>Community + capability + capital access</h2>
      <p className="muted">
        Vertex Dominium combines structured education, network-driven opportunities, and member
        collaboration modules for long-term business growth.
      </p>
    </div>

    <div className="card">
      <p className="eyebrow">Membership tiers</p>
      <h2>Choose your level</h2>
      <p className="muted">Initium, Ascensio, and Dominus define access depth in the portal.</p>
      <ul className="muted">
        <li>Initium: core courses, feed read access, forum basics, profile basics.</li>
        <li>Ascensio: everything in Initium plus extended profile and badge.</li>
        <li>Dominus: everything in Ascensio plus Dominus-only areas and badge.</li>
      </ul>
    </div>

    <div className="card">
      <p className="eyebrow">Call to action</p>
      <h2>Enter the member portal</h2>
      <div className="actions">
        <Link className="btn primary" to={routes.register}>
          Become a member
        </Link>
        <Link className="btn ghost" to={routes.login}>
          Log in
        </Link>
      </div>
    </div>

    <div className="card">
      <p className="eyebrow">Contact</p>
      <h2>Speak with the team</h2>
      <p className="muted">Email: contact@vertexdominium.com</p>
      <Link className="btn ghost" to={routes.contact}>
        Contact page
      </Link>
    </div>
  </section>
)

export default LandingPage
