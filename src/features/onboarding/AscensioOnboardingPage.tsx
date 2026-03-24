import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { upsertPublicProfile } from '../../lib/publicProfile'
import { routes } from '../../routes/paths'
import BrandPageShell from '../../components/ui/BrandPageShell'

const AscensioOnboardingPage = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [email, setEmail] = useState(profile?.email ?? '')
  const [password, setPassword] = useState('')
  const [countryCity, setCountryCity] = useState(profile?.countryCity ?? profile?.city ?? '')
  const [title, setTitle] = useState(profile?.title ?? '')
  const [professionalInterests, setProfessionalInterests] = useState(
    profile?.professionalInterests ?? '',
  )
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [currentBusiness, setCurrentBusiness] = useState(profile?.currentBusiness ?? '')
  const [industry, setIndustry] = useState(profile?.industry ?? '')
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
          <p>Logga in och kontrollera att Firebase är konfigurerat.</p>
        </article>
      </BrandPageShell>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const descriptionWords = professionalDescription.trim().split(/\s+/).filter(Boolean)
      const cappedDescription = descriptionWords.slice(0, 300).join(' ')

      await addDoc(collection(dbClient, 'dnApplications'), {
        uid: profile.uid,
        membershipPlan: 'ascensio',
        fullName,
        companyName: company,
        orgNumber,
        title,
        email,
        phone,
        motivation: cappedDescription,
        status: 'pending',
        createdAt: serverTimestamp(),
      })

      const updates = {
        fullName,
        email,
        countryCity,
        city: countryCity,
        title,
        professionalInterests,
        phone,
        currentBusiness,
        industry,
        company,
        orgNumber,
        linkedin,
        professionalDescription: cappedDescription,
        membershipPlan: 'ascensio',
        membershipStatus: 'pending',
        onboardingComplete: true,
        role: 'initium',
        updatedAt: serverTimestamp(),
      }
      await updateDoc(doc(dbClient, 'users', profile.uid), updates)
      await upsertPublicProfile(dbClient, profile.uid, { ...profile, ...updates })
      navigate(`${routes.payment}?planId=ascensio`)
    } catch (err) {
      console.error(err)
      setError('Kunde inte spara onboarding. Försök igen.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BrandPageShell title="ASCENSIO ONBOARDING" memberNav>
      <form className="brand-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Förnamn & efternamn</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label className="field">
          <span>E-postadress</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>Lösenord</span>
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
          <input value={countryCity} onChange={(e) => setCountryCity(e.target.value)} required />
        </label>
        <label className="field">
          <span>Yrkesroll</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="field">
          <span>Yrkesintressen (fritext)</span>
          <input
            value={professionalInterests}
            onChange={(e) => setProfessionalInterests(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Telefonnummer</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <label className="field">
          <span>Nuvarande verksamhet</span>
          <input
            value={currentBusiness}
            onChange={(e) => setCurrentBusiness(e.target.value)}
            placeholder="Anställd, egenföretagare, konsult eller ledare"
            required
          />
        </label>
        <label className="field">
          <span>Verksamhet/bransch</span>
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} required />
        </label>
        <label className="field">
          <span>Företagsnamn</span>
          <input value={company} onChange={(e) => setCompany(e.target.value)} required />
        </label>
        <label className="field">
          <span>Organisationsnummer</span>
          <input value={orgNumber} onChange={(e) => setOrgNumber(e.target.value)} required />
        </label>
        <label className="field">
          <span>LinkedIn-profil</span>
          <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} required />
        </label>
        <label className="field">
          <span>Kort professionell beskrivning (max 300 ord)</span>
          <textarea
            value={professionalDescription}
            onChange={(e) => setProfessionalDescription(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Sparar...' : 'Slutför onboarding'}
        </button>
      </form>
    </BrandPageShell>
  )
}

export default AscensioOnboardingPage
