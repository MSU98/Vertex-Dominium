import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import type { MembershipPlan } from '../../types/User'

const plans: { id: MembershipPlan; label: string; description: string }[] = [
  { id: 'initium', label: 'Initium', description: 'Core community access.' },
  { id: 'ascensio', label: 'Ascensio', description: 'Growth tier with profile and community perks.' },
  { id: 'dominus', label: 'Dominus Negotium', description: 'Application-only business tier.' },
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
          <p className="eyebrow">Membership</p>
          <h2>Loading...</h2>
          <p className="muted">Please sign in and ensure Firebase is configured.</p>
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
      setError('Could not set membership. Try again.')
      setToast('Failed to save membership selection.')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="page page-centered">
      <div className="card" style={{ maxWidth: '640px' }}>
        <p className="eyebrow">Choose membership</p>
        <h2>Select your plan</h2>
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
                {submitting === plan.id ? 'Saving...' : 'Select'}
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
