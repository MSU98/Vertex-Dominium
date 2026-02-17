import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { routes } from '../../routes/paths'

const DashboardPage = () => {
  const { profile } = useAuth()

  const onboardingRoute =
    profile?.membershipPlan === 'initium'
      ? routes.onboardingInitium
      : profile?.membershipPlan === 'ascensio'
      ? routes.onboardingAscensio
      : profile?.membershipPlan === 'dominus'
      ? routes.onboardingDominus
      : routes.membership

  const showMembershipCta = !profile?.membershipPlan
  const showOnboardingCta = Boolean(profile?.membershipPlan) && profile?.onboardingComplete === false
  const showDominusPendingCta =
    profile?.membershipPlan === 'dominus' && profile?.membershipStatus === 'pending'

  return (
    <section className="page">
      <div className="card">
        <p className="eyebrow">Dashboard</p>
        <h2>Welcome back{profile?.email ? `, ${profile.email}` : ''}</h2>
        <p className="muted">
          Role: {profile?.role ?? 'pending'} | Membership: {profile?.membershipStatus ?? 'unknown'}
        </p>
      </div>

      {showMembershipCta && (
        <div className="card">
          <p className="eyebrow">Membership</p>
          <h3>Choose your membership plan</h3>
          <Link className="btn primary" to={routes.membership}>
            Go to membership
          </Link>
        </div>
      )}

      {showOnboardingCta && (
        <div className="card">
          <p className="eyebrow">Onboarding</p>
          <h3>Complete onboarding</h3>
          <Link className="btn primary" to={onboardingRoute}>
            Continue onboarding
          </Link>
        </div>
      )}

      {showDominusPendingCta && (
        <div className="card">
          <p className="eyebrow">Dominus</p>
          <h3>Application under review</h3>
          <Link className="btn ghost" to={routes.applicationPending}>
            View status
          </Link>
        </div>
      )}

      {!showMembershipCta && !showOnboardingCta && !showDominusPendingCta && (
        <div className="card">
          <p className="eyebrow">Overview</p>
          <p className="muted">Dashboard content placeholder.</p>
        </div>
      )}
    </section>
  )
}

export default DashboardPage
