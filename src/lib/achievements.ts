import type { AchievementDefinition } from '@/types/achievements'

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ============ GRIND ACHIEVEMENTS ============
  {
    id: 'centurion',
    name: 'The Centurion',
    description: 'Complete 100 solves',
    howToAchieve: 'Complete 100 cube solves (manual or smart cube). Just keep solving!',
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
    howToAchieve: 'Complete 1,000 cube solves. Dedication is key!',
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
    howToAchieve: 'Complete 10,000 cube solves. A true speedcubing milestone!',
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
    howToAchieve: 'Complete 100,000 cube solves. Legend status achieved!',
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
    howToAchieve: 'Accumulate moves across all your solves. Smart cube required for accurate tracking.',
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
    howToAchieve: 'Smart cube with gyro required. Total rotation degrees are tracked across all solves.',
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
    howToAchieve: 'Smart cube required. Complete the cross stage in 8 or fewer moves. Practice efficient cross solutions!',
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
    howToAchieve: 'Smart cube required. Complete all 4 F2L pairs without pausing more than 0.5 seconds between moves. Requires smooth lookahead!',
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
    howToAchieve: 'Smart cube required. Complete the PLL stage in under 4 seconds. Higher tiers require sub-3s, sub-2s, sub-1.5s, and sub-1s PLLs.',
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
    howToAchieve: 'Smart cube required. Complete a solve with an average of more than 5 turns per second. Speed is everything!',
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
    howToAchieve: 'Smart cube required. Get lucky with a solve where OLL is already solved after F2L. ~1/216 chance per solve.',
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
    howToAchieve: 'Smart cube required. Get lucky with a solve where PLL is already solved after OLL. ~1/72 chance per solve.',
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
    howToAchieve: 'Smart cube required. Complete a solve using 20 or fewer moves total. Extremely rare with standard CFOP - requires optimal solving or incredible luck!',
    category: 'cfop',
    icon: 'sparkles',
    trackingKey: 'godsNumberSolves',
    requiresSmartCube: true,
    tiers: [
      { tier: 'diamond', requirement: 1, xpReward: 5000 },
      { tier: 'obsidian', requirement: 10, xpReward: 25000 },
    ],
  },
  {
    id: 'full-step-master',
    name: 'Full Step Master',
    description: 'Get a Sub-15 solve with no skips',
    howToAchieve: 'Smart cube required. Complete a solve under 15 seconds without any OLL or PLL skips. Pure skill, no luck!',
    category: 'cfop',
    icon: 'medal',
    trackingKey: 'fullStepSub15',
    requiresSmartCube: true,
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
    howToAchieve: 'Get two consecutive solves with the exact same time (to the millisecond). Pure coincidence!',
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
    howToAchieve: 'Smart cube required. Complete a solve under 20 seconds while using more than 80 moves. High TPS with inefficient solutions!',
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
    howToAchieve: 'Complete at least 5 solves per day to maintain your streak. Missing a day resets your streak to zero!',
    category: 'streak',
    icon: 'flame',
    trackingKey: 'longestStreak',
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
