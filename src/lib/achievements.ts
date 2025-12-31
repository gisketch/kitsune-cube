import type { AchievementDefinition } from '@/types/achievements'

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ============ GRIND ACHIEVEMENTS ============
  {
    id: 'centurion',
    name: 'The Centurion',
    description: 'Complete 100 solves',
    category: 'grind',
    icon: 'hash',
    trackingKey: 'totalSolves',
    tiers: [
      { tier: 'bronze', requirement: 100, xpReward: 500 },
    ],
  },
  {
    id: 'millennial',
    name: 'The Millennial',
    description: 'Complete 1,000 solves',
    category: 'grind',
    icon: 'trophy',
    trackingKey: 'totalSolves',
    tiers: [
      { tier: 'silver', requirement: 1000, xpReward: 2500 },
    ],
  },
  {
    id: 'ten-thousand',
    name: 'The Ten Thousand',
    description: 'Complete 10,000 solves',
    category: 'grind',
    icon: 'crown',
    trackingKey: 'totalSolves',
    tiers: [
      { tier: 'gold', requirement: 10000, xpReward: 10000 },
    ],
  },
  {
    id: 'cube-voyager',
    name: 'Cube Voyager',
    description: 'Complete 100,000 solves',
    category: 'grind',
    icon: 'rocket',
    trackingKey: 'totalSolves',
    tiers: [
      { tier: 'obsidian', requirement: 100000, xpReward: 100000 },
    ],
  },
  {
    id: 'finger-gymnastics',
    name: 'Finger Gymnastics',
    description: 'Execute 1,000,000 total moves',
    category: 'grind',
    icon: 'dumbbell',
    trackingKey: 'totalMoves',
    tiers: [
      { tier: 'bronze', requirement: 10000, xpReward: 200 },
      { tier: 'silver', requirement: 100000, xpReward: 1000 },
      { tier: 'gold', requirement: 500000, xpReward: 5000 },
      { tier: 'diamond', requirement: 1000000, xpReward: 25000 },
    ],
  },
  {
    id: 'marathon-hand',
    name: 'Marathon Hand',
    description: 'Rotate the cube a marathon distance (42,195 degrees)',
    category: 'grind',
    icon: 'footprints',
    trackingKey: 'totalRotationDegrees',
    requiresSmartCube: true,
    tiers: [
      { tier: 'bronze', requirement: 10000, xpReward: 300 },
      { tier: 'silver', requirement: 42195, xpReward: 2000 },
      { tier: 'gold', requirement: 100000, xpReward: 5000 },
    ],
  },

  // ============ SMART CUBE ACHIEVEMENTS ============
  {
    id: 'sniper-cross',
    name: 'The Sniper',
    description: 'Solve the Cross in exactly 8 moves or less',
    category: 'smart-cube',
    icon: 'crosshair',
    trackingKey: 'crossUnder8Moves',
    requiresSmartCube: true,
    tiers: [
      { tier: 'bronze', requirement: 5, xpReward: 100 },
      { tier: 'silver', requirement: 50, xpReward: 500 },
      { tier: 'gold', requirement: 500, xpReward: 2500 },
      { tier: 'diamond', requirement: 1000, xpReward: 5000 },
    ],
  },
  {
    id: 'f2l-flow',
    name: 'F2L Flow',
    description: 'Complete F2L with no pause longer than 0.5s between pairs',
    category: 'smart-cube',
    icon: 'waves',
    trackingKey: 'f2lNoPause',
    requiresSmartCube: true,
    tiers: [
      { tier: 'bronze', requirement: 10, xpReward: 200 },
      { tier: 'silver', requirement: 50, xpReward: 1000 },
      { tier: 'gold', requirement: 200, xpReward: 3000 },
      { tier: 'diamond', requirement: 500, xpReward: 7500 },
    ],
  },
  {
    id: 'pll-powerhouse',
    name: 'PLL Powerhouse',
    description: 'Execute PLL in record time',
    category: 'smart-cube',
    icon: 'zap',
    trackingKey: 'pllUnder4s',
    requiresSmartCube: true,
    tiers: [
      { tier: 'bronze', requirement: 50, xpReward: 200 },
      { tier: 'silver', requirement: 100, xpReward: 500 },
      { tier: 'gold', requirement: 200, xpReward: 1500 },
      { tier: 'diamond', requirement: 500, xpReward: 4000 },
      { tier: 'obsidian', requirement: 100, xpReward: 10000 },
    ],
  },
  {
    id: 'tps-beast',
    name: 'TPS Beast',
    description: 'Maintain > 5 TPS for an entire solve',
    category: 'smart-cube',
    icon: 'gauge',
    trackingKey: 'tpsOver5Solves',
    requiresSmartCube: true,
    tiers: [
      { tier: 'bronze', requirement: 1, xpReward: 500 },
      { tier: 'silver', requirement: 10, xpReward: 2000 },
      { tier: 'gold', requirement: 50, xpReward: 5000 },
      { tier: 'diamond', requirement: 200, xpReward: 15000 },
    ],
  },

  // ============ CFOP ACHIEVEMENTS ============
  {
    id: 'oll-skip-hunter',
    name: 'OLL Skip Hunter',
    description: 'Encounter an OLL skip',
    category: 'cfop',
    icon: 'clover',
    trackingKey: 'ollSkips',
    tiers: [
      { tier: 'bronze', requirement: 1, xpReward: 50 },
      { tier: 'silver', requirement: 10, xpReward: 300 },
      { tier: 'gold', requirement: 50, xpReward: 1500 },
    ],
  },
  {
    id: 'pll-skip-hunter',
    name: 'PLL Skip Hunter',
    description: 'Encounter a PLL skip',
    category: 'cfop',
    icon: 'dices',
    trackingKey: 'pllSkips',
    tiers: [
      { tier: 'bronze', requirement: 1, xpReward: 75 },
      { tier: 'silver', requirement: 10, xpReward: 400 },
      { tier: 'gold', requirement: 50, xpReward: 2000 },
    ],
  },
  {
    id: 'gods-number',
    name: "God's Number",
    description: 'Finish a solve in exactly 20 moves or less',
    category: 'cfop',
    icon: 'sparkles',
    trackingKey: 'godsNumberSolves',
    tiers: [
      { tier: 'diamond', requirement: 1, xpReward: 5000 },
      { tier: 'obsidian', requirement: 10, xpReward: 25000 },
    ],
  },
  {
    id: 'full-step-master',
    name: 'Full Step Master',
    description: 'Get a Sub-15 PB on a solve with no skips',
    category: 'cfop',
    icon: 'medal',
    trackingKey: 'fullStepSub15',
    tiers: [
      { tier: 'gold', requirement: 1, xpReward: 3000 },
      { tier: 'diamond', requirement: 10, xpReward: 10000 },
    ],
  },

  // ============ ANOMALY ACHIEVEMENTS ============
  {
    id: 'the-glitch',
    name: 'The Glitch',
    description: 'Get a solve time matching your previous solve exactly',
    category: 'anomaly',
    icon: 'bug',
    trackingKey: 'perfectMoveMatches',
    tiers: [
      { tier: 'gold', requirement: 1, xpReward: 1000 },
    ],
  },
  {
    id: 'inefficient-genius',
    name: 'Inefficient Genius',
    description: 'Get a sub-20s solve using more than 80 moves',
    category: 'anomaly',
    icon: 'brain',
    requiresSmartCube: true,
    trackingKey: 'sub20With80Moves',
    tiers: [
      { tier: 'gold', requirement: 1, xpReward: 2000 },
      { tier: 'diamond', requirement: 5, xpReward: 5000 },
    ],
  },

  // ============ STREAK ACHIEVEMENTS ============
  {
    id: 'streak-starter',
    name: 'Streak Starter',
    description: 'Maintain a daily solve streak',
    category: 'streak',
    icon: 'flame',
    trackingKey: 'currentStreak',
    tiers: [
      { tier: 'bronze', requirement: 3, xpReward: 100 },
      { tier: 'silver', requirement: 7, xpReward: 350 },
      { tier: 'gold', requirement: 30, xpReward: 2000 },
      { tier: 'diamond', requirement: 100, xpReward: 10000 },
      { tier: 'obsidian', requirement: 365, xpReward: 50000 },
    ],
  },
]

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map(a => [a.id, a]))

export function getAchievementById(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_MAP.get(id)
}

export function getAchievementsByCategory(category: string): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(a => a.category === category)
}
