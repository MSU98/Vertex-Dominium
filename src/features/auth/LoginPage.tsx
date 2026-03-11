import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, firebaseReady, missingFirebaseKeys } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import BrandPageShell from '../../components/ui/BrandPageShell'

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
            Add the following keys to your <code>.env</code> file and restart <code>npm run dev</code>.
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
      navigate(routes.home, { replace: true })
    } catch (err) {
      setError('Felaktiga uppgifter. Kontrollera email och lösenord.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BrandPageShell title="LOGGA IN" subtitle="Välkommen tillbaka till Vertex Dominium.">
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <form
          className="brand-form"
          onSubmit={handleSubmit}
          style={{
            width: 'min(480px, 100%)',
            display: 'grid',
            gap: '20px',
          }}
        >
          {/* Email */}
          <label className="field">
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="din@email.com"
              style={{ marginTop: '6px' }}
            />
          </label>

          {/* Lösenord */}
          <label className="field">
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Lösenord
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{ marginTop: '6px' }}
            />
          </label>

          {/* Felmeddelande */}
          {error && (
            <p className="error" style={{ margin: 0, fontSize: '0.85rem' }}>
              {error}
            </p>
          )}

          {/* Logga in-knapp */}
          <button
            className="btn primary"
            type="submit"
            disabled={submitting}
            style={{ marginTop: '4px', letterSpacing: '0.1em' }}
          >
            {submitting ? 'LOGGAR IN...' : 'LOGGA IN'}
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#98a3b8',
            fontSize: '0.8rem',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
            ELLER
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.12)' }} />
          </div>

          {/* Registrera */}
          <Link
            to={routes.register}
            className="btn ghost"
            style={{ textAlign: 'center', letterSpacing: '0.1em' }}
          >
            SKAPA KONTO
          </Link>

          <p className="muted" style={{ textAlign: 'center', fontSize: '0.8rem', margin: 0 }}>
            Genom att logga in godkänner du våra villkor.
          </p>
        </form>
      </div>
    </BrandPageShell>
  )
}

export default LoginPage