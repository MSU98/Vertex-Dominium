import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FirebaseError } from 'firebase/app'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, firebaseReady, missingFirebaseKeys } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import BrandPageShell from '../../components/ui/BrandPageShell'

const getLoginErrorMessage = (error: unknown) => {
  if (!(error instanceof FirebaseError)) {
    return 'Could not sign in. Check credentials or try again.'
  }

  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Email or password is incorrect.'
    case 'auth/too-many-requests':
      return 'Too many login attempts. Wait a moment and try again.'
    default:
      return `Sign-in failed: ${error.code}`
  }
}

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const authClient = auth

  if (!firebaseReady || !authClient) {
    return (
      <BrandPageShell title="LOGGA IN">
        <article className="brand-panel">
          <h3>Connect Firebase</h3>
          <p className="muted">
            Add the following keys to your <code>.env</code> file and restart{' '}
            <code>npm run dev</code>.
          </p>
          <ul className="muted" style={{ paddingLeft: '20px', margin: '8px 0' }}>
            {missingFirebaseKeys.map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
        </article>
      </BrandPageShell>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signInWithEmailAndPassword(authClient, email, password)
      navigate(routes.splash, { replace: true })
    } catch (err) {
      setError(getLoginErrorMessage(err))
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BrandPageShell title="LOGGA IN">
      <form className="brand-form" onSubmit={handleSubmit}>
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
    </BrandPageShell>
  )
}

export default LoginPage
