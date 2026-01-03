import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  type ReactNode,
} from 'react'
import { useTimer } from '@/hooks/useTimer'
import { useManualTimer } from '@/hooks/useManualTimer'
import { useGyroRecorder } from '@/hooks/useGyroRecorder'
import { useSolves } from '@/hooks/useSolves'
import { useExperience } from '@/contexts/ExperienceContext'
import { useAchievements } from '@/contexts/AchievementsContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useSettings } from '@/hooks/useSettings'
import { analyzeCFOP, type CFOPAnalysis } from '@/lib/cfop-analyzer'
import type { CubeFaces } from '@/lib/cube-faces'
import type { GyroFrame, MoveFrame } from '@/types'

interface SolveSessionState {
  scramble: string
  isRepeatedScramble: boolean
  solveSaved: boolean
  lastSolveTime: number
  lastMoveCount: number
  lastScramble: string
  lastAnalysis: CFOPAnalysis | null
}

interface SolveSessionContextValue {
  timer: ReturnType<typeof useTimer>
  manualTimer: ReturnType<typeof useManualTimer>
  gyroRecorder: ReturnType<typeof useGyroRecorder>

  scramble: string
  isRepeatedScramble: boolean
  solveSaved: boolean
  lastSolveTime: number
  lastMoveCount: number
  lastScramble: string
  lastAnalysis: CFOPAnalysis | null

  manualTimerEnabled: boolean
  setManualTimerEnabled: (enabled: boolean) => void

  setScramble: (scramble: string) => void
  setRepeatedScramble: (repeated: boolean) => void
  markSolveSaved: () => void
  resetSolveSession: () => void

  saveSolve: (params: {
    time: number
    scramble: string
    solution: string[]
    states?: CubeFaces[]
    isManual?: boolean
    gyroData?: GyroFrame[]
    moveTimings?: MoveFrame[]
  }) => void

  scrambleTrigger: number
  triggerNewScramble: () => void
}

const SolveSessionContext = createContext<SolveSessionContextValue | null>(null)

