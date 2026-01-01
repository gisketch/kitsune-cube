import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db, isOfflineMode } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { ACHIEVEMENTS } from '@/lib/achievements'
import type {
  UserAchievementProgress,
  UserStreakData,
  UserStats,
  PrestigeData,
  AchievementTier,
} from '@/types/achievements'
import { getStreakMultiplier } from '@/types/achievements'

interface AchievementUnlock {
  achievementId: string
  tier: AchievementTier
  xpAwarded: number
}

interface AchievementsContextType {
  achievements: UserAchievementProgress[]
  stats: UserStats
  streak: UserStreakData
  prestige: PrestigeData
  loading: boolean
  checkAndUpdateAchievements: (newStats: Partial<UserStats>) => Promise<AchievementUnlock[]>
  recordSolve: () => Promise<void>
  getPrestigeMultiplier: () => number
}

const AchievementsContext = createContext<AchievementsContextType | null>(null)

const DEFAULT_STATS: UserStats = {
  totalSolves: 0,
  totalMoves: 0,
  totalRotationDegrees: 0,
  avgSolveTime: null,
  bestSolveTime: null,
  avgCross: null,
  avgF2L: null,
  avgOLL: null,
  avgPLL: null,
  avgMoves: null,
  ollSkips: 0,
  pllSkips: 0,
  sub20With80Moves: 0,
  perfectMoveMatches: 0,
  godsNumberSolves: 0,
  fullStepSub15: 0,
  crossUnder8Moves: 0,
  f2lNoPause: 0,
  pllUnder4s: 0,
  pllUnder3s: 0,
  pllUnder2s: 0,
  pllUnder1_5s: 0,
  pllUnder1s: 0,
  tpsOver5Solves: 0,
}

const DEFAULT_STREAK: UserStreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastSolveDate: null,
  solvesToday: 0,
  streakMultiplier: 1,
}

const DEFAULT_PRESTIGE: PrestigeData = {
  stars: 0,
  permanentMultiplier: 1,
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [achievements, setAchievements] = useState<UserAchievementProgress[]>([])
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS)
  const [streak, setStreak] = useState<UserStreakData>(DEFAULT_STREAK)
  const [prestige, setPrestige] = useState<PrestigeData>(DEFAULT_PRESTIGE)
  const [loading, setLoading] = useState(true)

  const isGuest = isOfflineMode || !user || !db

  useEffect(() => {
    if (isGuest) {
      setAchievements([])
      setStats(DEFAULT_STATS)
      setStreak(DEFAULT_STREAK)
      setPrestige(DEFAULT_PRESTIGE)
      setLoading(false)
      return
    }

    const userDocRef = doc(db!, 'users', user!.uid)

    const initializeDoc = async () => {
      try {
        const userDoc = await getDoc(userDocRef)
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            achievements: [],
            stats: DEFAULT_STATS,
            streak: DEFAULT_STREAK,
            prestige: DEFAULT_PRESTIGE,
          }, { merge: true })
        }
      } catch (error) {
        console.error('Failed to initialize achievements doc:', error)
      }
    }

    initializeDoc()

    const unsubscribe = onSnapshot(
      userDocRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          setAchievements(data.achievements || [])
          setStats({ ...DEFAULT_STATS, ...data.stats })
          setStreak({ ...DEFAULT_STREAK, ...data.streak })
          setPrestige({ ...DEFAULT_PRESTIGE, ...data.prestige })
        }
        setLoading(false)
      },
      (error) => {
        console.error('Failed to listen to achievements:', error)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [user, isGuest])

  const recordSolve = useCallback(async () => {
    if (isGuest) return

    const today = getTodayDateString()
    
    setStreak(prev => {
      const isNewDay = prev.lastSolveDate !== today
      const wasYesterday = prev.lastSolveDate === getYesterdayDateString()
      
      let newStreak = prev.currentStreak
      let solvesToday = prev.solvesToday

      if (isNewDay) {
        solvesToday = 1
        if (wasYesterday && prev.solvesToday >= 5) {
          newStreak = prev.currentStreak + 1
        } else if (!wasYesterday) {
          newStreak = prev.solvesToday >= 5 ? 1 : 0
        }
      } else {
        solvesToday = prev.solvesToday + 1
        if (solvesToday === 5 && prev.currentStreak === 0) {
          newStreak = 1
        }
      }

      const newData: UserStreakData = {
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        lastSolveDate: today,
        solvesToday,
        streakMultiplier: getStreakMultiplier(newStreak),
      }

      if (!isGuest) {
        const userDocRef = doc(db!, 'users', user!.uid)
        setDoc(userDocRef, { streak: newData }, { merge: true }).catch(console.error)
      }

      return newData
    })
  }, [user, isGuest])

  const checkAndUpdateAchievements = useCallback(
    async (newStats: Partial<UserStats>): Promise<AchievementUnlock[]> => {
      if (isGuest) return []

      const updatedStats = { ...stats, ...newStats }
      setStats(updatedStats)

      const unlocks: AchievementUnlock[] = []
      const updatedAchievements = [...achievements]

      for (const achievement of ACHIEVEMENTS) {
        const statValue = updatedStats[achievement.trackingKey as keyof UserStats]
        if (typeof statValue !== 'number') continue

        let progress = updatedAchievements.find(a => a.id === achievement.id)
        if (!progress) {
          progress = { id: achievement.id, currentValue: 0, unlockedTiers: [] }
          updatedAchievements.push(progress)
        }

        progress.currentValue = statValue

        for (const tierConfig of achievement.tiers) {
          if (
            statValue >= tierConfig.requirement &&
            !progress.unlockedTiers.includes(tierConfig.tier)
          ) {
            progress.unlockedTiers.push(tierConfig.tier)
            progress.lastUnlockedAt = new Date().toISOString()
            unlocks.push({
              achievementId: achievement.id,
              tier: tierConfig.tier,
              xpAwarded: tierConfig.xpReward,
            })
          }
        }
      }

      setAchievements(updatedAchievements)

      if (!isGuest) {
        const userDocRef = doc(db!, 'users', user!.uid)
        await setDoc(userDocRef, { 
          achievements: updatedAchievements, 
          stats: updatedStats 
        }, { merge: true })
      }

      return unlocks
    },
    [user, stats, achievements, isGuest]
  )

  const getPrestigeMultiplier = useCallback(() => {
    return prestige.permanentMultiplier * streak.streakMultiplier
  }, [prestige.permanentMultiplier, streak.streakMultiplier])

  return (
    <AchievementsContext.Provider
      value={{
        achievements,
        stats,
        streak,
        prestige,
        loading,
        checkAndUpdateAchievements,
        recordSolve,
        getPrestigeMultiplier,
      }}
    >
      {children}
    </AchievementsContext.Provider>
  )
}

function getYesterdayDateString(): string {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}

export function useAchievements() {
  const context = useContext(AchievementsContext)
  if (!context) {
    throw new Error('useAchievements must be used within AchievementsProvider')
  }
  return context
}
