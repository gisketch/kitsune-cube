import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Rocket, Sparkles, Gift, Zap, Plus, Wrench, TrendingUp, AlertTriangle } from 'lucide-react'
import { useChangelog } from '@/contexts/ChangelogContext'
import { CHANGELOG, getFeaturedAnnouncement, type ChangeType } from '@/lib/changelog'

type FeaturedAnnouncement = NonNullable<ReturnType<typeof getFeaturedAnnouncement>>

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

function FeaturedCard({ announcement }: { announcement: FeaturedAnnouncement }) {
  const IconComponent = announcement.icon ? ICON_MAP[announcement.icon] : Rocket

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden rounded-xl p-6"
      style={{
        background: 'linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-main) 100%)',
      }}
    >
      <div className="absolute right-0 top-0 opacity-10">
        <IconComponent className="h-32 w-32 -translate-y-4 translate-x-4" />
      </div>
      <div className="relative z-10">
        <div className="mb-2 flex items-center gap-2">
          <IconComponent className="h-5 w-5" style={{ color: 'var(--theme-bg)' }} />
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--theme-bg)' }}
          >
            v{announcement.version}
          </span>
        </div>
        <h3 className="mb-2 text-lg font-bold" style={{ color: 'var(--theme-bg)' }}>
          {announcement.title}
        </h3>
        <p className="text-sm opacity-90" style={{ color: 'var(--theme-bg)' }}>
          {announcement.description}
        </p>
      </div>
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
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl"
            style={{
              backgroundColor: 'var(--theme-bg)',
              border: '1px solid var(--theme-subAlt)',
            }}
          >
            <div
              className="flex items-center justify-between border-b px-6 py-4"
              style={{ borderColor: 'var(--theme-subAlt)' }}
            >
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
                  What's New
                </h2>
                <p className="text-sm" style={{ color: 'var(--theme-sub)' }}>
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

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col gap-6">
                {getFeaturedAnnouncement() && (
                  <FeaturedCard announcement={getFeaturedAnnouncement()!} />
                )}

                <div>
                  <h3
                    className="mb-4 text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--theme-sub)' }}
                  >
                    Changelog
                  </h3>
                  <div className="flex flex-col gap-4">
                    {CHANGELOG.map((entry, index) => (
                      <motion.div
                        key={entry.version}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="rounded-lg p-4"
                        style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="rounded px-2 py-0.5 text-xs font-mono font-medium"
                              style={{
                                backgroundColor: 'var(--theme-subAlt)',
                                color: 'var(--theme-text)',
                              }}
                            >
                              v{entry.version}
                            </span>
                            <span className="font-medium" style={{ color: 'var(--theme-text)' }}>
                              {entry.title}
                            </span>
                          </div>
                          <span className="text-xs" style={{ color: 'var(--theme-sub)' }}>
                            {entry.date}
                          </span>
                        </div>
                        <ul className="flex flex-col gap-1.5">
                          {entry.changes.map((change, changeIndex) => {
                            const config = CHANGE_TYPE_CONFIG[change.type]
                            const ChangeIcon = config.icon
                            return (
                              <li
                                key={changeIndex}
                                className="flex items-start gap-2 text-sm"
                                style={{ color: 'var(--theme-sub)' }}
                              >
                                <ChangeIcon
                                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                                  style={{ color: config.color }}
                                />
                                <span>{change.text}</span>
                              </li>
                            )
                          })}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
