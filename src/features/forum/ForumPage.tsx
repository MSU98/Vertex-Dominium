import { useEffect, useMemo, useState } from 'react'
import { FirebaseError } from 'firebase/app'
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { Link } from 'react-router-dom'
import ForumPostCard from '../../components/forum/ForumPostCard'
import BrandPageShell from '../../components/ui/BrandPageShell'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import type { ForumPost } from '../../types/ForumPost'
import type { UserProfile } from '../../types/User'

const quickFilters = ['Alla inlägg']

const starterPosts: ForumPost[] = [
  {
    id: 'starter-1',
    authorUid: 'vertex-starter-1',
    authorName: 'Kristina Hall',
    authorRole: 'Strategic Advisor at Vertex Dominium',
    topic: 'Roundtable',
    title: 'Hur bygger vi starkare introduktioner för nya medlemmar?',
    body:
      'Jag vill samla konkreta format för onboarding, mastermind-grupper och första kontaktpunkter som faktiskt får nya medlemmar att stanna kvar och bidra.',
    audience: 'Publikt i forumet',
    likeCount: 34,
    commentCount: 12,
    repostCount: 4,
    createdAt: null,
  },
  {
    id: 'starter-2',
    authorUid: 'vertex-starter-2',
    authorName: 'Markus Leone',
    authorRole: 'Growth Operator',
    topic: 'Case study',
    title: 'Vi testade ett mindre invite-only event och fick 3x högre engagemang',
    body:
      'Upplägget var enklare än tidigare: få deltagare, tydligt tema och en moderator som förberedde frågor i förväg. Det skapade bättre samtal och fler uppföljningar veckan efter.',
    audience: 'Ascensio-nätverket',
    likeCount: 51,
    commentCount: 18,
    repostCount: 9,
    createdAt: null,
  },
  {
    id: 'starter-3',
    authorUid: 'vertex-starter-3',
    authorName: 'Elina Berg',
    authorRole: 'Community Lead',
    topic: 'Söker input',
    title: 'Vilka KPI:er bör vi visa i medlemsflödet varje vecka?',
    body:
      'Jag funderar på att lyfta aktiva trådar, svarstid, antal introduktioner och toppdiskussioner. Vad skulle faktiskt få dig att komma tillbaka oftare?',
    audience: 'Dominus-rummet',
    likeCount: 22,
    commentCount: 27,
    repostCount: 2,
    createdAt: null,
  },
]

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'VD'

const toDisplayName = (profile: Partial<UserProfile>) => {
  if (profile.fullName?.trim()) return profile.fullName.trim()
  return profile.email?.split('@')[0] ?? 'Medlem'
}

type SearchableProfile = Pick<UserProfile, 'uid' | 'fullName' | 'email' | 'avatarUrl' | 'title' | 'company'>

