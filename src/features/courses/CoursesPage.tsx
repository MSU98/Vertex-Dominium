import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
  where,
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
  price?: number
  availability?: 'all' | 'members' | 'initium' | 'ascensio' | 'dominus'
  steps?: CourseStep[]
  createdAt?: Timestamp | null
}

type CourseStep = {
  title: string
  videoUrl?: string
  pdfUrl?: string
  quizzes?: CourseQuiz[]
  quizQuestion?: string
  quizAnswer?: string
}

type CourseQuiz = {
  question: string
  answer: string
}

type CourseLibrary = {
  id: string
  name: string
  description?: string
  createdAt?: Timestamp | null
}

type CourseProgressItem = {
  id: string
  uid: string
  courseId: string
  lastStepIndex?: number
  completedStepIndexes?: number[]
}

type CourseBadgeItem = {
  id: string
  uid: string
  courseId: string
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

const availabilityLabel = (value?: 'all' | 'members' | 'initium' | 'ascensio' | 'dominus') => {
  if (value === 'initium') return 'Initium+'
  if (value === 'ascensio') return 'Ascensio+'
  if (value === 'members') return 'Medlemmar'
  if (value === 'dominus') return 'Dominus'
  return 'Alla'
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
  const [coursePrice, setCoursePrice] = useState('0')
  const [courseAvailability, setCourseAvailability] = useState<
    'all' | 'members' | 'initium' | 'ascensio' | 'dominus'
  >('all')
  const [draftSteps, setDraftSteps] = useState<CourseStep[]>([
    { title: '', videoUrl: '', pdfUrl: '', quizzes: [{ question: '', answer: '' }] },
  ])
  const [librarySubmitting, setLibrarySubmitting] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null)
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [libraries, setLibraries] = useState<CourseLibrary[]>([])
  const [ownedCourseIds, setOwnedCourseIds] = useState<string[]>([])
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null)
  const [purchaseSubmittingId, setPurchaseSubmittingId] = useState<string | null>(null)
  const [progressByCourseId, setProgressByCourseId] = useState<Record<string, CourseProgressItem>>({})
  const [earnedBadgeCourseIds, setEarnedBadgeCourseIds] = useState<string[]>([])
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [purchaseCountByCourseId, setPurchaseCountByCourseId] = useState<Record<string, number>>({})
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
    if (!dbClient || !profile?.uid) {
      setOwnedCourseIds([])
      setProgressByCourseId({})
      setEarnedBadgeCourseIds([])
      return
    }

    const purchasesQuery = query(
      collection(dbClient, 'coursePurchases'),
      where('uid', '==', profile.uid),
      orderBy('createdAt', 'desc'),
    )
    const unsubscribePurchases = onSnapshot(purchasesQuery, (snapshot) => {
      const nextOwned = new Set<string>()
      snapshot.docs.forEach((entry) => {
        const data = entry.data() as { courseId?: string }
        if (data.courseId) nextOwned.add(data.courseId)
      })
      setOwnedCourseIds(Array.from(nextOwned))
    })

    const progressQuery = query(collection(dbClient, 'courseProgress'), where('uid', '==', profile.uid))
    const unsubscribeProgress = onSnapshot(progressQuery, (snapshot) => {
      const nextProgress: Record<string, CourseProgressItem> = {}
      snapshot.docs.forEach((entry) => {
        const data = entry.data() as Omit<CourseProgressItem, 'id'>
        if (data.courseId) {
          nextProgress[data.courseId] = {
            id: entry.id,
            ...data,
          }
        }
      })
      setProgressByCourseId(nextProgress)
    })

    const badgesQuery = query(collection(dbClient, 'courseBadges'), where('uid', '==', profile.uid))
    const unsubscribeBadges = onSnapshot(badgesQuery, (snapshot) => {
      const nextBadges = snapshot.docs
        .map((entry) => {
          const data = entry.data() as Omit<CourseBadgeItem, 'id'>
          return { id: entry.id, ...data }
        })
        .map((badge) => badge.courseId)
        .filter(Boolean)
      setEarnedBadgeCourseIds(nextBadges)
    })

    return () => {
      unsubscribePurchases()
      unsubscribeProgress()
      unsubscribeBadges()
    }
  }, [dbClient, profile?.uid])

  useEffect(() => {
    if (!dbClient || !isAdmin) {
      setPurchaseCountByCourseId({})
      return
    }

    const purchasesQuery = query(collection(dbClient, 'coursePurchases'))
    const unsubscribe = onSnapshot(purchasesQuery, (snapshot) => {
      const counts: Record<string, number> = {}
      snapshot.docs.forEach((entry) => {
        const data = entry.data() as { courseId?: string }
        if (!data.courseId) return
        counts[data.courseId] = (counts[data.courseId] ?? 0) + 1
      })
      setPurchaseCountByCourseId(counts)
    })

    return () => unsubscribe()
  }, [dbClient, isAdmin])

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

  const normalizedLibraryQuery = searchQuery.trim().toLowerCase()

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

  const visibleLibraryCards = useMemo(() => {
    if (!normalizedLibraryQuery) return libraryCards
    return libraryCards.filter((library) =>
      `${library.name} ${library.description ?? ''}`.toLowerCase().includes(normalizedLibraryQuery),
    )
  }, [libraryCards, normalizedLibraryQuery])

  const visibleCatalogCourses = useMemo(() => {
    let next = courses

    if (selectedLibraryFilter !== 'all') {
      next = next.filter((course) => course.libraryId === selectedLibraryFilter)
      return next
    }

    if (!normalizedLibraryQuery) return next

    const visibleLibraryIds = new Set(visibleLibraryCards.map((library) => library.id))
    return next.filter((course) => (course.libraryId ? visibleLibraryIds.has(course.libraryId) : false))
  }, [courses, normalizedLibraryQuery, selectedLibraryFilter, visibleLibraryCards])

  const ownedCourseSet = useMemo(() => new Set(ownedCourseIds), [ownedCourseIds])
  const earnedBadgeCourseSet = useMemo(() => new Set(earnedBadgeCourseIds), [earnedBadgeCourseIds])

  const hasMembership = Boolean(profile?.membershipPlan)
  const hasDominus = profile?.membershipPlan === 'dominus'

  const canAccessByAvailability = (
    availability?: 'all' | 'members' | 'initium' | 'ascensio' | 'dominus',
  ) => {
    if (availability === 'dominus') return hasDominus
    if (availability === 'ascensio') return profile?.membershipPlan === 'ascensio' || hasDominus
    if (availability === 'initium') return hasMembership
    if (availability === 'members') return hasMembership
    return true
  }

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
      const parsedSteps = draftSteps
        .map((step) => {
          const nextTitle = step.title?.trim() || 'Steg'
          const nextVideoUrl = step.videoUrl?.trim()
          const nextPdfUrl = step.pdfUrl?.trim()
          const nextQuizzes = (step.quizzes ?? [])
            .map((quiz) => ({
              question: quiz.question.trim(),
              answer: quiz.answer.trim(),
            }))
            .filter((quiz) => quiz.question && quiz.answer)

          const hasAnyContent = Boolean(nextTitle.trim() || nextVideoUrl || nextPdfUrl || nextQuizzes.length > 0)
          if (!hasAnyContent) return null

          const nextStep: CourseStep = { title: nextTitle }
          if (nextVideoUrl) nextStep.videoUrl = nextVideoUrl
          if (nextPdfUrl) nextStep.pdfUrl = nextPdfUrl
          if (nextQuizzes.length > 0) nextStep.quizzes = nextQuizzes
          return nextStep
        })
        .filter((step): step is CourseStep => Boolean(step))
      const parsedPrice = Number.parseFloat(coursePrice)

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
        price: Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0,
        availability: courseAvailability,
        steps: parsedSteps,
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
      setCoursePrice('0')
      setCourseAvailability('all')
      setDraftSteps([{ title: '', videoUrl: '', pdfUrl: '', quizzes: [{ question: '', answer: '' }] }])
      setMessage('Kursen har publicerats.')
    } catch (submitError) {
      console.error('Failed to create course', submitError)
      const reason =
        submitError instanceof Error ? submitError.message : 'okant fel'
      setError(`Det gick inte att publicera kursen. Fel: ${reason}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBuyCourse = async (course: CourseItem) => {
    if (!dbClient || !profile?.uid) return
    if (ownedCourseSet.has(course.id)) return

    setPurchaseSubmittingId(course.id)
    setError(null)
    setMessage(null)

    try {
      await addDoc(collection(dbClient, 'coursePurchases'), {
        courseId: course.id,
        courseTitle: course.title,
        uid: profile.uid,
        amount: course.price ?? 0,
        createdAt: serverTimestamp(),
      })
      setMessage(`Du ager nu kursen "${course.title}".`)
    } catch (purchaseError) {
      console.error('Failed to purchase course', purchaseError)
      setError('Det gick inte att kopa kursen just nu. Forsok igen.')
    } finally {
      setPurchaseSubmittingId(null)
    }
  }

  const handleCompleteStep = async (course: CourseItem, stepIndex: number) => {
    if (!dbClient || !profile?.uid) return

    const current = progressByCourseId[course.id]
    const completed = new Set(current?.completedStepIndexes ?? [])
    completed.add(stepIndex)
    const completedStepIndexes = Array.from(completed).sort((a, b) => a - b)
    const lastStepIndex = Math.max(current?.lastStepIndex ?? -1, stepIndex)
    const totalSteps = (course.steps ?? []).length
    const isCourseCompleted = totalSteps > 0 && completedStepIndexes.length >= totalSteps

    try {
      await setDoc(
        doc(dbClient, 'courseProgress', `${profile.uid}_${course.id}`),
        {
          uid: profile.uid,
          courseId: course.id,
          lastStepIndex,
          completedStepIndexes,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      if (isCourseCompleted) {
        await setDoc(
          doc(dbClient, 'courseBadges', `${profile.uid}_${course.id}`),
          {
            uid: profile.uid,
            courseId: course.id,
            courseTitle: course.title,
            earnedAt: serverTimestamp(),
          },
          { merge: true },
        )
        setMessage(`Badge upplast: ${course.title}`)
      }
    } catch (progressError) {
      console.error('Failed to update course progress', progressError)
      setError('Det gick inte att spara progressionen. Forsok igen.')
    }
  }

  const updateDraftStep = (index: number, key: keyof CourseStep, value: string) => {
    setDraftSteps((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [key]: value } : step,
      ),
    )
  }

  const updateDraftQuiz = (stepIndex: number, quizIndex: number, key: keyof CourseQuiz, value: string) => {
    setDraftSteps((current) =>
      current.map((step, sIndex) => {
        if (sIndex !== stepIndex) return step
        const nextQuizzes = [...(step.quizzes ?? [{ question: '', answer: '' }])]
        nextQuizzes[quizIndex] = {
          ...(nextQuizzes[quizIndex] ?? { question: '', answer: '' }),
          [key]: value,
        }
        return { ...step, quizzes: nextQuizzes }
      }),
    )
  }

  const addDraftQuiz = (stepIndex: number) => {
    setDraftSteps((current) =>
      current.map((step, sIndex) =>
        sIndex === stepIndex
          ? {
              ...step,
              quizzes: [...(step.quizzes ?? []), { question: '', answer: '' }],
            }
          : step,
      ),
    )
  }

  const removeDraftQuiz = (stepIndex: number, quizIndex: number) => {
    setDraftSteps((current) =>
      current.map((step, sIndex) => {
        if (sIndex !== stepIndex) return step
        const currentQuizzes = step.quizzes ?? []
        if (currentQuizzes.length <= 1) {
          return { ...step, quizzes: [{ question: '', answer: '' }] }
        }
        return {
          ...step,
          quizzes: currentQuizzes.filter((_, qIndex) => qIndex !== quizIndex),
        }
      }),
    )
  }

  const addDraftStep = () => {
    setDraftSteps((current) => [
      ...current,
      { title: '', videoUrl: '', pdfUrl: '', quizzes: [{ question: '', answer: '' }] },
    ])
  }

  const removeDraftStep = (index: number) => {
    setDraftSteps((current) => {
      if (current.length === 1) {
        return [{ title: '', videoUrl: '', pdfUrl: '', quizzes: [{ question: '', answer: '' }] }]
      }
      return current.filter((_, stepIndex) => stepIndex !== index)
    })
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
            placeholder="Sok bibliotek..."
          />

          <p className="muted">Valkort nedan filtrerar vilka kurser som visas.</p>
        </div>
      </article>
      <section className="courses-library-section">
        {loadingCourses || loadingLibraries ? (
          <article className="brand-panel">
            <p className="muted">Laddar bibliotek...</p>
          </article>
        ) : selectedLibraryFilter === 'all' ? (
          <>
            <div className="courses-library-grid">
              {visibleLibraryCards.map((library) => (
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
            {!loadingLibraries && !loadingCourses && visibleLibraryCards.length === 0 && (
              <article className="brand-panel" style={{ marginTop: '12px' }}>
                <p className="muted">Inga bibliotek matchar din sokning.</p>
              </article>
            )}
          </>
        ) : (
          <article className="brand-panel">
            <h3 style={{ marginBottom: '10px' }}>
              Bibliotek:{' '}
              {libraries.find((library) => library.id === selectedLibraryFilter)?.name ?? 'Valt bibliotek'}
            </h3>
            <div className="actions" style={{ marginTop: 0 }}>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setSelectedLibraryFilter('all')
                  setSearchQuery('')
                }}
              >
                Tillbaka till alla bibliotek
              </button>
            </div>
          </article>
        )}
      </section>

      <section className="courses-catalog-section">
        {loadingCourses || loadingLibraries ? (
          <article className="brand-panel">
            <p className="muted">Laddar kurser...</p>
          </article>
        ) : visibleCatalogCourses.length > 0 ? (
          <>
          <div className="courses-catalog-grid">
            {visibleCatalogCourses.map((course) => {
              const embeddedUrl = course.videoUrl ? toYouTubeEmbed(course.videoUrl) : null
              const steps = course.steps ?? []
              const progress = progressByCourseId[course.id]
              const completedSet = new Set(progress?.completedStepIndexes ?? [])
              const progressPercent =
                steps.length > 0
                  ? Math.min(100, Math.round((completedSet.size / steps.length) * 100))
                  : 0
              const owned = ownedCourseSet.has(course.id)
              const canAccess = owned || isAdmin
              const allowedByPlan = canAccessByAvailability(course.availability)
              const canBuy = allowedByPlan && !owned && !isAdmin
              const resumeStepIndex =
                steps.length > 0
                  ? steps.findIndex((_, index) => !completedSet.has(index))
                  : -1
              const nextStepIndex = resumeStepIndex >= 0 ? resumeStepIndex : Math.max(0, steps.length - 1)

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
                    <p className="muted">Pris: {(course.price ?? 0).toFixed(0)} kr</p>
                    <p className="muted">Tillgang: {availabilityLabel(course.availability)}</p>
                    {isAdmin && (
                      <p className="muted">Kop: {purchaseCountByCourseId[course.id] ?? 0}</p>
                    )}
                    {canAccess && (
                      <div className="courses-progress-wrap">
                        <div className="courses-progress-meta">
                          <span>Progress</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <div className="courses-progress-track">
                          <span className="courses-progress-fill" style={{ width: `${progressPercent}%` }} />
                        </div>
                      </div>
                    )}
                    {earnedBadgeCourseSet.has(course.id) && (
                      <span className="courses-badge-pill">Badge upplast</span>
                    )}
                    {!allowedByPlan && (
                      <p className="error">Din medlemsniva kan inte kopa den har kursen.</p>
                    )}
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

                  <div className="courses-course-actions">
                    {canBuy ? (
                      <button
                        type="button"
                        className="btn primary"
                        disabled={purchaseSubmittingId === course.id}
                        onClick={() => handleBuyCourse(course)}
                      >
                        {purchaseSubmittingId === course.id ? 'Koper...' : 'Kop kurs'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() =>
                          setExpandedCourseId((current) => (current === course.id ? null : course.id))
                        }
                        disabled={!canAccess}
                      >
                        {canAccess ? 'Oppna kurs' : 'Kop for att lasa upp'}
                      </button>
                    )}

                    {canAccess && steps.length > 0 && (
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => handleCompleteStep(course, nextStepIndex)}
                      >
                        Fortsatt steg {nextStepIndex + 1}
                      </button>
                    )}
                  </div>

                  {expandedCourseId === course.id && canAccess && (
                    <div className="courses-steps-panel">
                      <h4>Kursinnehall</h4>
                      {steps.length === 0 ? (
                        <p className="muted">Inga steg upplagda an.</p>
                      ) : (
                        <div className="courses-step-list">
                          {steps.map((step, index) => {
                            const stepQuizzes =
                              step.quizzes && step.quizzes.length > 0
                                ? step.quizzes
                                : step.quizQuestion && step.quizAnswer
                                  ? [{ question: step.quizQuestion, answer: step.quizAnswer }]
                                  : []
                            const isDone = completedSet.has(index)
                            return (
                              <article key={`${course.id}-step-${index}`} className="courses-step-card">
                                <div className="courses-step-header">
                                  <strong>
                                    Steg {index + 1}: {step.title}
                                  </strong>
                                  <span>{isDone ? 'Klar' : 'Ej klar'}</span>
                                </div>

                                {step.videoUrl && (
                                  <div className="courses-catalog-video">
                                    {toYouTubeEmbed(step.videoUrl) ? (
                                      <iframe
                                        src={toYouTubeEmbed(step.videoUrl) ?? ''}
                                        title={`${course.title} steg ${index + 1}`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        allowFullScreen
                                        className="courses-catalog-embed"
                                      />
                                    ) : (
                                      <video controls src={step.videoUrl} className="courses-catalog-embed" />
                                    )}
                                  </div>
                                )}

                                {step.pdfUrl && (
                                  <a href={step.pdfUrl} target="_blank" rel="noreferrer" className="courses-step-link">
                                    Oppna PDF-material
                                  </a>
                                )}

                                {stepQuizzes.length > 0 && (
                                  <div className="courses-quiz-block">
                                    {stepQuizzes.map((quiz, quizIndex) => {
                                      const quizKey = `${course.id}-${index}-${quizIndex}`
                                      return (
                                        <div key={quizKey} className="courses-quiz-item">
                                          <p>{quiz.question}</p>
                                          <input
                                            type="text"
                                            value={quizAnswers[quizKey] ?? ''}
                                            onChange={(event) =>
                                              setQuizAnswers((current) => ({
                                                ...current,
                                                [quizKey]: event.target.value,
                                              }))
                                            }
                                            placeholder="Skriv ditt svar"
                                          />
                                        </div>
                                      )
                                    })}
                                    <button
                                      type="button"
                                      className="btn ghost"
                                      onClick={() => {
                                        const allCorrect = stepQuizzes.every((quiz, quizIndex) => {
                                          const quizKey = `${course.id}-${index}-${quizIndex}`
                                          const guess = (quizAnswers[quizKey] ?? '').trim().toLowerCase()
                                          const expected = (quiz.answer ?? '').trim().toLowerCase()
                                          return Boolean(guess) && guess === expected
                                        })

                                        if (!allCorrect) {
                                          setError('Fel quizsvar. Forsok igen.')
                                          return
                                        }
                                        setError(null)
                                        handleCompleteStep(course, index)
                                      }}
                                    >
                                      Godkann alla fragor
                                    </button>
                                  </div>
                                )}

                                {stepQuizzes.length === 0 && !isDone && (
                                  <button
                                    type="button"
                                    className="btn ghost"
                                    onClick={() => handleCompleteStep(course, index)}
                                  >
                                    Markera steg som klart
                                  </button>
                                )}
                              </article>
                            )
                          })}
                        </div>
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

                  <label className="field">
                    <span>Pris i SEK</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={coursePrice}
                      onChange={(event) => setCoursePrice(event.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Tillganglighet</span>
                    <select
                      value={courseAvailability}
                      onChange={(event) =>
                        setCourseAvailability(
                          event.target.value as 'all' | 'members' | 'initium' | 'ascensio' | 'dominus',
                        )
                      }
                      style={{
                        background: 'var(--panel-muted)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        color: 'var(--text)',
                        font: 'inherit',
                      }}
                    >
                      <option value="all">Alla</option>
                      <option value="members">Medlemmar</option>
                      <option value="initium">Initium+</option>
                      <option value="ascensio">Ascensio+</option>
                      <option value="dominus">Dominus</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Steg/Lektioner</span>
                    <div className="courses-step-list">
                      {draftSteps.map((step, index) => (
                        <div key={`draft-step-${index}`} className="courses-step-card">
                          <div className="courses-step-header">
                            <strong>Steg {index + 1}</strong>
                            <button
                              type="button"
                              className="btn ghost"
                              onClick={() => removeDraftStep(index)}
                            >
                              Ta bort
                            </button>
                          </div>

                          <input
                            type="text"
                            value={step.title ?? ''}
                            onChange={(event) => updateDraftStep(index, 'title', event.target.value)}
                            placeholder="Titel"
                          />
                          <input
                            type="url"
                            value={step.videoUrl ?? ''}
                            onChange={(event) => updateDraftStep(index, 'videoUrl', event.target.value)}
                            placeholder="Video-URL (valfritt)"
                          />
                          <input
                            type="url"
                            value={step.pdfUrl ?? ''}
                            onChange={(event) => updateDraftStep(index, 'pdfUrl', event.target.value)}
                            placeholder="PDF-URL (valfritt)"
                          />
                          <div className="courses-quiz-block">
                            {(step.quizzes ?? [{ question: '', answer: '' }]).map((quiz, quizIndex) => (
                              <div key={`draft-quiz-${index}-${quizIndex}`} className="courses-quiz-item">
                                <input
                                  type="text"
                                  value={quiz.question}
                                  onChange={(event) =>
                                    updateDraftQuiz(index, quizIndex, 'question', event.target.value)
                                  }
                                  placeholder={`Fraga ${quizIndex + 1}`}
                                />
                                <input
                                  type="text"
                                  value={quiz.answer}
                                  onChange={(event) =>
                                    updateDraftQuiz(index, quizIndex, 'answer', event.target.value)
                                  }
                                  placeholder={`Svar ${quizIndex + 1}`}
                                />
                                <button
                                  type="button"
                                  className="btn ghost"
                                  onClick={() => removeDraftQuiz(index, quizIndex)}
                                >
                                  Ta bort fraga
                                </button>
                              </div>
                            ))}
                            <button type="button" className="btn ghost" onClick={() => addDraftQuiz(index)}>
                              + Lagg till fraga
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="actions" style={{ marginTop: '10px' }}>
                      <button type="button" className="btn ghost" onClick={addDraftStep}>
                        + Lagg till lektion
                      </button>
                    </div>
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

