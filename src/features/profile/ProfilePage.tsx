import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import ForumPostCard from '../../components/forum/ForumPostCard'
import BrandPageShell from '../../components/ui/BrandPageShell'
import useAuth from '../../hooks/useAuth'
import { useModuleAccess } from '../../hooks/useModuleAccess'
import { db } from '../../lib/firebase'
import { upsertPublicProfile } from '../../lib/publicProfile'
import { routes } from '../../routes/paths'
import type { ForumPost } from '../../types/ForumPost'
import type { UserProfile } from '../../types/User'
import type { Subscription } from '../../types/Subscription'
import type { Timestamp } from 'firebase/firestore'

type ProfileFormState = {
  fullName: string
  phone: string
  city: string
  company: string
  professionalHeadline: string
  title: string
  linkedin: string
  professionalDescription: string
  currentBusiness: string
  developmentGoal: string
  strengths: string
}

type CourseBadge = {
  id: string
  courseId: string
  courseTitle?: string
  earnedAt?: Timestamp | null
}

const SHARE_FIELD_OPTIONS = [
  { key: 'fullName', label: 'Namn' },
  { key: 'professionalHeadline', label: 'Yrkesrubrik' },
  { key: 'title', label: 'Titel' },
  { key: 'company', label: 'Foretag' },
  { key: 'city', label: 'Stad' },
  { key: 'phone', label: 'Telefon' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'professionalDescription', label: 'Professionell beskrivning' },
  { key: 'currentBusiness', label: 'Nuvarande verksamhet' },
  { key: 'developmentGoal', label: 'Utvecklingsmal' },
  { key: 'strengths', label: 'Styrkor' },
  { key: 'avatarUrl', label: 'Profilbild' },
  { key: 'companyLogoUrl', label: 'Foretagslogga' },
] as const

type ShareFieldKey = (typeof SHARE_FIELD_OPTIONS)[number]['key']

