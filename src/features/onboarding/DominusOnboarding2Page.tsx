import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import BrandPageShell from '../../components/ui/BrandPageShell'

const DominusOnboarding2Page = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [companySize, setCompanySize] = useState(profile?.companySize ?? '')
  const [revenue, setRevenue] = useState(profile?.revenue ?? '')
  const [geographicReach, setGeographicReach] = useState(profile?.geographicReach ?? '')
  const [industryFocus, setIndustryFocus] = useState(profile?.industryFocus ?? '')
  const [linkedin, setLinkedin] = useState(profile?.linkedin ?? '')
  const [interestNetworking, setInterestNetworking] = useState(profile?.interestNetworking ?? false)
  const [interestMatchmaking, setInterestMatchmaking] = useState(profile?.interestMatchmaking ?? false)
  const [interestAdvisory, setInterestAdvisory] = useState(profile?.interestAdvisory ?? false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dbClient = db

  if (!dbClient || !profile) {
    return (
      <BrandPageShell title="DOMINUS ONBOARDING - STEG 2" memberNav>
        <article className="brand-panel">
          <p>Logga in och kontrollera att Firebase ar konfigurerat.</p>
        </article>
      </BrandPageShell>
    )
  }

  // Only allow access if user has pending status and dominus membership (first approval)
  if (profile.membershipStatus !== 'second pending' || profile.membershipPlan !== 'dominus' || profile.secondOnboardingComplete === true) {
    return (
      <BrandPageShell title="DOMINUS ONBOARDING - STEG 2" memberNav>
        <article className="brand-panel">
          <p className="error">Du har inte behörighet att komma åt denna sida.</p>
          <button
            className="btn ghost"
            style={{ marginTop: '12px' }}
            onClick={() => navigate(routes.dashboard)}
          >
            Tillbaka till dashboard
          </button>
        </article>
      </BrandPageShell>
    )
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Create second onboarding application
      await addDoc(collection(dbClient, 'dnApplications2'), {
        uid: profile.uid,
        membershipPlan: 'dominus',
        companySize,
        revenue,
        geographicReach,
        industryFocus,
        linkedin,
        interestNetworking,
        interestMatchmaking,
        interestAdvisory,
        status: 'pending',
        createdAt: serverTimestamp(),
      })

      // Update user profile
      await updateDoc(doc(dbClient, 'users', profile.uid), {
        companySize,
        revenue,
        geographicReach,
        industryFocus,
        linkedin,
        interestNetworking,
        interestMatchmaking,
        interestAdvisory,
        secondOnboardingComplete: true,
        membershipStatus: 'second pending',
        updatedAt: serverTimestamp(),
      })

      // Refresh profile and navigate
      setTimeout(() => {
        window.location.href = routes.applicationPending2
      }, 500)
    } catch (err) {
      console.error('Error submitting second onboarding:', err)
      setError('Kunde inte skicka ansokan. Försök igen. (Se konsol för detaljer)')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BrandPageShell title="DOMINUS ONBOARDING - STEG 2" memberNav>
      <form className="brand-form" onSubmit={handleSubmit}>
        <article className="brand-panel-sub">
          <h3>Fullständig Onboarding</h3>
          <p className="muted">Fortsätt med dina företagsinformation för att slutföra din medlemskap.</p>
        </article>

        <label className="field">
          <span>Företagsstorlek (antal anställda)</span>
          <select value={companySize} onChange={(e) => setCompanySize(e.target.value)} required>
            <option value="">Välj alternativ</option>
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-100">51-100</option>
            <option value="101-500">101-500</option>
            <option value="501-1000">501-1000</option>
            <option value="1000+">1000+</option>
          </select>
        </label>

        <label className="field">
          <span>Omsättning (årlig)</span>
          <select value={revenue} onChange={(e) => setRevenue(e.target.value)} required>
            <option value="">Välj alternativ</option>
            <option value="<1M">Mindre än 1M kr</option>
            <option value="1-10M">1-10M kr</option>
            <option value="10-50M">10-50M kr</option>
            <option value="50-100M">50-100M kr</option>
            <option value="100-500M">100-500M kr</option>
            <option value="500M+">500M+ kr</option>
          </select>
        </label>

        <label className="field">
          <span>Geografisk räckvidd</span>
          <select value={geographicReach} onChange={(e) => setGeographicReach(e.target.value)} required>
            <option value="">Välj alternativ</option>
            <option value="local">Lokal/regional</option>
            <option value="national">Nationell</option>
            <option value="nordic">Nordisk</option>
            <option value="european">Europeisk</option>
            <option value="global">Global</option>
          </select>
        </label>

        <label className="field">
          <span>Bransch/inriktning</span>
          <input
            value={industryFocus}
            onChange={(e) => setIndustryFocus(e.target.value)}
            placeholder="t.ex. Teknologi, Finans, Hälsa"
            required
          />
        </label>

        <label className="field">
          <span>LinkedIn-profil</span>
          <input
            type="text"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/ditt-namn"
          />
        </label>

        <article className="brand-panel-sub">
          <h3>Intressen</h3>
          <p className="muted">Vilka områden är du intresserad av?</p>

          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={interestNetworking}
              onChange={(e) => setInterestNetworking(e.target.checked)}
            />
            <span>Affärsnätverk</span>
          </label>

          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={interestMatchmaking}
              onChange={(e) => setInterestMatchmaking(e.target.checked)}
            />
            <span>Matchmaking</span>
          </label>

          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={interestAdvisory}
              onChange={(e) => setInterestAdvisory(e.target.checked)}
            />
            <span>Styrelse/rådgivande sammanhang</span>
          </label>
        </article>

        {error && <p className="error">{error}</p>}
        <button className="btn primary" type="submit" disabled={submitting}>
          {submitting ? 'Skickar...' : 'Skicka fullständig ansokan'}
        </button>
      </form>
    </BrandPageShell>
  )
}

export default DominusOnboarding2Page
