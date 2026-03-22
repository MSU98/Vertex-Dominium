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
import ForumPostCard from '../../components/forum/ForumPostCard'
import BrandPageShell from '../../components/ui/BrandPageShell'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import type { ForumPost } from '../../types/ForumPost'

const quickFilters = ['Alla inlagg', 'Ledarskap', 'Affarer', 'Events']

const starterPosts: ForumPost[] = [
  {
    id: 'starter-1',
    authorUid: 'vertex-starter-1',
    authorName: 'Kristina Hall',
    authorRole: 'Strategic Advisor at Vertex Dominium',
    topic: 'Roundtable',
    title: 'Hur bygger vi starkare introduktioner for nya medlemmar?',
    body:
      'Jag vill samla konkreta format for onboarding, mastermind-grupper och forsta kontaktpunkter som faktiskt far nya medlemmar att stanna kvar och bidra.',
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
    title: 'Vi testade ett mindre invite-only event och fick 3x hogre engagemang',
    body:
      'Upplagget var enklare an tidigare: fa deltagare, tydligt tema och en moderator som forberedde fragor i forvag. Det skapade battre samtal och fler uppfoljningar veckan efter.',
    audience: 'Ascensio-natverket',
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
    topic: 'Soker input',
    title: 'Vilka KPI:er bor vi visa i medlemsflodet varje vecka?',
    body:
      'Jag funderar pa att lyfta aktiva tradar, svarstid, antal introduktioner och toppdiskussioner. Vad skulle faktiskt fa dig att komma tillbaka oftare?',
    audience: 'Dominus-rummet',
    likeCount: 22,
    commentCount: 27,
    repostCount: 2,
    createdAt: null,
  },
]

const trendingTopics = [
  { name: 'Executive networking', count: '128 diskussioner' },
  { name: 'Private dinners', count: '64 diskussioner' },
  { name: 'Capital partners', count: '41 diskussioner' },
]

const events = [
  { title: 'Stockholm Breakfast Circle', date: '22 mars', attendees: '18 anmalda' },
  { title: 'Founder Roundtable', date: '29 mars', attendees: '12 anmalda' },
]

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'VD'

const ForumPage = () => {
  const { profile } = useAuth()
  const dbClient = db
  const [posts, setPosts] = useState<ForumPost[]>(starterPosts)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
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
      setError('Fyll i en rubrik och en text for inlagget.')
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
        topic: 'Nytt inlagg',
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
          'Firebase blockerar nya inlagg. Kontrollera att firestore.rules ar deployad och att ditt konto har admin-roll.',
        )
      } else {
        setError('Det gick inte att publicera inlagget. Forsok igen.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BrandPageShell
      title="FORUM"
      subtitle="Diskussioner, ideer och samarbete mellan medlemmar i ett flode som liknar ett professionellt natverk."
      memberNav
    >
      <section className="forum-layout">
      <aside className="forum-sidebar-column">
        <article className="forum-card forum-profile-card">
          <div className="forum-profile-cover" />
          <div className="forum-profile-body">
            <div className="forum-avatar">VD</div>
            <h3>Vertex Dominium</h3>
            <p className="forum-profile-role">Professionellt medlemsnatverk</p>
            <dl className="forum-profile-stats">
              <div>
                <dt>Profilvisningar</dt>
                <dd>148</dd>
              </div>
              <div>
                <dt>Kontakter denna vecka</dt>
                <dd>23</dd>
              </div>
            </dl>
          </div>
        </article>

        <article className="forum-card forum-menu-card">
          <h3>Snabbnavigering</h3>
          <a href="#forum-feed">Starta flode</a>
          <a href="#forum-groups">Mina grupper</a>
          <a href="#forum-events">Kommande event</a>
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
              placeholder="Skriv en rubrik for ditt inlagg"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <textarea
            className="forum-composer-body"
            placeholder="Dela en tanke, fraga eller uppdatering med natverket"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="forum-composer-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Publicerar...' : 'Publicera inlagg'}
            </button>
            <button type="button">Dela dokument</button>
            <button type="button">Skapa event</button>
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

      <aside className="forum-right-column">
        <article className="forum-card" id="forum-groups">
          <div className="forum-card-heading">
            <h3>Trendande amnen</h3>
            <span>Denna vecka</span>
          </div>
          <div className="forum-topic-list">
            {trendingTopics.map((topic) => (
              <div key={topic.name} className="forum-topic-item">
                <strong>{topic.name}</strong>
                <span>{topic.count}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="forum-card" id="forum-events">
          <div className="forum-card-heading">
            <h3>Kommande event</h3>
            <span>Narmast i natverket</span>
          </div>
          <div className="forum-event-list">
            {events.map((event) => (
              <div key={event.title} className="forum-event-item">
                <strong>{event.title}</strong>
                <span>{event.date}</span>
                <p>{event.attendees}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="forum-card forum-promo-card">
          <h3>Bygg ditt natverk</h3>
          <p>
            Publicera insikter, bjud in till diskussioner och hall forumet levande med korta,
            professionella uppdateringar.
          </p>
          <button type="button" className="btn primary">
            Skapa ny diskussion
          </button>
        </article>
      </aside>
      </section>
    </BrandPageShell>
  )
}

export default ForumPage
