import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bluetooth } from 'lucide-react'
import { formatTime } from '@/lib/format'
import type { ManualTimerStatus } from '@/hooks/useManualTimer'

interface ManualTimerDisplayProps {
  status: ManualTimerStatus
  time: number
  onConnect?: () => void
}

export function ManualTimerDisplay({ status, time, onConnect }: ManualTimerDisplayProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getTimerColor = () => {
    if (status === 'holding') return 'var(--theme-text)'
    if (status === 'ready') return 'var(--theme-accent)'
    if (status === 'running') return 'var(--theme-text)'
    if (status === 'stopped') return 'var(--theme-accent)'
    return 'var(--theme-sub)'
  }

  const getScale = () => {
    if (status === 'holding') return 1.05
    if (status === 'ready') return 1.08
    return 1
  }

  return (
    <div className="flex aspect-square w-full max-w-[240px] flex-col items-center justify-center md:max-w-sm">
      <div className="flex flex-col items-center gap-3">
        <motion.div
          className="text-5xl font-bold tabular-nums tracking-tight md:text-7xl"
          animate={{ 
            color: getTimerColor(),
            scale: getScale()
          }}
          transition={{ 
            color: { duration: 0 },
            scale: { type: 'spring', stiffness: 400, damping: 25 }
          }}
        >
          {formatTime(time)}
        </motion.div>
        
        <div className="flex flex-col items-center gap-2">
          <div
            className="text-xs tracking-wide md:text-sm"
            style={{ color: 'var(--theme-sub)' }}
          >
            {status === 'idle' && <><span className="md:hidden">hold to start</span><span className="hidden md:inline">hold space to start</span></>}
            {status === 'holding' && 'keep holding...'}
            {status === 'ready' && 'release to start!'}
            {status === 'running' && <><span className="md:hidden">tap to stop</span><span className="hidden md:inline">press any key to stop</span></>}
            {status === 'stopped' && <><span className="md:hidden">tap for next</span><span className="hidden md:inline">press space for next</span></>}
          </div>

          {status === 'idle' && onConnect && (
            <button
              onClick={onConnect}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="mt-1 hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors md:flex"
              style={{
                color: isHovered ? 'var(--theme-accent)' : 'var(--theme-sub)',
                backgroundColor: isHovered ? 'var(--theme-subAlt)' : 'transparent',
              }}
            >
              <Bluetooth className="h-3.5 w-3.5" />
              <span>connect to smart cube</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
