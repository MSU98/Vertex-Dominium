import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import BrandPageShell from '../../components/ui/BrandPageShell'

type ApplicationStatus = 'pending' | 'approved' | 'rejected'

type DnApplication2 = {
  id: string
  uid: string
  membershipPlan?: string
  companySize?: string
  revenue?: string
  geographicReach?: string
  industryFocus?: string
  linkedin?: string
  interestNetworking?: boolean
  interestMatchmaking?: boolean
  interestAdvisory?: boolean
  status: ApplicationStatus
}

const AdminDnApplications2Page = () => {
  const [applications, setApplications] = useState<DnApplication2[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dbClient = db
    if (!dbClient) return
    const q = query(collection(dbClient, 'dnApplications2'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<DnApplication2, 'id'>),
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

  const handleDecision = async (application: DnApplication2, status: ApplicationStatus) => {
    if (!db) return
    setActionId(application.id)
    setError(null)
    try {
      await updateDoc(doc(db, 'dnApplications2', application.id), {
        status,
        updatedAt: serverTimestamp(),
      })

      const userUpdates =
        status === 'approved'
          ? {
              membershipStatus: 'approved',
              secondOnboardingComplete: true,
              updatedAt: serverTimestamp(),
            }
          : {
              membershipStatus: 'pending',
              updatedAt: serverTimestamp(),
            }

      const userRef = doc(db, 'users', application.uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        await updateDoc(userRef, userUpdates)
      } else {
        setError('Application updated, but user profile is missing.')
      }
    } catch (err) {
      console.error(err)
      setError('Action failed. Try again.')
    } finally {
      setActionId(null)
    }
  }

  if (!db) {
    return (
      <BrandPageShell title="SECOND ONBOARDING REVIEWS" subtitle="Granska fullständig onboarding." memberNav>
        <article className="brand-panel">
          <h3>Firebase not configured</h3>
          <p>Add Firebase env keys to use the admin panel.</p>
        </article>
      </BrandPageShell>
    )
  }

  const pendingApplications = applications.filter((app) => app.status === 'pending')

  return (
    <BrandPageShell title="SECOND ONBOARDING REVIEWS" subtitle="Granska fullständig onboarding" memberNav>
      <article className="brand-panel">
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <h3 style={{ margin: 0 }}>Steg 2: Fullständig onboarding</h3>
          <Link to={routes.adminDnApplications} className="btn ghost" style={{ marginLeft: 'auto' }}>
            ← Gå tillbaka till Steg 1
          </Link>
        </div>
        {loading && <p className="muted">Loading...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && pendingApplications.length === 0 && (
          <p className="muted">No pending second onboarding applications.</p>
        )}
        <div className="brand-panel-grid">
          {pendingApplications.map((app) => (
            <div key={app.id} className="brand-panel-sub">
              <h3>Second Onboarding Review</h3>
              <p className="muted">Plan: {app.membershipPlan ?? 'dominus'}</p>
              <p className="muted">Company Size: {app.companySize ?? '-'}</p>
              <p className="muted">Revenue: {app.revenue ?? '-'}</p>
              <p className="muted">Geographic Reach: {app.geographicReach ?? '-'}</p>
              <p className="muted">Industry Focus: {app.industryFocus ?? '-'}</p>
              <p className="muted">LinkedIn: {app.linkedin ?? '-'}</p>
              <p className="muted">Status: pending</p>
              <div className="interests">
                <p className="muted"><strong>Interests:</strong></p>
                <ul>
                  {app.interestNetworking && <li>Affärsnätverk</li>}
                  {app.interestMatchmaking && <li>Matchmaking</li>}
                  {app.interestAdvisory && <li>Styrelse/rådgivande sammanhang</li>}
                </ul>
              </div>
              <div className="actions">
                <button
                  className="btn primary"
                  onClick={() => handleDecision(app, 'approved')}
                  disabled={Boolean(actionId)}
                >
                  {actionId === app.id ? 'Working...' : 'Approve'}
                </button>
                <button
                  className="btn ghost"
                  onClick={() => handleDecision(app, 'rejected')}
                  disabled={Boolean(actionId)}
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

export default AdminDnApplications2Page
