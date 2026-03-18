import type { ForumPost } from '../../types/ForumPost'

type ForumPostCardProps = {
  post: ForumPost
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

const ForumPostCard = ({ post }: ForumPostCardProps) => (
  <article className="forum-card forum-post-card">
    <header className="forum-post-header">
      {post.authorAvatarUrl ? (
        <img className="forum-post-avatar-image" src={post.authorAvatarUrl} alt={post.authorName} />
      ) : (
        <div className="forum-avatar forum-post-avatar">{getInitials(post.authorName)}</div>
      )}
      <div className="forum-post-meta">
        <strong>{post.authorName}</strong>
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
      <span>{post.likeCount} reaktioner</span>
      <span>{post.commentCount} kommentarer</span>
      <span>{post.repostCount} delningar</span>
    </div>

    <div className="forum-post-actions">
      <button type="button">Gilla</button>
      <button type="button">Kommentera</button>
      <button type="button">Dela</button>
      <button type="button">Skicka</button>
    </div>
  </article>
)

export default ForumPostCard
