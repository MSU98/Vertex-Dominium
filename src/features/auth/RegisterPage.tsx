import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, firebaseReady, missingFirebaseKeys } from '../../lib/firebase'
import type { UserProfile } from '../../types/User'

const RegisterPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  if (!firebaseReady || !auth || !db) {
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
      const credentials = await createUserWithEmailAndPassword(auth, email, password)
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

      await setDoc(doc(db, 'users', credentials.user.uid), baseProfile)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError('Could not create account. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page page-centered">
      <form className="card form" onSubmit={handleSubmit}>
        <p className="eyebrow">Onboarding</p>
        <h2>Create account</h2>
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
            autoComplete="new-password"
            minLength={8}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create account'}
        </button>
        <p className="muted">
          Already a member? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  )
}

export default RegisterPage
