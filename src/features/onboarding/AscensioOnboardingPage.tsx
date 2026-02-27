import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { routes } from '../../routes/paths'

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

  if (!db || !profile) {
    return (
      <div className="page page-centered">
        <div className="card">
          <p className="eyebrow">Onboarding</p>
          <h2>Ascensio</h2>
          <p className="muted">Please sign in and ensure Firebase is configured.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await updateDoc(doc(db, 'users', profile.uid), {
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
    <div className="page page-centered">
      <form className="card form" onSubmit={handleSubmit}>
        <p className="eyebrow">Onboarding</p>
        <h2>Ascensio</h2>
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
          <textarea
            value={professionalDescription}
            onChange={(e) => setProfessionalDescription(e.target.value)}
            maxLength={300}
            style={{ minHeight: '80px', background: 'var(--panel-muted)', color: 'var(--text)' }}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Finish onboarding'}
        </button>
      </form>
    </div>
  )
}

export default AscensioOnboardingPage
