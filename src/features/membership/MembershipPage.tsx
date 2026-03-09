import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import type { MembershipPlan } from '../../types/User'

const plans: { id: MembershipPlan; label: string; description: string }[] = [
  { id: 'initium', label: 'Initium', description: 'Grundläggande tillgång till nätverket.' },
  {
    id: 'ascensio',
    label: 'Ascensio',
    description: 'Utökad nivå med profilfunktioner och medlemsförmåner.',
  },
  { id: 'dominus', label: 'Dominus Negotium', description: 'Affärsnivå som kräver ansökan.' },
]

const MembershipPage = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState<MembershipPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  if (!db || !profile) {
    return (
      <div className="page page-centered">
        <div className="card">
          <p className="eyebrow">Medlemskap</p>
          <h2>Laddar...</h2>
          <p className="muted">Logga in och kontrollera att Firebase är konfigurerat.</p>
        </div>
      </div>
    )
  }

  const handleSelect = async (plan: MembershipPlan) => {
    if (!profile?.uid) return
    setSubmitting(plan)
    setError(null)
    setToast(null)
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
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
      setError('Det gick inte att välja medlemskap. Försök igen.')
      setToast('Det gick inte att spara ditt medlemsval.')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="page page-centered">
      <div className="card" style={{ maxWidth: '640px' }}>
        <p className="eyebrow">Välj medlemskap</p>
        <h2>Välj din nivå</h2>
        <div className="page" style={{ gap: '12px' }}>
          {plans.map((plan) => (
            <div key={plan.id} className="card" style={{ padding: '16px' }}>
              <h3>{plan.label}</h3>
              <p className="muted">{plan.description}</p>
              <button
                className="btn primary"
                onClick={() => handleSelect(plan.id)}
                disabled={Boolean(submitting)}
              >
                {submitting === plan.id ? 'Sparar...' : 'Välj'}
              </button>
            </div>
          ))}
        </div>
        {error && <p className="error">{error}</p>}
      </div>
      {toast && <div className="toast toast-error">{toast}</div>}
    </div>
  )
}

export default MembershipPage
