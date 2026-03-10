import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import BrandPageShell from '../../components/ui/BrandPageShell'
import type { MembershipPlan, UserRole } from '../../types/User'

type ApplicationStatus = 'pending' | 'approved' | 'rejected'

type DnApplication = {
  id: string
  uid: string
  membershipPlan?: MembershipPlan
  fullName: string
  companyName?: string
  orgNumber?: string
  title: string
  decisionMandate?: string
  businessEmail?: string
  email?: string
  phone?: string
  motivation?: string
  city?: string
  interests?: string[]
  status: ApplicationStatus
}

const resolveRoleFromPlan = (plan: MembershipPlan | undefined): UserRole => {
  if (plan === 'dominus') return 'dominus'
  if (plan === 'ascensio') return 'ascensio'
  return 'initium'
}

const AdminDnApplicationsPage = () => {
  const [applications, setApplications] = useState<DnApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dbClient = db
    if (!dbClient) return
    const q = query(collection(dbClient, 'dnApplications'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<DnApplication, 'id'>),
        }))
        setApplications(data)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setError('Failed to load applications.')
        setLoading(false)
      },
    )

    return () => unsub()
  }, [])

  const handleDecision = async (application: DnApplication, status: ApplicationStatus) => {
    if (!db) return
    setActionId(application.id)
    setError(null)
    try {
      await updateDoc(doc(db, 'dnApplications', application.id), {
        status,
        updatedAt: serverTimestamp(),
      })

      const plan = application.membershipPlan ?? 'dominus'
      const userUpdates =
        status === 'approved'
          ? {
              role: resolveRoleFromPlan(plan),
              membershipPlan: plan,
              membershipStatus: 'active',
              onboardingComplete: true,
              updatedAt: serverTimestamp(),
            }
          : {
              membershipPlan: plan,
              membershipStatus: 'rejected',
              updatedAt: serverTimestamp(),
            }

      await setDoc(doc(db, 'users', application.uid), userUpdates, { merge: true })
    } catch (err) {
      console.error(err)
      setError('Action failed. Try again.')
    } finally {
      setActionId(null)
    }
  }

  if (!db) {
    return (
      <BrandPageShell title="REVIEWS" subtitle="Granska medlemsansokningar." memberNav>
        <article className="brand-panel">
          <h3>Firebase not configured</h3>
          <p>Add Firebase env keys to use the admin panel.</p>
        </article>
      </BrandPageShell>
    )
  }

  return (
    <BrandPageShell title="REVIEWS" subtitle="Membership applications" memberNav>
      <article className="brand-panel">
        {loading && <p className="muted">Loading...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && applications.length === 0 && <p className="muted">No applications.</p>}
        <div className="brand-panel-grid">
          {applications.map((app) => (
            <div key={app.id} className="brand-panel-sub">
              <h3>{app.fullName}</h3>
              <p className="muted">Plan: {app.membershipPlan ?? 'dominus'}</p>
              <p className="muted">
                {app.title}
                {app.companyName ? ` @ ${app.companyName}` : ''}
              </p>
              <p className="muted">Org: {app.orgNumber ?? '-'}</p>
              <p className="muted">City: {app.city ?? '-'}</p>
              <p className="muted">Decision mandate: {app.decisionMandate ?? '-'}</p>
              <p className="muted">Business email: {app.businessEmail ?? app.email ?? '-'}</p>
              <p className="muted">Phone: {app.phone ?? '-'}</p>
              <p className="muted">Interests: {app.interests?.join(', ') ?? '-'}</p>
              <p className="muted">Motivation: {app.motivation ?? '-'}</p>
              <p className="muted">Status: {app.status}</p>
              <div className="actions">
                <button
                  className="btn primary"
                  onClick={() => handleDecision(app, 'approved')}
                  disabled={app.status !== 'pending' || Boolean(actionId)}
                >
                  {actionId === app.id ? 'Working...' : 'Approve'}
                </button>
                <button
                  className="btn ghost"
                  onClick={() => handleDecision(app, 'rejected')}
                  disabled={app.status !== 'pending' || Boolean(actionId)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>
    </BrandPageShell>
  )
}

export default AdminDnApplicationsPage
