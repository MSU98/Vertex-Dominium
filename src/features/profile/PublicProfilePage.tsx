import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { useParams } from 'react-router-dom'
import ForumPostCard from '../../components/forum/ForumPostCard'
import BrandPageShell from '../../components/ui/BrandPageShell'
import { db } from '../../lib/firebase'
import type { ForumPost } from '../../types/ForumPost'
import type { UserProfile } from '../../types/User'

const PublicProfilePage = () => {
  const { uid } = useParams<{ uid: string }>()
  const dbClient = db
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [postsLoading, setPostsLoading] = useState(true)

  useEffect(() => {
    const targetUid = uid?.trim()
    if (!targetUid || !dbClient) {
      setProfileLoading(false)
      setProfileError('Ogiltig profiladress.')
      return
    }

    const loadProfile = async () => {
      setProfileLoading(true)
      setProfileError(null)
      try {
        const snap = await getDoc(doc(dbClient, 'publicProfiles', targetUid))
        if (!snap.exists()) {
          setProfile(null)
          setProfileError('Profilen kunde inte hittas.')
          return
        }

        setProfile(snap.data() as Partial<UserProfile>)
      } catch (error) {
        console.error('Failed to load public profile', error)
        setProfile(null)
        setProfileError('Kunde inte ladda profilen just nu.')
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfile()
  }, [dbClient, uid])

  useEffect(() => {
    const targetUid = uid?.trim()
    if (!targetUid || !dbClient) {
      setPostsLoading(false)
      setPosts([])
      return
    }

    const loadPosts = async () => {
      setPostsLoading(true)
      try {
        const postsSnapshot = await getDocs(
          query(collection(dbClient, 'forumPosts'), where('authorUid', '==', targetUid)),
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

        setPosts(nextPosts)
      } catch (error) {
        console.error('Failed to load profile posts', error)
        setPosts([])
      } finally {
        setPostsLoading(false)
      }
    }

    loadPosts()
  }, [dbClient, uid])

  const displayName = useMemo(() => {
    if (!profile) return 'Medlem'
    if (profile.fullName?.trim()) return profile.fullName.trim()
    return profile.email?.split('@')[0] ?? 'Medlem'
  }, [profile])

  const profileFields = useMemo(() => {
    if (!profile) return []

    const interests = profile.interests?.length ? profile.interests.join(', ') : ''
    return [
      { label: 'E-post', value: profile.email ?? '' },
      { label: 'Telefon', value: profile.phone ?? '' },
      { label: 'Stad', value: profile.city ?? '' },
      { label: 'Land/Stad', value: profile.countryCity ?? '' },
      { label: 'Foretag', value: profile.company ?? '' },
      { label: 'Titel', value: profile.title ?? '' },
      { label: 'Yrkesrubrik', value: profile.professionalHeadline ?? '' },
      { label: 'LinkedIn', value: profile.linkedin ?? '' },
      { label: 'Professionell beskrivning', value: profile.professionalDescription ?? '' },
      { label: 'Nuvarande verksamhet', value: profile.currentBusiness ?? '' },
      { label: 'Bransch', value: profile.industry ?? '' },
      { label: 'Organisationsnummer', value: profile.orgNumber ?? '' },
      { label: 'Yrkesintressen', value: profile.professionalInterests ?? '' },
      { label: 'Intressen', value: interests },
      { label: 'Beslutsmandat', value: profile.decisionMandate ?? '' },
      { label: 'Foretagsmail', value: profile.businessEmail ?? '' },
    ].filter((field) => field.value.trim().length > 0)
  }, [profile])

  return (
    <BrandPageShell title="PROFILVY" subtitle="Offentlig medlemsprofil." memberNav>
      {profileLoading ? (
        <article className="brand-panel">
          <p>Laddar profil...</p>
        </article>
      ) : profileError || !profile ? (
        <article className="brand-panel">
          <p>{profileError ?? 'Profilen kunde inte visas.'}</p>
        </article>
      ) : (
        <>
          <article className="brand-panel public-profile-header">
            <div className="public-profile-avatar-wrap">
              {profile.avatarUrl ? (
                <img className="profile-avatar-preview" src={profile.avatarUrl} alt={displayName} />
              ) : (
                <div className="profile-avatar-preview profile-avatar-fallback">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3>{displayName}</h3>
                {profile.professionalHeadline && <p>{profile.professionalHeadline}</p>}
              </div>
            </div>
            {profile.companyLogoUrl && (
              <img
                className="profile-company-logo-preview public-profile-company-logo"
                src={profile.companyLogoUrl}
                alt="Foretagslogga"
              />
            )}
          </article>

          <article className="brand-panel">
            <h3>Profilinformation</h3>
            {profileFields.length > 0 ? (
              <div className="brand-panel-grid public-profile-grid">
                {profileFields.map((field) => (
                  <div key={field.label} className="brand-panel-sub">
                    <p className="eyebrow">{field.label}</p>
                    {field.label === 'LinkedIn' ? (
                      <a href={field.value} target="_blank" rel="noreferrer">
                        {field.value}
                      </a>
                    ) : (
                      <p>{field.value}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Ingen offentlig profilinformation är tillagd än.</p>
            )}
          </article>

          <article className="brand-panel profile-feed-panel">
            <h3>Foruminlägg</h3>
            {postsLoading ? (
              <p className="muted">Laddar inlägg...</p>
            ) : posts.length > 0 ? (
              <div className="forum-feed-list profile-feed-list">
                {posts.map((post) => (
                  <ForumPostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <p className="muted">Inga inlägg publicerade än.</p>
            )}
          </article>
        </>
      )}
    </BrandPageShell>
  )
}

export default PublicProfilePage
