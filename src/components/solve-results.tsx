import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  RotateCcw,
  Copy,
  Play,
  Pause,
  ArrowLeft,
  SkipBack,
  SkipForward,
  Clock,
  Hash,
  Share2,
  Trash2,
} from 'lucide-react'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import * as THREE from 'three'
import { CubeViewer, type RubiksCubeRef } from '@/components/cube'
import { DEFAULT_CONFIG } from '@/config/scene-config'
import { createSolvedCube, applyMove, cubeFacesToFacelets, COLOR_HEX, type CubeFaces } from '@/lib/cube-faces'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal'
import { CopyModal } from '@/components/copy-modal'
import { DebugCubeOverlay, useDebugMode } from '@/components/debug-cube-overlay'
import { formatTime, formatDuration } from '@/lib/format'
import { consolidateMoves, countConsolidatedMoves } from '@/lib/move-utils'
import { useGoals } from '@/contexts/GoalsContext'
import { useToast } from '@/contexts/ToastContext'
import { calculatePhaseTimings, type CFOPTimingAnalysis } from '@/lib/cfop-timing'
import type { CFOPAnalysis, CFOPPhase } from '@/lib/cfop-analyzer'
import type { PhaseGoal } from '@/types/goals'
import type { KPattern } from 'cubing/kpuzzle'
import type { MutableRefObject } from 'react'
import type { Quaternion } from 'three'
import type { Solve } from '@/types'

type DisplayMode = 'moves' | 'time'

function TriangleUp({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 10 10" fill="currentColor">
      <polygon points="5,1 9,9 1,9" />
    </svg>
  )
}

function TriangleDown({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 10 10" fill="currentColor">
      <polygon points="1,1 9,1 5,9" />
    </svg>
  )
}

interface SolveResultsProps {
  time: number
  moves: number
  analysis: CFOPAnalysis | null
  onNextScramble?: () => void
  onRepeatScramble?: () => void
  onWatchReplay?: () => void
  onBack?: () => void
  onDeleteSolve?: (id: string) => void
  pattern?: KPattern | null
  quaternionRef?: MutableRefObject<Quaternion>
  cubeRef?: MutableRefObject<RubiksCubeRef | null>
  scramble?: string
  showBackButton?: boolean
  solve?: Solve
  animationSpeed?: number
  isManual?: boolean
  solveId?: string
  isOwner?: boolean
  userId?: string
  effectiveGoals?: { cross?: PhaseGoal; f2l?: PhaseGoal; oll?: PhaseGoal; pll?: PhaseGoal }
  effectiveTotalTime?: number | null
}

interface PhaseMarker {
  name: string
  startIndex: number
  endIndex: number
  color: string
  widthPercent: number
  recognitionRatio: number
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center md:items-start"
    >
      <span className="text-xs tracking-wide md:text-sm" style={{ color: 'var(--theme-sub)' }}>
        {label}
      </span>
      <span className="text-lg font-bold md:text-3xl" style={{ color: 'var(--theme-text)' }}>
        {value}
      </span>
    </motion.div>
  )
}

function CrossColorFacelet({ color }: { color: string | null | undefined }) {
  if (!color) return null
  const colorMap: Record<string, string> = {
    W: COLOR_HEX.W,
    Y: COLOR_HEX.Y,
    G: COLOR_HEX.G,
    B: COLOR_HEX.B,
    R: COLOR_HEX.R,
    O: COLOR_HEX.O,
  }
  return (
    <div
      className="h-2 w-2 rounded-[1px] md:h-2.5 md:w-2.5"
      style={{ backgroundColor: colorMap[color] || 'var(--theme-sub)' }}
    />
  )
}

