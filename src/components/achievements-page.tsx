import { useMemo, useState } from 'react'
import { 
  Trophy, Star, Flame, Target, Cpu, Puzzle, Zap, 
  Hash, Crown, Rocket, Dumbbell, Footprints, Crosshair,
  Waves, Gauge, Clover, Dices, Sparkles, Medal, Bug, Brain, Gamepad2,
  type LucideIcon
} from 'lucide-react'
import { useAchievements } from '@/contexts/AchievementsContext'
import { useExperience } from '@/contexts/ExperienceContext'
import { ACHIEVEMENTS, getAchievementsByCategory } from '@/lib/achievements'
import {
  TIER_COLORS,
  TIER_ORDER,
  getLevelTitle,
  type AchievementTier,
  type AchievementCategory,
} from '@/types/achievements'

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  'hash': Hash,
  'trophy': Trophy,
  'crown': Crown,
  'rocket': Rocket,
  'dumbbell': Dumbbell,
  'footprints': Footprints,
  'crosshair': Crosshair,
  'waves': Waves,
  'zap': Zap,
  'gauge': Gauge,
  'clover': Clover,
  'dices': Dices,
  'sparkles': Sparkles,
  'medal': Medal,
  'bug': Bug,
  'brain': Brain,
  'flame': Flame,
}

const CATEGORY_INFO: Record<AchievementCategory, { label: string; icon: typeof Trophy; description: string }> = {
  streak: { label: 'Streak', icon: Flame, description: 'Daily consistency rewards' },
  'smart-cube': { label: 'Smart Cube', icon: Cpu, description: 'Requires connected smart cube' },
  cfop: { label: 'CFOP', icon: Puzzle, description: 'Method-specific achievements' },
  grind: { label: 'Grind', icon: Target, description: 'Lifetime statistics' },
  anomaly: { label: 'Anomaly', icon: Zap, description: 'Rare occurrences' },
}

const CATEGORY_ORDER: AchievementCategory[] = ['streak', 'grind', 'cfop', 'smart-cube', 'anomaly']

