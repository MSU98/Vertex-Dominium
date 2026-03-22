import { Timestamp } from 'firebase/firestore'

export type UserRole = 'initium' | 'ascensio' | 'dominus' | 'admin' | null
export type MembershipPlan = 'initium' | 'ascensio' | 'dominus' | null
export type MembershipStatus = 'pending' | 'second pending' | 'active' | 'rejected' | 'inactive' | 'approved'
export interface UserProfile {
  uid: string
  email: string
  avatarUrl?: string
  companyLogoUrl?: string
  role: UserRole
  membershipPlan: MembershipPlan
  membershipStatus: MembershipStatus
  onboardingComplete: boolean
  secondOnboardingComplete?: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  fullName?: string
  city?: string
  countryCity?: string
  title?: string
  professionalHeadline?: string
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
  // Second onboarding for Dominus
  companySize?: string
  revenue?: string
  geographicReach?: string
  industryFocus?: string
  interestNetworking?: boolean
  interestMatchmaking?: boolean
  interestAdvisory?: boolean
}
