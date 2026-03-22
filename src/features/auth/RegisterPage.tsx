import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FirebaseError } from 'firebase/app'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, firebaseReady, missingFirebaseKeys } from '../../lib/firebase'
import { upsertPublicProfile } from '../../lib/publicProfile'
import { routes } from '../../routes/paths'
import type { UserProfile } from '../../types/User'
import BrandPageShell from '../../components/ui/BrandPageShell'

const getRegisterErrorMessage = (error: unknown) => {
  if (!(error instanceof FirebaseError)) {
    return 'Could not create account. Please try again.'
  }

  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email address is already registered.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.'
    case 'permission-denied':
      return 'Account was created, but saving the profile to Firestore was denied.'
    default:
      return `Registration failed: ${error.code}`
  }
}

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
        role: null,
        membershipStatus: 'inactive',
        membershipPlan: null,
        onboardingComplete: false,
        createdAt: serverTimestamp() as unknown as UserProfile['createdAt'],
        updatedAt: serverTimestamp() as unknown as UserProfile['updatedAt'],
      }

      await setDoc(doc(dbClient, 'users', credentials.user.uid), baseProfile)
      await upsertPublicProfile(dbClient, credentials.user.uid, baseProfile)
      navigate(routes.home, { replace: true })
    } catch (err) {
      setError(getRegisterErrorMessage(err))
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BrandPageShell title="BLI MEDLEM">
      <form className="brand-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>E-post</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="field">
          <span>Lösenord</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Skapar...' : 'Skapa konto'}
        </button>
        <p className="muted">
          Redan medlem? <Link to="/login">Logga in</Link>
        </p>
      </form>
    </BrandPageShell>
  )
}

export default RegisterPage
