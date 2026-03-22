import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import ForumPostCard from '../../components/forum/ForumPostCard'
import BrandPageShell from '../../components/ui/BrandPageShell'
import useAuth from '../../hooks/useAuth'
import { useModuleAccess } from '../../hooks/useModuleAccess'
import { db } from '../../lib/firebase'
import type { ForumPost } from '../../types/ForumPost'
import type { UserProfile } from '../../types/User'
import type { Subscription } from '../../types/Subscription'

type ProfileFormState = {
  fullName: string
  phone: string
  city: string
  company: string
  professionalHeadline: string
  title: string
  linkedin: string
  professionalDescription: string
}

const ProfilePage = () => {
  const { profile, setProfileState } = useAuth()
  const { canAccess } = useModuleAccess()
  const showExtendedProfile = canAccess('profileExtended')
  const dbClient = db
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('')
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [companyLogoUrl, setCompanyLogoUrl] = useState('')
  const [companyLogoPreviewUrl, setCompanyLogoPreviewUrl] = useState('')
  const [selectedCompanyLogoFile, setSelectedCompanyLogoFile] = useState<File | null>(null)
  const [removeCompanyLogo, setRemoveCompanyLogo] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loadingSub, setLoadingSub] = useState(true)
  const [profilePosts, setProfilePosts] = useState<ForumPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [form, setForm] = useState<ProfileFormState>({
    fullName: '',
    phone: '',
    city: '',
    company: '',
    professionalHeadline: '',
    title: '',
    linkedin: '',
    professionalDescription: '',
  })

  const fileToDataUrl = (file: File, maxSize: number) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()

      reader.onerror = () => reject(new Error('Kunde inte läsa bildfilen.'))
      reader.onload = () => {
        const image = new Image()

        image.onerror = () => reject(new Error('Kunde inte tolka bildfilen.'))
        image.onload = () => {
          const scale = Math.min(maxSize / image.width, maxSize / image.height, 1)
          const width = Math.max(1, Math.round(image.width * scale))
          const height = Math.max(1, Math.round(image.height * scale))
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const context = canvas.getContext('2d')
          if (!context) {
            reject(new Error('Kunde inte bearbeta bilden.'))
            return
          }

          context.drawImage(image, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.82))
        }

        image.src = typeof reader.result === 'string' ? reader.result : ''
      }

      reader.readAsDataURL(file)
    })

  const fileToAvatarDataUrl = (file: File) => fileToDataUrl(file, 256)
  const fileToCompanyLogoDataUrl = (file: File) => fileToDataUrl(file, 420)

  useEffect(() => {
    setForm({
      fullName: profile?.fullName ?? '',
      phone: profile?.phone ?? '',
      city: profile?.city ?? '',
      company: profile?.company ?? '',
      professionalHeadline: profile?.professionalHeadline ?? '',
      title: profile?.title ?? '',
      linkedin: profile?.linkedin ?? '',
      professionalDescription: profile?.professionalDescription ?? '',
    })
    setAvatarUrl(profile?.avatarUrl ?? '')
    setAvatarPreviewUrl(profile?.avatarUrl ?? '')
    setSelectedAvatarFile(null)
    setRemoveAvatar(false)
    setCompanyLogoUrl(profile?.companyLogoUrl ?? '')
    setCompanyLogoPreviewUrl(profile?.companyLogoUrl ?? '')
    setSelectedCompanyLogoFile(null)
    setRemoveCompanyLogo(false)
  }, [profile])

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
      if (companyLogoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(companyLogoPreviewUrl)
      }
    }
  }, [avatarPreviewUrl, companyLogoPreviewUrl])

  useEffect(() => {
    if (!profile?.uid || !dbClient) {
      setLoadingSub(false)
      return
    }
    const fetchSubscription = async () => {
      try {
        const q = query(
          collection(dbClient, 'subscriptions'),
          where('userId', '==', profile.uid),
          where('status', '==', 'active'),
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
  }, [dbClient, profile?.uid])

  useEffect(() => {
    if (!profile?.uid || !dbClient) {
      setLoadingPosts(false)
      return
    }

    const fetchProfilePosts = async () => {
      setLoadingPosts(true)
      try {
        if (!db) return
        const postsSnapshot = await getDocs(
          query(collection(dbClient, 'forumPosts'), where('authorUid', '==', profile.uid)),
        )

        const nextPosts = postsSnapshot.docs
          .map((entry) => {
            const data = entry.data() as Omit<ForumPost, 'id'>
            return {
              id: entry.id,
              ...data,
            }
          })
          .sort((left, right) => {
            const leftTime = left.createdAt?.toMillis() ?? 0
            const rightTime = right.createdAt?.toMillis() ?? 0
            return rightTime - leftTime
          })

        setProfilePosts(nextPosts)
      } catch (postsError) {
        console.error('Failed to fetch profile posts', postsError)
      } finally {
        setLoadingPosts(false)
      }
    }

    fetchProfilePosts()
  }, [dbClient, profile?.uid])

  const handleChange =
    (field: keyof ProfileFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
    }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Välj en bildfil.')
      event.target.value = ''
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Bilden är för stor. Välj en bild under 8 MB.')
      event.target.value = ''
      return
    }

    if (avatarPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreviewUrl)
    }

    setSelectedAvatarFile(file)
    setAvatarPreviewUrl(URL.createObjectURL(file))
    setRemoveAvatar(false)
    setMessage('Profilbild vald. Klicka på "Spara profil" för att spara den.')
    setError(null)
    event.target.value = ''
  }

  const handleRemoveAvatar = () => {
    if (avatarPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreviewUrl)
    }

    setSelectedAvatarFile(null)
    setAvatarPreviewUrl('')
    setAvatarUrl('')
    setRemoveAvatar(true)
    setMessage('Profilbilden tas bort när du klickar på "Spara profil".')
    setError(null)
  }

  const handleCompanyLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Välj en bildfil för företagsloggan.')
      event.target.value = ''
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Företagsloggan är för stor. Välj en bild under 8 MB.')
      event.target.value = ''
      return
    }

    if (companyLogoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(companyLogoPreviewUrl)
    }

    setSelectedCompanyLogoFile(file)
    setCompanyLogoPreviewUrl(URL.createObjectURL(file))
    setRemoveCompanyLogo(false)
    setMessage('Företagslogga vald. Klicka på "Spara profil" för att spara den.')
    setError(null)
    event.target.value = ''
  }

  const handleRemoveCompanyLogo = () => {
    if (companyLogoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(companyLogoPreviewUrl)
    }

    setSelectedCompanyLogoFile(null)
    setCompanyLogoPreviewUrl('')
    setCompanyLogoUrl('')
    setRemoveCompanyLogo(true)
    setMessage('Företagsloggan tas bort när du klickar på "Spara profil".')
    setError(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!profile?.uid || !dbClient || saving) return

    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      let nextAvatarUrl = avatarUrl.trim()
      let nextCompanyLogoUrl = companyLogoUrl.trim()

      if (removeAvatar) {
        nextAvatarUrl = ''
      }

      if (removeCompanyLogo) {
        nextCompanyLogoUrl = ''
      }

      if (selectedAvatarFile) {
        nextAvatarUrl = await fileToAvatarDataUrl(selectedAvatarFile)
      }

      if (selectedCompanyLogoFile) {
        nextCompanyLogoUrl = await fileToCompanyLogoDataUrl(selectedCompanyLogoFile)
      }

      const updates = {
        avatarUrl: nextAvatarUrl,
        companyLogoUrl: nextCompanyLogoUrl,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        company: form.company.trim(),
        professionalHeadline: form.professionalHeadline.trim(),
        updatedAt: serverTimestamp(),
        ...(showExtendedProfile
          ? {
              title: form.title.trim(),
              linkedin: form.linkedin.trim(),
              professionalDescription: form.professionalDescription.trim(),
            }
          : {}),
      }

      await updateDoc(doc(dbClient, 'users', profile.uid), updates)

      setAvatarUrl(nextAvatarUrl)
      setAvatarPreviewUrl(nextAvatarUrl)
      setSelectedAvatarFile(null)
      setRemoveAvatar(false)
      setCompanyLogoUrl(nextCompanyLogoUrl)
      setCompanyLogoPreviewUrl(nextCompanyLogoUrl)
      setSelectedCompanyLogoFile(null)
      setRemoveCompanyLogo(false)
      setProfileState({
        ...profile,
        ...updates,
        updatedAt: profile.updatedAt,
      } as UserProfile)

      setMessage('Profilen har sparats.')
    } catch (saveError) {
      console.error(saveError)
      setError('Det gick inte att spara profilen eller profilbilden. Försök igen.')
    } finally {
      setSaving(false)
    }
  }

  const avatarDisplay = avatarPreviewUrl || avatarUrl
  const avatarFallback = (profile?.fullName ?? profile?.email ?? 'M').charAt(0).toUpperCase()
  const companyLogoDisplay = companyLogoPreviewUrl || companyLogoUrl

  return (
    <BrandPageShell title="PROFIL" subtitle="Hantera dina medlemsuppgifter." memberNav>
      <form className="brand-form profile-form" onSubmit={handleSubmit}>
        <p className="eyebrow">Kontaktprofil</p>
        <h3>{profile?.fullName ?? 'Medlemsprofil'}</h3>

        <div className="profile-avatar-editor">
          {avatarDisplay ? (
            <img className="profile-avatar-preview" src={avatarDisplay} alt="Profilbild" />
          ) : (
            <div className="profile-avatar-preview profile-avatar-fallback">{avatarFallback}</div>
          )}

          <div className="profile-avatar-actions">
            <label className="btn ghost profile-avatar-button">
              {avatarDisplay ? 'Byt profilbild' : 'Lägg till profilbild'}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
            </label>
            {avatarDisplay && (
              <button
                type="button"
                className="btn ghost profile-avatar-button"
                onClick={handleRemoveAvatar}
              >
                Ta bort profilbild
              </button>
            )}
          </div>
        </div>

        <label className="field">
          <span>Fullständigt namn</span>
          <input type="text" value={form.fullName} onChange={handleChange('fullName')} />
        </label>

        <label className="field">
          <span>E-post</span>
          <input type="email" value={profile?.email ?? ''} disabled />
        </label>

        <label className="field">
          <span>Telefon</span>
          <input type="text" value={form.phone} onChange={handleChange('phone')} />
        </label>

        <label className="field">
          <span>Stad</span>
          <input type="text" value={form.city} onChange={handleChange('city')} />
        </label>

        <article className="profile-professional-card">
          <p className="eyebrow">Yrkesprofil</p>
          <div className="profile-company-logo-editor">
            {companyLogoDisplay ? (
              <img
                className="profile-company-logo-preview"
                src={companyLogoDisplay}
                alt="Företagslogga"
              />
            ) : (
              <div className="profile-company-logo-preview profile-company-logo-fallback">
                Ingen logga vald
              </div>
            )}

            <div className="profile-avatar-actions">
              <label className="btn ghost profile-avatar-button">
                {companyLogoDisplay ? 'Byt företagslogga' : 'Lägg till företagslogga'}
                <input type="file" accept="image/*" onChange={handleCompanyLogoUpload} hidden />
              </label>
              {companyLogoDisplay && (
                <button
                  type="button"
                  className="btn ghost profile-avatar-button"
                  onClick={handleRemoveCompanyLogo}
                >
                  Ta bort företagslogga
                </button>
              )}
            </div>
          </div>

          <label className="field">
            <span>Yrkesrubrik</span>
            <input
              type="text"
              value={form.professionalHeadline}
              onChange={handleChange('professionalHeadline')}
              placeholder="T.ex. CEO, Affärsutvecklingschef eller Entreprenör"
            />
          </label>
        </article>

        <label className="field">
          <span>Företagsnamn</span>
          <input type="text" value={form.company} onChange={handleChange('company')} />
        </label>

        {showExtendedProfile ? (
          <>
            <label className="field">
              <span>Titel</span>
              <input type="text" value={form.title} onChange={handleChange('title')} />
            </label>

            <label className="field">
              <span>LinkedIn</span>
              <input type="url" value={form.linkedin} onChange={handleChange('linkedin')} />
            </label>

            <label className="field">
              <span>Professionell beskrivning</span>
              <textarea
                value={form.professionalDescription}
                onChange={handleChange('professionalDescription')}
              />
            </label>
          </>
        ) : (
          <p className="muted">
            Titel, LinkedIn och beskrivning låses upp med Ascensio eller högre.
          </p>
        )}

        <div className="actions">
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? 'Sparar...' : 'Spara profil'}
          </button>
        </div>

        {message && <p className="muted">{message}</p>}
        {error && <p className="error">{error}</p>}
      </form>
      <article className="brand-panel" style={{ marginTop: '16px' }}>
        <h3>Medlemskap</h3>
        {loadingSub ? (
          <p className="muted">Laddar...</p>
        ) : subscription ? (
          <>
            <p>
              Status: <strong style={{ color: '#c9a84c' }}>Aktiv</strong>
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
                if (!subscription || !dbClient || !profile?.uid) return
                try {
                  await updateDoc(doc(dbClient, 'subscriptions', subscription.id), {
                    status: 'cancelled',
                  })
                  await updateDoc(doc(dbClient, 'users', profile.uid), {
                    membershipStatus: 'inactive',
                    role: 'initium',
                    updatedAt: serverTimestamp(),
                  })
                  setSubscription(null)
                  window.location.reload()
                } catch (err) {
                  console.error(err)
                }
              }}
            >
              Avbryt medlemskap
            </button>
          </>
        ) : (
          <p className="muted">Du har inget aktivt medlemskap.</p>
        )}
      </article>
      <article className="brand-panel profile-feed-panel" style={{ marginTop: '16px' }}>
        <h3>Ditt forumflode</h3>
        {loadingPosts ? (
          <p className="muted">Laddar dina inlagg...</p>
        ) : profilePosts.length > 0 ? (
          <div className="forum-feed-list profile-feed-list">
            {profilePosts.map((post) => (
              <ForumPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="muted">Nar du publicerar i forumet visas dina inlagg har.</p>
        )}
      </article>
    </BrandPageShell>
  )
}

export default ProfilePage
