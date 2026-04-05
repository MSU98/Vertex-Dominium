import { useEffect, useMemo, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { useParams } from 'react-router-dom'
import BrandPageShell from '../../components/ui/BrandPageShell'
import { db } from '../../lib/firebase'

type SharedProfileDoc = {
  ownerUid: string
  enabled: boolean
  visibleFields: string[]
  data: Record<string, string>
}

const FIELD_LABELS: Record<string, string> = {
  fullName: 'Namn',
  professionalHeadline: 'Yrkesrubrik',
  title: 'Titel',
  company: 'Foretag',
  city: 'Stad',
  phone: 'Telefon',
  linkedin: 'LinkedIn',
  professionalDescription: 'Professionell beskrivning',
  currentBusiness: 'Nuvarande verksamhet',
  developmentGoal: 'Utvecklingsmal',
  strengths: 'Styrkor',
  avatarUrl: 'Profilbild',
  companyLogoUrl: 'Foretagslogga',
}

const PublicSharedProfilePage = () => {
  const { uid } = useParams<{ uid: string }>()
  const dbClient = db
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sharedProfile, setSharedProfile] = useState<SharedProfileDoc | null>(null)

  useEffect(() => {
    const targetUid = uid?.trim()
    if (!targetUid || !dbClient) {
      setLoading(false)
      setError('Ogiltig profiladress.')
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const snap = await getDoc(doc(dbClient, 'sharedProfiles', targetUid))
        if (!snap.exists()) {
          setSharedProfile(null)
          setError('Delningsprofilen hittades inte.')
          return
        }

        const data = snap.data() as SharedProfileDoc
        if (!data.enabled) {
          setSharedProfile(null)
          setError('Denna profil ar inte offentlig just nu.')
          return
        }

        setSharedProfile(data)
      } catch (loadError) {
        console.error(loadError)
        setSharedProfile(null)
        setError('Kunde inte ladda profilen.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [dbClient, uid])

  const entries = useMemo(() => {
    if (!sharedProfile?.data) return []
    return Object.entries(sharedProfile.data).filter(([, value]) => String(value).trim().length > 0)
  }, [sharedProfile])

  const displayName =
    sharedProfile?.data?.fullName?.trim() ||
    sharedProfile?.data?.professionalHeadline?.trim() ||
    'Publik profil'

  return (
    <BrandPageShell title="OFFENTLIG PROFIL" subtitle="Delad profilinformation.">
      {loading ? (
        <article className="brand-panel">
          <p className="muted">Laddar profil...</p>
        </article>
      ) : error ? (
        <article className="brand-panel">
          <p>{error}</p>
        </article>
      ) : sharedProfile ? (
        <>
          <article className="brand-panel public-profile-header">
            <div className="public-profile-avatar-wrap">
              {sharedProfile.data.avatarUrl ? (
                <img className="profile-avatar-preview" src={sharedProfile.data.avatarUrl} alt={displayName} />
              ) : (
                <div className="profile-avatar-preview profile-avatar-fallback">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3>{displayName}</h3>
                {sharedProfile.data.professionalHeadline && <p>{sharedProfile.data.professionalHeadline}</p>}
              </div>
            </div>
            {sharedProfile.data.companyLogoUrl && (
              <img
                className="profile-company-logo-preview public-profile-company-logo"
                src={sharedProfile.data.companyLogoUrl}
                alt="Foretagslogga"
              />
            )}
          </article>

          <article className="brand-panel">
            <h3>Delad information</h3>
            {entries.length > 0 ? (
              <div className="brand-panel-grid public-profile-grid">
                {entries
                  .filter(([key]) => key !== 'avatarUrl' && key !== 'companyLogoUrl')
                  .map(([key, value]) => (
                    <div key={key} className="brand-panel-sub">
                      <p className="eyebrow">{FIELD_LABELS[key] ?? key}</p>
                      {key === 'linkedin' ? (
                        <a href={value} target="_blank" rel="noreferrer">
                          {value}
                        </a>
                      ) : (
                        <p>{value}</p>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="muted">Ingen information ar tillagd for extern delning.</p>
            )}
          </article>
        </>
      ) : null}
    </BrandPageShell>
  )
}

export default PublicSharedProfilePage
