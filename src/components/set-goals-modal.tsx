import { X, Target, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useGoals } from '@/contexts/GoalsContext'
import { GOAL_PRESETS, TOTAL_TIME_PRESETS, type CFOPGoals } from '@/types/goals'

interface SetGoalsModalProps {
  isOpen: boolean
  onClose: () => void
}

const PRESET_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'sub-20', label: 'Sub-20' },
  { value: 'sub-15', label: 'Sub-15' },
  { value: 'custom', label: 'Custom' },
]

const PHASES: { key: keyof CFOPGoals; label: string; color: string }[] = [
  { key: 'cross', label: 'Cross', color: 'var(--theme-cross)' },
  { key: 'f2l', label: 'F2L (Total)', color: 'var(--theme-f2l)' },
  { key: 'oll', label: 'OLL', color: 'var(--theme-oll)' },
  { key: 'pll', label: 'PLL', color: 'var(--theme-pll)' },
]

export function SetGoalsModal({ isOpen, onClose }: SetGoalsModalProps) {
  const { goals, preset, totalTime, setGoals } = useGoals()
  const [localGoals, setLocalGoals] = useState<CFOPGoals>(goals)
  const [selectedPreset, setSelectedPreset] = useState<string>(preset || 'intermediate')
  const [localTotalTime, setLocalTotalTime] = useState<number | null>(totalTime)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLocalGoals(goals)
      setSelectedPreset(preset || 'custom')
      setLocalTotalTime(totalTime)
    }
  }, [isOpen, goals, preset, totalTime])

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
      await setGoals(localGoals, selectedPreset === 'custom' ? null : selectedPreset, localTotalTime)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative w-full max-w-lg p-6 shadow-lg duration-200 animate-in fade-in zoom-in-95 md:rounded-lg"
        style={{
          backgroundColor: 'var(--theme-bgSecondary)',
          border: '1px solid var(--theme-subAlt)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
          style={{ color: 'var(--theme-sub)' }}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
              Set CFOP Goals
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
              Preset
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: 'var(--theme-bg)',
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

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2 text-xs font-medium" style={{ color: 'var(--theme-sub)' }}>
              <span>Phase</span>
              <span className="text-center">Moves</span>
              <span className="text-center">Time (s)</span>
            </div>

            {PHASES.map(({ key, label, color }) => (
              <div key={key} className="grid grid-cols-3 items-center gap-2">
                <span className="text-sm font-medium" style={{ color }}>
                  {label}
                </span>
                <input
                  type="number"
                  min={1}
                  value={localGoals[key].moves}
                  onChange={(e) => handleInputChange(key, 'moves', e.target.value)}
                  className="w-full rounded-md px-3 py-1.5 text-center text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    color: 'var(--theme-text)',
                    border: '1px solid var(--theme-subAlt)',
                  }}
                />
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={(localGoals[key].time / 1000).toFixed(1)}
                  onChange={(e) => handleInputChange(key, 'time', e.target.value)}
                  className="w-full rounded-md px-3 py-1.5 text-center text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    color: 'var(--theme-text)',
                    border: '1px solid var(--theme-subAlt)',
                  }}
                />
              </div>
            ))}
          </div>

          <div
            className="rounded-lg p-4"
            style={{
              backgroundColor: 'var(--theme-bg)',
              border: '1px solid var(--theme-subAlt)',
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                  Total Time Goal
                </span>
                <span className="text-xs" style={{ color: 'var(--theme-sub)' }}>
                  Works for all methods including manual timer
                </span>
              </div>
              <div className="flex items-center gap-2">
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
                  className="w-20 rounded-md px-3 py-1.5 text-center text-sm outline-none"
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

          <div className="flex justify-end gap-3 pt-2">
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
    </div>
  )
}
