import { X, Target, Loader2, TrendingUp, Clock, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useMemo } from 'react'
import { useGoals } from '@/contexts/GoalsContext'
import { useToast } from '@/contexts/ToastContext'
import { computeDynamicGoals } from '@/lib/dynamic-goals'
import { GOAL_PRESETS, TOTAL_TIME_PRESETS, type CFOPGoals, type AverageGoalType } from '@/types/goals'
import type { Solve } from '@/types'

interface SetGoalsModalProps {
  isOpen: boolean
  onClose: () => void
  solves?: Solve[]
}

const PRESET_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'sub-20', label: 'Sub-20' },
  { value: 'sub-15', label: 'Sub-15' },
  { value: 'custom', label: 'Custom' },
]

const AVERAGE_OPTIONS: { value: AverageGoalType; label: string; minSolves: number }[] = [
  { value: 'fixed', label: 'Fixed', minSolves: 0 },
  { value: 'ao5', label: 'Ao5', minSolves: 5 },
  { value: 'ao12', label: 'Ao12', minSolves: 12 },
  { value: 'ao50', label: 'Ao50', minSolves: 50 },
  { value: 'ao100', label: 'Ao100', minSolves: 100 },
]

const PHASES: { key: keyof CFOPGoals; label: string; color: string }[] = [
  { key: 'cross', label: 'Cross', color: 'var(--theme-cross)' },
  { key: 'f2l', label: 'F2L', color: 'var(--theme-f2l)' },
  { key: 'oll', label: 'OLL', color: 'var(--theme-oll)' },
  { key: 'pll', label: 'PLL', color: 'var(--theme-pll)' },
]

