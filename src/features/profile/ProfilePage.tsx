import { useEffect, useState } from 'react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import BrandPageShell from '../../components/ui/BrandPageShell'
import useAuth from '../../hooks/useAuth'
import { useModuleAccess } from '../../hooks/useModuleAccess'
import { db } from '../../lib/firebase'
import type { UserProfile } from '../../types/User'

type ProfileFormState = {
  fullName: string
  phone: string
  city: string
  company: string
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
  const [form, setForm] = useState<ProfileFormState>({
    fullName: '',
    phone: '',
    city: '',
    company: '',
    title: '',
    linkedin: '',
    professionalDescription: '',
  })

  const fileToAvatarDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()

      reader.onerror = () => reject(new Error('Kunde inte läsa bildfilen.'))
      reader.onload = () => {
        const image = new Image()

        image.onerror = () => reject(new Error('Kunde inte tolka bildfilen.'))
        image.onload = () => {
          const maxSize = 256
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

  useEffect(() => {
    setForm({
      fullName: profile?.fullName ?? '',
      phone: profile?.phone ?? '',
      city: profile?.city ?? '',
      company: profile?.company ?? '',
      title: profile?.title ?? '',
      linkedin: profile?.linkedin ?? '',
      professionalDescription: profile?.professionalDescription ?? '',
    })
    setAvatarUrl(profile?.avatarUrl ?? '')
    setAvatarPreviewUrl(profile?.avatarUrl ?? '')
    setSelectedAvatarFile(null)
    setRemoveAvatar(false)
  }, [profile])

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!profile?.uid || !dbClient || saving) return

    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      let nextAvatarUrl = avatarUrl.trim()

      if (removeAvatar) {
        nextAvatarUrl = ''
      }

      if (selectedAvatarFile) {
        nextAvatarUrl = await fileToAvatarDataUrl(selectedAvatarFile)
      }

      const updates = {
        avatarUrl: nextAvatarUrl,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        company: form.company.trim(),
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

  return (
    <BrandPageShell title="PROFIL" subtitle="Hantera dina medlemsuppgifter." memberNav>
      <form className="brand-form" onSubmit={handleSubmit}>
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

        <label className="field">
          <span>Företag</span>
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
          <p className="muted">Titel, LinkedIn och beskrivning låses upp med Ascensio eller högre.</p>
        )}

        <div className="actions">
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? 'Sparar...' : 'Spara profil'}
          </button>
        </div>

        {message && <p className="muted">{message}</p>}
        {error && <p className="error">{error}</p>}
      </form>
    </BrandPageShell>
  )
}

export default ProfilePage
