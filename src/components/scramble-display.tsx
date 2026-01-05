import { RefreshCw, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useEffect } from 'react'
import type { ScrambleTrackerState, ScrambleMoveState } from '@/hooks/useScrambleTracker'
import type { ParsedMove } from '@/lib/move-utils'

interface ScrambleDisplayProps {
  trackerState: ScrambleTrackerState
  onNewScramble: () => void
  isLoading?: boolean
}

function MoveNotation({
  move,
  status,
  isFirst,
  wasModified,
}: {
  move: string
  status: 'pending' | 'current' | 'completed' | 'recovery'
  isFirst: boolean
  wasModified?: boolean
}) {
  const getColor = () => {
    if (wasModified) return 'text-yellow-400'
    if (status === 'completed') return 'text-green-400'
    if (status === 'recovery') return 'text-red-400'
    return ''
  }

  const opacity = status === 'pending' ? 0.4 : status === 'completed' ? 0.6 : 1
  const scale = status === 'current' ? 1.3 : status === 'completed' ? 1.1 : 1
  const colorClass = getColor()

  return (
    <motion.span
      initial={isFirst ? { opacity: 0, scale: 0.8 } : false}
      animate={{ opacity, scale }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      className={`inline-block w-[2ch] min-w-[2ch] max-w-[2ch] text-center font-mono ${colorClass} ${
        status === 'current' ? 'font-bold' : status === 'pending' ? 'font-normal' : 'font-medium'
      }`}
      style={!colorClass ? { color: 'var(--theme-text)' } : undefined}
    >
      {move}
    </motion.span>
  )
}

function RecoveryMoveNotation({ move, index }: { move: ParsedMove; index: number }) {
  const opacity = index === 0 ? 1 : 0.4
  const scale = index === 0 ? 1.3 : 1

  return (
    <motion.span
      initial={index === 0 ? { opacity: 0, scale: 0.8 } : false}
      animate={{ opacity, scale }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      className={`inline-block font-mono text-red-400 ${index === 0 ? 'font-bold' : 'font-normal'}`}
    >
      {move.original}
    </motion.span>
  )
}

export function ScrambleDisplay({ trackerState, onNewScramble, isLoading }: ScrambleDisplayProps) {
  const { status, moves, recoveryMoves, divergedMoves, isSolved, originalScramble } = trackerState
  const shouldReset = status === 'diverged' && divergedMoves.length > 10
  const lastScrambleRef = useRef<string>('')
  const isFirstRender = lastScrambleRef.current !== originalScramble

  useEffect(() => {
    if (originalScramble) {
      lastScrambleRef.current = originalScramble
    }
  }, [originalScramble])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--theme-sub)' }}
        >
          {status === 'idle'
            ? 'Ready'
            : status === 'scrambling'
              ? 'Scramble'
              : status === 'diverged'
                ? 'Recovery'
                : 'Completed'}
        </span>
        <button
          onClick={onNewScramble}
          disabled={isLoading}
          className="rounded-md p-1.5 transition-colors disabled:opacity-50"
          style={{ color: 'var(--theme-sub)' }}
          title="New Scramble"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isSolved && status === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm"
          style={{ color: 'var(--theme-sub)' }}
        >
          Cube is solved. Generate a scramble to begin.
        </motion.div>
      )}

      {shouldReset && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-red-400"
        >
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Please solve the cube to start fresh</span>
        </motion.div>
      )}

      <div className="flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4">
        <AnimatePresence mode="popLayout">
          {status === 'diverged' && !shouldReset && recoveryMoves.length > 0 ? (
            recoveryMoves.map((move, i) => (
              <RecoveryMoveNotation key={`recovery-${i}-${move.original}`} move={move} index={i} />
            ))
          ) : status === 'scrambling' || status === 'completed' ? (
            moves.map((moveState: ScrambleMoveState, i: number) => (
              <MoveNotation
                key={`move-${i}`}
                move={moveState.move.original}
                status={moveState.status}
                isFirst={isFirstRender}
                wasModified={moveState.wasModified}
              />
            ))
          ) : status === 'idle' && !isSolved ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              className="font-mono"
              style={{ color: 'var(--theme-sub)' }}
            >
              Press refresh to generate a scramble
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      {status === 'completed' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-sm font-medium text-green-400"
        >
          Scramble complete! Ready to solve.
        </motion.div>
      )}
    </div>
  )
}
