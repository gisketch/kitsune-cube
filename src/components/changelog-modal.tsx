import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Rocket, Sparkles, Gift, Zap, Plus, Wrench, TrendingUp, AlertTriangle } from 'lucide-react'
import { useChangelog } from '@/contexts/ChangelogContext'
import { CHANGELOG, type ChangeType, type ChangelogEntry } from '@/lib/changelog'

const ICON_MAP = {
  rocket: Rocket,
  sparkles: Sparkles,
  gift: Gift,
  zap: Zap,
}

const CHANGE_TYPE_CONFIG: Record<ChangeType, { icon: typeof Plus; label: string; color: string }> = {
  feature: { icon: Plus, label: 'New', color: 'var(--theme-accent)' },
  fix: { icon: Wrench, label: 'Fix', color: 'var(--theme-error)' },
  improvement: { icon: TrendingUp, label: 'Improved', color: 'var(--theme-main)' },
  breaking: { icon: AlertTriangle, label: 'Breaking', color: '#f59e0b' },
}

function LatestChangelogCard({ entry }: { entry: ChangelogEntry }) {
  const IconComponent = entry.icon ? ICON_MAP[entry.icon] : Sparkles

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden rounded-lg p-4 md:rounded-xl md:p-5"
      style={{
        background: 'linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-main) 100%)',
      }}
    >
      <div className="absolute right-0 top-0 opacity-10">
        <IconComponent className="h-20 w-20 -translate-y-4 translate-x-4 md:h-28 md:w-28" />
      </div>
      <div className="relative z-10">
        <div className="mb-2 flex flex-col gap-1 md:mb-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-1.5 md:gap-2">
            <IconComponent className="h-3.5 w-3.5 md:h-4 md:w-4" style={{ color: 'var(--theme-bg)' }} />
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium md:px-2 md:text-xs"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--theme-bg)' }}
            >
              v{entry.version}
            </span>
            <span className="text-sm font-semibold md:text-base" style={{ color: 'var(--theme-bg)' }}>
              {entry.title}
            </span>
          </div>
          <span className="text-[10px] opacity-75 md:text-xs" style={{ color: 'var(--theme-bg)' }}>
            {entry.date}
          </span>
        </div>
        <ul className="flex flex-col gap-1">
          {entry.changes.map((change, changeIndex) => (
            <li
              key={changeIndex}
              className="flex items-start gap-1.5 text-xs md:gap-2 md:text-sm"
              style={{ color: 'var(--theme-bg)', opacity: 0.9 }}
            >
              <span className="shrink-0">•</span>
              <span>
                {change.text}
                {change.contributor && (
                  <span className="ml-1 opacity-75">— {change.contributor}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

function ChangelogCard({ entry, index }: { entry: ChangelogEntry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      className="rounded-lg p-3 md:p-4"
      style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
    >
      <div className="mb-1.5 flex flex-col gap-1 md:mb-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-1.5 md:gap-2">
          <span
            className="rounded px-1.5 py-0.5 font-mono text-[10px] font-medium md:px-2 md:text-xs"
            style={{
              backgroundColor: 'var(--theme-subAlt)',
              color: 'var(--theme-text)',
            }}
          >
            v{entry.version}
          </span>
          <span className="text-sm font-medium md:text-base" style={{ color: 'var(--theme-text)' }}>
            {entry.title}
          </span>
        </div>
        <span className="text-[10px] md:text-xs" style={{ color: 'var(--theme-sub)' }}>
          {entry.date}
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {entry.changes.map((change, changeIndex) => {
          const config = CHANGE_TYPE_CONFIG[change.type]
          const ChangeIcon = config.icon
          return (
            <li
              key={changeIndex}
              className="flex items-start gap-1.5 text-xs md:gap-2 md:text-sm"
              style={{ color: 'var(--theme-sub)' }}
            >
              <ChangeIcon
                className="mt-0.5 h-3 w-3 shrink-0 md:h-3.5 md:w-3.5"
                style={{ color: config.color }}
              />
              <span>
                {change.text}
                {change.contributor && (
                  <span className="ml-1 opacity-75">— {change.contributor}</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}

export function ChangelogModal() {
  const { isOpen, closeChangelog, markAsRead } = useChangelog()

  useEffect(() => {
    if (isOpen) {
      markAsRead()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, markAsRead])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeChangelog()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeChangelog])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={closeChangelog}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl shadow-2xl md:max-h-[85vh] md:max-w-lg md:rounded-2xl"
            style={{
              backgroundColor: 'var(--theme-bg)',
              border: '1px solid var(--theme-subAlt)',
            }}
          >
            <div
              className="flex items-center justify-between border-b px-4 py-3 md:px-6 md:py-4"
              style={{ borderColor: 'var(--theme-subAlt)' }}
            >
              <div>
                <h2 className="text-base font-semibold md:text-lg" style={{ color: 'var(--theme-text)' }}>
                  What's New
                </h2>
                <p className="text-xs md:text-sm" style={{ color: 'var(--theme-sub)' }}>
                  Latest updates and improvements
                </p>
              </div>
              <button
                onClick={closeChangelog}
                className="rounded-lg p-2 transition-colors hover:opacity-80"
                style={{ backgroundColor: 'var(--theme-subAlt)', color: 'var(--theme-sub)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="flex flex-col gap-3 md:gap-4">
                {CHANGELOG.map((entry, index) =>
                  index === 0 ? (
                    <LatestChangelogCard key={entry.version} entry={entry} />
                  ) : (
                    <ChangelogCard key={entry.version} entry={entry} index={index} />
                  )
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
