import type { Timestamp } from 'firebase/firestore'

export type DirectConversation = {
  id: string
  participants: string[]
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
  lastMessageAt?: Timestamp | null
  lastMessageText?: string
  lastMessageSenderUid?: string
}

export type ConversationMessage = {
  id: string
  senderUid: string
  body: string
  createdAt?: Timestamp | null
}
