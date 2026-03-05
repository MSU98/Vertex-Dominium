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
      'Flöde (enbart inlagg fran ledning) och forum.',
      'Digitalt medlemsmärke (INITIUM märke) att anvanda i sin biografi pa LinkedIn och sociala medier.',
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
      'Samtliga delar fran INITIUM.',
      'Profil med biografi.',
      'Profilbild med ASCENSIO stämpel som kan anvandas pa LinkedIn och sociala medier.',
    ],
    price: '799 kr/månad',
  },
  {
    id: 'dominus',
    title: 'DOMINIUS NEGOTIUM III',
    subtitle: 'Betydelse: "Herre/Den som har kontroll, Verksamhet"',
    benefits: [
      'Enbart for beslutsfattare från företag.',
      'Samtliga delar fran Initium och Ascensio.',
      'DOMINIUS NEGOTIUM stämpel.',
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
          <p className="eyebrow">Membership</p>
          <h2>Loading...</h2>
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
      setError('Kunde inte spara val av medlemskap. Försök igen.')
      setToast('Kunde inte spara medlemsvalet.')
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
        <nav className="landing-nav-right membership-top-links">
          <Link to={routes.hem}>HEM</Link>
          <Link to={routes.dashboard}>DASHBOARD</Link>
          <Link to={routes.membership}>MEMBERSHIP</Link>
          <Link to={routes.courses}>COURSES</Link>
          <Link to={routes.feed}>FEED</Link>
          <Link to={routes.forum}>FORUM</Link>
          <Link to={routes.profile}>PROFILE</Link>
        </nav>
      </header>

      <section className="membership-intro">
        <h1>VERTEX DOMINIUM</h1>
        <h2>VÅRA MEDLEMSNIVÅER</h2>
      </section>

      <section className="membership-grid">
        {plans.map((plan) => (
          <article key={plan.id} className="membership-tier">
            <h3>{plan.title}</h3>
            <p className="membership-tier-subtitle">{plan.subtitle}</p>
            <ul className="membership-benefits">
              {plan.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
            <p className="membership-price">Pris inklusive moms: {plan.price}</p>
            <button
              className="membership-select"
              onClick={() => handleSelect(plan.id)}
              disabled={Boolean(submitting)}
            >
              {submitting === plan.id ? 'SPARAR...' : 'VÄLJ NIVÅN'}
            </button>
          </article>
        ))}
      </section>

      {error && <p className="membership-error">{error}</p>}
      {toast && <div className="toast toast-error">{toast}</div>}
    </div>
  )
}

export default MembershipPage
