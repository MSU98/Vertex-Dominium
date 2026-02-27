import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, firebaseReady, missingFirebaseKeys } from '../../lib/firebase'
import { routes } from '../../routes/paths'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const authClient = auth

  if (!firebaseReady || !authClient) {
    return (
      <div className="page page-centered">
        <div className="card">
          <p className="eyebrow">Configuration needed</p>
          <h2>Connect Firebase</h2>
          <p className="muted">
            Add the following keys to your <code>.env</code> file and restart <code>npm run dev</code>.
          </p>
          <ul className="muted" style={{ paddingLeft: '20px', margin: '8px 0' }}>
            {missingFirebaseKeys.map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signInWithEmailAndPassword(authClient, email, password)
      navigate(routes.home, { replace: true })
    } catch (err) {
      setError('Could not sign in. Check credentials or try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page page-centered">
      <form className="card form" onSubmit={handleSubmit}>
        <p className="eyebrow">Access</p>
        <h2>Sign in</h2>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="muted">
          No account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  )
}

export default LoginPage
