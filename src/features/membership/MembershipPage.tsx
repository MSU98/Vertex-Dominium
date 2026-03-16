import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import type { MembershipPlan } from '../../types/User'
 import HeaderAccountMenu from '../../components/ui/HeaderAccountMenu'

type SelectableMembershipPlan = Exclude<MembershipPlan, null>

type MembershipTier = {
  id: SelectableMembershipPlan
  title: string
  subtitle: string
  benefits: string[]
  price: string
}
 
const plans: MembershipTier[] = [
  {
    id: 'initium',
    title: 'INITIUM I',
    subtitle: 'Betydelse: "Borjan/intradet"',
    benefits: [
      'Tillgang till kop av utbildningar och coaching/vagledning.',
      'Flode (enbart inlagg fran ledning) och forum.',
      'Digitalt medlemsmarke (INITIUM-marke) att anvanda i sin biografi pa LinkedIn och sociala medier.',
      'Shop.',
      'Valkomstmail.',
    ],
    price: '199 kr/manad',
  },
  {
    id: 'ascensio',
    title: 'ASCENSIO II',
    subtitle: 'Betydelse: "Uppstigning/avancemang"',
    benefits: [
      'Samtliga delar fran INITIUM.',
      'Profil med biografi.',
      'Profilbild med ASCENSIO-stampel som kan anvandas pa LinkedIn och sociala medier.',
    ],
    price: '799 kr/manad',
  },
  {
    id: 'dominus',
    title: 'DOMINUS NEGOTIUM III',
    subtitle: 'Betydelse: "Herre/den som har kontroll, verksamhet"',
    benefits: [
      'Enbart for beslutsfattare fran foretag.',
      'Samtliga delar fran INITIUM och ASCENSIO.',
      'DOMINUS NEGOTIUM-stampel.',
      'Valkomstvideo fran grundare.',
      'Uppstartsmote.',
    ],
    price: '3999 kr/manad',
  },
]

]

const MembershipPage = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState<SelectableMembershipPlan | null>(null)
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
        <div className="landing-nav-left">
          <HeaderAccountMenu showMemberNav />
        </div>
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
 
 