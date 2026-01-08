import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { doc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db, isOfflineMode } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import {
  type CFOPGoals,
  type GoalCheckResult,
  type AverageGoalType,
  DEFAULT_GOALS,
  GOAL_PRESETS,
} from '@/types/goals'

const STORAGE_KEY = 'cube-cfop-goals'

interface GoalsContextType {
  goals: CFOPGoals
  preset: string | null
  totalTime: number | null
  averageGoalType: AverageGoalType
  loading: boolean
  setGoals: (goals: CFOPGoals, preset?: string | null, totalTime?: number | null, averageGoalType?: AverageGoalType) => Promise<void>
  applyPreset: (presetName: string) => Promise<void>
  checkPhaseGoal: (phase: keyof CFOPGoals, moves: number, time: number) => GoalCheckResult
  checkTotalTimeGoal: (time: number) => boolean
}

const GoalsContext = createContext<GoalsContextType | null>(null)

function loadLocalGoals(): { goals: CFOPGoals; preset: string | null; totalTime: number | null; averageGoalType: AverageGoalType } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { 
        goals: parsed.goals || DEFAULT_GOALS, 
        preset: parsed.preset || null,
        totalTime: parsed.totalTime ?? null,
        averageGoalType: parsed.averageGoalType || 'fixed',
      }
    }
  } catch {
    console.error('Failed to load goals from localStorage')
  }
  return { goals: DEFAULT_GOALS, preset: 'intermediate', totalTime: null, averageGoalType: 'fixed' }
}

function saveLocalGoals(goals: CFOPGoals, preset: string | null, totalTime: number | null, averageGoalType: AverageGoalType) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ goals, preset, totalTime, averageGoalType }))
  } catch {
    console.error('Failed to save goals to localStorage')
  }
}

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [goals, setGoalsState] = useState<CFOPGoals>(DEFAULT_GOALS)
  const [preset, setPreset] = useState<string | null>('intermediate')
  const [totalTime, setTotalTime] = useState<number | null>(null)
  const [averageGoalType, setAverageGoalType] = useState<AverageGoalType>('fixed')
  const [loading, setLoading] = useState(true)

  const isGuest = isOfflineMode || !user || !db

  useEffect(() => {
    if (isGuest) {
      const local = loadLocalGoals()
      setGoalsState(local.goals)
      setPreset(local.preset)
      setTotalTime(local.totalTime)
      setAverageGoalType(local.averageGoalType)
      setLoading(false)
      return
    }

    const userDocRef = doc(db!, 'users', user!.uid)

    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          if (data.cfopGoals) {
            setGoalsState(data.cfopGoals.goals || DEFAULT_GOALS)
            setPreset(data.cfopGoals.preset || null)
            setTotalTime(data.cfopGoals.totalTime ?? null)
            setAverageGoalType(data.cfopGoals.averageGoalType || 'fixed')
          }
        }
        setLoading(false)
      },
      (error) => {
        console.error('Error listening to goals:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, isGuest])

  const setGoals = useCallback(
    async (newGoals: CFOPGoals, newPreset: string | null = null, newTotalTime: number | null = null, newAverageGoalType: AverageGoalType = 'fixed') => {
      setGoalsState(newGoals)
      setPreset(newPreset)
      setTotalTime(newTotalTime)
      setAverageGoalType(newAverageGoalType)

      if (isGuest) {
        saveLocalGoals(newGoals, newPreset, newTotalTime, newAverageGoalType)
        return
      }

      try {
        const userDocRef = doc(db!, 'users', user!.uid)
        await updateDoc(userDocRef, {
          cfopGoals: { goals: newGoals, preset: newPreset, totalTime: newTotalTime, averageGoalType: newAverageGoalType },
        })
      } catch (error) {
        console.error('Failed to save goals to Firebase:', error)
        saveLocalGoals(newGoals, newPreset, newTotalTime, newAverageGoalType)
      }
    },
    [user, isGuest]
  )

  const applyPreset = useCallback(
    async (presetName: string) => {
      const presetGoals = GOAL_PRESETS[presetName]
      if (presetGoals) {
        await setGoals(presetGoals, presetName)
      }
    },
    [setGoals]
  )

  const checkPhaseGoal = useCallback(
    (phase: keyof CFOPGoals, moves: number, time: number): GoalCheckResult => {
      const goal = goals[phase]
      const movesMet = moves <= goal.moves
      const timeMet = time <= goal.time
      return {
        movesMet,
        timeMet,
        eitherMet: movesMet || timeMet,
      }
    },
    [goals]
  )

  const checkTotalTimeGoal = useCallback(
    (time: number): boolean => {
      if (totalTime === null) return false
      return time <= totalTime
    },
    [totalTime]
  )

  return (
    <GoalsContext.Provider
      value={{
        goals,
        preset,
        totalTime,
        averageGoalType,
        loading,
        setGoals,
        applyPreset,
        checkPhaseGoal,
        checkTotalTimeGoal,
      }}
    >
      {children}
    </GoalsContext.Provider>
  )
}

export function useGoals() {
  const context = useContext(GoalsContext)
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider')
  }
  return context
}
