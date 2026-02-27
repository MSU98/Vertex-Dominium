import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { routes } from '../../routes/paths'

const DominusOnboardingPage = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [companyName, setCompanyName] = useState(profile?.company ?? '')
  const [orgNumber, setOrgNumber] = useState(profile?.orgNumber ?? '')
  const [title, setTitle] = useState(profile?.title ?? '')
  const [decisionMandate, setDecisionMandate] = useState('')
  const [email, setEmail] = useState(profile?.email ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [motivation, setMotivation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dbClient = db

  if (!dbClient || !profile) {
    return (
      <div className="page page-centered">
        <div className="card">
          <p className="eyebrow">Onboarding</p>
          <h2>Dominus Negotium</h2>
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
      await addDoc(collection(dbClient, 'dnApplications'), {
        uid: profile.uid,
        fullName,
        companyName,
        orgNumber,
        title,
        decisionMandate,
        email,
        phone,
        motivation,
        status: 'pending',
        createdAt: serverTimestamp(),
      })

      await updateDoc(doc(dbClient, 'users', profile.uid), {
        fullName,
        company: companyName,
        orgNumber,
        phone,
        title,
        membershipPlan: 'dominus',
        membershipStatus: 'pending',
        onboardingComplete: true,
        role: 'initium',
        updatedAt: serverTimestamp(),
      })

      navigate(routes.applicationPending)
    } catch (err) {
      console.error(err)
      setError('Could not submit application. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page page-centered">
      <form className="card form" onSubmit={handleSubmit}>
        <p className="eyebrow">Onboarding</p>
        <h2>Dominus Negotium application</h2>
        <label className="field">
          <span>Full name</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label className="field">
          <span>Company name</span>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        </label>
        <label className="field">
          <span>Org number</span>
          <input value={orgNumber} onChange={(e) => setOrgNumber(e.target.value)} required />
        </label>
        <label className="field">
          <span>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="field">
          <span>Decision mandate</span>
          <input
            value={decisionMandate}
            onChange={(e) => setDecisionMandate(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>Phone</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <label className="field">
          <span>Motivation</span>
          <textarea
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            style={{ minHeight: '120px', background: 'var(--panel-muted)', color: 'var(--text)' }}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit application'}
        </button>
      </form>
    </div>
  )
}

export default DominusOnboardingPage
