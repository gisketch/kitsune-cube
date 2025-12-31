const BASE_XP = 10
const TIME_THRESHOLDS = [
  { maxMs: 10 * 1000, multiplier: 5 },
  { maxMs: 15 * 1000, multiplier: 4 },
  { maxMs: 20 * 1000, multiplier: 3 },
  { maxMs: 30 * 1000, multiplier: 2 },
  { maxMs: 60 * 1000, multiplier: 1.5 },
] as const

const MANUAL_MULTIPLIER = 0.5
const LEVEL_BASE = 100
const LEVEL_EXPONENT = 1.5

export function calculateSolveXP(timeMs: number, isManual: boolean): number {
  let multiplier = 1
  for (const threshold of TIME_THRESHOLDS) {
    if (timeMs <= threshold.maxMs) {
      multiplier = threshold.multiplier
      break
    }
  }

  let xp = Math.round(BASE_XP * multiplier)
  if (isManual) {
    xp = Math.round(xp * MANUAL_MULTIPLIER)
  }

  return xp
}

export function getXPForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.floor(LEVEL_BASE * Math.pow(level - 1, LEVEL_EXPONENT))
}

export function getLevelFromXP(totalXP: number): { level: number; currentXP: number; xpForNextLevel: number; progress: number } {
  let level = 1
  while (getXPForLevel(level + 1) <= totalXP) {
    level++
  }

  const currentLevelXP = getXPForLevel(level)
  const nextLevelXP = getXPForLevel(level + 1)
  const currentXP = totalXP - currentLevelXP
  const xpForNextLevel = nextLevelXP - currentLevelXP
  const progress = xpForNextLevel > 0 ? currentXP / xpForNextLevel : 0

  return { level, currentXP, xpForNextLevel, progress }
}
