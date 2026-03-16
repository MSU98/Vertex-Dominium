import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
  limit,
  updateDoc,
  doc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import useAuth from '../../hooks/useAuth'
import BrandPageShell from '../../components/ui/BrandPageShell'
import { routes } from '../../routes/paths'

const planDetails: Record<
  string,
  { title: string; priceMonth: string; priceYear: string; description: string }
> = {
  initium: {
    title: 'INITIUM I',
    priceMonth: '199 kr/månad',
    priceYear: '1 990 kr/år',
    description: 'Tillgång till utbildningar, forum och digitalt medlemsmärke.',
  },
  ascensio: {
    title: 'ASCENSIO II',
    priceMonth: '799 kr/månad',
    priceYear: '7 990 kr/år',
    description: 'Allt i Initium plus utökad profil och Ascensio-stämpel.',
  },
  dominus: {
    title: 'DOMINIUS NEGOTIUM III',
    priceMonth: '3 999 kr/månad',
    priceYear: '39 990 kr/år',
    description: 'Allt i Ascensio plus exklusiva förmåner för beslutsfattare.',
  },
}

const PaymentPage = () => {
  const [searchParams] = useSearchParams()
  const planId = searchParams.get('planId')
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [method, setMethod] = useState<'klarna' | 'direct' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [billing, setBilling] = useState<'month' | 'year'>('month')
  const [existingSub, setExistingSub] = useState(false)

  useEffect(() => {
    if (!profile?.uid || !db) return
    const checkSub = async () => {
      const q = query(
        collection(db!, 'subscriptions'),
        where('userId', '==', profile.uid),
        where('status', '==', 'active'),
        limit(1),
      )
      const snap = await getDocs(q)
      if (!snap.empty) setExistingSub(true)
    }
    checkSub()
  }, [profile?.uid])

  if (!planId || !planDetails[planId]) {
    return (
      <BrandPageShell title="BETALNING">
        <article className="brand-panel">
          <p className="error">Ingen giltig plan vald.</p>
          <button
            className="btn ghost"
            style={{ marginTop: '12px' }}
            onClick={() => navigate(routes.membership)}
          >
            Tillbaka till planer
          </button>
        </article>
      </BrandPageShell>
    )
  }

  const plan = planDetails[planId]

  const handlePayment = async () => {
    if (!method) {
      setError('Välj en betalningsmetod.')
      return
    }
    if (!profile?.uid || !db) return

    setSubmitting(true)
    setError(null)

    try {
      const now = Timestamp.now()
      const nextBillingDate = Timestamp.fromDate(
        new Date(Date.now() + (billing === 'year' ? 365 : 30) * 24 * 60 * 60 * 1000),
      )

      await addDoc(collection(db, 'subscriptions'), {
        userId: profile.uid,
        planId,
        billing,
        status: 'active',
        startDate: now,
        endDate: null,
        nextBillingDate,
        createdAt: serverTimestamp(),
      })

      await updateDoc(doc(db, 'users', profile.uid), {
        membershipStatus: 'active',
        updatedAt: serverTimestamp(),
      })

      navigate(routes.profile, { replace: true })
    } catch (err) {
      console.error(err)
      setError('Betalningen misslyckades. Försök igen.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BrandPageShell title="BETALNING">
      <div className="brand-panel-grid" style={{ gap: '16px' }}>
        {/* Ordersammanfattning */}
        <article className="brand-panel">
          <h3>Ordersammanfattning</h3>
          <p>
            Plan: <strong>{plan.title}</strong>
          </p>
          <p style={{ color: '#e5e5e5', marginTop: '4px' }}>{plan.description}</p>
          <div className="actions" style={{ marginTop: '12px' }}>
            <button
              className={`btn ${billing === 'month' ? 'primary' : 'ghost'}`}
              onClick={() => setBilling('month')}
            >
              Månadsvis
            </button>
            <button
              className={`btn ${billing === 'year' ? 'primary' : 'ghost'}`}
              onClick={() => setBilling('year')}
            >
              Årsvis
            </button>
          </div>
          <p style={{ marginTop: '12px' }}>
            Pris:{' '}
            <strong style={{ color: '#c9a84c' }}>
              {billing === 'month' ? plan.priceMonth : plan.priceYear}
            </strong>
          </p>
          {billing === 'year' && (
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              Du sparar 2 månader jämfört med månadsvis betalning!
            </p>
          )}
        </article>

        {/* Betalningsmetod */}
        <article className="brand-panel">
          <h3>Välj betalningsmetod</h3>

          {existingSub ? (
            <p className="error" style={{ marginTop: '12px' }}>
              Du har redan ett aktivt medlemskap.
            </p>
          ) : (
            <>
              <div className="brand-panel-grid" style={{ marginTop: '12px', gap: '12px' }}>
                <div
                  className="brand-panel-sub"
                  style={{
                    cursor: 'pointer',
                    border:
                      method === 'klarna'
                        ? '1px solid #c9a84c'
                        : '1px solid rgba(255,255,255,0.16)',
                  }}
                  onClick={() => setMethod('klarna')}
                >
                  <h3 style={{ fontSize: '1rem', marginBottom: '6px' }}>Klarna</h3>
                  <p className="muted">Delbetalning eller direktbetalning via Klarna.</p>
                  {/* TODO: Integrera Klarna checkout */}
                </div>

                <div
                  className="brand-panel-sub"
                  style={{
                    cursor: 'pointer',
                    border:
                      method === 'direct'
                        ? '1px solid #c9a84c'
                        : '1px solid rgba(255,255,255,0.16)',
                  }}
                  onClick={() => setMethod('direct')}
                >
                  <h3 style={{ fontSize: '1rem', marginBottom: '6px' }}>Direktbetalning</h3>
                  <p className="muted">Betala direkt via banköverföring.</p>
                  {/* TODO: Integrera direktbetalning */}
                </div>
              </div>

              {error && (
                <p className="error" style={{ marginTop: '12px' }}>
                  {error}
                </p>
              )}

              <div className="actions" style={{ marginTop: '16px' }}>
                <button className="btn primary" onClick={handlePayment} disabled={submitting}>
                  {submitting ? 'Behandlar...' : 'Genomför betalning'}
                </button>
                <button className="btn ghost" onClick={() => navigate(-1)}>
                  Avbryt
                </button>
              </div>
            </>
          )}
        </article>
      </div>
    </BrandPageShell>
  )
}

export default PaymentPage
