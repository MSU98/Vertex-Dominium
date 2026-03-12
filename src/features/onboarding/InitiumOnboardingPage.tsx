import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import BrandPageShell from '../../components/ui/BrandPageShell'

const InitiumOnboardingPage = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [email, setEmail] = useState(profile?.email ?? '')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState(profile?.city ?? '')
  const [title, setTitle] = useState(profile?.title ?? '')
  const [interests, setInterests] = useState((profile?.interests ?? []).join(', '))
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacyPolicy, setAcceptPrivacyPolicy] = useState(false)
  const [acceptCommunication, setAcceptCommunication] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dbClient = db

  if (!dbClient || !profile) {
    return (
      <BrandPageShell title="INITIUM ONBOARDING" memberNav>
        <article className="brand-panel">
          <p>Logga in och kontrollera att Firebase ar konfigurerat.</p>
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
      await addDoc(collection(dbClient, 'dnApplications'), {
        uid: profile.uid,
        membershipPlan: 'initium',
        fullName,
        email,
        title,
        city,
        interests: parsedInterests,
        status: 'pending',
        createdAt: serverTimestamp(),
      })

      await updateDoc(doc(dbClient, 'users', profile.uid), {
        fullName,
        email,
        city,
        title,
        role: 'initium',
        interests: parsedInterests,
        termsAccepted: acceptTerms,
        privacyPolicyAccepted: acceptPrivacyPolicy,
        communicationConsent: acceptCommunication,
        membershipPlan: 'initium',
        membershipStatus: 'pending',
        onboardingComplete: true,
        updatedAt: serverTimestamp(),
      })
      navigate(`${routes.payment}?planId=initium`)
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
          <span>Fornamn & efternamn</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label className="field">
          <span>E-postadress</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>Losenord</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        <label className="field">
          <span>Land/stad</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} required />
        </label>
        <label className="field">
          <span>Yrkesroll</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="field">
          <span>Yrkesintressen (max 3)</span>
          <input
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="t.ex. AI, Finance, Produkt"
          />
        </label>
        <fieldset className="consent-group">
          <legend>Godkannande av:</legend>
          <label className="consent-item">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              required
            />
            <span>Anvandarvillkor</span>
          </label>
          <label className="consent-item">
            <input
              type="checkbox"
              checked={acceptPrivacyPolicy}
              onChange={(e) => setAcceptPrivacyPolicy(e.target.checked)}
              required
            />
            <span>Integritetspolicy</span>
          </label>
          <label className="consent-item">
            <input
              type="checkbox"
              checked={acceptCommunication}
              onChange={(e) => setAcceptCommunication(e.target.checked)}
              required
            />
            <span>Samtycke till kommunikation</span>
          </label>
        </fieldset>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Sparar...' : 'Slutfor onboarding'}
        </button>
      </form>
    </BrandPageShell>
  )
}

export default InitiumOnboardingPage
