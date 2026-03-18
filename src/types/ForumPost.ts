import type { Timestamp } from 'firebase/firestore'

export interface ForumPost {
  id: string
  authorUid: string
  authorName: string
  authorRole: string
  authorAvatarUrl?: string
  topic: string
  title: string
  body: string
  audience: string
  likeCount: number
  commentCount: number
  repostCount: number
  createdAt?: Timestamp | null
}