const ForumPage = () => {
  const { profile } = useAuth()
  const dbClient = db
  const [posts, setPosts] = useState<ForumPost[]>(starterPosts)
  const [directory, setDirectory] = useState<SearchableProfile[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isAdmin = profile?.role === 'admin'

  const authorName = useMemo(() => {
    if (profile?.fullName?.trim()) return profile.fullName.trim()
    return profile?.email?.split('@')[0] ?? 'Medlem'
  }, [profile?.email, profile?.fullName])

  const authorRole = useMemo(() => {
    if (profile?.title?.trim()) return profile.title.trim()
    if (profile?.company?.trim()) return profile.company.trim()
    return 'Medlem i Vertex Dominium'
  }, [profile?.company, profile?.title])

  const authorInitials = useMemo(() => getInitials(authorName), [authorName])
  const profileHeadline = useMemo(() => {
    if (profile?.professionalHeadline?.trim()) return profile.professionalHeadline.trim()
    if (profile?.title?.trim() && profile?.company?.trim()) {
      return `${profile.title.trim()} @ ${profile.company.trim()}`
    }
    if (profile?.title?.trim()) return profile.title.trim()
    if (profile?.company?.trim()) return profile.company.trim()
    return 'Medlem i Vertex Dominium'
  }, [profile?.company, profile?.professionalHeadline, profile?.title])

  const membershipLabel = useMemo(() => {
    if (profile?.membershipPlan === 'dominus') return 'Dominus'
    if (profile?.membershipPlan === 'ascensio') return 'Ascensio'
    if (profile?.membershipPlan === 'initium') return 'Initium'
    return 'Medlem'
  }, [profile?.membershipPlan])
  const profileCoverImage = profile?.companyLogoUrl?.trim() || profile?.avatarUrl?.trim() || ''

  useEffect(() => {
    if (!dbClient) return

    const loadPosts = async () => {
      try {
        const snapshot = await getDocs(
          query(collection(dbClient, 'forumPosts'), orderBy('createdAt', 'desc')),
        )
        const remotePosts = snapshot.docs.map((entry) => {
          const data = entry.data() as Omit<ForumPost, 'id'>
          return {
            id: entry.id,
            ...data,
          }
        })

        if (remotePosts.length > 0) {
          setPosts(remotePosts)
        }
      } catch (loadError) {
        console.error('Failed to load forum posts', loadError)
      }
    }

    loadPosts()
  }, [dbClient])

  useEffect(() => {
    if (!dbClient) return

    const loadDirectory = async () => {
      try {
        const snapshot = await getDocs(collection(dbClient, 'publicProfiles'))
        const nextProfiles = snapshot.docs
          .map((entry) => entry.data() as Partial<UserProfile>)
          .filter((entry): entry is SearchableProfile => Boolean(entry.uid))
          .sort((left, right) => toDisplayName(left).localeCompare(toDisplayName(right), 'sv'))

        setDirectory(nextProfiles)
      } catch (loadError) {
        console.error('Failed to load public profiles', loadError)
      }
    }

    loadDirectory()
  }, [dbClient])

  const filteredProfiles = useMemo(() => {
    const queryValue = searchTerm.trim().toLocaleLowerCase('sv')
    if (!queryValue) return []

    return directory
      .filter((entry) => {
        const name = toDisplayName(entry).toLocaleLowerCase('sv')
        return name.includes(queryValue)
      })
      .slice(0, 6)
  }, [directory, searchTerm])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (submitting) return

    if (!isAdmin) {
      setError('Du har inte beh\u00F6righet till att publicera ett inl\u00E4gg.')
      return
    }

    if (!dbClient || !profile?.uid) return

    const nextTitle = title.trim()
    const nextBody = body.trim()

    if (!nextTitle || !nextBody) {
      setError('Fyll i en rubrik och en text för inlägget.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await addDoc(collection(dbClient, 'forumPosts'), {
        authorUid: profile.uid,
        authorName,
        authorRole,
        authorAvatarUrl: profile.avatarUrl ?? '',
        topic: 'Nytt inlägg',
        title: nextTitle,
        body: nextBody,
        audience: 'Publikt i forumet',
        likeCount: 0,
        commentCount: 0,
        repostCount: 0,
        createdAt: serverTimestamp(),
      })

      const snapshot = await getDocs(
        query(collection(dbClient, 'forumPosts'), orderBy('createdAt', 'desc')),
      )
      const remotePosts = snapshot.docs.map((entry) => {
        const data = entry.data() as Omit<ForumPost, 'id'>
        return {
          id: entry.id,
          ...data,
        }
      })

      setPosts(remotePosts)
      setTitle('')
      setBody('')
    } catch (submitError) {
      console.error('Failed to create forum post', submitError)
      if (submitError instanceof FirebaseError && submitError.code === 'permission-denied') {
        setError(
          'Firebase blockerar nya inlägg. Kontrollera att firestore.rules är deployad och att ditt konto har admin-roll.',
        )
      } else {
        setError('Det gick inte att publicera inlägget. Försök igen.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BrandPageShell
      title="FORUM"
      subtitle="Diskussioner, idéer och samarbete mellan medlemmar i ett flöde som liknar ett professionellt nätverk."
      memberNav
    >
      <section className="forum-layout">
      <aside className="forum-sidebar-column">
        <Link className="forum-card forum-profile-card forum-profile-link" to={routes.profile}>
          <div
            className="forum-profile-cover"
            style={
              profileCoverImage
                ? {
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.5)), url(${profileCoverImage})`,
                  }
                : undefined
            }
          />
          <div className="forum-profile-body">
            {profile?.avatarUrl ? (
              <img className="forum-profile-avatar-image" src={profile.avatarUrl} alt={authorName} />
            ) : (
              <div className="forum-avatar">{authorInitials}</div>
            )}
            <h3>{authorName}</h3>
            <p className="forum-profile-role">{profileHeadline}</p>
            <dl className="forum-profile-stats">
              <div>
                <dt>Medlemsnivå</dt>
                <dd>{membershipLabel}</dd>
              </div>
              <div>
                <dt>Profil</dt>
                <dd>Visa</dd>
              </div>
            </dl>
          </div>
        </Link>

        <article className="forum-card forum-menu-card">
          <h3>Snabbnavigering</h3>
          <a href="#forum-feed">Starta flöde</a>
          <a href="#forum-member-search">Sök medlemmar</a>
        </article>

        <article className="forum-card forum-search-card" id="forum-member-search">
          <div className="forum-card-heading">
            <h3>Sök medlemmar</h3>
            <span>Nätverket</span>
          </div>
          <label className="forum-search-field">
            <span className="sr-only">Sök efter medlem</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Skriv ett namn"
            />
          </label>
          {searchTerm.trim() ? (
            filteredProfiles.length > 0 ? (
              <div className="forum-search-results">
                {filteredProfiles.map((entry) => {
                  const displayName = toDisplayName(entry)
                  const subtitle = [entry.title?.trim(), entry.company?.trim()].filter(Boolean).join(' @ ')

                  return (
                    <Link
                      key={entry.uid}
                      className="forum-search-result"
                      to={routes.profileView(entry.uid)}
                    >
                      {entry.avatarUrl ? (
                        <img className="forum-search-avatar" src={entry.avatarUrl} alt={displayName} />
                      ) : (
                        <div className="forum-avatar small forum-search-avatar">
                          {getInitials(displayName)}
                        </div>
                      )}
                      <div>
                        <strong>{displayName}</strong>
                        <span>{subtitle || 'Medlem i Vertex Dominium'}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="muted">Ingen medlem matchade sökningen.</p>
            )
          ) : (
            <p className="muted">Börja skriva ett namn för att hitta andra medlemmar.</p>
          )}
        </article>
      </aside>

      <main className="forum-main-column" id="forum-feed">
        <form className="forum-card forum-composer" onSubmit={handleSubmit}>
          <div className="forum-composer-top">
            {profile?.avatarUrl ? (
              <img className="forum-post-avatar-image" src={profile.avatarUrl} alt={authorName} />
            ) : (
              <div className="forum-avatar small forum-post-avatar">{authorInitials}</div>
            )}
            <input
              className="forum-composer-trigger"
              type="text"
              placeholder="Skriv en rubrik för ditt inlägg"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <textarea
            className="forum-composer-body"
            placeholder="Dela en tanke, fråga eller uppdatering med nätverket"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="forum-composer-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Publicerar...' : 'Publicera inlägg'}
            </button>
          </div>
          {error && <p className="error forum-composer-error">{error}</p>}
        </form>

        <div className="forum-filter-row" aria-label="Forumfilter">
          {quickFilters.map((filter, index) => (
            <button
              key={filter}
              type="button"
              className={index === 0 ? 'forum-filter active' : 'forum-filter'}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="forum-feed-list">
          {posts.map((post) => (
            <ForumPostCard key={post.id} post={post} />
          ))}
        </div>
      </main>
      </section>
    </BrandPageShell>
  )
}

export default ForumPage
