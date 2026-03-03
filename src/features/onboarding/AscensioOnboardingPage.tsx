import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import BrandPageShell from '../../components/ui/BrandPageShell'

const AscensioOnboardingPage = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [company, setCompany] = useState(profile?.company ?? '')
  const [orgNumber, setOrgNumber] = useState(profile?.orgNumber ?? '')
  const [linkedin, setLinkedin] = useState(profile?.linkedin ?? '')
  const [professionalDescription, setProfessionalDescription] = useState(
    profile?.professionalDescription ?? '',
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dbClient = db

  if (!dbClient || !profile) {
    return (
      <BrandPageShell title="ASCENSIO ONBOARDING" memberNav>
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

    try {
      await updateDoc(doc(dbClient, 'users', profile.uid), {
        fullName,
        phone,
        company,
        orgNumber,
        linkedin,
        professionalDescription: professionalDescription.slice(0, 300),
        membershipPlan: 'ascensio',
        membershipStatus: 'active',
        onboardingComplete: true,
        role: 'ascensio',
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
    <BrandPageShell title="ASCENSIO ONBOARDING" memberNav>
      <form className="brand-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Full name</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label className="field">
          <span>Phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <label className="field">
          <span>Company</span>
          <input value={company} onChange={(e) => setCompany(e.target.value)} required />
        </label>
        <label className="field">
          <span>Org number</span>
          <input value={orgNumber} onChange={(e) => setOrgNumber(e.target.value)} required />
        </label>
        <label className="field">
          <span>LinkedIn</span>
          <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
        </label>
        <label className="field">
          <span>Professional description (max 300 chars)</span>
          <textarea value={professionalDescription} onChange={(e) => setProfessionalDescription(e.target.value)} maxLength={300} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Finish onboarding'}
        </button>
      </form>
    </BrandPageShell>
  )
}

export default AscensioOnboardingPage
