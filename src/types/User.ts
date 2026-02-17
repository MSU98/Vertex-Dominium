import { Timestamp } from 'firebase/firestore'

export type UserRole =
  | 'Initium'
  | 'Ascensio'
  | 'Dominus'
  | 'Admin'
  | 'Official'
  | 'Curated'

export type MembershipStatus = 'active' | 'inactive' | 'trial' | 'canceled' | 'pending'

export interface UserProfile {
  uid: string
  email: string
  role: UserRole
  membershipPlan?: string
  membershipStatus: MembershipStatus
  onboardingComplete: boolean
  createdAt?: Timestamp
}

