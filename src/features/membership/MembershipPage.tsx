import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import type { MembershipPlan } from '../../types/User'
 
type MembershipTier = {
  id: MembershipPlan
  title: string
  subtitle: string
  benefits: string[]
  price: string
}
 
const plans: MembershipTier[] = [
  {
    id: 'initium',
    title: 'INITIUM I',
    subtitle: 'Betydelse: "Början/inträdet"',
    benefits: [
      'Tillgång till köp av utbildningar och coaching/vägledning.',
      'Flöde (enbart inlägg från ledning) och forum.',
      'Digitalt medlemsmärke (INITIUM-märke) att använda i sin biografi på LinkedIn och sociala medier.',
      'Shop.',
      'Välkomstmail.',
    ],
    price: '199 kr/månad',
  },
  {
    id: 'ascensio',
    title: 'ASCENSIO II',
    subtitle: 'Betydelse: "Uppstigning/avancemang"',
    benefits: [
      'Samtliga delar från INITIUM.',
      'Profil med biografi.',
      'Profilbild med ASCENSIO-stämpel som kan användas på LinkedIn och sociala medier.',
    ],
    price: '799 kr/månad',
  },
  {
    id: 'dominus',
    title: 'DOMINUS NEGOTIUM III',
    subtitle: 'Betydelse: "Herre/den som har kontroll, verksamhet"',
    benefits: [
      'Enbart för beslutsfattare från företag.',
      'Samtliga delar från INITIUM och ASCENSIO.',
      'DOMINUS NEGOTIUM-stämpel.',
      'Välkomstvideo från grundare.',
      'Uppstartsmöte.',
    ],
    price: '3999 kr/månad',
  },
]
 
const MembershipPage = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState<MembershipPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const dbClient = db
 
  if (!dbClient || !profile) {
    return (
      <div className="membership-hero page-centered">
        <div className="card" style={{ width: 'min(480px, 92vw)' }}>
          <p className="eyebrow">Medlemskap</p>
          <h2>Laddar...</h2>
          <p className="muted">Logga in och kontrollera att Firebase är konfigurerat.</p>
        </div>
      </div>
    )
  }
 
  const handleSelect = async (plan: MembershipPlan) => {
    if (!profile.uid) return
 
    setSubmitting(plan)
    setError(null)
    setToast(null)
 
    try {
      await updateDoc(doc(dbClient, 'users', profile.uid), {
        membershipPlan: plan,
        membershipStatus: 'pending',
        onboardingComplete: false,
        updatedAt: serverTimestamp(),
      })
 
      const target =
        plan === 'initium'
          ? routes.onboardingInitium
          : plan === 'ascensio'
            ? routes.onboardingAscensio
            : routes.onboardingDominus
 
      navigate(target)
    } catch (err) {
      console.error(err)
      setError('Det gick inte att spara valet av medlemskap. Försök igen.')
      setToast('Det gick inte att spara medlemsvalet.')
    } finally {
      setSubmitting(null)
    }
  }
 
  return (
    <div className="membership-hero">
      <header className="landing-nav membership-nav">
        <div className="landing-nav-left">MENY</div>
        <div className="landing-nav-logo">
          <img src="/vertex-logo.png" alt="Vertex Dominium" />
        </div>
        <div className="landing-nav-right">
          <Link to={routes.dashboard}>Översikt</Link>
          <Link to={routes.profile}>Profil</Link>
        </div>
      </header>
 
      <div className="membership-shell">
        <div className="membership-intro card">
          <p className="eyebrow">Välj medlemskap</p>
          <h2>Välj din nivå</h2>
        </div>
 
        <div className="membership-plan-list">
          {plans.map((plan) => (
            <article key={plan.id} className="membership-plan-card card">
              <p className="membership-plan-title">{plan.title}</p>
              <p className="muted">{plan.subtitle}</p>
              <p className="membership-price">{plan.price}</p>
 
              <ul className="membership-benefits">
                {plan.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
 
              <button
                className="btn primary"
                onClick={() => handleSelect(plan.id)}
                disabled={Boolean(submitting)}
              >
                {submitting === plan.id ? 'Sparar...' : 'Välj'}
              </button>
            </article>
          ))}
        </div>
      </div>
 
      {error && <p className="membership-error">{error}</p>}
      {toast && <div className="toast toast-error">{toast}</div>}
    </div>
  )
}
 
export default MembershipPage
 
 