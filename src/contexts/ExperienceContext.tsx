import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore'
import { db, isOfflineMode } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { calculateSolveXP, getLevelFromXP } from '@/lib/experience'

interface UserXPData {
  totalXP: number
  level: number
  currentXP: number
  xpForNextLevel: number
  progress: number
}

interface ExperienceContextType {
  totalXP: number
  loading: boolean
  recentXPGain: number | null
  addXP: (timeMs: number, isManual: boolean) => Promise<number>
  getXPData: () => UserXPData
  clearRecentXPGain: () => void
}

const ExperienceContext = createContext<ExperienceContextType | null>(null)

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [totalXP, setTotalXP] = useState(0)
  const [loading, setLoading] = useState(true)
  const [recentXPGain, setRecentXPGain] = useState<number | null>(null)
  const docInitialized = useRef(false)
  const pendingXPRef = useRef<{ timeMs: number; isManual: boolean; resolve: (xp: number) => void }[]>([])

  const isGuest = isOfflineMode || !user || !db

  const clearRecentXPGain = useCallback(() => {
    setRecentXPGain(null)
  }, [])

  useEffect(() => {
    if (isGuest) {
      setTotalXP(0)
      setLoading(false)
      docInitialized.current = false
      return
    }

    docInitialized.current = false
    const userDocRef = doc(db!, 'users', user!.uid)

    const initializeAndListen = async () => {
      try {
        const userDoc = await getDoc(userDocRef)
        if (!userDoc.exists()) {
          await setDoc(userDocRef, { 
            totalXP: 0,
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL || null,
          }, { merge: true })
        } else if (userDoc.data().totalXP === undefined) {
          await setDoc(userDocRef, { totalXP: 0 }, { merge: true })
        }
        docInitialized.current = true
      } catch (error) {
        console.error('Failed to initialize user doc:', error)
        docInitialized.current = true
      }
    }

    initializeAndListen()

    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setTotalXP(data.totalXP || 0)
        }
        setLoading(false)
      },
      (error) => {
        console.error('Failed to listen to XP updates:', error)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user, isGuest])

  useEffect(() => {
    if (!loading && !isGuest && pendingXPRef.current.length > 0) {
      const pending = [...pendingXPRef.current]
      pendingXPRef.current = []
      
      pending.forEach(async ({ timeMs, isManual, resolve }) => {
        const xpGained = calculateSolveXP(timeMs, isManual)
        try {
          const userDocRef = doc(db!, 'users', user!.uid)
          await updateDoc(userDocRef, { totalXP: increment(xpGained) })
          resolve(xpGained)
        } catch (error) {
          console.error('Failed to add pending XP:', error)
          resolve(0)
        }
      })
    }
  }, [loading, isGuest, user])

  const addXP = useCallback(
    async (timeMs: number, isManual: boolean): Promise<number> => {
      if (isGuest) {
        return 0
      }

      const xpGained = calculateSolveXP(timeMs, isManual)
      setRecentXPGain(xpGained)

      if (loading) {
        return new Promise((resolve) => {
          pendingXPRef.current.push({ timeMs, isManual, resolve })
        })
      }

      try {
        const userDocRef = doc(db!, 'users', user!.uid)
        
        const userDoc = await getDoc(userDocRef)
        if (!userDoc.exists()) {
          await setDoc(userDocRef, { 
            totalXP: xpGained,
            displayName: user!.displayName || 'Anonymous',
            photoURL: user!.photoURL || null,
          })
        } else {
          await updateDoc(userDocRef, { totalXP: increment(xpGained) })
        }
        
        return xpGained
      } catch (error) {
        console.error('Failed to add XP to Firestore:', error)
        return 0
      }
    },
    [user, isGuest, loading]
  )

  const getXPData = useCallback((): UserXPData => {
    const levelData = getLevelFromXP(totalXP)
    return {
      totalXP,
      ...levelData,
    }
  }, [totalXP])

  return (
    <ExperienceContext.Provider value={{ totalXP, loading, recentXPGain, addXP, getXPData, clearRecentXPGain }}>
      {children}
    </ExperienceContext.Provider>
  )
}

export function useExperience() {
  const context = useContext(ExperienceContext)
  if (!context) {
    throw new Error('useExperience must be used within ExperienceProvider')
  }
  return context
}
