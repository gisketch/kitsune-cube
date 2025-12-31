import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
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
  addXP: (timeMs: number, isManual: boolean) => Promise<number>
  getXPData: () => UserXPData
}

const ExperienceContext = createContext<ExperienceContextType | null>(null)

const STORAGE_KEY = 'cube-user-xp'

function loadLocalXP(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return parseInt(stored, 10) || 0
    }
  } catch {
    console.error('Failed to load XP from localStorage')
  }
  return 0
}

function saveLocalXP(xp: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(xp))
  } catch {
    console.error('Failed to save XP to localStorage')
  }
}

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [totalXP, setTotalXP] = useState(0)
  const [loading, setLoading] = useState(true)
  const docInitialized = useRef(false)

  useEffect(() => {
    if (!user) {
      setTotalXP(loadLocalXP())
      setLoading(false)
      docInitialized.current = false
      return
    }

    docInitialized.current = false
    const userDocRef = doc(db, 'users', user.uid)

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
  }, [user])

  useEffect(() => {
    if (!user && !loading) {
      saveLocalXP(totalXP)
    }
  }, [totalXP, user, loading])

  const addXP = useCallback(
    async (timeMs: number, isManual: boolean): Promise<number> => {
      const xpGained = calculateSolveXP(timeMs, isManual)

      if (!user) {
        setTotalXP((prev) => prev + xpGained)
        return xpGained
      }

      try {
        const userDocRef = doc(db, 'users', user.uid)
        
        const userDoc = await getDoc(userDocRef)
        if (!userDoc.exists()) {
          await setDoc(userDocRef, { 
            totalXP: xpGained,
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL || null,
          })
        } else {
          await updateDoc(userDocRef, { totalXP: increment(xpGained) })
        }
        
        return xpGained
      } catch (error) {
        console.error('Failed to add XP to Firestore:', error)
        setTotalXP((prev) => prev + xpGained)
        return xpGained
      }
    },
    [user]
  )

  const getXPData = useCallback((): UserXPData => {
    const levelData = getLevelFromXP(totalXP)
    return {
      totalXP,
      ...levelData,
    }
  }, [totalXP])

  return (
    <ExperienceContext.Provider value={{ totalXP, loading, addXP, getXPData }}>
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
