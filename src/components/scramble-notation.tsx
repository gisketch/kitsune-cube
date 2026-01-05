import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { formatTime } from '@/lib/format'
import type {
  ScrambleTrackerState,
  ScrambleMoveState,
  ParsedMove,
} from '@/hooks/useScrambleTracker'

interface ScrambleNotationProps {
  trackerState: ScrambleTrackerState
  timerStatus: 'idle' | 'inspection' | 'running' | 'stopped'
  time: number
  isManual?: boolean
  manualScramble?: string
  isRepeatedScramble?: boolean
  inspectionRemaining?: number
}

function MoveNotation({
  move,
  status,
}: {
  move: string
  status: 'pending' | 'current' | 'completed' | 'recovery'
}) {
  const isCurrent = status === 'current'
  const isCompleted = status === 'completed'
  const isRecovery = status === 'recovery'
  const isPending = status === 'pending'

  const getColor = () => {
    if (isRecovery) return 'var(--theme-error)'
    if (isCurrent) return 'var(--theme-accent)'
    if (isCompleted) return 'var(--theme-accent)'
    return 'var(--theme-text)'
  }

  return (
    <motion.span
      layout
      initial={{ opacity: 0.6, scale: 1 }}
      animate={{
        opacity: isCurrent || isRecovery ? 1 : isCompleted ? 0.6 : 0.7,
        scale: isCurrent || isRecovery ? 1.15 : 1,
        color: getColor(),
      }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`inline-block w-[2ch] min-w-[2ch] max-w-[2ch] text-center ${isCurrent || isRecovery ? 'font-bold' : isPending ? 'font-normal' : 'font-medium'}`}
    >
      {move}
    </motion.span>
  )
}

function RecoveryMoveNotation({ move }: { move: ParsedMove }) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.8, x: -10 }}
      animate={{
        opacity: 1,
        scale: 1.15,
        x: 0,
        color: 'var(--theme-error, #ef4444)',
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="inline-block font-bold"
    >
      {move.original}
    </motion.span>
  )
}

export function ScrambleNotation({ trackerState, timerStatus, time, isManual, manualScramble, isRepeatedScramble, inspectionRemaining = 0 }: ScrambleNotationProps) {
  const { status, moves, originalScramble, recoveryMoves, shouldResetCube } = trackerState
  const isScrambling = status === 'scrambling'
  const isDiverged = status === 'diverged'
  const showScrambleMoves = isScrambling || isDiverged
  const isInspection = timerStatus === 'inspection'
  const hasInspectionCountdown = isInspection && inspectionRemaining > 0
  const inspectionSeconds = Math.ceil(inspectionRemaining / 1000)
  const isRunning = timerStatus === 'running'
  const isStopped = timerStatus === 'stopped'

  const repeatedWarning = isRepeatedScramble && !isRunning && !isStopped && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-2 text-xs mb-2 text-center"
      style={{ color: 'var(--theme-error)' }}
    >
      <AlertTriangle className="hidden md:block h-4 w-4 flex-shrink-0" />
      <span>Repeated scramble — XP and achievements will not be awarded</span>
    </motion.div>
  )

  if (isManual && manualScramble) {
    const manualMoves = manualScramble.split(' ').filter(Boolean)
    return (
      <div className="flex min-h-[60px] flex-col items-center justify-center px-4 md:min-h-[80px] md:px-0">
        {repeatedWarning}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex max-w-xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-base tracking-wide md:gap-x-4 md:gap-y-2 md:text-2xl"
        >
          {manualMoves.map((move, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              className="inline-block font-bold w-[2ch] min-w-[2ch] max-w-[2ch] text-center"
              style={{ color: 'var(--theme-accent)' }}
            >
              {move}
            </motion.span>
          ))}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60px] flex-col items-center justify-center px-4 md:min-h-[80px] md:px-0">
      {repeatedWarning}
      <AnimatePresence mode="wait">
        {!originalScramble && status === 'idle' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="text-2xl tracking-widest"
            style={{ color: 'var(--theme-sub)' }}
          >
            generating...
          </motion.div>
        )}

        {showScrambleMoves && (
          <motion.div
            key="scramble"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              layout
              className="flex max-w-xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-base tracking-wide md:gap-x-4 md:gap-y-2 md:text-2xl"
            >
              {moves.map((moveState: ScrambleMoveState, i: number) => (
                <MoveNotation
                  key={`move-${i}`}
                  move={moveState.move.original}
                  status={moveState.status}
                />
              ))}
            </motion.div>
            <AnimatePresence>
              {isDiverged && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex items-center gap-2"
                >
                  {shouldResetCube ? (
                    <span className="text-xs" style={{ color: 'var(--theme-error, #ef4444)' }}>
                      solve cube to restart scramble
                    </span>
                  ) : recoveryMoves.length > 0 ? (
                    <>
                      <span className="text-xs" style={{ color: 'var(--theme-error, #ef4444)' }}>
                        undo:
                      </span>
                      <div className="flex gap-1 text-sm md:gap-2 md:text-xl">
                        {recoveryMoves.map((move, i) => (
                          <RecoveryMoveNotation key={`recovery-${i}`} move={move} />
                        ))}
                      </div>
                    </>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {(status === 'completed' || status === 'solving') && isInspection && (
          <motion.div
            key="inspection"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-2"
          >
            {hasInspectionCountdown ? (
              <>
                <div
                  className="text-5xl font-bold tabular-nums tracking-tight md:text-7xl"
                  style={{ 
                    color: inspectionSeconds <= 3 
                      ? 'var(--theme-error)' 
                      : inspectionSeconds <= 8 
                        ? 'var(--theme-accent)' 
                        : 'var(--theme-text)' 
                  }}
                >
                  {inspectionSeconds}
                </div>
                <div className="text-sm" style={{ color: 'var(--theme-sub)' }}>
                  make a move to start
                </div>
              </>
            ) : (
              <div
                className="text-xl font-medium tracking-widest md:text-3xl"
                style={{ color: 'var(--theme-accent)' }}
              >
                inspecting...
              </div>
            )}
          </motion.div>
        )}

        {isRunning && (
          <motion.div
            key="timer"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-5xl font-bold tabular-nums tracking-tight md:text-7xl"
            style={{ color: 'var(--theme-text)' }}
          >
            {formatTime(time)}
          </motion.div>
        )}

        {isStopped && (
          <motion.div
            key="stopped"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-5xl font-bold tabular-nums tracking-tight md:text-7xl"
            style={{ color: 'var(--theme-accent)' }}
          >
            {formatTime(time)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
