import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import ForumPostCard from '../../components/forum/ForumPostCard'
import BrandPageShell from '../../components/ui/BrandPageShell'
import { db } from '../../lib/firebase'
import type { ForumPost } from '../../types/ForumPost'

const FeedPage = () => {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    const loadPosts = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, 'forumPosts'), orderBy('createdAt', 'desc')))
        const nextPosts = snapshot.docs.map((entry) => {
          const data = entry.data() as Omit<ForumPost, 'id'>
          return {
            id: entry.id,
            ...data,
          }
        })

        setPosts(nextPosts)
      } catch (error) {
        console.error('Failed to load feed posts', error)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  return (
    <BrandPageShell
      title="FLODE"
      subtitle="Inlagg fran forumet visas har, sa allt du publicerar i forumet hamnar ocksa i ditt flode."
      memberNav
    >
      {loading ? (
        <article className="brand-panel">
          <p>Laddar flodet...</p>
        </article>
      ) : posts.length > 0 ? (
        <section className="forum-feed-list">
          {posts.map((post) => (
            <ForumPostCard key={post.id} post={post} />
          ))}
        </section>
      ) : (
        <article className="brand-panel">
          <p>Inga inlagg an. Publicera ett inlagg i forumet sa visas det har.</p>
        </article>
      )}
    </BrandPageShell>
  )
}

export default FeedPage
