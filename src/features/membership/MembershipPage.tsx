import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
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
  const isAdmin = profile?.role === 'admin'

  if (!profile) {
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

  const handleSelect = (plan: SelectableMembershipPlan) => {
    const target =
      plan === 'dominus'
        ? routes.onboardingDominus
        : profile?.onboardingComplete
          ? `${routes.payment}?planId=${plan}`
          : plan === 'initium'
            ? routes.onboardingInitium
            : routes.onboardingAscensio

    navigate(target)
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
        <nav className="landing-nav-right membership-top-links">
          <Link to={routes.hem}>HEM</Link>
          <Link to={routes.dashboard}>DASHBOARD</Link>
          <Link to={routes.membership}>MEMBERSHIP</Link>
          <Link to={routes.courses}>COURSES</Link>
          <Link to={routes.feed}>FEED</Link>
          <Link to={routes.forum}>FORUM</Link>
          <Link to={routes.profile}>PROFILE</Link>
          {isAdmin && <Link to={routes.adminReviews}>REVIEWS</Link>}
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
              disabled={
                profile?.membershipPlan === plan.id && profile?.membershipStatus === 'active'
              }
              style={
                profile?.membershipPlan === plan.id && profile?.membershipStatus === 'active'
                  ? { opacity: 0.5, cursor: 'default' }
                  : {}
              }
            >
              {profile?.membershipPlan === plan.id && profile?.membershipStatus === 'active'
                ? 'DIN PLAN'
                : 'VÄLJ NIVÅ'}{' '}
            </button>
          </article>
        ))}
      </section>
    </div>
  )
}

export default MembershipPage