function PhaseStatCard({
  label,
  moves,
  duration,
  tps,
  recognitionTime = 0,
  executionTime,
  displayMode = 'time',
  goal,
  hideRecognition = false,
  crossColor,
}: {
  label: string
  moves: number
  duration: number
  tps: number
  recognitionTime?: number
  executionTime?: number
  displayMode?: DisplayMode
  goal?: PhaseGoal
  hideRecognition?: boolean
  crossColor?: string | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  const actualExecutionTime = executionTime ?? duration
  const totalPhaseTime = recognitionTime + actualExecutionTime
  const recognitionPercent = totalPhaseTime > 0 ? Math.round((recognitionTime / totalPhaseTime) * 100) : 0
  const executionPercent = 100 - recognitionPercent

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const displayValue = displayMode === 'moves' ? moves.toString() : formatDuration(duration)

  const movesMet = goal && moves > 0 ? moves <= goal.moves : null
  const timeMet = goal && moves > 0 ? duration <= goal.time : null
  const goalMet = displayMode === 'moves' ? movesMet : timeMet

  const isCrossPhase = label.toLowerCase() === 'cross'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center md:items-start"
    >
      <div className={`flex items-center ${isCrossPhase && crossColor ? 'w-full justify-between' : 'gap-1'}`}>
        <div className="flex items-center gap-1">
          <span className="text-xs tracking-wide md:text-sm" style={{ color: 'var(--theme-sub)' }}>
            {label}
          </span>
          {goalMet !== null && (
            goalMet ? (
              <TriangleDown className="h-2.5 w-2.5" style={{ color: 'var(--theme-cubeGreen)' }} />
            ) : (
              <TriangleUp className="h-2.5 w-2.5" style={{ color: 'var(--theme-cubeRed)' }} />
            )
          )}
        </div>
        {isCrossPhase && crossColor && <CrossColorFacelet color={crossColor} />}
      </div>
      {moves > 0 ? (
        <Tooltip open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="cursor-pointer text-lg font-bold transition-colors hover:text-[var(--theme-accent)] md:text-3xl"
              style={{ color: 'var(--theme-text)' }}
            >
              {displayValue}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="border-[var(--theme-subAlt)] bg-[var(--theme-bgSecondary)]"
          >
            <div className="flex flex-col gap-1.5 text-xs">
              {isCrossPhase && crossColor && (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: 'var(--theme-sub)' }}>Cross Color</span>
                    <CrossColorFacelet color={crossColor} />
                  </div>
                  <div
                    className="my-0.5 h-px w-full"
                    style={{ backgroundColor: 'var(--theme-subAlt)' }}
                  />
                </>
              )}
              <div className="flex justify-between gap-4">
                <span style={{ color: 'var(--theme-sub)' }}>Moves</span>
                <span className="font-medium" style={{ color: 'var(--theme-text)' }}>
                  {moves}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span style={{ color: 'var(--theme-sub)' }}>TPS</span>
                <span className="font-medium" style={{ color: 'var(--theme-text)' }}>
                  {tps.toFixed(2)}
                </span>
              </div>
              <div
                className="my-1 h-px w-full"
                style={{ backgroundColor: 'var(--theme-subAlt)' }}
              />
              {!hideRecognition && (
                <div className="flex justify-between gap-4">
                  <span style={{ color: 'var(--theme-sub)' }}>Recognition</span>
                  <span className="font-medium" style={{ color: 'var(--theme-text)' }}>
                    {formatMs(recognitionTime)} ({recognitionPercent}%)
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span style={{ color: 'var(--theme-sub)' }}>Execution</span>
                <span className="font-medium" style={{ color: 'var(--theme-text)' }}>
                  {formatMs(actualExecutionTime)} ({hideRecognition ? 100 : executionPercent}%)
                </span>
              </div>
              {goal && (
                <>
                  <div
                    className="my-0.5 h-px w-full"
                    style={{ backgroundColor: 'var(--theme-subAlt)' }}
                  />
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ color: 'var(--theme-sub)' }}>Goal</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5" style={{ color: movesMet ? 'var(--theme-cubeGreen)' : 'var(--theme-cubeRed)' }}>
                        {movesMet ? <TriangleDown className="h-2.5 w-2.5" /> : <TriangleUp className="h-2.5 w-2.5" />}
                        {goal.moves}
                      </span>
                      <span style={{ color: 'var(--theme-sub)' }}>/</span>
                      <span className="flex items-center gap-0.5" style={{ color: timeMet ? 'var(--theme-cubeGreen)' : 'var(--theme-cubeRed)' }}>
                        {timeMet ? <TriangleDown className="h-2.5 w-2.5" /> : <TriangleUp className="h-2.5 w-2.5" />}
                        {(goal.time / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className="text-lg font-bold md:text-3xl" style={{ color: 'var(--theme-sub)' }}>
          SKIP
        </span>
      )}
    </motion.div>
  )
}

function ActionButton({
  icon: Icon,
  onClick,
  label,
  hidden,
  active,
}: {
  icon: typeof ChevronRight
  onClick?: () => void
  label: string
  hidden?: boolean
  active?: boolean
}) {
  if (hidden || !onClick) return null
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors md:h-12 md:w-12"
      style={{
        backgroundColor: active ? 'var(--theme-accent)' : 'var(--theme-subAlt)',
        color: active ? 'var(--theme-bg)' : 'var(--theme-text)',
      }}
      title={label}
    >
      <Icon className="h-4 w-4 md:h-5 md:w-5" />
    </motion.button>
  )
}

function CubeNet({ scramble }: { scramble: string }) {
  const cubeState = useMemo(() => {
    const moves = scramble
      .trim()
      .split(/\s+/)
      .filter((m) => m.length > 0)
    let cube = createSolvedCube()
    for (const move of moves) {
      cube = applyMove(cube, move)
    }
    return cube
  }, [scramble])

  return (
    <div className="grid grid-cols-3 gap-1">
      {cubeState.F.map((color, i) => (
        <div
          key={i}
          className="h-10 w-10 rounded-sm md:h-12 md:w-12"
          style={{ backgroundColor: COLOR_HEX[color as keyof typeof COLOR_HEX] || '#888' }}
        />
      ))}
    </div>
  )
}

interface PhaseBarProps {
  label: string
  moves: number
  recognitionTime: number
  executionTime: number
  maxMoves: number
  maxDuration: number
  duration: number
  phaseColor: string
  goal?: PhaseGoal
  displayMode: DisplayMode
  hideRecognition?: boolean
}

function VerticalBar({
  label,
  moves,
  recognitionTime,
  executionTime,
  maxMoves,
  maxDuration,
  duration,
  phaseColor,
  goal,
  displayMode,
  hideRecognition = false,
}: PhaseBarProps) {
  const barValue = displayMode === 'moves' ? moves : duration
  const maxValue = displayMode === 'moves' ? maxMoves : maxDuration
  const barHeight = maxValue > 0 ? (barValue / maxValue) * 100 : 0
  const totalPhaseTime = recognitionTime + executionTime
  const recognitionRatio = totalPhaseTime > 0 ? recognitionTime / totalPhaseTime : 0
  const recognitionHeight = hideRecognition ? 0 : recognitionRatio * 100

  const goalValue = goal ? (displayMode === 'moves' ? goal.moves : goal.time) : null
  const goalHeight = goalValue && maxValue > 0 ? (goalValue / maxValue) * 100 : null

  const movesMet = goal ? moves <= goal.moves : null
  const timeMet = goal ? duration <= goal.time : null

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const barContent = (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div
        className="relative w-full cursor-pointer overflow-hidden rounded-t transition-opacity hover:opacity-100"
        style={{ height: '120px', opacity: 0.9 }}
      >
        {goalHeight !== null && goalHeight <= 100 && (
          <div
            className="absolute left-0 right-0 z-10"
            style={{
              bottom: `${goalHeight}%`,
              height: '2px',
              backgroundColor: 'var(--theme-text)',
              boxShadow: '0 0 6px var(--theme-text)',
            }}
          />
        )}
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col overflow-hidden rounded-t"
          style={{ height: `${Math.max(barHeight, 5)}%` }}
        >
          <div
            className="w-full"
            style={{
              height: `${recognitionHeight}%`,
              backgroundColor: phaseColor,
              opacity: 0.4,
            }}
          />
          <div
            className="w-full flex-1"
            style={{
              backgroundColor: phaseColor,
              opacity: 0.9,
            }}
          />
        </div>
      </div>
      <span className="text-xs" style={{ color: phaseColor }}>
        {label}
      </span>
    </div>
  )

  if (moves === 0) {
    return <div className="flex flex-1 flex-col items-center gap-2">{barContent}</div>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{barContent}</TooltipTrigger>
      <TooltipContent
        side="top"
        className="border-[var(--theme-subAlt)] bg-[var(--theme-bgSecondary)]"
      >
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="font-medium" style={{ color: phaseColor }}>
            {label}: {moves} moves
          </div>
          {!hideRecognition && (
            <div className="flex items-center gap-2" style={{ color: 'var(--theme-sub)' }}>
              <div
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: phaseColor, opacity: 0.4 }}
              />
              <span>Recognition: {Math.round(recognitionRatio * 100)}%</span>
              <span style={{ color: 'var(--theme-text)' }}>{formatMs(recognitionTime)}</span>
            </div>
          )}
          <div className="flex items-center gap-2" style={{ color: 'var(--theme-sub)' }}>
            <div
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: phaseColor, opacity: 0.9 }}
            />
            <span>Execution: {hideRecognition ? '100%' : `${Math.round((1 - recognitionRatio) * 100)}%`}</span>
            <span style={{ color: 'var(--theme-text)' }}>{formatMs(executionTime)}</span>
          </div>
          {goal && (
            <>
              <div
                className="my-0.5 h-px w-full"
                style={{ backgroundColor: 'var(--theme-subAlt)' }}
              />
              <div className="flex items-center justify-between gap-4">
                <span style={{ color: 'var(--theme-sub)' }}>Goal</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5" style={{ color: movesMet ? 'var(--theme-cubeGreen)' : 'var(--theme-cubeRed)' }}>
                    {movesMet ? <TriangleDown className="h-2.5 w-2.5" /> : <TriangleUp className="h-2.5 w-2.5" />}
                    {goal.moves}
                  </span>
                  <span style={{ color: 'var(--theme-sub)' }}>/</span>
                  <span className="flex items-center gap-0.5" style={{ color: timeMet ? 'var(--theme-cubeGreen)' : 'var(--theme-cubeRed)' }}>
                    {timeMet ? <TriangleDown className="h-2.5 w-2.5" /> : <TriangleUp className="h-2.5 w-2.5" />}
                    {(goal.time / 1000).toFixed(1)}s
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function HorizontalBar({
  label,
  moves,
  recognitionTime,
  executionTime,
  maxMoves,
  maxDuration,
  duration,
  phaseColor,
  goal,
  displayMode,
  hideRecognition = false,
}: PhaseBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const barValue = displayMode === 'moves' ? moves : duration
  const maxValue = displayMode === 'moves' ? maxMoves : maxDuration
  const barWidth = maxValue > 0 ? (barValue / maxValue) * 100 : 0
  const totalPhaseTime = recognitionTime + executionTime
  const recognitionRatio = totalPhaseTime > 0 && !hideRecognition ? recognitionTime / totalPhaseTime : 0

  const goalValue = goal ? (displayMode === 'moves' ? goal.moves : goal.time) : null
  const goalPosition = goalValue && maxValue > 0 ? (goalValue / maxValue) * 100 : null

  const movesMet = goal ? moves <= goal.moves : null
  const timeMet = goal ? duration <= goal.time : null

  const formatMs = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const tps = duration > 0 ? moves / (duration / 1000) : 0

  const barContent = (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium" style={{ color: phaseColor }}>
          {label}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--theme-sub)' }}>
          {displayMode === 'moves' ? moves : formatMs(duration)}
        </span>
      </div>
      <div
        className="relative h-2 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--theme-subAlt)' }}
      >
        {goalPosition !== null && goalPosition <= 100 && (
          <div
            className="absolute top-0 bottom-0 z-10"
            style={{
              left: `${goalPosition}%`,
              width: '2px',
              backgroundColor: 'var(--theme-text)',
              boxShadow: '0 0 6px var(--theme-text)',
            }}
          />
        )}
        <div
          className="flex h-full overflow-hidden rounded-full"
          style={{ width: `${Math.max(barWidth, 3)}%` }}
        >
          <div
            style={{
              width: `${recognitionRatio * 100}%`,
              backgroundColor: phaseColor,
              opacity: 0.4,
            }}
          />
          <div
            className="flex-1"
            style={{
              backgroundColor: phaseColor,
              opacity: 0.9,
            }}
          />
        </div>
      </div>
    </div>
  )

  if (moves === 0) {
    return barContent
  }

  return (
    <Tooltip open={isOpen} onOpenChange={setIsOpen}>
      <TooltipTrigger asChild>
        <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left">
          {barContent}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="border-[var(--theme-subAlt)] bg-[var(--theme-bgSecondary)]"
      >
        <div className="flex flex-col gap-1.5 text-xs">
          <div className="font-medium" style={{ color: phaseColor }}>
            {label}: {moves} moves
          </div>
          <div className="flex justify-between gap-4">
            <span style={{ color: 'var(--theme-sub)' }}>TPS</span>
            <span className="font-medium" style={{ color: 'var(--theme-text)' }}>
              {tps.toFixed(2)}
            </span>
          </div>
          <div
            className="my-0.5 h-px w-full"
            style={{ backgroundColor: 'var(--theme-subAlt)' }}
          />
          {!hideRecognition && (
            <div className="flex justify-between gap-4">
              <span style={{ color: 'var(--theme-sub)' }}>Recognition</span>
              <span className="font-medium" style={{ color: 'var(--theme-text)' }}>
                {formatMs(recognitionTime)} ({Math.round(recognitionRatio * 100)}%)
              </span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span style={{ color: 'var(--theme-sub)' }}>Execution</span>
            <span className="font-medium" style={{ color: 'var(--theme-text)' }}>
              {formatMs(executionTime)} ({hideRecognition ? 100 : Math.round((1 - recognitionRatio) * 100)}%)
            </span>
          </div>
          {goal && (
            <>
              <div
                className="my-0.5 h-px w-full"
                style={{ backgroundColor: 'var(--theme-subAlt)' }}
              />
              <div className="flex items-center justify-between gap-4">
                <span style={{ color: 'var(--theme-sub)' }}>Goal</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5" style={{ color: movesMet ? 'var(--theme-cubeGreen)' : 'var(--theme-cubeRed)' }}>
                    {movesMet ? <TriangleDown className="h-2.5 w-2.5" /> : <TriangleUp className="h-2.5 w-2.5" />}
                    {goal.moves}
                  </span>
                  <span style={{ color: 'var(--theme-sub)' }}>/</span>
                  <span className="flex items-center gap-0.5" style={{ color: timeMet ? 'var(--theme-cubeGreen)' : 'var(--theme-cubeRed)' }}>
                    {timeMet ? <TriangleDown className="h-2.5 w-2.5" /> : <TriangleUp className="h-2.5 w-2.5" />}
                    {(goal.time / 1000).toFixed(1)}s
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

interface F2LSlotData {
  moves: number
  duration: number
  recognitionTime: number
  executionTime: number
}

function MobileCFOPBreakdown({
  crossMoves,
  f2lSlots,
  ollMoves,
  pllMoves,
  crossDuration,
  ollDuration,
  pllDuration,
  crossExecution,
  ollRecognition,
  ollExecution,
  pllRecognition,
  pllExecution,
  displayMode,
  onDisplayModeChange,
  goals,
}: {
  crossMoves: number
  f2lSlots: F2LSlotData[]
  ollMoves: number
  pllMoves: number
  crossDuration: number
  ollDuration: number
  pllDuration: number
  crossExecution: number
  ollRecognition: number
  ollExecution: number
  pllRecognition: number
  pllExecution: number
  displayMode: DisplayMode
  onDisplayModeChange: (mode: DisplayMode) => void
  goals?: { cross?: PhaseGoal; f2l?: PhaseGoal; oll?: PhaseGoal; pll?: PhaseGoal }
}) {
  const f2lGoalPerSlot = goals?.f2l ? {
    moves: Math.ceil(goals.f2l.moves / 4),
    time: goals.f2l.time / 4,
  } : undefined

  const allMoves = [crossMoves, ...f2lSlots.map(s => s.moves), ollMoves, pllMoves]
  const allDurations = [crossDuration, ...f2lSlots.map(s => s.duration), ollDuration, pllDuration]
  const maxMoves = Math.max(...allMoves, 1)
  const maxDuration = Math.max(...allDurations, 1)

  const phases = [
    { label: 'Cross', moves: crossMoves, recognitionTime: 0, executionTime: crossExecution, colorVar: '--theme-phaseCross', duration: crossDuration, goal: goals?.cross, hideRecognition: true },
    { label: 'F2L 1', moves: f2lSlots[0]?.moves ?? 0, recognitionTime: f2lSlots[0]?.recognitionTime ?? 0, executionTime: f2lSlots[0]?.executionTime ?? 0, colorVar: '--theme-phaseF2L1', duration: f2lSlots[0]?.duration ?? 0, goal: f2lGoalPerSlot, hideRecognition: false },
    { label: 'F2L 2', moves: f2lSlots[1]?.moves ?? 0, recognitionTime: f2lSlots[1]?.recognitionTime ?? 0, executionTime: f2lSlots[1]?.executionTime ?? 0, colorVar: '--theme-phaseF2L2', duration: f2lSlots[1]?.duration ?? 0, goal: f2lGoalPerSlot, hideRecognition: false },
    { label: 'F2L 3', moves: f2lSlots[2]?.moves ?? 0, recognitionTime: f2lSlots[2]?.recognitionTime ?? 0, executionTime: f2lSlots[2]?.executionTime ?? 0, colorVar: '--theme-phaseF2L3', duration: f2lSlots[2]?.duration ?? 0, goal: f2lGoalPerSlot, hideRecognition: false },
    { label: 'F2L 4', moves: f2lSlots[3]?.moves ?? 0, recognitionTime: f2lSlots[3]?.recognitionTime ?? 0, executionTime: f2lSlots[3]?.executionTime ?? 0, colorVar: '--theme-phaseF2L4', duration: f2lSlots[3]?.duration ?? 0, goal: f2lGoalPerSlot, hideRecognition: false },
    { label: 'OLL', moves: ollMoves, recognitionTime: ollRecognition, executionTime: ollExecution, colorVar: '--theme-phaseOLL', duration: ollDuration, goal: goals?.oll, hideRecognition: false },
    { label: 'PLL', moves: pllMoves, recognitionTime: pllRecognition, executionTime: pllExecution, colorVar: '--theme-phasePLL', duration: pllDuration, goal: goals?.pll, hideRecognition: false },
  ]

  return (
    <div className="flex w-full flex-col gap-2 md:hidden">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-3 text-[10px]"
          style={{ color: 'var(--theme-sub)' }}
        >
          <div className="flex items-center gap-1">
            <div
              className="h-1.5 w-3 rounded-sm opacity-40"
              style={{ backgroundColor: 'var(--theme-text)' }}
            />
            <span>rec</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="h-1.5 w-3 rounded-sm opacity-90"
              style={{ backgroundColor: 'var(--theme-text)' }}
            />
            <span>exec</span>
          </div>
        </div>
        <div className="flex rounded overflow-hidden" style={{ backgroundColor: 'var(--theme-subAlt)' }}>
          <button
            onClick={() => onDisplayModeChange('moves')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors"
            style={{
              backgroundColor: displayMode === 'moves' ? 'var(--theme-accent)' : 'transparent',
              color: displayMode === 'moves' ? 'var(--theme-bg)' : 'var(--theme-sub)',
            }}
            aria-label="Show move count"
            aria-pressed={displayMode === 'moves'}
          >
            <Hash className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDisplayModeChange('time')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors"
            style={{
              backgroundColor: displayMode === 'time' ? 'var(--theme-accent)' : 'transparent',
              color: displayMode === 'time' ? 'var(--theme-bg)' : 'var(--theme-sub)',
            }}
            aria-label="Show time"
            aria-pressed={displayMode === 'time'}
          >
            <Clock className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {phases.map((phase) => (
          <HorizontalBar
            key={phase.label}
            label={phase.label}
            moves={phase.moves}
            recognitionTime={phase.recognitionTime}
            executionTime={phase.executionTime}
            maxMoves={maxMoves}
            maxDuration={maxDuration}
            duration={phase.duration}
            phaseColor={`var(${phase.colorVar})`}
            goal={phase.goal}
            displayMode={displayMode}
            hideRecognition={phase.hideRecognition}
          />
        ))}
      </div>
    </div>
  )
}

function parseAlgorithm(alg: string): string[] {
  return alg
    .trim()
    .split(/\s+/)
    .filter((m) => m.length > 0)
}

export function SolveResults({
  time,
  moves,
  analysis,
  onNextScramble,
  onRepeatScramble,
  onWatchReplay,
  onBack,
  onDeleteSolve,
  scramble,
  showBackButton,
  solve,
  isManual,
  solveId,
  isOwner = true,
  userId,
  effectiveGoals,
  effectiveTotalTime,
}: SolveResultsProps) {
  const [isReplayMode, setIsReplayMode] = useState(false)
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(500)
  const [currentElapsedTime, setCurrentElapsedTime] = useState(0)
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    const saved = localStorage.getItem('solve-results-display-mode')
    return (saved === 'moves' || saved === 'time') ? saved : 'moves'
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)

  const { isDebugMode, setIsDebugMode } = useDebugMode()

  useEffect(() => {
    localStorage.setItem('solve-results-display-mode', displayMode)
  }, [displayMode])

  const { goals: userGoals, totalTime: userTotalTimeGoal } = useGoals()
  const { showToast } = useToast()

  const goals = isOwner 
    ? (effectiveGoals ?? userGoals)
    : { cross: undefined, f2l: undefined, oll: undefined, pll: undefined }
  const totalTimeGoal = isOwner ? (effectiveTotalTime ?? userTotalTimeGoal) : null

  const handleShare = useCallback(async () => {
    const shortId = solve?.shortId
    if (shortId) {
      const url = `${window.location.origin}/s/${shortId}`
      try {
        await navigator.clipboard.writeText(url)
        showToast('Link copied to clipboard!')
      } catch {
        showToast('Failed to copy link', 'error')
      }
      return
    }

    const id = solveId || solve?.id
    if (!id) return
    
    const url = userId 
      ? `${window.location.origin}/solve/${userId}/${id}`
      : `${window.location.origin}/solve/${id}`
    try {
      await navigator.clipboard.writeText(url)
      showToast('Link copied to clipboard!')
    } catch {
      showToast('Failed to copy link', 'error')
    }
  }, [solveId, solve?.id, solve?.shortId, userId, showToast])

  const handleCopySolution = useCallback(async () => {
    const solution = solve?.solution || []
    if (solution.length === 0) {
      showToast('No solution to copy', 'error')
      return
    }
    try {
      const consolidated = consolidateMoves(solution)
      await navigator.clipboard.writeText(consolidated.join(' '))
      showToast('Solution copied to clipboard!')
    } catch {
      showToast('Failed to copy solution', 'error')
    }
  }, [solve?.solution, showToast])

  const handleCopyScramble = useCallback(async () => {
    const scrambleText = scramble || solve?.scramble
    if (!scrambleText) {
      showToast('No scramble to copy', 'error')
      return
    }
    try {
      await navigator.clipboard.writeText(scrambleText)
      showToast('Scramble copied to clipboard!')
    } catch {
      showToast('Failed to copy scramble', 'error')
    }
  }, [scramble, solve?.scramble, showToast])

  const hasGyroData = Boolean(solve?.gyroData && solve.gyroData.length > 0)
  const hasMoveTimings = Boolean(solve?.moveTimings && solve.moveTimings.length > 0)
  const [enableGyro, setEnableGyro] = useState(true)

  useEffect(() => {
    if (hasGyroData) {
      setEnableGyro(true)
    }
  }, [hasGyroData])

  const replayCubeRef = useRef<RubiksCubeRef>(null)
  const replayQuaternionRef = useRef<THREE.Quaternion>(new THREE.Quaternion())
  const playbackStartTimeRef = useRef<number>(0)
  const currentMoveIndexRef = useRef<number>(-1)
  const isPlayingRef = useRef<boolean>(false)
  const animationFrameRef = useRef<number | null>(null)
  const [replayFacelets, setReplayFacelets] = useState<string>('')

  const crossMoves = analysis?.cross.moves.length ?? 0
  const f2l1Moves = analysis?.f2l[0]?.moves.length ?? 0
  const f2l2Moves = analysis?.f2l[1]?.moves.length ?? 0
  const f2l3Moves = analysis?.f2l[2]?.moves.length ?? 0
  const f2l4Moves = analysis?.f2l[3]?.moves.length ?? 0
  const f2lMoves = f2l1Moves + f2l2Moves + f2l3Moves + f2l4Moves
  const ollMoves = analysis?.oll.moves.length ?? 0
  const pllMoves = analysis?.pll.moves.length ?? 0

  const phaseTimings: CFOPTimingAnalysis | null = useMemo(() => {
    if (!analysis || !solve?.moveTimings || solve.moveTimings.length === 0) {
      return null
    }
    return calculatePhaseTimings(analysis, solve.moveTimings)
  }, [analysis, solve?.moveTimings])

  const totalPhaseMoves = crossMoves + f2lMoves + ollMoves + pllMoves
  const crossDuration = phaseTimings?.cross.executionTime ?? (totalPhaseMoves > 0 ? (crossMoves / totalPhaseMoves) * time : 0)
  const f2lDuration = phaseTimings?.aggregated.f2l.totalDuration ?? (totalPhaseMoves > 0 ? (f2lMoves / totalPhaseMoves) * time : 0)
  const ollDuration = phaseTimings?.oll.totalDuration ?? (totalPhaseMoves > 0 ? (ollMoves / totalPhaseMoves) * time : 0)
  const pllDuration = phaseTimings?.pll.totalDuration ?? (totalPhaseMoves > 0 ? (pllMoves / totalPhaseMoves) * time : 0)

  const f2l1Duration = phaseTimings?.f2l[0]?.totalDuration ?? (f2lMoves > 0 ? (f2l1Moves / f2lMoves) * f2lDuration : 0)
  const f2l2Duration = phaseTimings?.f2l[1]?.totalDuration ?? (f2lMoves > 0 ? (f2l2Moves / f2lMoves) * f2lDuration : 0)
  const f2l3Duration = phaseTimings?.f2l[2]?.totalDuration ?? (f2lMoves > 0 ? (f2l3Moves / f2lMoves) * f2lDuration : 0)
  const f2l4Duration = phaseTimings?.f2l[3]?.totalDuration ?? (f2lMoves > 0 ? (f2l4Moves / f2lMoves) * f2lDuration : 0)

  const crossTps = crossDuration > 0 ? crossMoves / (crossDuration / 1000) : 0
  const f2lTps = f2lDuration > 0 ? f2lMoves / (f2lDuration / 1000) : 0
  const ollTps = ollDuration > 0 ? ollMoves / (ollDuration / 1000) : 0
  const pllTps = pllDuration > 0 ? pllMoves / (pllDuration / 1000) : 0

  const maxMoves = Math.max(
    crossMoves,
    f2l1Moves,
    f2l2Moves,
    f2l3Moves,
    f2l4Moves,
    ollMoves,
    pllMoves,
    1,
  )

  const maxDuration = Math.max(
    crossDuration,
    f2l1Duration,
    f2l2Duration,
    f2l3Duration,
    f2l4Duration,
    ollDuration,
    pllDuration,
    1,
  )

  const f2lGoalPerSlot = goals?.f2l ? {
    moves: Math.ceil(goals.f2l.moves / 4),
    time: goals.f2l.time / 4,
  } : undefined

  const phases = [
    { label: 'Cross', moves: crossMoves, recognitionTime: 0, executionTime: phaseTimings?.cross.executionTime ?? crossDuration, colorVar: '--theme-phaseCross', duration: crossDuration, goal: goals?.cross, hideRecognition: true },
    { label: 'F2L 1', moves: f2l1Moves, recognitionTime: phaseTimings?.f2l[0]?.recognitionTime ?? 0, executionTime: phaseTimings?.f2l[0]?.executionTime ?? f2l1Duration, colorVar: '--theme-phaseF2L1', duration: f2l1Duration, goal: f2lGoalPerSlot, hideRecognition: false },
    { label: 'F2L 2', moves: f2l2Moves, recognitionTime: phaseTimings?.f2l[1]?.recognitionTime ?? 0, executionTime: phaseTimings?.f2l[1]?.executionTime ?? f2l2Duration, colorVar: '--theme-phaseF2L2', duration: f2l2Duration, goal: f2lGoalPerSlot, hideRecognition: false },
    { label: 'F2L 3', moves: f2l3Moves, recognitionTime: phaseTimings?.f2l[2]?.recognitionTime ?? 0, executionTime: phaseTimings?.f2l[2]?.executionTime ?? f2l3Duration, colorVar: '--theme-phaseF2L3', duration: f2l3Duration, goal: f2lGoalPerSlot, hideRecognition: false },
    { label: 'F2L 4', moves: f2l4Moves, recognitionTime: phaseTimings?.f2l[3]?.recognitionTime ?? 0, executionTime: phaseTimings?.f2l[3]?.executionTime ?? f2l4Duration, colorVar: '--theme-phaseF2L4', duration: f2l4Duration, goal: f2lGoalPerSlot, hideRecognition: false },
    { label: 'OLL', moves: ollMoves, recognitionTime: phaseTimings?.oll.recognitionTime ?? 0, executionTime: phaseTimings?.oll.executionTime ?? ollDuration, colorVar: '--theme-phaseOLL', duration: ollDuration, goal: goals?.oll, hideRecognition: false },
    { label: 'PLL', moves: pllMoves, recognitionTime: phaseTimings?.pll.recognitionTime ?? 0, executionTime: phaseTimings?.pll.executionTime ?? pllDuration, colorVar: '--theme-phasePLL', duration: pllDuration, goal: goals?.pll, hideRecognition: false },
  ]

  const { initialScrambledFacelets, replayPhases, allMoves, totalMoves, timeOffset } =
    useMemo(() => {
      if (!solve) {
        return {
          initialScrambledFacelets: '',
          replayPhases: [],
          allMoves: [],
          totalMoves: 0,
          timeOffset: 0,
        }
      }

      const scrambleMoves = parseAlgorithm(solve.scramble)
      let solutionMoves = solve.solution
      const offset = solve.moveTimings?.[0]?.time ?? 0

      if (solve.cfopAnalysis) {
        const analysisMovesCount =
          solve.cfopAnalysis.cross.moves.length +
          solve.cfopAnalysis.f2l.reduce(
            (sum: number, slot: CFOPPhase) => sum + slot.moves.length,
            0,
          ) +
          solve.cfopAnalysis.oll.moves.length +
          solve.cfopAnalysis.pll.moves.length

        if (analysisMovesCount > solutionMoves.length) {
          solutionMoves = [
            ...solve.cfopAnalysis.cross.moves,
            ...solve.cfopAnalysis.f2l.flatMap((slot: CFOPPhase) => slot.moves),
            ...solve.cfopAnalysis.oll.moves,
            ...solve.cfopAnalysis.pll.moves,
          ]
        }
      }

      let cube = createSolvedCube()
      for (const move of scrambleMoves) {
        cube = applyMove(cube, move)
      }
      const scrambledFacelets = cubeFacesToFacelets(cube)

      const moveCount = solutionMoves.length
      const phaseMarkers: PhaseMarker[] = []

      if (solve.cfopAnalysis && moveCount > 0) {
        let currentIndex = 0
        const cfop = solve.cfopAnalysis

        if (cfop.cross.moves.length > 0) {
          phaseMarkers.push({
            name: 'Cross',
            startIndex: currentIndex,
            endIndex: currentIndex + cfop.cross.moves.length - 1,
            color: 'var(--theme-phaseCross)',
            widthPercent: (cfop.cross.moves.length / moveCount) * 100,
            recognitionRatio: 0.15,
          })
          currentIndex += cfop.cross.moves.length
        }

        const f2lColors = [
          'var(--theme-phaseF2L1)',
          'var(--theme-phaseF2L2)',
          'var(--theme-phaseF2L3)',
          'var(--theme-phaseF2L4)',
        ]
        cfop.f2l.forEach((slot: CFOPPhase, i: number) => {
          if (slot.moves.length > 0) {
            phaseMarkers.push({
              name: `F2L ${i + 1}`,
              startIndex: currentIndex,
              endIndex: currentIndex + slot.moves.length - 1,
              color: f2lColors[i],
              widthPercent: (slot.moves.length / moveCount) * 100,
              recognitionRatio: 0.25,
            })
            currentIndex += slot.moves.length
          }
        })

        if (cfop.oll.moves.length > 0) {
          phaseMarkers.push({
            name: 'OLL',
            startIndex: currentIndex,
            endIndex: currentIndex + cfop.oll.moves.length - 1,
            color: 'var(--theme-phaseOLL)',
            widthPercent: (cfop.oll.moves.length / moveCount) * 100,
            recognitionRatio: 0.35,
          })
          currentIndex += cfop.oll.moves.length
        }

        if (cfop.pll.moves.length > 0) {
          phaseMarkers.push({
            name: 'PLL',
            startIndex: currentIndex,
            endIndex: currentIndex + cfop.pll.moves.length - 1,
            color: 'var(--theme-phasePLL)',
            widthPercent: (cfop.pll.moves.length / moveCount) * 100,
            recognitionRatio: 0.30,
          })
        }
      }

      return {
        initialScrambledFacelets: scrambledFacelets,
        replayPhases: phaseMarkers,
        allMoves: solutionMoves,
        totalMoves: solutionMoves.length,
        timeOffset: offset,
      }
    }, [solve])

  const computeFaceletsAtIndex = useCallback(
    (index: number): string => {
      if (!solve) return ''
      const scrambleMoves = parseAlgorithm(solve.scramble)
      let cube = createSolvedCube()
      for (const move of scrambleMoves) {
        cube = applyMove(cube, move)
      }
      for (let i = 0; i <= index && i < allMoves.length; i++) {
        cube = applyMove(cube, allMoves[i])
      }
      return cubeFacesToFacelets(cube)
    },
    [solve, allMoves],
  )

  const computeCubeFacesAtIndex = useCallback(
    (index: number): CubeFaces => {
      const scrambleMoves = solve ? parseAlgorithm(solve.scramble) : []
      let cube = createSolvedCube()
      for (const move of scrambleMoves) {
        cube = applyMove(cube, move)
      }
      for (let i = 0; i <= index && i < allMoves.length; i++) {
        cube = applyMove(cube, allMoves[i])
      }
      return cube
    },
    [solve, allMoves],
  )

  const replayCubeFaces = useMemo(() => {
    if (!isReplayMode) return createSolvedCube()
    return computeCubeFacesAtIndex(currentMoveIndex)
  }, [isReplayMode, currentMoveIndex, computeCubeFacesAtIndex])

  const [replayKey, setReplayKey] = useState(0)

  useEffect(() => {
    currentMoveIndexRef.current = currentMoveIndex
  }, [currentMoveIndex])

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    if (!isPlaying || !solve) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    playbackStartTimeRef.current = performance.now()
    const startMoveIndex = currentMoveIndexRef.current

    if (hasMoveTimings && solve.moveTimings && solve.moveTimings.length > 0) {
      const firstGyroTime = solve.gyroData?.[0]?.time ?? 0
      const startTime =
        startMoveIndex >= 0 && startMoveIndex < solve.moveTimings.length
          ? solve.moveTimings[startMoveIndex].time
          : firstGyroTime
      const speedMultiplier = 500 / playbackSpeed

      const animate = () => {
        if (!isPlayingRef.current) return

        const elapsed =
          (performance.now() - playbackStartTimeRef.current) * speedMultiplier + startTime
        setCurrentElapsedTime(elapsed)

        if (enableGyro && hasGyroData && solve.gyroData && solve.gyroData.length > 0) {
          let gyroFrame = solve.gyroData[0]
          for (let i = solve.gyroData.length - 1; i >= 0; i--) {
            if (solve.gyroData[i].time <= elapsed) {
              gyroFrame = solve.gyroData[i]
              break
            }
          }
          replayQuaternionRef.current.set(
            gyroFrame.quaternion.x,
            gyroFrame.quaternion.y,
            gyroFrame.quaternion.z,
            gyroFrame.quaternion.w,
          )
        }

        let targetMoveIdx = -1
        for (let i = 0; i < solve.moveTimings!.length; i++) {
          if (solve.moveTimings![i].time <= elapsed) {
            targetMoveIdx = i
          } else {
            break
          }
        }

        if (targetMoveIdx !== currentMoveIndexRef.current && targetMoveIdx >= 0) {
          const prevIdx = currentMoveIndexRef.current
          currentMoveIndexRef.current = targetMoveIdx
          setCurrentMoveIndex(targetMoveIdx)

          if (replayCubeRef.current && targetMoveIdx > prevIdx) {
            for (let i = prevIdx + 1; i <= targetMoveIdx; i++) {
              if (i >= 0 && i < allMoves.length) {
                replayCubeRef.current.performMove(allMoves[i])
              }
            }
          }
        }

        const solveEndTime = time
        if (elapsed >= solveEndTime) {
          setCurrentElapsedTime(solveEndTime + timeOffset)
          if (targetMoveIdx < totalMoves - 1) {
            currentMoveIndexRef.current = totalMoves - 1
            setCurrentMoveIndex(totalMoves - 1)
            if (replayCubeRef.current) {
              for (let i = targetMoveIdx + 1; i < totalMoves; i++) {
                if (i >= 0 && i < allMoves.length) {
                  replayCubeRef.current.performMove(allMoves[i])
                }
              }
            }
          }
          setIsPlaying(false)
          return
        }

        animationFrameRef.current = requestAnimationFrame(animate)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    } else {
      const interval = setInterval(() => {
        const prev = currentMoveIndexRef.current
        if (prev >= totalMoves - 1) {
          setIsPlaying(false)
          return
        }
        const next = prev + 1
        currentMoveIndexRef.current = next
        setCurrentMoveIndex(next)

        if (replayCubeRef.current && next >= 0 && next < allMoves.length) {
          replayCubeRef.current.performMove(allMoves[next])
        }
      }, playbackSpeed)

      return () => clearInterval(interval)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [
    isPlaying,
    totalMoves,
    playbackSpeed,
    hasMoveTimings,
    hasGyroData,
    enableGyro,
    solve,
    allMoves,
  ])

  const handleSeek = useCallback(
    (index: number) => {
      const newIndex = Math.max(-1, Math.min(index, totalMoves - 1))
      const prevIndex = currentMoveIndexRef.current
      currentMoveIndexRef.current = newIndex
      setCurrentMoveIndex(newIndex)

      if (newIndex < prevIndex) {
        const newFacelets = computeFaceletsAtIndex(newIndex)
        setReplayFacelets(newFacelets)
        setReplayKey((k) => k + 1)
      } else if (newIndex > prevIndex && replayCubeRef.current) {
        for (let i = prevIndex + 1; i <= newIndex; i++) {
          if (i >= 0 && i < allMoves.length) {
            replayCubeRef.current.applyMoveInstantly(allMoves[i])
          }
        }
      }

      if (solve?.moveTimings && solve.moveTimings.length > 0) {
        const elapsed =
          newIndex >= 0 && newIndex < solve.moveTimings.length
            ? solve.moveTimings[newIndex].time
            : (solve.moveTimings[0]?.time ?? 0)
        setCurrentElapsedTime(elapsed)

        if (enableGyro && solve.gyroData && solve.gyroData.length > 0) {
          let gyroFrame = solve.gyroData[0]
          for (let i = solve.gyroData.length - 1; i >= 0; i--) {
            if (solve.gyroData[i].time <= elapsed) {
              gyroFrame = solve.gyroData[i]
              break
            }
          }
          replayQuaternionRef.current.set(
            gyroFrame.quaternion.x,
            gyroFrame.quaternion.y,
            gyroFrame.quaternion.z,
            gyroFrame.quaternion.w,
          )
        }
      } else {
        const estimatedTime = totalMoves > 0 ? ((newIndex + 1) / totalMoves) * time : 0
        setCurrentElapsedTime(Math.max(0, estimatedTime))
      }
    },
    [totalMoves, solve, enableGyro, time, allMoves, computeFaceletsAtIndex],
  )

  const resetReplay = useCallback(() => {
    currentMoveIndexRef.current = -1
    setCurrentMoveIndex(-1)
    setCurrentElapsedTime(0)
    setIsPlaying(false)
    setReplayFacelets('')
    setReplayKey((k) => k + 1)
    if (solve?.gyroData?.[0]) {
      const firstFrame = solve.gyroData[0]
      replayQuaternionRef.current.set(
        firstFrame.quaternion.x,
        firstFrame.quaternion.y,
        firstFrame.quaternion.z,
        firstFrame.quaternion.w,
      )
    }
  }, [solve?.gyroData])

  const togglePlay = () => {
    if (!isPlaying) {
      if (currentMoveIndex >= totalMoves - 1) {
        resetReplay()
        setTimeout(() => {
          playbackStartTimeRef.current = performance.now()
          setIsPlaying(true)
        }, 50)
        return
      }
      playbackStartTimeRef.current = performance.now()
    }
    setIsPlaying(!isPlaying)
  }

  const stepBack = () => handleSeek(currentMoveIndex - 1)
  const stepForward = () => handleSeek(currentMoveIndex + 1)

  const enterReplayMode = () => {
    setIsReplayMode(true)
    setCurrentMoveIndex(-1)
    setCurrentElapsedTime(0)
    setIsPlaying(false)
    setReplayFacelets('')
    setReplayKey((k) => k + 1)
    if (solve?.gyroData?.[0]) {
      const firstFrame = solve.gyroData[0]
      replayQuaternionRef.current.set(
        firstFrame.quaternion.x,
        firstFrame.quaternion.y,
        firstFrame.quaternion.z,
        firstFrame.quaternion.w,
      )
    }
  }

  const exitReplayMode = () => {
    setIsReplayMode(false)
    setIsPlaying(false)
    setCurrentMoveIndex(-1)
    setCurrentElapsedTime(0)
  }

  const getCurrentPhase = () => {
    if (currentMoveIndex < 0) return null
    return replayPhases.find(
      (p) => currentMoveIndex >= p.startIndex && currentMoveIndex <= p.endIndex,
    )
  }

  const currentPhase = getCurrentPhase()
  const progressPercent = totalMoves > 0 ? ((currentMoveIndex + 1) / totalMoves) * 100 : 0

  const canReplay =
    solve && (solve.gyroData?.length || solve.moveTimings?.length || solve.solution?.length)

  const consolidatedMoveCount = useMemo(() => {
    const solution = solve?.solution || []
    return countConsolidatedMoves(solution)
  }, [solve?.solution])

  const displayTime = isReplayMode ? Math.max(0, currentElapsedTime - timeOffset) : time
  const rawMoveCount = isReplayMode ? Math.max(0, currentMoveIndex + 1) : moves
  const displayMoveCount = isReplayMode ? rawMoveCount : consolidatedMoveCount
  const displayTps = displayTime > 0 ? (rawMoveCount / (displayTime / 1000)).toFixed(2) : '0.00'

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full w-full flex-col">
        {showBackButton && onBack && (
          <div
            className="flex items-center gap-4 px-6 py-4"
            style={{ borderBottom: '1px solid var(--theme-subAlt)' }}
          >
            <button
              onClick={onBack}
              className="rounded-lg p-2 transition-colors hover:opacity-80"
              style={{ color: 'var(--theme-sub)' }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-sm" style={{ color: 'var(--theme-sub)' }}>
              Back to Solve History
            </span>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-1 flex-col items-center gap-2 px-6 pt-6 md:justify-center md:gap-3 md:px-4 md:pt-4"
        >
          {(isManual || solve?.isManual) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-2 flex items-center gap-2 rounded-full px-3 py-1"
              style={{ backgroundColor: 'var(--theme-subAlt)', color: 'var(--theme-sub)' }}
            >
              <span className="text-xs font-medium uppercase tracking-wider">Manual Timer</span>
            </motion.div>
          )}
          <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-2 md:flex-row md:items-center md:gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center md:text-left"
            >
              <div className="flex items-center justify-center gap-1.5 md:justify-between md:min-w-[120px]">
                <span className="text-xs md:text-base" style={{ color: 'var(--theme-sub)' }}>
                  time
                </span>
                {totalTimeGoal !== null && (
                  <div className="flex items-center gap-1">
                    {displayTime <= totalTimeGoal ? (
                      <>
                        <TriangleDown 
                          className="h-2.5 w-2.5 md:h-3 md:w-3" 
                          style={{ color: 'var(--theme-success, #22c55e)' }} 
                        />
                        <span className="text-[10px] md:text-xs" style={{ color: 'var(--theme-success, #22c55e)' }}>
                          -{((totalTimeGoal - displayTime) / 1000).toFixed(1)}s
                        </span>
                      </>
                    ) : (
                      <>
                        <TriangleUp 
                          className="h-2.5 w-2.5 md:h-3 md:w-3" 
                          style={{ color: 'var(--theme-error, #ef4444)' }} 
                        />
                        <span className="text-[10px] md:text-xs" style={{ color: 'var(--theme-error, #ef4444)' }}>
                          +{((displayTime - totalTimeGoal) / 1000).toFixed(1)}s
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div
                className="text-4xl font-bold tabular-nums md:text-6xl"
                style={{ color: 'var(--theme-accent)' }}
              >
                {formatTime(displayTime, time)}
              </div>
              <div className="hidden md:flex md:flex-col md:items-start md:mt-1">
                <span className="text-sm" style={{ color: 'var(--theme-sub)' }}>
                  tps
                </span>
                <span className="text-3xl font-bold" style={{ color: 'var(--theme-text)' }}>
                  {displayTps}
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative flex items-center justify-center"
              style={{ minWidth: 160, minHeight: 160 }}
            >
              {isReplayMode && initialScrambledFacelets ? (
                <div className="flex h-40 w-40 items-center justify-center md:h-56 md:w-56">
                  <CubeViewer
                    key={replayKey}
                    facelets={replayFacelets || initialScrambledFacelets}
                    quaternionRef={replayQuaternionRef}
                    cubeRef={replayCubeRef}
                    config={{
                      ...DEFAULT_CONFIG,
                      camera: {
                        ...DEFAULT_CONFIG.camera,
                        fov: 26,
                      },
                    }}
                    animationSpeed={30}
                    enableZoom={false}
                  />
                </div>
              ) : (scramble || solve?.scramble) ? (
                <div className="py-4 md:py-0">
                  <CubeNet scramble={scramble || solve?.scramble || ''} />
                </div>
              ) : null}
            </motion.div>

            {analysis && !isManual && !solve?.isManual && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="hidden flex-1 flex-col gap-2 md:flex"
                style={{ maxWidth: '400px' }}
              >
                <div className="mb-1 flex items-center justify-end gap-3">
                  <div
                    className="flex items-center gap-2 text-[10px]"
                    style={{ color: 'var(--theme-sub)' }}
                  >
                    <div className="flex items-center gap-1">
                      <div
                        className="h-1.5 w-3 rounded-sm opacity-40"
                        style={{ backgroundColor: 'var(--theme-text)' }}
                      />
                      <span>rec</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div
                        className="h-1.5 w-3 rounded-sm opacity-90"
                        style={{ backgroundColor: 'var(--theme-text)' }}
                      />
                      <span>exec</span>
                    </div>
                  </div>
                  <div className="flex rounded overflow-hidden" style={{ backgroundColor: 'var(--theme-subAlt)' }}>
                    <button
                      onClick={() => setDisplayMode('moves')}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] transition-colors"
                      style={{
                        backgroundColor: displayMode === 'moves' ? 'var(--theme-accent)' : 'transparent',
                        color: displayMode === 'moves' ? 'var(--theme-bg)' : 'var(--theme-sub)',
                      }}
                    >
                      <Hash className="h-2.5 w-2.5" />
                    </button>
                    <button
                      onClick={() => setDisplayMode('time')}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] transition-colors"
                      style={{
                        backgroundColor: displayMode === 'time' ? 'var(--theme-accent)' : 'transparent',
                        color: displayMode === 'time' ? 'var(--theme-bg)' : 'var(--theme-sub)',
                      }}
                    >
                      <Clock className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex w-full gap-1">
                  {phases
                    .filter((phase) => phase.moves > 0)
                    .map((phase) => (
                      <VerticalBar
                        key={phase.label}
                        label={phase.label}
                        moves={phase.moves}
                        recognitionTime={phase.recognitionTime}
                        executionTime={phase.executionTime}
                        maxMoves={maxMoves}
                        maxDuration={maxDuration}
                        duration={phase.duration}
                        phaseColor={`var(${phase.colorVar})`}
                        goal={phase.goal}
                        displayMode={displayMode}
                        hideRecognition={phase.hideRecognition}
                      />
                    ))}
                </div>
              </motion.div>
            )}
          </div>

          {!isManual && !solve?.isManual && (
          <AnimatePresence mode="wait">
            {isReplayMode ? (
              <motion.div
                key="replay"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex w-full max-w-4xl flex-col gap-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 md:gap-3">
                    {currentPhase && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white md:px-3 md:py-1 md:text-sm"
                        style={{ backgroundColor: currentPhase.color }}
                      >
                        {currentPhase.name}
                      </span>
                    )}
                    <span className="text-[10px] md:text-sm" style={{ color: 'var(--theme-sub)' }}>
                      {currentMoveIndex < 0
                        ? 'Scrambled'
                        : currentMoveIndex >= totalMoves - 1
                          ? 'Solved'
                          : `Move ${currentMoveIndex + 1} of ${totalMoves}`}
                    </span>
                    {currentMoveIndex >= 0 && currentMoveIndex < totalMoves && (
                      <span
                        className="font-mono text-sm font-bold md:text-lg"
                        style={{ color: 'var(--theme-text)' }}
                      >
                        {allMoves[currentMoveIndex]}
                      </span>
                    )}
                  </div>

                  {hasGyroData && (
                    <label
                      className="flex items-center gap-2 text-xs"
                      style={{ color: 'var(--theme-sub)' }}
                    >
                      <input
                        type="checkbox"
                        checked={enableGyro}
                        onChange={(e) => setEnableGyro(e.target.checked)}
                        className="h-3 w-3 rounded"
                        style={{ accentColor: 'var(--theme-accent)' }}
                      />
                      Gyroscope
                    </label>
                  )}
                </div>

                <div className="relative flex h-2 w-full items-center gap-1">
                  {replayPhases.map((phase) => (
                    <div
                      key={phase.name}
                      className="relative flex h-full cursor-pointer overflow-hidden rounded-full transition-opacity hover:opacity-80"
                      style={{ width: `${phase.widthPercent}%` }}
                      onClick={() => handleSeek(phase.startIndex)}
                      title={phase.name}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: `${phase.recognitionRatio * 100}%`,
                          backgroundColor: phase.color,
                          opacity: 0.4,
                        }}
                      />
                      <div
                        className="h-full flex-1"
                        style={{
                          backgroundColor: phase.color,
                          opacity: 0.9,
                        }}
                      />
                    </div>
                  ))}

                  <div
                    className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-white shadow-lg transition-all"
                    style={{
                      left: `${progressPercent}%`,
                      transform: `translateX(-50%) translateY(-50%)`,
                    }}
                  />

                  <input
                    type="range"
                    min={-1}
                    max={totalMoves - 1}
                    value={currentMoveIndex}
                    onChange={(e) => handleSeek(parseInt(e.target.value))}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={resetReplay}
                    className="rounded-lg p-1.5 transition-colors hover:opacity-80"
                    style={{ color: 'var(--theme-sub)' }}
                    title="Reset"
                  >
                    <SkipBack className="h-3 w-3" />
                  </button>
                  <button
                    onClick={stepBack}
                    disabled={currentMoveIndex < 0}
                    className="rounded-lg p-1.5 transition-colors disabled:opacity-30"
                    style={{ color: 'var(--theme-sub)' }}
                    title="Step Back"
                  >
                    <SkipBack className="h-2.5 w-2.5" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="rounded-full p-2 transition-colors"
                    style={{
                      backgroundColor: 'var(--theme-accent)',
                      color: 'var(--theme-bg)',
                    }}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={stepForward}
                    disabled={currentMoveIndex >= totalMoves - 1}
                    className="rounded-lg p-1.5 transition-colors disabled:opacity-30"
                    style={{ color: 'var(--theme-sub)' }}
                    title="Step Forward"
                  >
                    <SkipForward className="h-2.5 w-2.5" />
                  </button>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                    className="rounded-lg border-0 px-2 py-0.5 text-xs outline-none"
                    style={{
                      backgroundColor: 'var(--theme-subAlt)',
                      color: 'var(--theme-text)',
                    }}
                  >
                    <option value={1000}>0.5x</option>
                    <option value={500}>1x</option>
                    <option value={250}>2x</option>
                    <option value={100}>5x</option>
                  </select>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, delay: 0.4 }}
                className="flex w-full max-w-4xl flex-col gap-3"
              >
                {/* Mobile: horizontal layout */}
                <div className="flex items-center justify-center gap-6 md:hidden">
                  <StatCard label="moves" value={displayMoveCount.toString()} />
                  <StatCard label="tps" value={displayTps} />
                </div>
                <div className="flex items-center justify-center gap-4 md:hidden">
                  <PhaseStatCard
                    label="cross"
                    moves={crossMoves}
                    duration={crossDuration}
                    tps={crossTps}
                    recognitionTime={0}
                    executionTime={phaseTimings?.cross.executionTime ?? crossDuration}
                    displayMode={displayMode}
                    goal={goals.cross}
                    hideRecognition
                    crossColor={analysis?.crossColor}
                  />
                  <PhaseStatCard
                    label="f2l"
                    moves={f2lMoves}
                    duration={f2lDuration}
                    tps={f2lTps}
                    recognitionTime={phaseTimings?.aggregated.f2l.recognitionTime ?? 0}
                    executionTime={phaseTimings?.aggregated.f2l.executionTime ?? f2lDuration}
                    displayMode={displayMode}
                    goal={goals.f2l}
                  />
                  <PhaseStatCard
                    label="oll"
                    moves={ollMoves}
                    duration={ollDuration}
                    tps={ollTps}
                    recognitionTime={phaseTimings?.oll.recognitionTime ?? 0}
                    executionTime={phaseTimings?.oll.executionTime ?? ollDuration}
                    displayMode={displayMode}
                    goal={goals.oll}
                  />
                  <PhaseStatCard
                    label="pll"
                    moves={pllMoves}
                    duration={pllDuration}
                    tps={pllTps}
                    recognitionTime={phaseTimings?.pll.recognitionTime ?? 0}
                    executionTime={phaseTimings?.pll.executionTime ?? pllDuration}
                    displayMode={displayMode}
                    goal={goals.pll}
                  />
                </div>

                {/* Desktop: centered single row with all stats */}
                <div className="hidden md:flex md:items-center md:justify-center md:gap-8">
                  <StatCard label="moves" value={displayMoveCount.toString()} />
                  <PhaseStatCard
                    label="cross"
                    moves={crossMoves}
                    duration={crossDuration}
                    tps={crossTps}
                    recognitionTime={0}
                    executionTime={phaseTimings?.cross.executionTime ?? crossDuration}
                    displayMode={displayMode}
                    goal={goals.cross}
                    hideRecognition
                    crossColor={analysis?.crossColor}
                  />
                  <PhaseStatCard
                    label="f2l"
                    moves={f2lMoves}
                    duration={f2lDuration}
                    tps={f2lTps}
                    recognitionTime={phaseTimings?.aggregated.f2l.recognitionTime ?? 0}
                    executionTime={phaseTimings?.aggregated.f2l.executionTime ?? f2lDuration}
                    displayMode={displayMode}
                    goal={goals.f2l}
                  />
                  <PhaseStatCard
                    label="oll"
                    moves={ollMoves}
                    duration={ollDuration}
                    tps={ollTps}
                    recognitionTime={phaseTimings?.oll.recognitionTime ?? 0}
                    executionTime={phaseTimings?.oll.executionTime ?? ollDuration}
                    displayMode={displayMode}
                    goal={goals.oll}
                  />
                  <PhaseStatCard
                    label="pll"
                    moves={pllMoves}
                    duration={pllDuration}
                    tps={pllTps}
                    recognitionTime={phaseTimings?.pll.recognitionTime ?? 0}
                    executionTime={phaseTimings?.pll.executionTime ?? pllDuration}
                    displayMode={displayMode}
                    goal={goals.pll}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          )}

          {!isManual && !solve?.isManual && (
          <MobileCFOPBreakdown
            crossMoves={crossMoves}
            f2lSlots={[
              { moves: f2l1Moves, duration: f2l1Duration, recognitionTime: phaseTimings?.f2l[0]?.recognitionTime ?? 0, executionTime: phaseTimings?.f2l[0]?.executionTime ?? f2l1Duration },
              { moves: f2l2Moves, duration: f2l2Duration, recognitionTime: phaseTimings?.f2l[1]?.recognitionTime ?? 0, executionTime: phaseTimings?.f2l[1]?.executionTime ?? f2l2Duration },
              { moves: f2l3Moves, duration: f2l3Duration, recognitionTime: phaseTimings?.f2l[2]?.recognitionTime ?? 0, executionTime: phaseTimings?.f2l[2]?.executionTime ?? f2l3Duration },
              { moves: f2l4Moves, duration: f2l4Duration, recognitionTime: phaseTimings?.f2l[3]?.recognitionTime ?? 0, executionTime: phaseTimings?.f2l[3]?.executionTime ?? f2l4Duration },
            ]}
            ollMoves={ollMoves}
            pllMoves={pllMoves}
            crossDuration={crossDuration}
            ollDuration={ollDuration}
            pllDuration={pllDuration}
            crossExecution={phaseTimings?.cross.executionTime ?? crossDuration}
            ollRecognition={phaseTimings?.oll.recognitionTime ?? 0}
            ollExecution={phaseTimings?.oll.executionTime ?? ollDuration}
            pllRecognition={phaseTimings?.pll.recognitionTime ?? 0}
            pllExecution={phaseTimings?.pll.executionTime ?? pllDuration}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            goals={{
              cross: goals.cross,
              f2l: goals.f2l,
              oll: goals.oll,
              pll: goals.pll,
            }}
          />
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 flex items-center gap-4 md:mt-8"
          >
            <ActionButton icon={ChevronRight} onClick={onNextScramble} label="Next Scramble" />
            <ActionButton icon={RotateCcw} onClick={onRepeatScramble} label="Repeat Scramble" />
            {(solveId || solve?.id) && (
              <ActionButton 
                icon={Share2} 
                onClick={handleShare} 
                label="Share Solve" 
              />
            )}
            {!isManual && !solve?.isManual && (
              <>
                <ActionButton icon={Copy} onClick={() => setShowCopyModal(true)} label="Copy" />
                {canReplay ? (
                  <ActionButton
                    icon={isReplayMode ? Pause : Play}
                    onClick={isReplayMode ? exitReplayMode : enterReplayMode}
                    label={isReplayMode ? 'Exit Replay' : 'Watch Replay'}
                    active={isReplayMode}
                  />
                ) : (
                  <ActionButton icon={Play} onClick={onWatchReplay} label="Watch Replay" />
                )}
              </>
            )}
            {onDeleteSolve && (solveId || solve?.id) && (
              <ActionButton 
                icon={Trash2} 
                onClick={() => setShowDeleteConfirm(true)} 
                label="Delete Solve" 
              />
            )}
          </motion.div>
        </motion.div>
      </div>

      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          const id = solveId || solve?.id
          if (id && onDeleteSolve) {
            onDeleteSolve(id)
          }
        }}
      />

      <CopyModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onCopySolution={handleCopySolution}
        onCopyScramble={handleCopyScramble}
      />

      {isReplayMode && (
        <DebugCubeOverlay
          cubeFaces={replayCubeFaces}
          isOpen={isDebugMode}
          onClose={() => setIsDebugMode(false)}
        />
      )}
    </TooltipProvider>
  )
}
