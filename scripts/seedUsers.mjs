import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import * as dotenv from 'dotenv'
dotenv.config()

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const users = [
  {
    email: 'initium@test.com',
    password: 'Test1234!',
    fullName: 'Initium Testsson',
    role: 'initium',
    membershipPlan: 'initium',
    membershipStatus: 'active',
  },
  {
    email: 'ascensio@test.com',
    password: 'Test1234!',
    fullName: 'Ascensio Testsson',
    role: 'ascensio',
    membershipPlan: 'ascensio',
    membershipStatus: 'active',
  },
  {
    email: 'dominus@test.com',
    password: 'Test1234!',
    fullName: 'Dominus Testsson',
    role: 'dominus',
    membershipPlan: 'dominus',
    membershipStatus: 'active',
  },
  {
    email: 'admin@test.com',
    password: 'Test1234!',
    fullName: 'Admin Testsson',
    role: 'admin',
    membershipPlan: null,
    membershipStatus: 'active',
  },
]

for (const user of users) {
  try {
    const { user: created } = await createUserWithEmailAndPassword(auth, user.email, user.password)
    await setDoc(doc(db, 'users', created.uid), {
      uid: created.uid,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      membershipPlan: user.membershipPlan,
      membershipStatus: user.membershipStatus,
      onboardingComplete: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    console.log(`✅ Skapade: ${user.email}`)
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log(`⚠️  Finns redan: ${user.email}`)
    } else {
      console.error(`❌ Fel för ${user.email}:`, err.message)
    }
  }
}

console.log('\n✅ Klart! Logga in med lösenord: Test1234!')
process.exit(0)