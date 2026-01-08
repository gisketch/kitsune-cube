import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const hasValidConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
)

export const isOfflineMode = !hasValidConfig

export function isEmbeddedBrowser(): boolean {
  const ua = navigator.userAgent.toLowerCase()
  return (
    ua.includes('bluefy') ||
    ua.includes('webview') ||
    ua.includes('wv') ||
    (ua.includes('iphone') && !ua.includes('safari')) ||
    (ua.includes('android') && ua.includes('version/'))
  )
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null
let googleProvider: GoogleAuthProvider | null = null

if (hasValidConfig) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)

  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  } catch {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    })
  }

  storage = getStorage(app)
  googleProvider = new GoogleAuthProvider()
}

export { auth, db, storage, googleProvider }
