import { Timestamp } from 'firebase/firestore'

export type UserRole = 'initium' | 'ascensio' | 'dominus' | 'admin'
export type MembershipPlan = 'initium' | 'ascensio' | 'dominus' | null
export type MembershipStatus = 'pending' | 'active' | 'rejected' | 'inactive'

export interface UserProfile {
  uid: string
  email: string
  role: UserRole
  membershipPlan: MembershipPlan
  membershipStatus: MembershipStatus
  onboardingComplete: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  fullName?: string
  city?: string
  countryCity?: string
  title?: string
  interests?: string[]
  professionalInterests?: string
  phone?: string
  currentBusiness?: string
  industry?: string
  company?: string
  orgNumber?: string
  linkedin?: string
  professionalDescription?: string
  decisionMandate?: string
  businessEmail?: string
  termsAccepted?: boolean
  privacyPolicyAccepted?: boolean
  communicationConsent?: boolean
}

