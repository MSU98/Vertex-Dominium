import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import HeaderAccountMenu from '../../components/ui/HeaderAccountMenu'
import useAuth from '../../hooks/useAuth'
import { routes } from '../../routes/paths'
import type { MembershipPlan } from '../../types/User'

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

const memberLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'member-top-link active' : 'member-top-link'

const MembershipPage = () => {
  const { currentUser, profile } = useAuth()
  const navigate = useNavigate()
  const [guestError, setGuestError] = useState<string | null>(null)

  const showMemberNav = Boolean(currentUser)
  const isAdmin = profile?.role === 'admin'

  const handleSelect = (plan: SelectableMembershipPlan) => {
    if (!currentUser || !profile) {
      setGuestError('skapa ett konto för att kunna köpa medlemskap')
      return
    }

    setGuestError(null)

    const target =
      plan === 'dominus'
        ? routes.onboardingDominus
        : profile.onboardingComplete
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
          <HeaderAccountMenu showMemberNav={showMemberNav} />
        </div>
        <NavLink to={routes.hem} className="landing-nav-logo">
          <img src="/vertex-logo.png" alt="Vertex Dominium" />
        </NavLink>
        <nav className="landing-nav-right membership-top-links">
          {showMemberNav ? (
            <>
              <NavLink to={routes.hem} className={memberLinkClass}>
                HEM
              </NavLink>
              <NavLink to={routes.dashboard} className={memberLinkClass}>
                ÖVERSIKT
              </NavLink>
              <NavLink to={routes.membership} className={memberLinkClass}>
                MEDLEMSKAP
              </NavLink>
              <NavLink to={routes.courses} className={memberLinkClass}>
                KURSER
              </NavLink>
              <NavLink to={routes.feed} className={memberLinkClass}>
                FLÖDE
              </NavLink>
              <NavLink to={routes.forum} className={memberLinkClass}>
                FORUM
              </NavLink>
              <NavLink to={routes.profile} className={memberLinkClass}>
                PROFIL
              </NavLink>
              {isAdmin && (
                <NavLink to={routes.adminReviews} className={memberLinkClass}>
                  GRANSKNINGAR
                </NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink to={routes.hem} className={memberLinkClass}>
                HEM
              </NavLink>
              <NavLink to={routes.about} className={memberLinkClass}>
                OM OSS
              </NavLink>
              <NavLink to={routes.membership} className={memberLinkClass}>
                MEDLEMSPORTAL
              </NavLink>
              <NavLink to={routes.contact} className={memberLinkClass}>
                KONTAKT
              </NavLink>
              <NavLink to={routes.login} className={memberLinkClass}>
                LOGGA IN
              </NavLink>
            </>
          )}
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
              disabled={profile?.membershipPlan === plan.id && profile?.membershipStatus === 'active'}
              style={
                profile?.membershipPlan === plan.id && profile?.membershipStatus === 'active'
                  ? { opacity: 0.5, cursor: 'default' }
                  : {}
              }
            >
              {profile?.membershipPlan === plan.id && profile?.membershipStatus === 'active'
                ? 'DIN PLAN'
                : 'VÄLJ NIVÅ'}
            </button>
          </article>
        ))}
      </section>

      {guestError && <p className="membership-error">{guestError}</p>}
    </div>
  )
}

export default MembershipPage
