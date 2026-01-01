import { motion, AnimatePresence } from 'framer-motion'
import type { TimerStatus } from '@/hooks/useTimer'

interface TimerDisplayProps {
  time: number
  status: TimerStatus
  visible: boolean
  inspectionRemaining?: number
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const centiseconds = Math.floor((ms % 1000) / 10)

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
  }
  return `${seconds}.${centiseconds.toString().padStart(2, '0')}`
}

export function TimerDisplay({ time, status, visible, inspectionRemaining = 0 }: TimerDisplayProps) {
  const inspectionSeconds = Math.ceil(inspectionRemaining / 1000)
  const hasInspectionCountdown = status === 'inspection' && inspectionRemaining > 0

  const statusText = hasInspectionCountdown
    ? 'Make a move to start'
    : status === 'inspection'
      ? 'Inspection - make a move to start'
      : status === 'running'
        ? 'Solving...'
        : status === 'stopped'
          ? 'Solved!'
          : 'Ready'

  const colorClass =
    status === 'running'
      ? 'text-green-400'
      : status === 'stopped'
        ? 'text-blue-400'
        : status === 'inspection'
          ? inspectionSeconds <= 3
            ? 'text-red-400'
            : inspectionSeconds <= 8
              ? 'text-yellow-400'
              : 'text-green-400'
          : ''

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center"
        >
          <div
            className={`font-mono text-6xl font-light tracking-tight transition-colors ${colorClass}`}
            style={status === 'idle' ? { color: 'var(--theme-text)' } : undefined}
          >
            {hasInspectionCountdown ? inspectionSeconds : formatTime(time)}
          </div>
          <div className="mt-2 text-sm" style={{ color: 'var(--theme-sub)' }}>
            {statusText}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
