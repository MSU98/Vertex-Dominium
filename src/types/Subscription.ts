import type { Timestamp } from 'firebase/firestore'

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired'

export interface Subscription {
  id: string
  userId: string
  planId: string
  status: SubscriptionStatus
  startDate: Timestamp
  endDate: Timestamp | null
  nextBillingDate: Timestamp
  createdAt: Timestamp
}