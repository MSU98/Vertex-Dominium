import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, firebaseReady, missingFirebaseKeys } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import type { UserProfile } from '../../types/User'
import BrandPageShell from '../../components/ui/BrandPageShell'

const RegisterPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const authClient = auth
  const dbClient = db

  if (!firebaseReady || !authClient || !dbClient) {
    return (
      <BrandPageShell title="BLI MEDLEM">
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
      const credentials = await createUserWithEmailAndPassword(authClient, email, password)
      const baseProfile: UserProfile = {
        uid: credentials.user.uid,
        email,
        role: 'initium',
        membershipStatus: 'pending',
        membershipPlan: null,
        onboardingComplete: false,
        createdAt: serverTimestamp() as unknown as UserProfile['createdAt'],
        updatedAt: serverTimestamp() as unknown as UserProfile['updatedAt'],
      }
      await setDoc(doc(dbClient, 'users', credentials.user.uid), baseProfile)
      navigate(routes.home, { replace: true })
    } catch (err) {
      setError('Kunde inte skapa konto. Försök igen.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BrandPageShell title="BLI MEDLEM" subtitle="Skapa ditt konto i Vertex Dominium.">
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <form
          className="brand-form"
          onSubmit={handleSubmit}
          style={{ width: 'min(480px, 100%)', display: 'grid', gap: '20px' }}
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
              autoComplete="new-password"
              minLength={8}
              placeholder="Minst 8 tecken"
              style={{ marginTop: '6px' }}
            />
          </label>

          {/* Felmeddelande */}
          {error && (
            <p className="error" style={{ margin: 0, fontSize: '0.85rem' }}>
              {error}
            </p>
          )}

          {/* Skapa konto-knapp */}
          <button
            className="btn primary"
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '4px',
              letterSpacing: '0.1em',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.35)',
              color: '#f5f5f5',
              boxShadow: 'none',
            }}
          >
            {submitting ? 'SKAPAR KONTO...' : 'SKAPA KONTO'}
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

          {/* Logga in */}
          <Link
            to={routes.login}
            className="btn ghost"
            style={{ textAlign: 'center', letterSpacing: '0.1em' }}
          >
            LOGGA IN
          </Link>

          <p className="muted" style={{ textAlign: 'center', fontSize: '0.8rem', margin: 0 }}>
            Genom att registrera dig godkänner du våra villkor.
          </p>
        </form>
      </div>
    </BrandPageShell>
  )
}

export default RegisterPage