import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db, firebaseReady } from '../lib/firebase'
import type { UserProfile } from '../types/User'
import { AuthContext } from './auth-context'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const authClient = auth
    const dbClient = db

    if (!firebaseReady || !authClient || !dbClient) {
      setLoading(false)
      return
    }

    // Listen for auth changes and hydrate Firestore profile.
    const unsubscribe = onAuthStateChanged(authClient, async (user) => {
      setCurrentUser(user)

      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        const userDoc = await getDoc(doc(dbClient, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile
          setProfile({ ...data, uid: user.uid })
        } else {
          setProfile(null)
        }
      } catch (error) {
        console.error('Failed to fetch user profile', error)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const value = useMemo(
    () => ({
      currentUser,
      profile,
      loading,
      role: profile?.role ?? null,
      membershipStatus: profile?.membershipStatus ?? null,
      membershipPlan: profile?.membershipPlan ?? null,
    }),
    [currentUser, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
