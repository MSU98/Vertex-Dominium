import { createContext, useContext } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import type { MembershipPlan, MembershipStatus, UserProfile, UserRole } from '../types/User'

export type AuthContextValue = {
  currentUser: FirebaseUser | null
  profile: UserProfile | null
  loading: boolean
  role: UserRole | null
  membershipStatus: MembershipStatus | null
  membershipPlan: MembershipPlan
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return ctx
}
