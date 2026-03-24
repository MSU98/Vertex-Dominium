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
        setError('Kunde inte ladda ansökningar.')
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
      <BrandPageShell title="STEG 2 GRANSKNINGAR" subtitle="Granska fullständig onboarding." memberNav>
        <article className="brand-panel">
          <h3>Firebase inte konfigurerat</h3>
          <p>Lägg till Firebase-nycklar i .env för att använda adminpanelen.</p>
        </article>
      </BrandPageShell>
    )
  }

  const pendingApplications = applications.filter((app) => app.status === 'pending')

  return (
    <BrandPageShell title="STEG 2 GRANSKNINGAR" subtitle="Granska fullständig onboarding" memberNav>
      <article className="brand-panel">
        <div className="panel-toolbar">
          <h3 style={{ margin: 0 }}>Steg 2: Fullständig onboarding</h3>
          <Link to={routes.adminDnApplications} className="btn ghost">
            ← Gå tillbaka till Steg 1
          </Link>
        </div>
        {loading && <p className="muted">Laddar...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && pendingApplications.length === 0 && (
          <p className="muted">Inga väntande steg 2-ansökningar.</p>
        )}
        <div className="brand-panel-grid">
          {pendingApplications.map((app) => (
            <div key={app.id} className="brand-panel-sub">
              <h3>Steg 2 Granskning</h3>
              <p className="muted">Plan: {app.membershipPlan ?? 'Dominus'}</p>
              <p className="muted">Företagsstorlek: {app.companySize ?? '-'}</p>
              <p className="muted">Omsättning: {app.revenue ?? '-'}</p>
              <p className="muted">Geografisk räckvidd: {app.geographicReach ?? '-'}</p>
              <p className="muted">Bransch: {app.industryFocus ?? '-'}</p>
              <p className="muted">LinkedIn: {app.linkedin ?? '-'}</p>
              <p className="muted">Status: Väntande</p>
              <div className="interests">
                <p className="muted"><strong>Intressen:</strong></p>
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

export default AdminDnApplications2Page
