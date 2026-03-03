import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import BrandPageShell from '../../components/ui/BrandPageShell'

const InitiumOnboardingPage = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [title, setTitle] = useState(profile?.title ?? 'Member')
  const [interests, setInterests] = useState((profile?.interests ?? []).join(', '))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dbClient = db

  if (!dbClient || !profile) {
    return (
      <BrandPageShell title="INITIUM ONBOARDING" memberNav>
        <article className="brand-panel">
          <p>Please sign in and ensure Firebase is configured.</p>
        </article>
      </BrandPageShell>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const parsedInterests = interests
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3)

    try {
      await updateDoc(doc(dbClient, 'users', profile.uid), {
        fullName,
        city,
        title,
        role: 'initium',
        interests: parsedInterests,
        membershipPlan: 'initium',
        membershipStatus: 'active',
        onboardingComplete: true,
        updatedAt: serverTimestamp(),
      })
      navigate(routes.dashboard)
    } catch (err) {
      console.error(err)
      setError('Could not save onboarding. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BrandPageShell title="INITIUM ONBOARDING" memberNav>
      <form className="brand-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Full name</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label className="field">
          <span>City</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} required />
        </label>
        <label className="field">
          <span>Role</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="field">
          <span>Interests (comma separated, max 3)</span>
          <input
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g. AI, Finance, Product"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Finish onboarding'}
        </button>
      </form>
    </BrandPageShell>
  )
}

export default InitiumOnboardingPage
