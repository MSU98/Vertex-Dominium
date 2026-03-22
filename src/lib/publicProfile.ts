import { doc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore'
import type { UserProfile } from '../types/User'

type PublicProfileField = keyof Pick<
  UserProfile,
  | 'email'
  | 'avatarUrl'
  | 'companyLogoUrl'
  | 'fullName'
  | 'city'
  | 'countryCity'
  | 'title'
  | 'professionalHeadline'
  | 'interests'
  | 'professionalInterests'
  | 'phone'
  | 'currentBusiness'
  | 'industry'
  | 'company'
  | 'orgNumber'
  | 'linkedin'
  | 'professionalDescription'
  | 'decisionMandate'
  | 'businessEmail'
>

const PUBLIC_PROFILE_FIELDS: PublicProfileField[] = [
  'email',
  'avatarUrl',
  'companyLogoUrl',
  'fullName',
  'city',
  'countryCity',
  'title',
  'professionalHeadline',
  'interests',
  'professionalInterests',
  'phone',
  'currentBusiness',
  'industry',
  'company',
  'orgNumber',
  'linkedin',
  'professionalDescription',
  'decisionMandate',
  'businessEmail',
]

export const upsertPublicProfile = async (
  dbClient: Firestore,
  uid: string,
  source: Partial<UserProfile> | Record<string, unknown>,
) => {
  const sourceRecord = source as Record<string, unknown>
  const payload: Record<string, unknown> = { uid, updatedAt: serverTimestamp() }

  for (const field of PUBLIC_PROFILE_FIELDS) {
    const value = sourceRecord[field as string]
    if (value !== undefined) {
      payload[field] = value
    }
  }

  await setDoc(doc(dbClient, 'publicProfiles', uid), payload, { merge: true })
}
