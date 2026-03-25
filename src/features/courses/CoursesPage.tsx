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
  libraryId?: string
  libraryName?: string
  imageUrl?: string
  videoUrl?: string
  authorName?: string
  createdAt?: Timestamp | null
}

type CourseLibrary = {
  id: string
  name: string
  description?: string
  createdAt?: Timestamp | null
}

const formatCatalogTime = (value?: Timestamp | null) => {
  if (!value) return 'Ny'
  return value.toDate().toLocaleTimeString('sv-SE', {
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

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLibraryFilter, setSelectedLibraryFilter] = useState('all')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [libraryId, setLibraryId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [newLibraryName, setNewLibraryName] = useState('')
  const [newLibraryDescription, setNewLibraryDescription] = useState('')
  const [librarySubmitting, setLibrarySubmitting] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null)
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [libraries, setLibraries] = useState<CourseLibrary[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingLibraries, setLoadingLibraries] = useState(true)

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
          return { id: entry.id, ...data }
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

  useEffect(() => {
    if (!dbClient) {
      setLoadingLibraries(false)
      return
    }

    const librariesQuery = query(collection(dbClient, 'courseLibraries'), orderBy('name', 'asc'))
    const unsubscribe = onSnapshot(
      librariesQuery,
      (snapshot) => {
        const nextLibraries = snapshot.docs.map((entry) => {
          const data = entry.data() as Omit<CourseLibrary, 'id'>
          return { id: entry.id, ...data }
        })
        setLibraries(nextLibraries)
        setLoadingLibraries(false)
      },
      (loadError) => {
        console.error('Failed to load course libraries', loadError)
        setLoadingLibraries(false)
      },
    )

    return () => unsubscribe()
  }, [dbClient])

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return courses.filter((course) => {
      const matchesLibrary =
        selectedLibraryFilter === 'all' ? true : course.libraryId === selectedLibraryFilter

      if (!matchesLibrary) return false
      if (!q) return true

      const haystack = `${course.title} ${course.description} ${course.libraryName ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [courses, searchQuery, selectedLibraryFilter])

  const fallbackToAllCourses = filteredCourses.length === 0 && courses.length > 0
  const visibleCatalogCourses = fallbackToAllCourses ? courses : filteredCourses

  const libraryCards = useMemo(() => {
    return libraries.map((library) => {
      const libraryCourses = courses.filter((course) => course.libraryId === library.id)
      return {
        ...library,
        count: libraryCourses.length,
        coverImageUrl: libraryCourses.find((course) => course.imageUrl)?.imageUrl ?? '',
        latestCreatedAt: libraryCourses[0]?.createdAt ?? null,
      }
    })
  }, [courses, libraries])

  const handleCreateLibrary = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!dbClient || !isAdmin || librarySubmitting) return

    const nextName = newLibraryName.trim()
    const nextDescription = newLibraryDescription.trim()

    if (!nextName) {
      setError('Fyll i ett namn for biblioteket.')
      return
    }

    setLibrarySubmitting(true)
    setError(null)
    setLibraryMessage(null)

    try {
      const docRef = await addDoc(collection(dbClient, 'courseLibraries'), {
        name: nextName,
        description: nextDescription,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setNewLibraryName('')
      setNewLibraryDescription('')
      setLibraryId(docRef.id)
      setLibraryMessage('Biblioteket har skapats.')
    } catch (createError) {
      console.error('Failed to create course library', createError)
      setError('Det gick inte att skapa biblioteket. Forsok igen.')
    } finally {
      setLibrarySubmitting(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!dbClient || !isAdmin || submitting) return

    const nextTitle = title.trim()
    const nextDescription = description.trim()
    const selectedLibrary = libraries.find((entry) => entry.id === libraryId)

    if (!nextTitle || !nextDescription) {
      setError('Fyll i kurstitel och beskrivning.')
      return
    }
    if (!selectedLibrary) {
      setError('Valj vilket bibliotek kursen ska hamna i.')
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
        libraryId: selectedLibrary.id,
        libraryName: selectedLibrary.name,
        imageUrl: nextImageUrl,
        videoUrl: nextVideoUrl,
        authorName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setTitle('')
      setDescription('')
      setLibraryId('')
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
    <BrandPageShell title="KURSER" subtitle="Valj bibliotek och utforska kurser." memberNav>
      <article className="brand-panel courses-toolbar-panel">
        <div className="courses-toolbar-inner">
          <input
            className="courses-search-input"
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search training..."
          />

          <p className="muted">Valkort nedan filtrerar vilka kurser som visas.</p>
        </div>
      </article>
      <section className="courses-library-section">
        {loadingCourses || loadingLibraries ? (
          <article className="brand-panel">
            <p className="muted">Laddar bibliotek...</p>
          </article>
        ) : (
          <div className="courses-library-grid">
            {libraryCards.map((library) => (
              <button
                key={library.id}
                type="button"
                className={`courses-library-card ${
                  selectedLibraryFilter === library.id ? 'active' : ''
                }`}
                onClick={() => {
                  setSelectedLibraryFilter(library.id)
                  setSearchQuery('')
                }}
              >
                {library.coverImageUrl ? (
                  <img src={library.coverImageUrl} alt={library.name} className="courses-library-image" />
                ) : (
                  <div className="courses-library-image courses-library-image-fallback" />
                )}
                <div className="courses-library-body">
                  <div className="courses-catalog-meta-row">
                    <span className="courses-catalog-pill">{library.name}</span>
                    <span className="courses-catalog-date">
                      {library.count > 0 ? formatCatalogTime(library.latestCreatedAt) : 'Tomt'}
                    </span>
                  </div>
                  <h3>{library.name}</h3>
                  <p>{library.count} kurs(er)</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="courses-catalog-section">
        {loadingCourses || loadingLibraries ? (
          <article className="brand-panel">
            <p className="muted">Laddar kurser...</p>
          </article>
        ) : visibleCatalogCourses.length > 0 ? (
          <>
            {fallbackToAllCourses && (
              <article className="brand-panel" style={{ marginBottom: '12px' }}>
                <p className="muted">
                  Inga kurser matchade valt bibliotek/sokning. Visar alla kurser istallet.
                </p>
              </article>
            )}
          <div className="courses-catalog-grid">
            {visibleCatalogCourses.map((course) => {
              const embeddedUrl = course.videoUrl ? toYouTubeEmbed(course.videoUrl) : null
              return (
                <article key={course.id} className="courses-catalog-card">
                  {course.imageUrl ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="courses-catalog-image"
                    />
                  ) : (
                    <div className="courses-catalog-image courses-catalog-image-fallback" />
                  )}

                  <div className="courses-catalog-body">
                    <div className="courses-catalog-meta-row">
                      <span className="courses-catalog-pill">{course.libraryName ?? 'Bibliotek'}</span>
                      <span className="courses-catalog-date">{formatCatalogTime(course.createdAt)}</span>
                    </div>
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>
                  </div>

                  {course.videoUrl && (
                    <div className="courses-catalog-video">
                      {embeddedUrl ? (
                        <iframe
                          src={embeddedUrl}
                          title={`${course.title} video`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                          className="courses-catalog-embed"
                        />
                      ) : (
                        <video controls src={course.videoUrl} className="courses-catalog-embed" />
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
          </>
        ) : selectedLibraryFilter !== 'all' ? (
          <article className="brand-panel">
            <p className="muted">Inga kurser i valt bibliotek. Prova "Alla".</p>
            <div className="actions" style={{ marginTop: '10px' }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setSelectedLibraryFilter('all')
                  setSearchQuery('')
                }}
              >
                Visa alla kurser
              </button>
            </div>
          </article>
        ) : (
          null
        )}
      </section>

      {isAdmin && (
        <article className="brand-panel" style={{ marginTop: '16px' }}>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Adminverktyg</summary>
            <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
              <article className="brand-panel-sub">
                <h3>Skapa bibliotek</h3>
                <form className="brand-form" style={{ width: '100%' }} onSubmit={handleCreateLibrary}>
                  <label className="field">
                    <span>Namn</span>
                    <input
                      type="text"
                      value={newLibraryName}
                      onChange={(event) => setNewLibraryName(event.target.value)}
                      required
                    />
                  </label>
                  <label className="field">
                    <span>Beskrivning (valfritt)</span>
                    <textarea
                      value={newLibraryDescription}
                      onChange={(event) => setNewLibraryDescription(event.target.value)}
                    />
                  </label>
                  <div className="actions">
                    <button className="btn ghost" type="submit" disabled={librarySubmitting}>
                      {librarySubmitting ? 'Skapar...' : 'Skapa bibliotek'}
                    </button>
                  </div>
                  {libraryMessage && <p className="muted">{libraryMessage}</p>}
                </form>
              </article>

              <article className="brand-panel-sub">
                <h3>Skapa kurs</h3>
                <form className="brand-form" style={{ width: '100%' }} onSubmit={handleSubmit}>
                  <label className="field">
                    <span>Bibliotek</span>
                    <select
                      value={libraryId}
                      onChange={(event) => setLibraryId(event.target.value)}
                      style={{
                        background: 'var(--panel-muted)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        color: 'var(--text)',
                        font: 'inherit',
                      }}
                      required
                    >
                      <option value="" disabled>
                        {loadingLibraries ? 'Laddar bibliotek...' : 'Valj bibliotek'}
                      </option>
                      {libraries.map((library) => (
                        <option key={library.id} value={library.id}>
                          {library.name}
                        </option>
                      ))}
                    </select>
                  </label>

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
                    <button className="btn primary" type="submit" disabled={submitting || libraries.length === 0}>
                      {submitting ? 'Publicerar...' : 'Spara och publicera'}
                    </button>
                  </div>

                  {libraries.length === 0 && !loadingLibraries && (
                    <p className="muted">Skapa minst ett bibliotek innan du publicerar kurser.</p>
                  )}
                  {message && <p className="muted">{message}</p>}
                  {error && <p className="error">{error}</p>}
                </form>
              </article>
            </div>
          </details>
        </article>
      )}
    </BrandPageShell>
  )
}

export default CoursesPage

