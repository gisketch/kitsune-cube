import { useEffect, useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { type CubeFaces, COLOR_HEX, type Color } from '@/lib/cube-faces'
import { detectCurrentPhase, type CurrentCFOPPhase, type CFOPPhaseName } from '@/lib/cfop-analyzer'

interface DebugCubeOverlayProps {
  cubeFaces: CubeFaces
  isOpen: boolean
  onClose: () => void
}

const PHASE_COLORS: Record<CFOPPhaseName, string> = {
  'cross': 'var(--theme-phaseCross)',
  'f2l-1': 'var(--theme-phaseF2L1)',
  'f2l-2': 'var(--theme-phaseF2L2)',
  'f2l-3': 'var(--theme-phaseF2L3)',
  'f2l-4': 'var(--theme-phaseF2L4)',
  'oll': 'var(--theme-phaseOLL)',
  'pll': 'var(--theme-phasePLL)',
  'solved': 'var(--theme-cubeGreen)',
  'scrambled': 'var(--theme-sub)',
}

const PHASE_LABELS: Record<CFOPPhaseName, string> = {
  'cross': 'CROSS',
  'f2l-1': 'F2L #1',
  'f2l-2': 'F2L #2',
  'f2l-3': 'F2L #3',
  'f2l-4': 'F2L #4',
  'oll': 'OLL',
  'pll': 'PLL',
  'solved': 'SOLVED',
  'scrambled': 'SCRAMBLED',
}

function FaceGrid({ colors }: { colors: Color[] }) {
  return (
    <div className="grid grid-cols-3 gap-[2px]">
      {colors.map((color, idx) => (
        <div
          key={idx}
          className="h-4 w-4 flex-shrink-0 rounded-[2px]"
          style={{ backgroundColor: COLOR_HEX[color] }}
        />
      ))}
    </div>
  )
}

function CrossColorIndicator({ color }: { color: Color | null }) {
  if (!color) return null
  return (
    <div
      className="h-3 w-3 rounded-[2px]"
      style={{ backgroundColor: COLOR_HEX[color] }}
    />
  )
}

function PhaseIndicator({ phase }: { phase: CurrentCFOPPhase }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold" style={{ color: 'var(--theme-sub)' }}>
          PHASE
        </span>
        <span 
          className="rounded px-1.5 py-0.5 text-[10px] font-bold"
          style={{ 
            backgroundColor: PHASE_COLORS[phase.phase],
            color: phase.phase === 'solved' ? 'var(--theme-bg)' : 'var(--theme-text)',
          }}
        >
          {PHASE_LABELS[phase.phase]}
        </span>
      </div>
      
      {phase.crossColor && (
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: 'var(--theme-sub)' }}>Cross</span>
          <CrossColorIndicator color={phase.crossColor} />
        </div>
      )}
      
      <div className="flex items-center gap-1">
        <span className="text-[10px]" style={{ color: 'var(--theme-sub)' }}>F2L</span>
        {phase.f2lSlotsSolved.map((solved, i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full"
            style={{ 
              backgroundColor: solved ? 'var(--theme-cubeGreen)' : 'var(--theme-subAlt)',
            }}
          />
        ))}
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px]" style={{ color: 'var(--theme-sub)' }}>OLL</span>
          <div
            className="h-2 w-2 rounded-full"
            style={{ 
              backgroundColor: phase.ollSolved ? 'var(--theme-cubeGreen)' : 'var(--theme-subAlt)',
            }}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px]" style={{ color: 'var(--theme-sub)' }}>PLL</span>
          <div
            className="h-2 w-2 rounded-full"
            style={{ 
              backgroundColor: phase.pllSolved ? 'var(--theme-cubeGreen)' : 'var(--theme-subAlt)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function DebugCubeOverlay({ cubeFaces, isOpen, onClose }: DebugCubeOverlayProps) {
  const currentPhase = useMemo(() => detectCurrentPhase(cubeFaces), [cubeFaces])

  if (!isOpen) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] rounded-lg p-3 shadow-xl"
      style={{ 
        backgroundColor: 'var(--theme-bg)', 
        border: '2px solid var(--theme-accent)',
        opacity: 0.95
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-xs font-bold" style={{ color: 'var(--theme-accent)' }}>
          🔧 DEV MODE
        </span>
        <button
          onClick={onClose}
          className="rounded p-0.5 transition-colors hover:opacity-80"
          style={{ color: 'var(--theme-sub)' }}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      
      <div className="flex gap-4">
        {/* Cube Net - matching ScrambleWidget layout */}
        <div className="flex flex-shrink-0 flex-col gap-[2px]">
          {/* Row 1: U face aligned with F */}
          <div className="flex gap-[2px]">
            <div className="w-[52px]" />
            <FaceGrid colors={cubeFaces.U} />
          </div>

          {/* Row 2: L, F, R, B in a row */}
          <div className="flex flex-shrink-0 gap-[2px]">
            <FaceGrid colors={cubeFaces.L} />
            <FaceGrid colors={cubeFaces.F} />
            <FaceGrid colors={cubeFaces.R} />
            <FaceGrid colors={cubeFaces.B} />
          </div>

          {/* Row 3: D face aligned with F */}
          <div className="flex gap-[2px]">
            <div className="w-[52px]" />
            <FaceGrid colors={cubeFaces.D} />
          </div>
        </div>

        {/* CFOP Phase Status */}
        <PhaseIndicator phase={currentPhase} />
      </div>

      <div className="mt-2 text-[8px]" style={{ color: 'var(--theme-sub)' }}>
        Toggle: Ctrl+Shift+L
      </div>
    </div>
  )
}

export function useDebugMode() {
  const [isDebugMode, setIsDebugMode] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        setIsDebugMode(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { isDebugMode, setIsDebugMode }
}
