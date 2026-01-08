import type { Solve } from '@/types'
import type { CFOPGoals, AverageGoalType } from '@/types/goals'

export interface DynamicGoalData {
  time: number
  moves: number
}

export interface ComputedDynamicGoals {
  cross: DynamicGoalData | null
  f2l: DynamicGoalData | null
  oll: DynamicGoalData | null
  pll: DynamicGoalData | null
  totalTime: number | null
}

export function computeDynamicGoals(
  solves: Solve[],
  averageGoalType: AverageGoalType
): ComputedDynamicGoals | null {
  if (averageGoalType === 'fixed') return null

  const avgCount = parseInt(averageGoalType.replace('ao', ''), 10)
  const validSolves = solves.filter(s => !s.dnf && s.cfopAnalysis && s.moveTimings?.length)

  if (validSolves.length < avgCount) return null

  const recentSolves = validSolves.slice(0, avgCount)
  const sorted = [...recentSolves].sort((a, b) => a.time - b.time)
  const trimmed = sorted.slice(1, -1)

  if (trimmed.length === 0) return null

  const calcPhaseAvg = (phase: 'cross' | 'f2l' | 'oll' | 'pll'): DynamicGoalData | null => {
    const phaseTimes: number[] = []
    const phaseMoves: number[] = []

    for (const s of trimmed) {
      if (!s.cfopAnalysis || !s.moveTimings?.length) continue
      const a = s.cfopAnalysis
      const timings = s.moveTimings

      const crossMoveCount = a.cross.moves.length
      const f2lMoveCount = a.f2l.reduce((sum, slot) => sum + slot.moves.length, 0)
      const ollMoveCount = a.oll.moves.length
      const pllMoveCount = a.pll.moves.length

      const getTimeAtIndex = (idx: number): number => {
        if (idx < 0) return 0
        if (idx >= timings.length) return s.time
        return timings[idx].time
      }

      if (phase === 'cross') {
        if (crossMoveCount === 0) continue
        phaseMoves.push(crossMoveCount)
        phaseTimes.push(getTimeAtIndex(crossMoveCount - 1))
      } else if (phase === 'f2l') {
        if (f2lMoveCount === 0) continue
        phaseMoves.push(f2lMoveCount)
        const crossEndTime = getTimeAtIndex(crossMoveCount - 1)
        const f2lEndTime = getTimeAtIndex(crossMoveCount + f2lMoveCount - 1)
        phaseTimes.push(Math.max(0, f2lEndTime - crossEndTime))
      } else if (phase === 'oll') {
        if (ollMoveCount === 0) continue
        phaseMoves.push(ollMoveCount)
        const f2lEndTime = getTimeAtIndex(crossMoveCount + f2lMoveCount - 1)
        const ollEndTime = getTimeAtIndex(crossMoveCount + f2lMoveCount + ollMoveCount - 1)
        phaseTimes.push(Math.max(0, ollEndTime - f2lEndTime))
      } else {
        if (pllMoveCount === 0) continue
        phaseMoves.push(pllMoveCount)
        const ollEndTime = getTimeAtIndex(crossMoveCount + f2lMoveCount + ollMoveCount - 1)
        const pllEndTime = getTimeAtIndex(crossMoveCount + f2lMoveCount + ollMoveCount + pllMoveCount - 1)
        phaseTimes.push(Math.max(0, pllEndTime - ollEndTime))
      }
    }

    if (phaseTimes.length === 0) return null
    const avgTime = phaseTimes.reduce((a, b) => a + b, 0) / phaseTimes.length
    const avgMoves = Math.round(phaseMoves.reduce((a, b) => a + b, 0) / phaseMoves.length)
    return { time: avgTime, moves: avgMoves }
  }

  const totalTimeAvg = trimmed.reduce((sum, s) => sum + s.time, 0) / trimmed.length

  return {
    cross: calcPhaseAvg('cross'),
    f2l: calcPhaseAvg('f2l'),
    oll: calcPhaseAvg('oll'),
    pll: calcPhaseAvg('pll'),
    totalTime: totalTimeAvg,
  }
}

export function getEffectiveGoals(
  fixedGoals: CFOPGoals,
  dynamicGoals: ComputedDynamicGoals | null
): CFOPGoals {
  if (!dynamicGoals) return fixedGoals

  return {
    cross: dynamicGoals.cross ?? fixedGoals.cross,
    f2l: dynamicGoals.f2l ?? fixedGoals.f2l,
    oll: dynamicGoals.oll ?? fixedGoals.oll,
    pll: dynamicGoals.pll ?? fixedGoals.pll,
  }
}

export function getEffectiveTotalTime(
  fixedTotalTime: number | null,
  dynamicGoals: ComputedDynamicGoals | null
): number | null {
  return dynamicGoals?.totalTime ?? fixedTotalTime
}
