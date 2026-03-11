import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
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
      'Digitalt medlemsmärke (INITIUM märke) att använda i sin biografi på LinkedIn och sociala medier.',
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
      'Profilbild med ASCENSIO stämpel som kan användas på LinkedIn och sociala medier.',
    ],
    price: '799 kr/månad',
  },
  {
    id: 'dominus',
    title: 'DOMINIUS NEGOTIUM III',
    subtitle: 'Betydelse: "Herre/Den som har kontroll, Verksamhet"',
    benefits: [
      'Enbart för beslutsfattare från företag.',
      'Samtliga delar från Initium och Ascensio.',
      'DOMINIUS NEGOTIUM stämpel.',
      'Välkomstvideo från grundare.',
      'Uppstartsmöte.',
    ],
    price: '3999 kr/månad',
  },
]

const MembershipPage = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const handleSelect = (planId: MembershipPlan) => {
    if (!currentUser) {
      navigate(routes.login)
      return
    }
    navigate(`${routes.payment}?planId=${planId}`)
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
            >
              VÄLJ NIVÅN
            </button>
          </article>
        ))}
      </section>
    </div>
  )
}

export default MembershipPage