import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  updateDoc,
  doc,
} from 'firebase/firestore'
import useAuth from '../../hooks/useAuth'
import { useModuleAccess } from '../../hooks/useModuleAccess'
import BrandPageShell from '../../components/ui/BrandPageShell'
import { auth, db } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import type { Subscription } from '../../types/Subscription'

const ProfilePage = () => {
  const { profile } = useAuth()
  const { canAccess } = useModuleAccess()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loadingSub, setLoadingSub] = useState(true)
  const showExtendedProfile = canAccess('profileExtended')
  const badge =
    profile?.membershipPlan === 'dominus'
      ? 'Dominus badge'
      : profile?.membershipPlan === 'ascensio'
        ? 'Ascensio badge'
        : null

  useEffect(() => {
    if (!profile?.uid || !db) {
      setLoadingSub(false)
      return
    }
    const fetchSubscription = async () => {
      try {
        const q = query(
          collection(db, 'subscriptions'),
          where('userId', '==', profile.uid),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(1),
        )
        const snap = await getDocs(q)
        if (!snap.empty) {
          setSubscription({ id: snap.docs[0].id, ...snap.docs[0].data() } as Subscription)
        }
      } catch (err) {
        console.error('Failed to fetch subscription', err)
      } finally {
        setLoadingSub(false)
      }
    }
    fetchSubscription()
  }, [profile?.uid])

  const handleLogout = async () => {
    const authClient = auth
    if (!authClient || loggingOut) return

    setLoggingOut(true)
    setLogoutError(null)
    try {
      await signOut(authClient)
      navigate(routes.home, { replace: true })
    } catch (error) {
      console.error(error)
      setLogoutError('Could not log out. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <BrandPageShell title="PROFILE" subtitle="Din medlemsprofil i Vertex Dominium." memberNav>
      <article className="brand-panel">
        <h3>{profile?.fullName ?? 'Member profile'}</h3>
        {badge && <p>{badge}</p>}
        <p>Email: {profile?.email ?? '-'}</p>
        <p>Plan: {profile?.membershipPlan ?? 'none'}</p>
        {showExtendedProfile ? (
          <>
            <p>Company: {profile?.company ?? '-'}</p>
            <p>LinkedIn: {profile?.linkedin ?? '-'}</p>
            <p>Description: {profile?.professionalDescription ?? 'No description provided.'}</p>
          </>
        ) : (
          <p>Extended profile fields unlock with Ascensio or higher.</p>
        )}
        <div className="actions">
          <button className="btn ghost" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? 'LOGGING OUT...' : 'LOGGA UT'}
          </button>
        </div>
        {logoutError && <p className="error">{logoutError}</p>}
      </article>
      <article className="brand-panel" style={{ marginTop: '16px' }}>
        <h3>Medlemskap</h3>
        {loadingSub ? (
          <p className="muted">Laddar...</p>
        ) : subscription ? (
          <>
            <p>
              Status: <strong style={{ color: '#5cd9b1' }}>Aktiv</strong>
            </p>
            <p>
              Plan: <strong>{subscription.planId}</strong>
            </p>
            <p>Startdatum: {subscription.startDate.toDate().toLocaleDateString('sv-SE')}</p>
            <p>
              Nästa betalning: {subscription.nextBillingDate.toDate().toLocaleDateString('sv-SE')}
            </p>
            <button
              className="btn ghost"
              style={{ marginTop: '12px' }}
              onClick={async () => {
                if (!subscription || !db) return
                try {
                  await updateDoc(doc(db, 'subscriptions', subscription.id), {
                    status: 'cancelled',
                  })
                  setSubscription(null)
                } catch (err) {
                  console.error(err)
                }
              }}
            >
              Avbryt medlemskap
            </button>
          </>
        ) : (
          <p className="muted">You do not have an active membership.</p>
        )}
      </article>
    </BrandPageShell>
  )
}

export default ProfilePage
