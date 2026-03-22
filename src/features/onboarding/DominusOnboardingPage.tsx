import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import BrandPageShell from '../../components/ui/BrandPageShell'

const DominusOnboardingPage = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [companyName, setCompanyName] = useState(profile?.company ?? '')
  const [orgNumber, setOrgNumber] = useState(profile?.orgNumber ?? '')
  const [title, setTitle] = useState(profile?.title ?? '')
  const [decisionMandate, setDecisionMandate] = useState(profile?.decisionMandate ?? '')
  const [businessEmail, setBusinessEmail] = useState(profile?.businessEmail ?? profile?.email ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [motivation, setMotivation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const dbClient = db

  if (!dbClient || !profile) {
    return (
      <BrandPageShell title="DOMINUS ONBOARDING" memberNav>
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

    try {
      await addDoc(collection(dbClient, 'dnApplications'), {
        uid: profile.uid,
        membershipPlan: 'dominus',
        fullName,
        companyName,
        orgNumber,
        title,
        decisionMandate,
        businessEmail,
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
        decisionMandate,
        businessEmail,
        membershipPlan: 'dominus',
        membershipStatus: 'pending',
        onboardingComplete: true,
        role: 'initium',
        updatedAt: serverTimestamp(),
      })

      navigate(routes.applicationPending)
    } catch (err) {
      console.error(err)
      setError('Kunde inte skicka ansokan. Forsok igen.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BrandPageShell title="DOMINUS ONBOARDING" memberNav>
      <form className="brand-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Fornamn/efternamn</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label className="field">
          <span>Företagsnamn</span>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        </label>
        <label className="field">
          <span>Organisationsnummer</span>
          <input value={orgNumber} onChange={(e) => setOrgNumber(e.target.value)} required />
        </label>
        <label className="field">
          <span>Titel/befattning</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="field">
          <span>Beslutsmandat</span>
          <input
            value={decisionMandate}
            onChange={(e) => setDecisionMandate(e.target.value)}
            placeholder="Agare, VD, ledningsgrupp eller annat"
            required
          />
        </label>
        <label className="field">
          <span>E-post (företagsdomän)</span>
          <input
            type="email"
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
            required
          />
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
          <span>Telefonnummer</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <label className="field">
          <span>Kort ansokan (varfor vill du bli medlem?)</span>
          <textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} required />
        </label>
        <article className="brand-panel-sub">
          <h3>Steg 2 (vid godkänd ansokan)</h3>
          <p className="muted">Full onboarding samlar in följande:</p>
          <ul className="membership-benefits">
            <li>Faktureringsuppgifter</li>
            <li>Foretagsstorlek (antal anställda)</li>
            <li>Omsättning</li>
            <li>Geografisk räckvidd</li>
            <li>Bransch/inriktning</li>
            <li>LinkedIn</li>
            <li>Intresse for affärsnätverk, matchmaking och styrelse/rådgivande sammanhang</li>
          </ul>
        </article>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Skickar...' : 'Skicka ansokan'}
        </button>
      </form>
    </BrandPageShell>
  )
}

export default DominusOnboardingPage
