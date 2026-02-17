import { Link } from 'react-router-dom'

const HomePage = () => (
  <div className="page page-centered">
    <div className="card">
      <p className="eyebrow">Vertex Dominium</p>
      <h1>Premium membership foundation</h1>
      <p className="muted">
        React + Firebase MVP scaffold with role-based access, ready for onboarding and payments.
      </p>
      <div className="actions">
        <Link className="btn primary" to="/register">
          Get started
        </Link>
        <Link className="btn ghost" to="/login">
          Sign in
        </Link>
      </div>
    </div>
  </div>
)

export default HomePage

