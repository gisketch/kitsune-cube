import { useState, useEffect, useCallback, useRef } from 'react'
import { applyTheme, type CubeTheme } from '@/lib/themes'

export type InspectionTime = 'none' | '15' | '30' | '60' | 'custom'
export type TimerLayoutMode = 'minimal' | 'detailed'
export type SolvesPerPage = 10 | 20 | 50 | 100

export interface AppSettings {
  animationSpeed: number
  gyroEnabled: boolean
  theme: string
  cubeTheme: CubeTheme
  inspectionTime: InspectionTime
  customInspectionTime: number
  holdThreshold: number
  timerLayoutMode: TimerLayoutMode
  showStatsWidget: boolean
  solvesPerPage: SolvesPerPage
}

const STORAGE_KEY = 'cube-settings'

const DEFAULT_SETTINGS: AppSettings = {
  animationSpeed: 15,
  gyroEnabled: true,
  theme: 'kitsune',
  cubeTheme: 'current',
  inspectionTime: 'none',
  customInspectionTime: 15,
  holdThreshold: 300,
  timerLayoutMode: 'detailed',
  showStatsWidget: true,
  solvesPerPage: 20,
}

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
      applyTheme(settings.theme)
      return settings
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  applyTheme(DEFAULT_SETTINGS.theme)
  return DEFAULT_SETTINGS
}

function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const isLocalUpdateRef = useRef(false)

  useEffect(() => {
    if (isLocalUpdateRef.current) {
      saveSettings(settings)
      window.dispatchEvent(new CustomEvent('settings-changed', { detail: settings }))
      isLocalUpdateRef.current = false
    }
  }, [settings])

  useEffect(() => {
    const handleSettingsChange = (e: Event) => {
      const customEvent = e as CustomEvent<AppSettings>
      if (customEvent.detail) {
        setSettings(customEvent.detail)
      }
    }

    window.addEventListener('settings-changed', handleSettingsChange)
    return () => window.removeEventListener('settings-changed', handleSettingsChange)
  }, [])

  useEffect(() => {
    applyTheme(settings.theme)
  }, [settings.theme])

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      isLocalUpdateRef.current = true
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const resetSettings = useCallback(() => {
    isLocalUpdateRef.current = true
    setSettings(DEFAULT_SETTINGS)
  }, [])

  return {
    settings,
    updateSetting,
    resetSettings,
  }
}
