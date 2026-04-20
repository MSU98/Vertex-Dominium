import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { db } from '../../lib/firebase'
import { routes } from '../../routes/paths'
import type { ForumPost } from '../../types/ForumPost'

type ForumPostCardProps = {
  post: ForumPost
  onDeleted?: (postId: string) => void
}

type PostComment = {
  id: string
  uid: string
  authorName: string
  body: string
  createdAt?: Timestamp | null
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'VD'

const formatRelativeDate = (value?: ForumPost['createdAt']) => {
  if (!value) return 'Nu'

  const date = value.toDate()
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)))

  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)))
    return `${diffMinutes} min`
  }

  if (diffHours < 24) {
    return `${diffHours} h`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} d`
}

const ForumPostCard = ({ post, onDeleted }: ForumPostCardProps) => {
  const { currentUser, profile } = useAuth()
  const dbClient = db
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0)
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0)
  const [likedByMe, setLikedByMe] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const likeDocId = useMemo(() => {
    if (!currentUser) return ''
    return `${post.id}_${currentUser.uid}`
  }, [currentUser, post.id])

  const commentAuthorName = useMemo(() => {
    if (profile?.fullName?.trim()) return profile.fullName.trim()
    return profile?.email?.split('@')[0] ?? 'Medlem'
  }, [profile?.email, profile?.fullName])
  const canDeletePost = currentUser?.uid === post.authorUid || profile?.role === 'admin'

  useEffect(() => {
    if (!dbClient || !post.id) return undefined

    const likesQuery = query(collection(dbClient, 'forumPostLikes'), where('postId', '==', post.id))
    const unsubscribeLikes = onSnapshot(
      likesQuery,
      (snapshot) => {
        const nextCount = snapshot.size > 0 ? snapshot.size : (post.likeCount ?? 0)
        setLikeCount(nextCount)
        if (currentUser) {
          setLikedByMe(snapshot.docs.some((entry) => entry.data().uid === currentUser.uid))
        } else {
          setLikedByMe(false)
        }
      },
      (error) => console.error('Failed to watch likes', error),
    )

    const commentsQuery = query(
      collection(dbClient, 'forumPostComments'),
      where('postId', '==', post.id),
    )
    const unsubscribeComments = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const nextComments = snapshot.docs
          .map((entry) => {
            const data = entry.data() as Omit<PostComment, 'id'>
            return { id: entry.id, ...data }
          })
          .sort((left, right) => {
            const leftTime = left.createdAt?.toMillis() ?? 0
            const rightTime = right.createdAt?.toMillis() ?? 0
            return rightTime - leftTime
          })

        setComments(nextComments)
        const nextCount = nextComments.length > 0 ? nextComments.length : (post.commentCount ?? 0)
        setCommentCount(nextCount)
      },
      (error) => console.error('Failed to watch comments', error),
    )

    return () => {
      unsubscribeLikes()
      unsubscribeComments()
    }
  }, [currentUser, dbClient, post.commentCount, post.id, post.likeCount])

  const handleToggleLike = async () => {
    if (!dbClient || !currentUser || !likeDocId) return

    try {
      if (likedByMe) {
        await deleteDoc(doc(dbClient, 'forumPostLikes', likeDocId))
      } else {
        await setDoc(doc(dbClient, 'forumPostLikes', likeDocId), {
          postId: post.id,
          uid: currentUser.uid,
          createdAt: serverTimestamp(),
        })
      }
    } catch (error) {
      console.error('Failed to toggle like', error)
    }
  }

  const handleCommentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!dbClient || !currentUser || commentSubmitting) return

    const body = commentDraft.trim()
    if (!body) return

    setCommentSubmitting(true)
    setCommentError(null)
    try {
      await addDoc(collection(dbClient, 'forumPostComments'), {
        postId: post.id,
        uid: currentUser.uid,
        authorName: commentAuthorName,
        body,
        createdAt: serverTimestamp(),
      })
      setCommentDraft('')
    } catch (error) {
      console.error('Failed to add comment', error)
      setCommentError('Det gick inte att publicera kommentaren. FÃ¶rsÃ¶k igen.')
    } finally {
      setCommentSubmitting(false)
    }
  }

  const toggleComments = () => {
    setCommentsOpen((open) => !open)
  }

  const handleDeletePost = async () => {
    if (!dbClient || !post.id || !canDeletePost || deleteSubmitting) return

    setDeleteSubmitting(true)
    setDeleteError(null)

    try {
      await deleteDoc(doc(dbClient, 'forumPosts', post.id))
      onDeleted?.(post.id)
    } catch (error) {
      console.error('Failed to delete forum post', error)
      setDeleteError('Det gick inte att radera inlÃ¤gget. FÃ¶rsÃ¶k igen.')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <article className="forum-card forum-post-card">
      <header className="forum-post-header">
        {post.authorAvatarUrl ? (
          <img className="forum-post-avatar-image" src={post.authorAvatarUrl} alt={post.authorName} />
        ) : (
          <div className="forum-avatar forum-post-avatar">{getInitials(post.authorName)}</div>
        )}
        <div className="forum-post-meta">
          <strong>
            <Link className="forum-author-link" to={routes.profileView(post.authorUid)}>
              {post.authorName}
            </Link>
          </strong>
          <span>{post.authorRole}</span>
          <span>
            {formatRelativeDate(post.createdAt)} / {post.audience}
          </span>
        </div>
      </header>

      <div className="forum-post-tag">{post.topic}</div>
      <h3>{post.title}</h3>
      <p>{post.body}</p>

      <div className="forum-post-insights">
        <span>{likeCount} reaktioner</span>
        <button type="button" className="forum-comments-toggle-link" onClick={toggleComments}>
          {commentCount} kommentarer
        </button>
      </div>

      <div className="forum-post-actions">
        <button type="button" className={likedByMe ? 'active' : ''} onClick={handleToggleLike}>
          {likedByMe ? 'Gillad' : 'Gilla'}
        </button>
        <button type="button" className={commentsOpen ? 'active' : ''} onClick={toggleComments}>
          {commentsOpen ? 'DÃ¶lj kommentarer' : 'Kommentarer'}
        </button>
        {canDeletePost && (
          <button
            type="button"
            onClick={() => {
              setConfirmingDelete(true)
              setDeleteError(null)
            }}
            disabled={deleteSubmitting}
          >
            Radera
          </button>
        )}
      </div>
      {deleteError && <p className="error">{deleteError}</p>}

      {confirmingDelete && (
        <div className="forum-delete-modal" role="dialog" aria-modal="true">
          <div className="forum-delete-modal-card">
            <p>Vill du radera detta inlägg?</p>
            <div className="forum-delete-modal-actions">
              <button
                type="button"
                className="forum-delete-confirm"
                onClick={handleDeletePost}
                disabled={deleteSubmitting}
              >
                {deleteSubmitting ? 'Raderar...' : 'Ja'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteSubmitting) return
                  setConfirmingDelete(false)
                  setDeleteError(null)
                }}
                disabled={deleteSubmitting}
              >
                Nej
              </button>
            </div>
          </div>
        </div>
      )}

      {commentsOpen && (
        <section className="forum-comments">
          <form className="forum-comment-form" onSubmit={handleCommentSubmit}>
            <input
              type="text"
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Skriv en kommentar..."
              maxLength={500}
            />
            <button type="submit" disabled={commentSubmitting || !commentDraft.trim()}>
              {commentSubmitting ? 'Skickar...' : 'Publicera'}
            </button>
          </form>
          {commentError && <p className="error">{commentError}</p>}

          {comments.length > 0 ? (
            <div className="forum-comment-list">
              {comments.map((comment) => (
                <article key={comment.id} className="forum-comment-item">
                  <strong>
                    <Link className="forum-comment-author-link" to={routes.profileView(comment.uid)}>
                      {comment.authorName}
                    </Link>
                  </strong>
                  <p>{comment.body}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">Inga kommentarer Ã¤n.</p>
          )}
        </section>
      )}
    </article>
  )
}

export default ForumPostCard


