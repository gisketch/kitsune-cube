import type { CFOPAnalysis } from './cfop-analyzer'
import type { MoveFrame } from '@/types'

export interface PhaseTiming {
  name: string
  recognitionTime: number
  executionTime: number
  totalDuration: number
  recognitionRatio: number
  moveCount: number
  startTime: number
  endTime: number
}

export interface CFOPTimingAnalysis {
  cross: PhaseTiming
  f2l: PhaseTiming[]
  oll: PhaseTiming
  pll: PhaseTiming
  aggregated: {
    cross: PhaseTiming
    f2l: PhaseTiming
    oll: PhaseTiming
    pll: PhaseTiming
  }
}

function createEmptyTiming(name: string): PhaseTiming {
  return {
    name,
    recognitionTime: 0,
    executionTime: 0,
    totalDuration: 0,
    recognitionRatio: 0,
    moveCount: 0,
    startTime: 0,
    endTime: 0,
  }
}

function calculateSinglePhaseTiming(
  name: string,
  moves: string[],
  moveTimings: MoveFrame[],
  startIdx: number,
  prevPhaseEndTime: number
): PhaseTiming {
  if (moves.length === 0) {
    return createEmptyTiming(name)
  }

  const endIdx = startIdx + moves.length - 1
  
  if (startIdx >= moveTimings.length) {
    return createEmptyTiming(name)
  }

  const phaseStartTime = moveTimings[startIdx]?.time ?? 0
  const phaseEndTime = moveTimings[Math.min(endIdx, moveTimings.length - 1)]?.time ?? phaseStartTime

  const recognitionTime = phaseStartTime - prevPhaseEndTime
  const executionTime = phaseEndTime - phaseStartTime
  const totalDuration = recognitionTime + executionTime

  const recognitionRatio = totalDuration > 0 ? recognitionTime / totalDuration : 0

  return {
    name,
    recognitionTime: Math.max(0, recognitionTime),
    executionTime: Math.max(0, executionTime),
    totalDuration: Math.max(0, totalDuration),
    recognitionRatio,
    moveCount: moves.length,
    startTime: phaseStartTime,
    endTime: phaseEndTime,
  }
}

export function calculatePhaseTimings(
  analysis: CFOPAnalysis,
  moveTimings: MoveFrame[]
): CFOPTimingAnalysis | null {
  if (moveTimings.length === 0) {
    return null
  }

  let currentIdx = 0
  let prevEndTime = 0

  const crossTiming = calculateSinglePhaseTiming(
    'Cross',
    analysis.cross.moves,
    moveTimings,
    currentIdx,
    0
  )
  crossTiming.recognitionTime = 0
  crossTiming.totalDuration = crossTiming.executionTime
  crossTiming.recognitionRatio = 0
  currentIdx += analysis.cross.moves.length
  prevEndTime = crossTiming.endTime

  const f2lTimings: PhaseTiming[] = []
  for (let i = 0; i < analysis.f2l.length; i++) {
    const slot = analysis.f2l[i]
    const slotTiming = calculateSinglePhaseTiming(
      `F2L ${i + 1}`,
      slot.moves,
      moveTimings,
      currentIdx,
      prevEndTime
    )
    f2lTimings.push(slotTiming)
    currentIdx += slot.moves.length
    if (slot.moves.length > 0) {
      prevEndTime = slotTiming.endTime
    }
  }

  const ollTiming = calculateSinglePhaseTiming(
    'OLL',
    analysis.oll.moves,
    moveTimings,
    currentIdx,
    prevEndTime
  )
  currentIdx += analysis.oll.moves.length
  if (analysis.oll.moves.length > 0) {
    prevEndTime = ollTiming.endTime
  }

  const pllTiming = calculateSinglePhaseTiming(
    'PLL',
    analysis.pll.moves,
    moveTimings,
    currentIdx,
    prevEndTime
  )

  const aggregatedF2l = aggregateF2LTimings(f2lTimings)

  return {
    cross: crossTiming,
    f2l: f2lTimings,
    oll: ollTiming,
    pll: pllTiming,
    aggregated: {
      cross: crossTiming,
      f2l: aggregatedF2l,
      oll: ollTiming,
      pll: pllTiming,
    },
  }
}

function aggregateF2LTimings(f2lTimings: PhaseTiming[]): PhaseTiming {
  const nonEmptySlots = f2lTimings.filter(t => t.moveCount > 0)
  
  if (nonEmptySlots.length === 0) {
    return createEmptyTiming('F2L')
  }

  const totalRecognition = f2lTimings.reduce((sum, t) => sum + t.recognitionTime, 0)
  const totalExecution = f2lTimings.reduce((sum, t) => sum + t.executionTime, 0)
  const totalDuration = totalRecognition + totalExecution
  const totalMoves = f2lTimings.reduce((sum, t) => sum + t.moveCount, 0)
  const startTime = nonEmptySlots[0]?.startTime ?? 0
  const endTime = nonEmptySlots[nonEmptySlots.length - 1]?.endTime ?? 0

  return {
    name: 'F2L',
    recognitionTime: totalRecognition,
    executionTime: totalExecution,
    totalDuration,
    recognitionRatio: totalDuration > 0 ? totalRecognition / totalDuration : 0,
    moveCount: totalMoves,
    startTime,
    endTime,
  }
}

export function getRecognitionRatio(timing: PhaseTiming | undefined): number {
  if (!timing || timing.totalDuration === 0) return 0
  return timing.recognitionRatio
}
