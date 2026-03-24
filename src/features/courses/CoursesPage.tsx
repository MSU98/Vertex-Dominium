import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import BrandPageShell from '../../components/ui/BrandPageShell'
import useAuth from '../../hooks/useAuth'
import { db, storage } from '../../lib/firebase'

type CourseItem = {
  id: string
  title: string
  description: string
  imageUrl?: string
  videoUrl?: string
  authorName?: string
  createdAt?: Timestamp | null
}

const formatCourseDate = (value?: Timestamp | null) => {
  if (!value) return 'Nyss publicerad'
  return value.toDate().toLocaleString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const toYouTubeEmbed = (url: string) => {
  const value = url.trim()
  if (!value) return null

  const watchMatch = value.match(/youtube\.com\/watch\?v=([^&]+)/i)
  if (watchMatch?.[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`

  const shortMatch = value.match(/youtu\.be\/([^?&]+)/i)
  if (shortMatch?.[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`

  if (value.includes('youtube.com/embed/')) return value
  return null
}

const CoursesPage = () => {
  const { profile } = useAuth()
  const dbClient = db
  const storageClient = storage
  const isAdmin = profile?.role === 'admin'
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)

  const authorName = useMemo(() => {
    if (profile?.fullName?.trim()) return profile.fullName.trim()
    return profile?.email?.split('@')[0] ?? 'Admin'
  }, [profile?.email, profile?.fullName])

  useEffect(() => {
    if (!dbClient) {
      setLoadingCourses(false)
      return
    }

    const coursesQuery = query(collection(dbClient, 'courses'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      coursesQuery,
      (snapshot) => {
        const nextCourses = snapshot.docs.map((entry) => {
          const data = entry.data() as Omit<CourseItem, 'id'>
          return {
            id: entry.id,
            ...data,
          }
        })
        setCourses(nextCourses)
        setLoadingCourses(false)
      },
      (loadError) => {
        console.error('Failed to load courses', loadError)
        setLoadingCourses(false)
      },
    )

    return () => unsubscribe()
  }, [dbClient])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!dbClient || !isAdmin || submitting) return

    const nextTitle = title.trim()
    const nextDescription = description.trim()

    if (!nextTitle || !nextDescription) {
      setError('Fyll i kurstitel och beskrivning.')
      return
    }

    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      let nextImageUrl = imageUrl.trim()
      let nextVideoUrl = videoUrl.trim()

      if (selectedImageFile) {
        if (!storageClient || !profile?.uid) {
          setError('Bilduppladdning kraver att Firebase Storage ar konfigurerad.')
          setSubmitting(false)
          return
        }

        const imageExt = selectedImageFile.name.split('.').pop() || 'jpg'
        const imageRef = ref(
          storageClient,
          `courses/${profile.uid}/images/${Date.now()}-${Math.random().toString(36).slice(2)}.${imageExt}`,
        )
        await uploadBytes(imageRef, selectedImageFile)
        nextImageUrl = await getDownloadURL(imageRef)
      }

      if (selectedVideoFile) {
        if (!storageClient || !profile?.uid) {
          setError('Videouppladdning kraver att Firebase Storage ar konfigurerad.')
          setSubmitting(false)
          return
        }

        const videoExt = selectedVideoFile.name.split('.').pop() || 'mp4'
        const videoRef = ref(
          storageClient,
          `courses/${profile.uid}/videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${videoExt}`,
        )
        await uploadBytes(videoRef, selectedVideoFile)
        nextVideoUrl = await getDownloadURL(videoRef)
      }

      await addDoc(collection(dbClient, 'courses'), {
        title: nextTitle,
        description: nextDescription,
        imageUrl: nextImageUrl,
        videoUrl: nextVideoUrl,
        authorName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setTitle('')
      setDescription('')
      setImageUrl('')
      setVideoUrl('')
      setSelectedImageFile(null)
      setSelectedVideoFile(null)
      setMessage('Kursen har publicerats.')
    } catch (submitError) {
      console.error('Failed to create course', submitError)
      setError(
        'Det gick inte att publicera kursen. Kontrollera Firestore/Storage-rattigheter och forsok igen.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BrandPageShell
      title={isAdmin ? 'SKAPA KURS' : 'KURSER'}
      subtitle={
        isAdmin
          ? 'Fyll i detaljerna nedan for att publicera ett nytt larpaket.'
          : 'Alla publicerade kurser visas i flodet nedan.'
      }
      memberNav
    >
      {isAdmin && (
        <article className="brand-panel">
          <form className="brand-form" style={{ width: 'min(980px, 100%)' }} onSubmit={handleSubmit}>
            <label className="field">
              <span>Kurstitel</span>
              <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>

            <label className="field">
              <span>Beskrivning</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Bild-URL (valfritt)</span>
              <input
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://..."
              />
            </label>

            <label className="field">
              <span>Ladda upp bild (valfritt)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  if (!file) {
                    setSelectedImageFile(null)
                    return
                  }
                  if (!file.type.startsWith('image/')) {
                    setError('Vald bilfil ar inte en giltig bild.')
                    event.target.value = ''
                    return
                  }
                  if (file.size > 8 * 1024 * 1024) {
                    setError('Bilden ar for stor. Max 8 MB.')
                    event.target.value = ''
                    return
                  }
                  setSelectedImageFile(file)
                  setError(null)
                }}
              />
              {selectedImageFile && <small className="muted">Vald fil: {selectedImageFile.name}</small>}
            </label>

            <label className="field">
              <span>Video-URL (valfritt)</span>
              <input
                type="url"
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
                placeholder="YouTube-lank eller MP4-lank"
              />
            </label>

            <label className="field">
              <span>Ladda upp video (valfritt)</span>
              <input
                type="file"
                accept="video/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  if (!file) {
                    setSelectedVideoFile(null)
                    return
                  }
                  if (!file.type.startsWith('video/')) {
                    setError('Vald fil ar inte en giltig video.')
                    event.target.value = ''
                    return
                  }
                  if (file.size > 120 * 1024 * 1024) {
                    setError('Videon ar for stor. Max 120 MB.')
                    event.target.value = ''
                    return
                  }
                  setSelectedVideoFile(file)
                  setError(null)
                }}
              />
              {selectedVideoFile && <small className="muted">Vald fil: {selectedVideoFile.name}</small>}
            </label>

            <p className="muted">
              Du kan fylla i URL, ladda upp fil, eller hoppa over bada. Om du valjer bade URL och fil
              anvands den uppladdade filen.
            </p>

            <div className="actions">
              <button className="btn primary" type="submit" disabled={submitting}>
                {submitting ? 'Publicerar...' : 'Spara och publicera'}
              </button>
            </div>

            {message && <p className="muted">{message}</p>}
            {error && <p className="error">{error}</p>}
          </form>
        </article>
      )}

      <article className="brand-panel" style={{ marginTop: isAdmin ? '16px' : '0' }}>
        <h3>Kursflode</h3>
        {loadingCourses ? (
          <p className="muted">Laddar kurser...</p>
        ) : courses.length > 0 ? (
          <div className="brand-panel-grid">
            {courses.map((course) => {
              const embeddedUrl = course.videoUrl ? toYouTubeEmbed(course.videoUrl) : null
              return (
                <article key={course.id} className="brand-panel-sub">
                  <p className="eyebrow">Publicerad {formatCourseDate(course.createdAt)}</p>
                  <h3 style={{ marginBottom: '8px' }}>{course.title}</h3>
                  {course.authorName && (
                    <p className="muted" style={{ marginBottom: '12px' }}>
                      Av {course.authorName}
                    </p>
                  )}
                  {course.imageUrl && (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      style={{
                        width: '100%',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.16)',
                        marginBottom: '12px',
                        maxHeight: '320px',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                  {course.videoUrl && (
                    <div style={{ marginBottom: '12px' }}>
                      {embeddedUrl ? (
                        <iframe
                          src={embeddedUrl}
                          title={`${course.title} video`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                          style={{
                            width: '100%',
                            aspectRatio: '16/9',
                            border: '1px solid rgba(255,255,255,0.16)',
                            borderRadius: '12px',
                            background: '#000',
                          }}
                        />
                      ) : (
                        <video
                          controls
                          src={course.videoUrl}
                          style={{
                            width: '100%',
                            border: '1px solid rgba(255,255,255,0.16)',
                            borderRadius: '12px',
                            background: '#000',
                          }}
                        />
                      )}
                    </div>
                  )}
                  <p style={{ margin: 0 }}>{course.description}</p>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="muted">Inga kurser publicerade an.</p>
        )}
      </article>
    </BrandPageShell>
  )
}

export default CoursesPage