const INITIAL_SHARE_VISIBILITY: Record<ShareFieldKey, boolean> = {
  fullName: true,
  professionalHeadline: true,
  title: false,
  company: true,
  city: false,
  phone: false,
  linkedin: true,
  professionalDescription: false,
  currentBusiness: false,
  developmentGoal: false,
  strengths: false,
  avatarUrl: true,
  companyLogoUrl: false,
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
  const [courseBadges, setCourseBadges] = useState<CourseBadge[]>([])
  const [loadingBadges, setLoadingBadges] = useState(true)
  const [shareEnabled, setShareEnabled] = useState(false)
  const [shareVisibility, setShareVisibility] =
    useState<Record<ShareFieldKey, boolean>>(INITIAL_SHARE_VISIBILITY)
  const [shareSaving, setShareSaving] = useState(false)
  const [form, setForm] = useState<ProfileFormState>({
    fullName: '',
    phone: '',
    city: '',
    company: '',
    professionalHeadline: '',
    title: '',
    linkedin: '',
    professionalDescription: '',
    currentBusiness: '',
    developmentGoal: '',
    strengths: '',
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
      currentBusiness: profile?.currentBusiness ?? '',
      developmentGoal: profile?.developmentGoal ?? '',
      strengths: profile?.strengths ?? '',
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

  useEffect(() => {
    if (!profile?.uid || !dbClient) {
      setLoadingBadges(false)
      setCourseBadges([])
      return
    }

    setLoadingBadges(true)
    const badgesQuery = query(collection(dbClient, 'courseBadges'), where('uid', '==', profile.uid))
    const unsubscribe = onSnapshot(
      badgesQuery,
      (badgesSnapshot) => {
        const nextBadges = badgesSnapshot.docs
          .map((entry) => {
            const data = entry.data() as Omit<CourseBadge, 'id'>
            return {
              id: entry.id,
              ...data,
            }
          })
          .sort((left, right) => {
            const leftTime = left.earnedAt?.toMillis() ?? 0
            const rightTime = right.earnedAt?.toMillis() ?? 0
            return rightTime - leftTime
          })

        setCourseBadges(nextBadges)
        setLoadingBadges(false)
      },
      (badgesError) => {
        console.error('Failed to fetch course badges', badgesError)
        setLoadingBadges(false)
      },
    )

    return () => unsubscribe()
  }, [dbClient, profile?.uid])

  useEffect(() => {
    if (!profile?.uid || !dbClient) return

    const loadShareSettings = async () => {
      try {
        const shareSnap = await getDoc(doc(dbClient, 'sharedProfiles', profile.uid))
        if (!shareSnap.exists()) return

        const data = shareSnap.data() as {
          enabled?: boolean
          visibleFields?: string[]
        }

        setShareEnabled(Boolean(data.enabled))
        if (Array.isArray(data.visibleFields)) {
          const nextVisibility = { ...INITIAL_SHARE_VISIBILITY }
          SHARE_FIELD_OPTIONS.forEach((field) => {
            nextVisibility[field.key] = data.visibleFields?.includes(field.key) ?? false
          })
          setShareVisibility(nextVisibility)
        }
      } catch (shareLoadError) {
        console.error('Failed to load share settings', shareLoadError)
      }
    }

    loadShareSettings()
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
              currentBusiness: form.currentBusiness.trim(),
              developmentGoal: form.developmentGoal.trim(),
              strengths: form.strengths.trim(),
            }
          : {}),
      }

      await updateDoc(doc(dbClient, 'users', profile.uid), updates)
      await upsertPublicProfile(dbClient, profile.uid, { ...profile, ...updates })

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

  const handleCopyProfileLink = async () => {
    if (!profile?.uid) {
      setError('Kunde inte skapa profillanken.')
      return
    }

    const profileUrl = `${window.location.origin}${routes.profileView(profile.uid)}`

    try {
      await navigator.clipboard.writeText(profileUrl)
      setMessage('Profillanken ar kopierad till urklipp.')
      setError(null)
      return
    } catch (clipboardError) {
      console.error('Clipboard API failed, trying fallback.', clipboardError)
    }

    try {
      const textarea = document.createElement('textarea')
      textarea.value = profileUrl
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setMessage('Profillanken ar kopierad till urklipp.')
      setError(null)
    } catch (fallbackError) {
      console.error(fallbackError)
      setError('Kunde inte kopiera profillanken.')
    }
  }

  const handleShareToggle = (field: ShareFieldKey) => {
    setShareVisibility((current) => ({ ...current, [field]: !current[field] }))
  }

  const buildShareData = () => {
    const source: Record<ShareFieldKey, string> = {
      fullName: form.fullName.trim(),
      professionalHeadline: form.professionalHeadline.trim(),
      title: form.title.trim(),
      company: form.company.trim(),
      city: form.city.trim(),
      phone: form.phone.trim(),
      linkedin: form.linkedin.trim(),
      professionalDescription: form.professionalDescription.trim(),
      currentBusiness: form.currentBusiness.trim(),
      developmentGoal: form.developmentGoal.trim(),
      strengths: form.strengths.trim(),
      avatarUrl: avatarPreviewUrl || avatarUrl,
      companyLogoUrl: companyLogoPreviewUrl || companyLogoUrl,
    }

    return SHARE_FIELD_OPTIONS.reduce<Record<string, string>>((accumulator, field) => {
      if (!shareVisibility[field.key]) return accumulator
      const value = source[field.key]?.trim()
      if (!value) return accumulator
      accumulator[field.key] = value
      return accumulator
    }, {})
  }

  const handleSaveShareSettings = async () => {
    if (!profile?.uid || !dbClient || shareSaving) return
    setShareSaving(true)
    setError(null)
    setMessage(null)

    try {
      const visibleFields = SHARE_FIELD_OPTIONS.filter((field) => shareVisibility[field.key]).map(
        (field) => field.key,
      )
      const data = buildShareData()

      await setDoc(
        doc(dbClient, 'sharedProfiles', profile.uid),
        {
          ownerUid: profile.uid,
          enabled: shareEnabled,
          visibleFields,
          data,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      setMessage('Extern delningsprofil uppdaterad.')
    } catch (shareSaveError) {
      console.error(shareSaveError)
      setError('Kunde inte spara delningsinställningarna.')
    } finally {
      setShareSaving(false)
    }
  }

  const handleCopyExternalProfileLink = async () => {
    if (!profile?.uid) return
    const shareUrl = `${window.location.origin}${routes.publicShareProfileView(profile.uid)}`

    try {
      await navigator.clipboard.writeText(shareUrl)
      setMessage('Extern profillank kopierad till urklipp.')
      setError(null)
      return
    } catch (clipboardError) {
      console.error('Clipboard API failed, trying fallback.', clipboardError)
    }

    try {
      const textarea = document.createElement('textarea')
      textarea.value = shareUrl
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setMessage('Extern profillank kopierad till urklipp.')
      setError(null)
    } catch (fallbackError) {
      console.error(fallbackError)
      setError('Kunde inte kopiera extern profillank.')
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

        {canAccess('dominusArea') && (profile?.companySize || profile?.revenue || profile?.geographicReach || profile?.industryFocus || profile?.interestNetworking || profile?.interestMatchmaking || profile?.interestAdvisory) && (
          <>
            <p className="eyebrow" style={{ marginTop: '8px' }}>Dominus – ansökningsuppgifter</p>
            {profile?.companySize && (
              <label className="field">
                <span>Företagsstorlek</span>
                <input className="dominus-readonly" type="text" value={`${profile.companySize} anställda`} disabled />
              </label>
            )}
            {profile?.revenue && (
              <label className="field">
                <span>Omsättning</span>
                <input className="dominus-readonly" type="text" value={`${profile.revenue} kr/år`} disabled />
              </label>
            )}
            {profile?.geographicReach && (
              <label className="field">
                <span>Geografisk räckvidd</span>
                <input
                  className="dominus-readonly"
                  type="text"
                  value={({'local': 'Lokal/regional', 'national': 'Nationell', 'nordic': 'Nordisk', 'european': 'Europeisk', 'global': 'Global'} as Record<string, string>)[profile.geographicReach] ?? profile.geographicReach}
                  disabled
                />
              </label>
            )}
            {profile?.industryFocus && (
              <label className="field">
                <span>Branschfokus</span>
                <input className="dominus-readonly" type="text" value={profile.industryFocus} disabled />
              </label>
            )}
            {(profile?.interestNetworking || profile?.interestMatchmaking || profile?.interestAdvisory) && (
              <label className="field">
                <span>Intressen</span>
                <input
                  className="dominus-readonly"
                  type="text"
                  value={[
                    profile.interestNetworking && 'Affärsnätverk',
                    profile.interestMatchmaking && 'Matchmaking',
                    profile.interestAdvisory && 'Styrelse & rådgivning',
                  ].filter(Boolean).join(', ')}
                  disabled
                />
              </label>
            )}
          </>
        )}

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

            <label className="field">
              <span>Vad arbetar du med just nu?</span>
              <input
                type="text"
                value={form.currentBusiness}
                onChange={handleChange('currentBusiness')}
                placeholder="t.ex. Bygger SaaS-bolag inom HR-tech"
              />
            </label>

            <label className="field">
              <span>Vad vill du utveckla eller uppnå framåt?</span>
              <textarea
                value={form.developmentGoal}
                onChange={handleChange('developmentGoal')}
                placeholder="t.ex. Internationell expansion, styrelseuppdrag, ny kompetens"
              />
            </label>

            <label className="field">
              <span>2–3 styrkor eller fokusområden</span>
              <input
                type="text"
                value={form.strengths}
                onChange={handleChange('strengths')}
                placeholder="t.ex. Försäljning, ledarskap, produktutveckling"
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
          <button type="button" className="btn ghost" onClick={handleCopyProfileLink}>
            Kopiera profil-lank
          </button>
        </div>

        {message && <p className="muted">{message}</p>}
        {error && <p className="error">{error}</p>}
      </form>

      <article className="brand-panel" style={{ marginTop: '16px' }}>
        <h3>Extern delningsprofil</h3>
        <p className="muted">
          Välj exakt vilken information externa besökare (utan konto) får se via din delningslänk.
        </p>

        <label className="field" style={{ marginTop: '12px' }}>
          <span>Aktivera extern profil</span>
          <input
            type="checkbox"
            checked={shareEnabled}
            onChange={(event) => setShareEnabled(event.target.checked)}
            style={{ width: '18px', height: '18px' }}
          />
        </label>

        <div className="brand-panel-grid" style={{ marginTop: '10px' }}>
          {SHARE_FIELD_OPTIONS.map((field) => (
            <label key={field.key} className="brand-panel-sub" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={shareVisibility[field.key]}
                onChange={() => handleShareToggle(field.key)}
                style={{ width: '16px', height: '16px' }}
              />
              <span>{field.label}</span>
            </label>
          ))}
        </div>

        <div className="actions">
          <button type="button" className="btn primary" onClick={handleSaveShareSettings} disabled={shareSaving}>
            {shareSaving ? 'Sparar...' : 'Spara delningsinställningar'}
          </button>
          <button type="button" className="btn ghost" onClick={handleCopyExternalProfileLink}>
            Kopiera extern profil-lank
          </button>
        </div>
      </article>
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
      <article className="brand-panel" style={{ marginTop: '16px' }}>
        <h3>Kursbadges</h3>
        {loadingBadges ? (
          <p className="muted">Laddar badges...</p>
        ) : courseBadges.length > 0 ? (
          <div className="brand-panel-grid">
            {courseBadges.map((badge) => (
              <article key={badge.id} className="brand-panel-sub">
                <p className="eyebrow">Badge</p>
                <p>{badge.courseTitle ?? 'Kurs slutford'}</p>
                <p className="muted">
                  {badge.earnedAt
                    ? `Upplast: ${badge.earnedAt.toDate().toLocaleDateString('sv-SE')}`
                    : 'Upplast'}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Inga badges upplasta an.</p>
        )}
      </article>

      <article className="brand-panel profile-feed-panel" style={{ marginTop: '16px' }}>
        <h3>Ditt forumflöde</h3>
        {loadingPosts ? (
          <p className="muted">Laddar dina inlägg...</p>
        ) : profilePosts.length > 0 ? (
          <div className="forum-feed-list profile-feed-list">
            {profilePosts.map((post) => (
              <ForumPostCard
                key={post.id}
                post={post}
                onDeleted={(postId) =>
                  setProfilePosts((currentPosts) => currentPosts.filter((post) => post.id !== postId))
                }
              />
            ))}
          </div>
        ) : (
          <p className="muted">När du publicerar i forumet visas dina inlägg här.</p>
        )}
      </article>
    </BrandPageShell>
  )
}

export default ProfilePage
