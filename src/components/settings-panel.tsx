import { useState } from 'react'
import { Upload, Loader2, Cloud, CloudOff, List } from 'lucide-react'
import { useSettings, type SolvesPerPage } from '@/hooks/useSettings'
import { useAuth } from '@/contexts/AuthContext'
import { themes, themeKeys, getCubeColors, type CubeTheme } from '@/lib/themes'

interface SettingsPanelProps {
  onMigrateToCloud?: () => Promise<{ success: boolean; count: number }>
  isCloudSync?: boolean
}

const cubeThemeOptions: { value: CubeTheme; label: string }[] = [
  { value: 'current', label: 'Use Current Theme' },
  { value: 'standard', label: 'Standard (Competition)' },
  ...themeKeys.map((key) => ({ value: key as CubeTheme, label: themes[key].name })),
]

const SOLVES_PER_PAGE_OPTIONS: SolvesPerPage[] = [10, 20, 50, 100]

export function SettingsPanel({ onMigrateToCloud, isCloudSync }: SettingsPanelProps) {
  const { settings, updateSetting, resetSettings } = useSettings()
  const { user } = useAuth()
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<string | null>(null)

  const cubeColors = getCubeColors(settings.cubeTheme, settings.theme)

  const handleMigrate = async () => {
    if (!onMigrateToCloud) return
    setIsMigrating(true)
    setMigrationResult(null)

    try {
      const result = await onMigrateToCloud()
      if (result.success) {
        setMigrationResult(
          result.count > 0
            ? `Successfully migrated ${result.count} solves to cloud!`
            : 'No local solves to migrate'
        )
      } else {
        setMigrationResult('Migration failed. Please try again.')
      }
    } catch {
      setMigrationResult('Migration failed. Please try again.')
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl overflow-y-auto px-4 py-4 md:px-8 pb-8">
      <h2 className="mb-6 text-xl font-semibold" style={{ color: 'var(--theme-text)' }}>
        Settings
      </h2>

      <div className="space-y-6">
        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--theme-bgSecondary)' }}>
          <h3
            className="mb-4 text-sm font-medium uppercase tracking-wider"
            style={{ color: 'var(--theme-sub)' }}
          >
            Theme
          </h3>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {themeKeys.map((key) => {
              const theme = themes[key]
              const isActive = settings.theme === key
              return (
                <button
                  key={key}
                  onClick={() => updateSetting('theme', key)}
                  className="group relative flex flex-col items-start gap-2 rounded-lg p-3 transition-all"
                  style={{
                    backgroundColor: theme.colors.bg,
                    border: isActive ? `2px solid ${theme.colors.accent}` : '2px solid transparent',
                  }}
                >
                  <div className="flex gap-1">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: theme.colors.main }}
                    />
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: theme.colors.sub }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: theme.colors.text }}>
                    {theme.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--theme-bgSecondary)' }}>
          <h3
            className="mb-4 text-sm font-medium uppercase tracking-wider"
            style={{ color: 'var(--theme-sub)' }}
          >
            Cube Colors
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <div
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: cubeColors.cubeWhite }}
                />
                <div
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: cubeColors.cubeYellow }}
                />
                <div
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: cubeColors.cubeGreen }}
                />
                <div className="h-6 w-6 rounded" style={{ backgroundColor: cubeColors.cubeBlue }} />
                <div className="h-6 w-6 rounded" style={{ backgroundColor: cubeColors.cubeRed }} />
                <div
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: cubeColors.cubeOrange }}
                />
              </div>
            </div>

            <select
              value={settings.cubeTheme}
              onChange={(e) => updateSetting('cubeTheme', e.target.value as CubeTheme)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{
                backgroundColor: 'var(--theme-subAlt)',
                color: 'var(--theme-text)',
                border: '1px solid var(--theme-sub)',
              }}
            >
              {cubeThemeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <p className="text-xs" style={{ color: 'var(--theme-sub)' }}>
              Choose how the cube colors appear in the 3D view, scramble display, and solve history.
              "Standard" uses official competition colors.
            </p>
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--theme-bgSecondary)' }}>
          <h3
            className="mb-4 text-sm font-medium uppercase tracking-wider"
            style={{ color: 'var(--theme-sub)' }}
          >
            Animation
          </h3>

          <div className="space-y-4">
            <div>
              <label className="mb-2 flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--theme-text)' }}>
                  Turn Animation Speed
                </span>
                <span className="text-sm" style={{ color: 'var(--theme-sub)' }}>
                  {settings.animationSpeed}
                </span>
              </label>
              <input
                type="range"
                min={5}
                max={50}
                value={settings.animationSpeed}
                onChange={(e) => updateSetting('animationSpeed', parseInt(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg"
                style={{ backgroundColor: 'var(--theme-subAlt)' }}
              />
              <div
                className="mt-1 flex justify-between text-xs"
                style={{ color: 'var(--theme-sub)' }}
              >
                <span>Slow</span>
                <span>Fast</span>
              </div>
            </div>

            <div className="text-xs" style={{ color: 'var(--theme-sub)' }}>
              Higher values make cube animations faster. If you're a fast solver, increase this to
              prevent animation lag.
            </div>
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--theme-bgSecondary)' }}>
          <h3
            className="mb-4 text-sm font-medium uppercase tracking-wider"
            style={{ color: 'var(--theme-sub)' }}
          >
            Timer
          </h3>

          <div className="space-y-4">
            <div>
              <label className="mb-2 flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--theme-text)' }}>
                  Hold Threshold
                </span>
                <span className="text-sm" style={{ color: 'var(--theme-sub)' }}>
                  {settings.holdThreshold}ms
                </span>
              </label>
              <input
                type="range"
                min={100}
                max={700}
                step={50}
                value={settings.holdThreshold}
                onChange={(e) => updateSetting('holdThreshold', parseInt(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg"
                style={{ backgroundColor: 'var(--theme-subAlt)' }}
              />
              <div
                className="mt-1 flex justify-between text-xs"
                style={{ color: 'var(--theme-sub)' }}
              >
                <span>Fast (100ms)</span>
                <span>Slow (700ms)</span>
              </div>
            </div>

            <div className="text-xs" style={{ color: 'var(--theme-sub)' }}>
              How long you need to hold spacebar/screen before the timer is ready to start.
              Lower values mean faster starts but may cause accidental triggers.
            </div>
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--theme-bgSecondary)' }}>
          <h3
            className="mb-4 text-sm font-medium uppercase tracking-wider"
            style={{ color: 'var(--theme-sub)' }}
          >
            Solve History
          </h3>

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <List className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
                <span className="text-sm" style={{ color: 'var(--theme-text)' }}>
                  Solves Per Page
                </span>
              </div>
              <div className="flex gap-2">
                {SOLVES_PER_PAGE_OPTIONS.map((count) => (
                  <button
                    key={count}
                    onClick={() => updateSetting('solvesPerPage', count)}
                    className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: settings.solvesPerPage === count ? 'var(--theme-accent)' : 'var(--theme-subAlt)',
                      color: settings.solvesPerPage === count ? 'var(--theme-bg)' : 'var(--theme-sub)',
                    }}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--theme-sub)' }}>
                Number of solves shown per page in your solve history. Lower values load faster.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--theme-bgSecondary)' }}>
          <h3
            className="mb-4 text-sm font-medium uppercase tracking-wider"
            style={{ color: 'var(--theme-sub)' }}
          >
            Smart Cube
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded"
                style={{ backgroundColor: 'var(--theme-accent)' }}
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--theme-bg)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <span className="text-sm" style={{ color: 'var(--theme-text)' }}>
                  Gyroscope Recording Enabled
                </span>
                <p className="text-xs" style={{ color: 'var(--theme-sub)' }}>
                  Cube orientation is automatically recorded during solves for replay.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: 'var(--theme-bgSecondary)' }}>
          <h3
            className="mb-4 text-sm font-medium uppercase tracking-wider"
            style={{ color: 'var(--theme-sub)' }}
          >
            Data & Sync
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-2" style={{ color: 'var(--theme-sub)' }}>
              {isCloudSync ? (
                <>
                  <Cloud className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
                  <span className="text-sm">Cloud sync is enabled</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-4 w-4" />
                  <span className="text-sm">
                    {user ? 'Cloud sync active' : 'Sign in to enable cloud sync'}
                  </span>
                </>
              )}
            </div>

            {user && onMigrateToCloud && (
              <div className="space-y-2">
                <button
                  onClick={handleMigrate}
                  disabled={isMigrating}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--theme-subAlt)',
                    color: 'var(--theme-text)',
                  }}
                >
                  {isMigrating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>Migrate Local Solves to Cloud</span>
                </button>
                <p className="text-xs" style={{ color: 'var(--theme-sub)' }}>
                  Upload any solves stored locally to your cloud account.
                </p>
                {migrationResult && (
                  <p
                    className="text-sm"
                    style={{ color: migrationResult.includes('failed') ? 'var(--theme-error)' : 'var(--theme-accent)' }}
                  >
                    {migrationResult}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={resetSettings}
          className="rounded-lg px-4 py-2 text-sm transition-colors"
          style={{
            backgroundColor: 'var(--theme-subAlt)',
            color: 'var(--theme-text)',
          }}
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}