export function SetGoalsModal({ isOpen, onClose, solves = [] }: SetGoalsModalProps) {
  const { goals, preset, totalTime, averageGoalType, setGoals } = useGoals()
  const { showToast } = useToast()
  const [localGoals, setLocalGoals] = useState<CFOPGoals>(goals)
  const [selectedPreset, setSelectedPreset] = useState<string>(preset || 'intermediate')
  const [localTotalTime, setLocalTotalTime] = useState<number | null>(totalTime)
  const [localAverageGoalType, setLocalAverageGoalType] = useState<AverageGoalType>(averageGoalType)
  const [isSaving, setIsSaving] = useState(false)

  const solveCount = useMemo(() => solves.filter(s => !s.dnf).length, [solves])

  const averageData = useMemo(
    () => computeDynamicGoals(solves, localAverageGoalType),
    [localAverageGoalType, solves]
  )

  useEffect(() => {
    if (isOpen) {
      setLocalGoals(goals)
      setSelectedPreset(preset || 'custom')
      setLocalTotalTime(totalTime)
      setLocalAverageGoalType(averageGoalType)
    }
  }, [isOpen, goals, preset, totalTime, averageGoalType])

  if (!isOpen) return null

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName)
    if (presetName !== 'custom' && GOAL_PRESETS[presetName]) {
      setLocalGoals(GOAL_PRESETS[presetName])
      setLocalTotalTime(TOTAL_TIME_PRESETS[presetName] ?? null)
    }
  }

  const handleInputChange = (phase: keyof CFOPGoals, field: 'moves' | 'time', value: string) => {
    const numValue = field === 'time' ? parseFloat(value) * 1000 : parseInt(value, 10)
    if (isNaN(numValue)) return

    setSelectedPreset('custom')
    setLocalGoals((prev) => ({
      ...prev,
      [phase]: {
        ...prev[phase],
        [field]: numValue,
      },
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await setGoals(localGoals, selectedPreset === 'custom' ? null : selectedPreset, localTotalTime, localAverageGoalType)
      showToast(localAverageGoalType === 'fixed' ? 'Goals saved!' : `${localAverageGoalType.toUpperCase()} goals activated!`, 'success')
      onClose()
    } catch {
      showToast('Failed to save goals', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const isAverageDisabled = (minSolves: number) => solveCount < minSolves

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg duration-200 animate-in fade-in zoom-in-95 rounded-xl"
        style={{
          backgroundColor: 'var(--theme-bgSecondary)',
          border: '1px solid var(--theme-subAlt)',
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b" style={{ backgroundColor: 'var(--theme-bgSecondary)', borderColor: 'var(--theme-subAlt)' }}>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
              Goal Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-[var(--theme-subAlt)]"
            style={{ color: 'var(--theme-sub)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: 'var(--theme-bg)', border: '1px solid var(--theme-subAlt)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                Goal Mode
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVERAGE_OPTIONS.map((opt) => {
                const disabled = isAverageDisabled(opt.minSolves)
                return (
                  <button
                    key={opt.value}
                    onClick={() => !disabled && setLocalAverageGoalType(opt.value)}
                    disabled={disabled}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                    style={{
                      backgroundColor: localAverageGoalType === opt.value ? 'var(--theme-accent)' : 'var(--theme-subAlt)',
                      color: localAverageGoalType === opt.value ? 'var(--theme-bg)' : 'var(--theme-sub)',
                      opacity: disabled ? 0.4 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                    title={disabled ? `Need ${opt.minSolves} solves (you have ${solveCount})` : ''}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs" style={{ color: 'var(--theme-sub)' }}>
              {localAverageGoalType === 'fixed' 
                ? 'Set specific target times and moves for each phase' 
                : `Beat your current ${localAverageGoalType.toUpperCase()} for total time and each CFOP phase`}
            </p>
          </div>

          {localAverageGoalType === 'fixed' && (
            <>
              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: 'var(--theme-bg)', border: '1px solid var(--theme-subAlt)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                    Preset
                  </span>
                </div>
                <select
                  value={selectedPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--theme-bgSecondary)',
                    color: 'var(--theme-text)',
                    border: '1px solid var(--theme-subAlt)',
                  }}
                >
                  {PRESET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: 'var(--theme-bg)', border: '1px solid var(--theme-subAlt)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                    CFOP Phase Goals
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_60px_70px] gap-2 text-[10px] font-medium uppercase tracking-wide px-1" style={{ color: 'var(--theme-sub)' }}>
                    <span>Phase</span>
                    <span className="text-center">Moves</span>
                    <span className="text-center">Time</span>
                  </div>

                  {PHASES.map(({ key, label, color }) => (
                    <div key={key} className="grid grid-cols-[1fr_60px_70px] items-center gap-2">
                      <span className="text-sm font-medium px-1" style={{ color }}>
                        {label}
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={localGoals[key].moves}
                        onChange={(e) => handleInputChange(key, 'moves', e.target.value)}
                        className="w-full rounded-lg px-2 py-1.5 text-center text-sm outline-none"
                        style={{
                          backgroundColor: 'var(--theme-bgSecondary)',
                          color: 'var(--theme-text)',
                          border: '1px solid var(--theme-subAlt)',
                        }}
                      />
                      <div className="relative">
                        <input
                          type="number"
                          min={0.1}
                          step={0.1}
                          value={(localGoals[key].time / 1000).toFixed(1)}
                          onChange={(e) => handleInputChange(key, 'time', e.target.value)}
                          className="w-full rounded-lg px-2 py-1.5 text-center text-sm outline-none pr-5"
                          style={{
                            backgroundColor: 'var(--theme-bgSecondary)',
                            color: 'var(--theme-text)',
                            border: '1px solid var(--theme-subAlt)',
                          }}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: 'var(--theme-sub)' }}>s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="rounded-lg p-3"
                style={{ backgroundColor: 'var(--theme-bg)', border: '1px solid var(--theme-subAlt)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                      Total Time Goal
                    </span>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--theme-sub)' }}>
                      Works with manual timer too
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={localTotalTime !== null ? Math.round(localTotalTime / 1000) : ''}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '') {
                          setLocalTotalTime(null)
                        } else {
                          const numVal = parseInt(val, 10) * 1000
                          if (!isNaN(numVal) && numVal > 0) {
                            setLocalTotalTime(numVal)
                          }
                        }
                      }}
                      placeholder="—"
                      className="w-16 rounded-lg px-2 py-1.5 text-center text-sm outline-none"
                      style={{
                        backgroundColor: 'var(--theme-bgSecondary)',
                        color: 'var(--theme-text)',
                        border: '1px solid var(--theme-subAlt)',
                      }}
                    />
                    <span className="text-xs" style={{ color: 'var(--theme-sub)' }}>sec</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {localAverageGoalType !== 'fixed' && (
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: 'var(--theme-bg)', border: '1px solid var(--theme-accent)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                  Current {localAverageGoalType.toUpperCase()} Targets
                </span>
              </div>
              
              {averageData ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-[1fr_60px_70px] gap-2 text-[10px] font-medium uppercase tracking-wide px-1" style={{ color: 'var(--theme-sub)' }}>
                    <span>Phase</span>
                    <span className="text-center">Moves</span>
                    <span className="text-center">Time</span>
                  </div>
                  
                  {PHASES.map(({ key, label, color }) => {
                    const data = averageData[key]
                    return (
                      <div key={key} className="grid grid-cols-[1fr_60px_70px] items-center gap-2">
                        <span className="text-sm font-medium px-1" style={{ color }}>
                          {label}
                        </span>
                        <span className="text-center text-sm font-mono" style={{ color: 'var(--theme-text)' }}>
                          {data ? data.moves : '—'}
                        </span>
                        <span className="text-center text-sm font-mono" style={{ color: 'var(--theme-text)' }}>
                          {data ? `${(data.time / 1000).toFixed(1)}s` : '—'}
                        </span>
                      </div>
                    )
                  })}
                  
                  <div className="pt-2 mt-2 border-t" style={{ borderColor: 'var(--theme-subAlt)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'var(--theme-accent)' }}>
                        Total Time
                      </span>
                      <span className="text-lg font-bold font-mono" style={{ color: 'var(--theme-text)' }}>
                        {averageData.totalTime !== null ? `${(averageData.totalTime / 1000).toFixed(2)}s` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-center py-2" style={{ color: 'var(--theme-sub)' }}>
                  Not enough smart cube solves with timing data for {localAverageGoalType.toUpperCase()}
                </p>
              )}
              
              <p className="text-[10px] mt-3 text-center" style={{ color: 'var(--theme-sub)' }}>
                Beat these times to see green indicators on your solve results
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 p-4 border-t" style={{ backgroundColor: 'var(--theme-bgSecondary)', borderColor: 'var(--theme-subAlt)' }}>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Goals'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
