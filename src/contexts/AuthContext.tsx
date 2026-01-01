import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, googleProvider, isOfflineMode, isEmbeddedBrowser } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  isOffline: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(!isOfflineMode)

  useEffect(() => {
    if (isOfflineMode || !auth) {
      setLoading(false)
      return
    }

    getRedirectResult(auth).catch((error) => {
      console.error('Redirect sign-in error:', error)
    })

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    if (isOfflineMode || !auth || !googleProvider) {
      console.warn('Firebase not configured - running in offline mode')
      return
    }
    try {
      if (isEmbeddedBrowser()) {
        await signInWithRedirect(auth, googleProvider)
      } else {
        await signInWithPopup(auth, googleProvider)
      }
    } catch (error) {
      console.error('Failed to sign in with Google:', error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    if (isOfflineMode || !auth) {
      console.warn('Firebase not configured - running in offline mode')
      return
    }
    await signInWithEmailAndPassword(auth, email, password)
  }

  const registerWithEmail = async (email: string, password: string, displayName?: string) => {
    if (isOfflineMode || !auth) {
      console.warn('Firebase not configured - running in offline mode')
      return
    }
    const result = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName })
    }
  }

  const resetPassword = async (email: string) => {
    if (isOfflineMode || !auth) {
      console.warn('Firebase not configured - running in offline mode')
      return
    }
    await sendPasswordResetEmail(auth, email)
  }

  const logout = async () => {
    if (isOfflineMode || !auth) return
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Failed to sign out:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isOffline: isOfflineMode, 
      signInWithGoogle, 
      signInWithEmail,
      registerWithEmail,
      resetPassword,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
