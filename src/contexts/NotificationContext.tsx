import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Sparkles, Zap } from 'lucide-react'
import confetti from 'canvas-confetti'
import { ACHIEVEMENTS } from '@/lib/achievements'
import type { AchievementTier } from '@/types/achievements'

interface Notification {
  id: string
  type: 'achievement' | 'personal-best'
  title: string
  subtitle?: string
  tier?: AchievementTier
}

interface NotificationContextType {
  showAchievement: (achievementId: string, tier: AchievementTier) => void
  showPersonalBest: (time: number, previousBest?: number) => void
  triggerTestAchievement: () => void
  triggerTestPersonalBest: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

const NOTIFICATION_DURATION = 5000

const tierColors: Record<AchievementTier, { bg: string; border: string; text: string; glow: string }> = {
  bronze: {
    bg: 'bg-gradient-to-r from-amber-900/40 to-amber-700/40',
    border: 'border-amber-600/60',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/30',
  },
  silver: {
    bg: 'bg-gradient-to-r from-slate-400/30 to-slate-300/30',
    border: 'border-slate-400/60',
    text: 'text-slate-300',
    glow: 'shadow-slate-400/30',
  },
  gold: {
    bg: 'bg-gradient-to-r from-yellow-600/40 to-yellow-400/40',
    border: 'border-yellow-500/60',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/40',
  },
  diamond: {
    bg: 'bg-gradient-to-r from-cyan-500/30 to-blue-400/30',
    border: 'border-cyan-400/60',
    text: 'text-cyan-300',
    glow: 'shadow-cyan-400/40',
  },
  obsidian: {
    bg: 'bg-gradient-to-r from-purple-900/50 to-violet-700/50',
    border: 'border-purple-500/60',
    text: 'text-purple-300',
    glow: 'shadow-purple-500/50',
  },
}

function formatTime(ms: number): string {
  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = (totalSeconds % 60).toFixed(2)
  return minutes > 0 ? `${minutes}:${seconds.padStart(5, '0')}` : `${seconds}s`
}

function fireConfetti(type: 'achievement' | 'personal-best') {
  const defaults = {
    origin: { y: 0.6 },
    zIndex: 200,
    disableForReducedMotion: true,
  }

  if (type === 'personal-best') {
    confetti({
      ...defaults,
      particleCount: 80,
      spread: 60,
      startVelocity: 30,
      colors: ['#FFD700', '#FFA500', '#FF6347', '#00FF00', '#00BFFF'],
      shapes: ['star', 'circle'],
      scalar: 0.8,
    })
  } else {
    const count = 60
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        ...defaults,
        particleCount: Math.floor(count * particleRatio),
        ...opts,
      })
    }

    fire(0.25, { spread: 26, startVelocity: 55, scalar: 0.8 })
    fire(0.2, { spread: 60, scalar: 0.7 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92 })
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const showAchievement = useCallback((achievementId: string, tier: AchievementTier) => {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
    if (!achievement) return

    const id = crypto.randomUUID()
    setNotifications(prev => [...prev, {
      id,
      type: 'achievement',
      title: achievement.name,
      subtitle: achievement.description,
      tier,
    }])

    fireConfetti('achievement')

    setTimeout(() => removeNotification(id), NOTIFICATION_DURATION)
  }, [removeNotification])

  const showPersonalBest = useCallback((time: number, previousBest?: number) => {
    const id = crypto.randomUUID()
    const improvement = previousBest ? previousBest - time : undefined
    
    setNotifications(prev => [...prev, {
      id,
      type: 'personal-best',
      title: `New Personal Best: ${formatTime(time)}`,
      subtitle: improvement ? `${formatTime(improvement)} faster!` : 'First recorded solve!',
    }])

    fireConfetti('personal-best')

    setTimeout(() => removeNotification(id), NOTIFICATION_DURATION)
  }, [removeNotification])

  const triggerTestAchievement = useCallback(() => {
    const randomAchievement = ACHIEVEMENTS[Math.floor(Math.random() * ACHIEVEMENTS.length)]
    const tiers: AchievementTier[] = ['bronze', 'silver', 'gold', 'diamond', 'obsidian']
    const randomTier = tiers[Math.floor(Math.random() * tiers.length)]
    showAchievement(randomAchievement.id, randomTier)
  }, [showAchievement])

  const triggerTestPersonalBest = useCallback(() => {
    const randomTime = 10000 + Math.random() * 20000
    const randomPrevious = randomTime + 500 + Math.random() * 2000
    showPersonalBest(randomTime, randomPrevious)
  }, [showPersonalBest])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (import.meta.env.DEV) {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
          e.preventDefault()
          triggerTestAchievement()
        }
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
          e.preventDefault()
          triggerTestPersonalBest()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [triggerTestAchievement, triggerTestPersonalBest])

  return (
    <NotificationContext.Provider value={{ 
      showAchievement, 
      showPersonalBest, 
      triggerTestAchievement, 
      triggerTestPersonalBest 
    }}>
      {children}
      <div className="fixed top-3 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:top-4 z-[150] flex flex-col gap-2 sm:gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto"
            >
              {notification.type === 'achievement' ? (
                <AchievementNotification notification={notification} onClose={() => removeNotification(notification.id)} />
              ) : (
                <PersonalBestNotification notification={notification} onClose={() => removeNotification(notification.id)} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}

function AchievementNotification({ 
  notification, 
  onClose 
}: { 
  notification: Notification
  onClose: () => void 
}) {
  const tier = notification.tier || 'bronze'
  const colors = tierColors[tier]

  return (
    <div
      className={`relative flex items-center gap-2 sm:gap-4 px-3 py-2.5 sm:px-6 sm:py-4 rounded-xl border backdrop-blur-md cursor-pointer transition-opacity hover:opacity-90 ${colors.bg} ${colors.border} shadow-lg ${colors.glow}`}
      onClick={onClose}
    >
      <div className={`p-2 sm:p-3 rounded-full ${colors.bg} ${colors.border} border`}>
        <Trophy className={`w-4 h-4 sm:w-6 sm:h-6 ${colors.text}`} />
      </div>
      
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Sparkles className={`w-3 h-3 sm:w-4 sm:h-4 ${colors.text}`} />
          <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
            Achievement Unlocked
          </span>
        </div>
        <span className="text-sm sm:text-lg font-bold text-white mt-0.5 truncate">
          {notification.title}
        </span>
        {notification.subtitle && (
          <span className="text-xs sm:text-sm text-white/70 truncate">
            {notification.subtitle}
          </span>
        )}
      </div>

      <div className={`absolute -top-1 -right-1 p-1 sm:p-1.5 rounded-full ${colors.bg} ${colors.border} border`}>
        <Star className={`w-3 h-3 sm:w-4 sm:h-4 ${colors.text} fill-current`} />
      </div>
    </div>
  )
}

function PersonalBestNotification({ 
  notification, 
  onClose 
}: { 
  notification: Notification
  onClose: () => void 
}) {
  return (
    <div
      className="relative flex items-center gap-2 sm:gap-4 px-3 py-2.5 sm:px-6 sm:py-4 rounded-xl border backdrop-blur-md cursor-pointer transition-opacity hover:opacity-90 bg-gradient-to-r from-green-500/30 to-emerald-400/30 border-green-500/60 shadow-lg shadow-green-500/30"
      onClick={onClose}
    >
      <div className="p-2 sm:p-3 rounded-full bg-green-500/30 border border-green-500/50">
        <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-green-400 fill-current" />
      </div>
      
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-green-400">
            Personal Best!
          </span>
        </div>
        <span className="text-sm sm:text-lg font-bold text-white mt-0.5 truncate">
          {notification.title}
        </span>
        {notification.subtitle && (
          <span className="text-xs sm:text-sm text-green-300 truncate">
            {notification.subtitle}
          </span>
        )}
      </div>
    </div>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
