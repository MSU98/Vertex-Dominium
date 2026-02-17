import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

type ApplicationStatus = 'pending' | 'approved' | 'rejected'

type DnApplication = {
  id: string
  uid: string
  fullName: string
  companyName: string
  orgNumber: string
  title: string
  decisionMandate: string
  email: string
  phone: string
  motivation: string
  status: ApplicationStatus
}

const AdminDnApplicationsPage = () => {
  const [applications, setApplications] = useState<DnApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!db) return
    const q = query(collection(db, 'dnApplications'), orderBy('createdAt', 'desc'))
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
  }, [db])

  const handleDecision = async (application: DnApplication, status: ApplicationStatus) => {
    if (!db) return
    setActionId(application.id)
    setError(null)
    try {
      await updateDoc(doc(db, 'dnApplications', application.id), {
        status,
        updatedAt: serverTimestamp(),
      })

      const userUpdates =
        status === 'approved'
          ? {
              role: 'dominus',
              membershipPlan: 'dominus',
              membershipStatus: 'active',
              onboardingComplete: true,
              updatedAt: serverTimestamp(),
            }
          : {
              membershipPlan: 'dominus',
              membershipStatus: 'rejected',
              updatedAt: serverTimestamp(),
            }

      await updateDoc(doc(db, 'users', application.uid), userUpdates)
    } catch (err) {
      console.error(err)
      setError('Action failed. Try again.')
    } finally {
      setActionId(null)
    }
  }

  if (!db) {
    return (
      <section className="page">
        <div className="card">
          <p className="eyebrow">Admin</p>
          <h2>Firebase not configured</h2>
          <p className="muted">Add Firebase env keys to use the admin panel.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <div className="card">
        <p className="eyebrow">Admin</p>
        <h2>Dominus applications</h2>
        {loading && <p className="muted">Loading...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && applications.length === 0 && <p className="muted">No applications.</p>}
        <div className="page" style={{ gap: '12px' }}>
          {applications.map((app) => (
            <div key={app.id} className="card" style={{ padding: '16px' }}>
              <h3>{app.fullName}</h3>
              <p className="muted">
                {app.title} @ {app.companyName}
              </p>
              <p className="muted">Org: {app.orgNumber}</p>
              <p className="muted">Decision mandate: {app.decisionMandate}</p>
              <p className="muted">Email: {app.email}</p>
              <p className="muted">Phone: {app.phone}</p>
              <p className="muted">Motivation: {app.motivation}</p>
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
      </div>
    </section>
  )
}

export default AdminDnApplicationsPage
