import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import ForumPostCard from '../../components/forum/ForumPostCard'
import BrandPageShell from '../../components/ui/BrandPageShell'
import { db } from '../../lib/firebase'
import type { ForumPost } from '../../types/ForumPost'

const FeedPage = () => {
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const dbClient = db

  useEffect(() => {
    if (!dbClient) {
      setLoading(false)
      return
    }

    const loadPosts = async () => {
      try {
        const snapshot = await getDocs(
          query(collection(dbClient, 'forumPosts'), orderBy('createdAt', 'desc')),
        )
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
  }, [dbClient])

  const handlePostDeleted = (postId: string) => {
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId))
  }

  return (
    <BrandPageShell
      title="FLÖDE"
      subtitle="Inlägg från forumet visas här, så allt du publicerar i forumet hamnar också i ditt flöde."
      memberNav
    >
      {loading ? (
        <article className="brand-panel">
          <p>Laddar flödet...</p>
        </article>
      ) : posts.length > 0 ? (
        <section className="forum-feed-list">
          {posts.map((post) => (
            <ForumPostCard key={post.id} post={post} onDeleted={handlePostDeleted} />
          ))}
        </section>
      ) : (
        <article className="brand-panel">
          <p>Inga inlägg än. Publicera ett inlägg i forumet så visas det här.</p>
        </article>
      )}
    </BrandPageShell>
  )
}

export default FeedPage