export function SolveSessionProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()

  const [state, setState] = useState<SolveSessionState>({
    scramble: '',
    isRepeatedScramble: false,
    solveSaved: false,
    lastSolveTime: 0,
    lastMoveCount: 0,
    lastScramble: '',
    lastAnalysis: null,
  })

  const [manualTimerEnabled, setManualTimerEnabled] = useState(false)
  const [scrambleTrigger, setScrambleTrigger] = useState(0)

  const triggerNewScramble = useCallback(() => {
    setScrambleTrigger((n) => n + 1)
  }, [])

  const triggerNewScrambleRef = useRef(triggerNewScramble)
  useEffect(() => {
    triggerNewScrambleRef.current = triggerNewScramble
  }, [triggerNewScramble])

  const timer = useTimer({
    inspectionTime: settings.inspectionTime,
    customInspectionTime: settings.customInspectionTime,
  })
  const manualTimer = useManualTimer({
    enabled: manualTimerEnabled,
    onNextScramble: () => triggerNewScrambleRef.current(),
    inspectionTime: settings.inspectionTime,
    customInspectionTime: settings.customInspectionTime,
    holdThreshold: settings.holdThreshold,
  })
  const gyroRecorder = useGyroRecorder()
  const { addSolve, solves } = useSolves()
  const { addXP } = useExperience()
  const { recordSolve, checkAndUpdateAchievements, stats: userStats } = useAchievements()
  const { showAchievement, showPersonalBest } = useNotifications()

  const setScramble = useCallback((scramble: string) => {
    setState((prev) => ({ ...prev, scramble, solveSaved: false }))
  }, [])

  const setRepeatedScramble = useCallback((repeated: boolean) => {
    setState((prev) => ({ ...prev, isRepeatedScramble: repeated }))
  }, [])

  const markSolveSaved = useCallback(() => {
    setState((prev) => ({ ...prev, solveSaved: true }))
  }, [])

  const resetSolveSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      solveSaved: false,
      lastSolveTime: 0,
      lastMoveCount: 0,
      lastAnalysis: null,
    }))
    timer.reset()
    manualTimer.reset()
  }, [timer, manualTimer])

  const saveSolve = useCallback(
    ({
      time,
      scramble,
      solution,
      states,
      isManual = false,
      gyroData,
      moveTimings,
    }: {
      time: number
      scramble: string
      solution: string[]
      states?: CubeFaces[]
      isManual?: boolean
      gyroData?: GyroFrame[]
      moveTimings?: MoveFrame[]
    }) => {
      if (state.solveSaved) return

      setState((prev) => ({
        ...prev,
        solveSaved: true,
        lastSolveTime: time,
        lastMoveCount: solution.length,
        lastScramble: scramble,
      }))

      let analysis: CFOPAnalysis | null = null
      if (!isManual && solution.length > 0 && states && states.length > 0) {
        analysis = analyzeCFOP(solution, states)
        setState((prev) => ({ ...prev, lastAnalysis: analysis }))
      }

      const validSolves = solves.filter(s => !s.dnf && !s.isRepeatedScramble)
      const currentBest = validSolves.length > 0 
        ? Math.min(...validSolves.map(s => s.time))
        : null

      if (!state.isRepeatedScramble && currentBest !== null && time < currentBest) {
        showPersonalBest(time, currentBest)
      }

      addSolve({
        time,
        scramble,
        solution,
        cfopAnalysis: analysis || undefined,
        gyroData: gyroData && gyroData.length > 0 ? gyroData : undefined,
        moveTimings: moveTimings && moveTimings.length > 0 ? moveTimings : undefined,
        isManual,
        ...(state.isRepeatedScramble && { isRepeatedScramble: true }),
      })

      if (!state.isRepeatedScramble) {
        addXP(time, isManual)
        recordSolve()

        const newTotalSolves = userStats.totalSolves + 1
        const currentAvg = userStats.avgSolveTime ?? 0
        const newAvgSolveTime = currentAvg > 0 
          ? Math.round((currentAvg * userStats.totalSolves + time) / newTotalSolves)
          : time
        const currentBestTime = userStats.bestSolveTime ?? Infinity
        const newBestSolveTime = Math.min(currentBestTime === Infinity ? time : currentBestTime, time)

        const statsUpdate: Record<string, number> = {
          totalSolves: newTotalSolves,
          totalMoves: userStats.totalMoves + solution.length,
          avgSolveTime: newAvgSolveTime,
          bestSolveTime: newBestSolveTime,
        }

        if (!isManual) {
          const verifiedTotal = (userStats.verifiedTotalSolves ?? 0) + 1
          const currentVerifiedAvg = userStats.verifiedAvgSolveTime ?? 0
          statsUpdate.verifiedTotalSolves = verifiedTotal
          statsUpdate.verifiedAvgSolveTime = currentVerifiedAvg > 0
            ? Math.round((currentVerifiedAvg * (verifiedTotal - 1) + time) / verifiedTotal)
            : time
          const currentVerifiedBest = userStats.verifiedBestSolveTime ?? Infinity
          statsUpdate.verifiedBestSolveTime = Math.min(
            currentVerifiedBest === Infinity ? time : currentVerifiedBest,
            time
          )
        }

        if (analysis) {
          if (analysis.oll.skipped) statsUpdate.ollSkips = userStats.ollSkips + 1
          if (analysis.pll.skipped) statsUpdate.pllSkips = userStats.pllSkips + 1
          if (analysis.cross.moves.length <= 8)
            statsUpdate.crossUnder8Moves = userStats.crossUnder8Moves + 1

          const crossMoves = analysis.cross.moves.length
          const f2lMoves = analysis.f2l.reduce((sum, slot) => sum + slot.moves.length, 0)
          const ollMoves = analysis.oll.moves.length
          const pllMoves = analysis.pll.moves.length
          const totalPhaseMoves = crossMoves + f2lMoves + ollMoves + pllMoves
          const pllTime = totalPhaseMoves > 0 ? (pllMoves / totalPhaseMoves) * time : 0
          if (pllTime && pllTime < 4000) {
            statsUpdate.pllUnder4s = userStats.pllUnder4s + 1
            if (pllTime < 3000) statsUpdate.pllUnder3s = userStats.pllUnder3s + 1
            if (pllTime < 2000) statsUpdate.pllUnder2s = userStats.pllUnder2s + 1
            if (pllTime < 1500) statsUpdate.pllUnder1_5s = userStats.pllUnder1_5s + 1
            if (pllTime < 1000) statsUpdate.pllUnder1s = userStats.pllUnder1s + 1
          }

          const hasNoSkips = !analysis.oll.skipped && !analysis.pll.skipped
          if (hasNoSkips && time < 15000) {
            statsUpdate.fullStepSub15 = userStats.fullStepSub15 + 1
          }
        }

        if (!isManual && solution.length > 0) {
          const tps = solution.length / (time / 1000)
          if (tps > 5) {
            statsUpdate.tpsOver5Solves = userStats.tpsOver5Solves + 1
          }
          statsUpdate.totalRotationDegrees = userStats.totalRotationDegrees + solution.length
        }

        const prevSolve = solves[0]
        if (prevSolve && !prevSolve.dnf && prevSolve.time === time) {
          statsUpdate.perfectMoveMatches = userStats.perfectMoveMatches + 1
        }

        if (!isManual && solution.length > 0 && solution.length <= 20)
          statsUpdate.godsNumberSolves = userStats.godsNumberSolves + 1
        if (!isManual && time < 20000 && solution.length > 80)
          statsUpdate.sub20With80Moves = userStats.sub20With80Moves + 1

        checkAndUpdateAchievements(statsUpdate).then(unlocks => {
          unlocks.forEach(unlock => {
            showAchievement(unlock.achievementId, unlock.tier)
          })
        })
      }
    },
    [
      state.solveSaved,
      state.isRepeatedScramble,
      solves,
      addSolve,
      addXP,
      recordSolve,
      checkAndUpdateAchievements,
      showAchievement,
      showPersonalBest,
      userStats,
    ],
  )

  const value = useMemo<SolveSessionContextValue>(
    () => ({
      timer,
      manualTimer,
      gyroRecorder,

      scramble: state.scramble,
      isRepeatedScramble: state.isRepeatedScramble,
      solveSaved: state.solveSaved,
      lastSolveTime: state.lastSolveTime,
      lastMoveCount: state.lastMoveCount,
      lastScramble: state.lastScramble,
      lastAnalysis: state.lastAnalysis,

      manualTimerEnabled,
      setManualTimerEnabled,

      setScramble,
      setRepeatedScramble,
      markSolveSaved,
      resetSolveSession,
      saveSolve,

      scrambleTrigger,
      triggerNewScramble,
    }),
    [
      timer,
      manualTimer,
      gyroRecorder,
      state,
      manualTimerEnabled,
      setScramble,
      setRepeatedScramble,
      markSolveSaved,
      resetSolveSession,
      saveSolve,
      scrambleTrigger,
      triggerNewScramble,
    ],
  )

  return (
    <SolveSessionContext.Provider value={value}>{children}</SolveSessionContext.Provider>
  )
}

export function useSolveSession() {
  const context = useContext(SolveSessionContext)
  if (!context) {
    throw new Error('useSolveSession must be used within a SolveSessionProvider')
  }
  return context
}
