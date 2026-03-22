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
        setError('Kunde inte ladda ansökningar.')
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
              membershipStatus: plan === 'dominus' ? 'second pending' : 'approved',
              onboardingComplete: true,
              updatedAt: serverTimestamp(),
            }
          : {
              membershipPlan: plan,
              membershipStatus: 'rejected',
              updatedAt: serverTimestamp(),
            }

      const userRef = doc(db, 'users', application.uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        await updateDoc(userRef, userUpdates)
      } else {
        setError('Ansökan uppdaterad, men användarprofilen saknas.')
      }
    } catch (err) {
      console.error(err)
      setError('Åtgärden misslyckades. Försök igen.')
    } finally {
      setActionId(null)
    }
  }

  if (!db) {
    return (
      <BrandPageShell title="GRANSKNINGAR" subtitle="Granska medlemsansökningar." memberNav>
        <article className="brand-panel">
          <h3>Firebase inte konfigurerat</h3>
          <p>Lägg till Firebase-nycklar i .env för att använda adminpanelen.</p>
        </article>
      </BrandPageShell>
    )
  }

  const pendingApplications = applications.filter((app) => app.status === 'pending')

  return (
    <BrandPageShell title="GRANSKNINGAR" subtitle="Medlemsansökningar" memberNav>
      <article className="brand-panel">
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <h3 style={{ margin: 0 }}>Steg 1: Första ansökningar</h3>
          <Link to={routes.adminDnApplications2} className="btn ghost" style={{ marginLeft: 'auto' }}>
            → Gå till Steg 2
          </Link>
        </div>
        {loading && <p className="muted">Laddar...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && pendingApplications.length === 0 && (
          <p className="muted">Inga väntande ansökningar.</p>
        )}
        <div className="brand-panel-grid">
          {pendingApplications.map((app) => (
            <div key={app.id} className="brand-panel-sub">
              <h3>{app.fullName}</h3>
              <p className="muted">Plan: {app.membershipPlan ?? 'Dominus'}</p>
              <p className="muted">
                {app.title}
                {app.companyName ? ` @ ${app.companyName}` : ''}
              </p>
              <p className="muted">Org.nr: {app.orgNumber ?? '-'}</p>
              <p className="muted">Stad: {app.city ?? '-'}</p>
              <p className="muted">Beslutsmandat: {app.decisionMandate ?? '-'}</p>
              <p className="muted">Företagsmail: {app.businessEmail ?? app.email ?? '-'}</p>
              <p className="muted">Telefon: {app.phone ?? '-'}</p>
              <p className="muted">Intressen: {app.interests?.join(', ') ?? '-'}</p>
              <p className="muted">Motivering: {app.motivation ?? '-'}</p>
              <p className="muted">Status: Väntande</p>
              <div className="actions">
                <button
                  className="btn primary"
                  onClick={() => handleDecision(app, 'approved')}
                  disabled={Boolean(actionId)}
                >
                  {actionId === app.id ? 'Hanterar...' : 'Godkänn'}
                </button>
                <button
                  className="btn ghost"
                  onClick={() => handleDecision(app, 'rejected')}
                  disabled={Boolean(actionId)}
                >
                  Neka
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