function TierBadge({ tier, unlocked, size = 'md' }: { tier: AchievementTier; unlocked: boolean; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'h-4 w-4 text-[8px]' : 'h-6 w-6 text-[10px]'
  
  return (
    <div
      className={`${sizeClasses} flex items-center justify-center rounded-full font-bold uppercase`}
      style={{
        backgroundColor: unlocked ? TIER_COLORS[tier] : 'var(--theme-subAlt)',
        color: unlocked ? (tier === 'gold' || tier === 'diamond' ? '#000' : '#fff') : 'var(--theme-sub)',
        opacity: unlocked ? 1 : 0.5,
      }}
    >
      {tier.charAt(0)}
    </div>
  )
}

function ProgressBar({ current, max, tiers, unlockedTiers }: { 
  current: number
  max: number
  tiers: { tier: AchievementTier; requirement: number }[]
  unlockedTiers: AchievementTier[]
}) {
  const percentage = Math.min((current / max) * 100, 100)
  
  return (
    <div className="relative">
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--theme-subAlt)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            backgroundColor: 'var(--theme-accent)',
            width: `${percentage}%`,
          }}
        />
      </div>
      <div className="absolute -top-1 left-0 right-0 flex justify-between">
        {tiers.map((t) => {
          const position = (t.requirement / max) * 100
          const isUnlocked = unlockedTiers.includes(t.tier)
          return (
            <div
              key={t.tier}
              className="absolute -translate-x-1/2"
              style={{ left: `${Math.min(position, 100)}%` }}
            >
              <div
                className="h-4 w-4 rounded-full border-2 flex items-center justify-center"
                style={{
                  backgroundColor: isUnlocked ? TIER_COLORS[t.tier] : 'var(--theme-bg)',
                  borderColor: isUnlocked ? TIER_COLORS[t.tier] : 'var(--theme-subAlt)',
                }}
              >
                {isUnlocked && <span className="text-[8px]">✓</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: typeof ACHIEVEMENTS[0] }) {
  const { achievements } = useAchievements()
  const progress = achievements.find(a => a.id === achievement.id)
  const currentValue = progress?.currentValue || 0
  const unlockedTiers = progress?.unlockedTiers || []
  const maxRequirement = Math.max(...achievement.tiers.map(t => t.requirement))
  const nextTier = achievement.tiers.find(t => !unlockedTiers.includes(t.tier))
  const isComplete = unlockedTiers.length === achievement.tiers.length
  const highestTier = TIER_ORDER.filter(t => unlockedTiers.includes(t)).pop()

  return (
    <div
      className="rounded-lg p-3 transition-all"
      style={{
        backgroundColor: 'var(--theme-bg)',
        border: isComplete 
          ? `2px solid ${TIER_COLORS[highestTier || 'bronze']}`
          : '1px solid var(--theme-subAlt)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
        >
          {(() => {
            const IconComponent = ACHIEVEMENT_ICONS[achievement.icon]
            return IconComponent ? <IconComponent className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} /> : null
          })()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate" style={{ color: 'var(--theme-text)' }}>
              {achievement.name}
            </h4>
            {achievement.requiresSmartCube && (
              <Cpu className="h-3 w-3 shrink-0" style={{ color: 'var(--theme-accent)' }} />
            )}
          </div>
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--theme-sub)' }}>
            {achievement.description}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1">
            {achievement.tiers.map(t => (
              <TierBadge key={t.tier} tier={t.tier} unlocked={unlockedTiers.includes(t.tier)} size="sm" />
            ))}
          </div>
          <span className="text-xs font-mono" style={{ color: 'var(--theme-sub)' }}>
            {currentValue.toLocaleString()} / {(nextTier?.requirement || maxRequirement).toLocaleString()}
          </span>
        </div>
        <ProgressBar
          current={currentValue}
          max={maxRequirement}
          tiers={achievement.tiers}
          unlockedTiers={unlockedTiers}
        />
      </div>

      {nextTier && (
        <div className="mt-2 flex items-center justify-between text-[10px]">
          <span style={{ color: 'var(--theme-sub)' }}>
            Next: {nextTier.tier.charAt(0).toUpperCase() + nextTier.tier.slice(1)}
          </span>
          <span style={{ color: 'var(--theme-accent)' }}>
            +{nextTier.xpReward} XP
          </span>
        </div>
      )}
    </div>
  )
}

function CategorySection({ category }: { category: AchievementCategory }) {
  const info = CATEGORY_INFO[category]
  const categoryAchievements = getAchievementsByCategory(category)
  const Icon = info.icon

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
        <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--theme-text)' }}>
          {info.label}
        </h3>
        <span className="text-xs" style={{ color: 'var(--theme-sub)' }}>
          — {info.description}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categoryAchievements.map(achievement => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  )
}

function PrestigeSection() {
  const { prestige, streak } = useAchievements()
  const { getXPData } = useExperience()
  const xpData = getXPData()
  const title = getLevelTitle(xpData.level, prestige.stars)

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
        <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--theme-text)' }}>
          Prestige & Rank
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col items-center rounded-lg p-4" style={{ backgroundColor: 'var(--theme-bg)' }}>
          <div className="flex gap-1 mb-2">
            {prestige.stars > 0 
              ? Array.from({ length: Math.min(prestige.stars, 5) }).map((_, i) => (
                  <Star key={i} className="h-6 w-6" style={{ color: 'var(--theme-accent)', fill: 'var(--theme-accent)' }} />
                ))
              : <Gamepad2 className="h-6 w-6" style={{ color: 'var(--theme-sub)' }} />
            }
          </div>
          <span className="font-medium text-center" style={{ color: 'var(--theme-text)' }}>{title}</span>
          <span className="text-xs mt-1" style={{ color: 'var(--theme-sub)' }}>Level {xpData.level}</span>
        </div>

        <div className="flex flex-col items-center rounded-lg p-4" style={{ backgroundColor: 'var(--theme-bg)' }}>
          <div className="font-mono text-2xl font-bold" style={{ color: 'var(--theme-accent)' }}>
            x{prestige.permanentMultiplier.toFixed(2)}
          </div>
          <span className="text-xs mt-1 text-center" style={{ color: 'var(--theme-sub)' }}>
            Permanent XP Multiplier
          </span>
          {prestige.stars === 0 && (
            <span className="text-[10px] mt-2 text-center" style={{ color: 'var(--theme-sub)' }}>
              Reach Level 100 to Prestige
            </span>
          )}
        </div>

        <div className="flex flex-col items-center rounded-lg p-4" style={{ backgroundColor: 'var(--theme-bg)' }}>
          <div className="font-mono text-2xl font-bold" style={{ color: 'var(--theme-accent)' }}>
            +{((streak.streakMultiplier - 1) * 100).toFixed(0)}%
          </div>
          <span className="text-xs mt-1 text-center" style={{ color: 'var(--theme-sub)' }}>
            Streak Bonus (max 50%)
          </span>
          <span className="text-[10px] mt-2 text-center" style={{ color: 'var(--theme-sub)' }}>
            {streak.currentStreak} day streak
          </span>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-bg)' }}>
        <h4 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--theme-sub)' }}>
          Level Titles
        </h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div style={{ color: 'var(--theme-text)' }}>Novice Cuber</div>
            <div style={{ color: 'var(--theme-sub)' }}>Level 1-10</div>
          </div>
          <div className="text-center">
            <div style={{ color: 'var(--theme-text)' }}>Speedcuber</div>
            <div style={{ color: 'var(--theme-sub)' }}>Level 11-50</div>
          </div>
          <div className="text-center">
            <div style={{ color: 'var(--theme-text)' }}>Grandmaster</div>
            <div style={{ color: 'var(--theme-sub)' }}>Level 50+</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AchievementsSummary() {
  const { achievements } = useAchievements()
  
  const summary = useMemo(() => {
    let totalUnlocked = 0
    let totalPossible = 0
    const tierCounts: Record<AchievementTier, number> = {
      bronze: 0, silver: 0, gold: 0, diamond: 0, obsidian: 0
    }

    for (const achievement of ACHIEVEMENTS) {
      totalPossible += achievement.tiers.length
      const progress = achievements.find(a => a.id === achievement.id)
      if (progress) {
        totalUnlocked += progress.unlockedTiers.length
        for (const tier of progress.unlockedTiers) {
          tierCounts[tier]++
        }
      }
    }

    return { totalUnlocked, totalPossible, tierCounts }
  }, [achievements])

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
        <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--theme-text)' }}>
          Achievement Progress
        </h3>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl font-bold font-mono" style={{ color: 'var(--theme-text)' }}>
          {summary.totalUnlocked} / {summary.totalPossible}
        </span>
        <span className="text-sm" style={{ color: 'var(--theme-sub)' }}>
          {((summary.totalUnlocked / summary.totalPossible) * 100).toFixed(1)}% Complete
        </span>
      </div>

      <div
        className="h-3 w-full overflow-hidden rounded-full mb-4"
        style={{ backgroundColor: 'var(--theme-subAlt)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            backgroundColor: 'var(--theme-accent)',
            width: `${(summary.totalUnlocked / summary.totalPossible) * 100}%`,
          }}
        />
      </div>

      <div className="grid grid-cols-5 gap-2">
        {TIER_ORDER.map(tier => (
          <div key={tier} className="flex flex-col items-center">
            <TierBadge tier={tier} unlocked={summary.tierCounts[tier] > 0} />
            <span className="mt-1 text-xs font-mono" style={{ color: 'var(--theme-text)' }}>
              {summary.tierCounts[tier]}
            </span>
            <span className="text-[9px] capitalize" style={{ color: 'var(--theme-sub)' }}>
              {tier}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AchievementsPage() {
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all')

  return (
    <div className="mx-auto w-full max-w-7xl overflow-y-auto px-4 py-4 md:px-8 pb-8">
      <h2 className="mb-4 text-lg sm:text-xl font-semibold" style={{ color: 'var(--theme-text)' }}>
        Achievements
      </h2>

      <div className="space-y-4">
        <AchievementsSummary />
        <PrestigeSection />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('all')}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: activeCategory === 'all' ? 'var(--theme-accent)' : 'var(--theme-bgSecondary)',
              color: activeCategory === 'all' ? 'var(--theme-bg)' : 'var(--theme-text)',
            }}
          >
            All
          </button>
          {CATEGORY_ORDER.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: activeCategory === cat ? 'var(--theme-accent)' : 'var(--theme-bgSecondary)',
                color: activeCategory === cat ? 'var(--theme-bg)' : 'var(--theme-text)',
              }}
            >
              {CATEGORY_INFO[cat].label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {(activeCategory === 'all' ? CATEGORY_ORDER : [activeCategory]).map(category => (
            <CategorySection key={category} category={category} />
          ))}
        </div>
      </div>
    </div>
  )
}
