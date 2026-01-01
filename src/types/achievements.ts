export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'obsidian'
export type AchievementCategory = 'streak' | 'smart-cube' | 'cfop' | 'grind' | 'anomaly'

export interface AchievementTierConfig {
  tier: AchievementTier
  requirement: number
  xpReward: number
}

export interface AchievementDefinition {
  id: string
  name: string
  description: string
  category: AchievementCategory
  icon: string
  tiers: AchievementTierConfig[]
  trackingKey: string
  requiresSmartCube?: boolean
}

export interface UserAchievementProgress {
  id: string
  currentValue: number
  unlockedTiers: AchievementTier[]
  lastUnlockedAt?: string
}

export interface UserStreakData {
  currentStreak: number
  longestStreak: number
  lastSolveDate: string | null
  solvesToday: number
  streakMultiplier: number
}

export interface UserStats {
  totalSolves: number
  totalMoves: number
  totalRotationDegrees: number
  avgSolveTime: number | null
  bestSolveTime: number | null
  avgCross: number | null
  avgF2L: number | null
  avgOLL: number | null
  avgPLL: number | null
  avgMoves: number | null
  ollSkips: number
  pllSkips: number
  sub20With80Moves: number
  perfectMoveMatches: number
  godsNumberSolves: number
  fullStepSub15: number
  crossUnder8Moves: number
  f2lNoPause: number
  pllUnder4s: number
  pllUnder3s: number
  pllUnder2s: number
  pllUnder1_5s: number
  pllUnder1s: number
  tpsOver5Solves: number
}

export interface PrestigeData {
  stars: number
  permanentMultiplier: number
}

export function getLevelTitle(level: number, stars: number): string {
  if (stars > 0) return `★${stars} Prestige Master`
  if (level >= 50) return 'Grandmaster'
  if (level >= 11) return 'Speedcuber'
  return 'Novice Cuber'
}

export function getStreakMultiplier(streak: number): number {
  const bonus = Math.min(streak * 0.05, 0.5)
  return 1 + bonus
}

export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  diamond: '#B9F2FF',
  obsidian: '#3D3D3D',
}

export const TIER_ORDER: AchievementTier[] = ['bronze', 'silver', 'gold', 'diamond', 'obsidian']
