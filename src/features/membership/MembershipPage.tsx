import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import type { MembershipPlan } from '../../types/User'

const plans: { id: MembershipPlan; title: string; copy: string }[] = [
  {
    id: 'initium',
    title: 'INITIUM',
    copy: 'Basniva for medlemmar med tillgang till kurser, forum och grundprofil.',
  },
  {
    id: 'ascensio',
    title: 'ASCENSIO',
    copy: 'Utokad niva med fler profilfunktioner, badge och starkare synlighet i portalen.',
  },
  {
    id: 'dominus',
    title: 'DOMINIUS NEGOTIUM',
    copy: 'Exklusiv niva for medlemmar som ansoker om premiumyta och strategiska mojligheter.',
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
      <div className="page page-centered">
        <div className="card">
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
      setError('Kunde inte spara val av medlemskap. Forsok igen.')
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
        <h2>VARA MEDLEMSNIVAER</h2>
      </section>

      <section className="membership-grid">
        {plans.map((plan) => (
          <article key={plan.id} className="membership-tier">
            <h3>{plan.title}</h3>
            <p>{plan.copy}</p>
            <button
              className="membership-select"
              onClick={() => handleSelect(plan.id)}
              disabled={Boolean(submitting)}
            >
              {submitting === plan.id ? 'SPARAR...' : 'VALJ NIVAN'}
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
