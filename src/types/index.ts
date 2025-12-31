import type { CFOPAnalysis } from '@/lib/cfop-analyzer'
export type { CFOPAnalysis }

export type TabType = 'timer' | 'solves' | 'simulator' | 'settings'
export type SolveViewMode = 'list' | 'results' | 'stats' | 'replay'
export type TimerStatus = 'idle' | 'inspection' | 'running' | 'stopped'

export interface GyroFrame {
  time: number
  quaternion: { x: number; y: number; z: number; w: number }
}

export interface MoveFrame {
  time: number
  move: string
}

export interface Solve {
  id: string
  time: number
  scramble: string
  solution: string[]
  date: string
  dnf?: boolean
  plusTwo?: boolean
  cfopAnalysis?: CFOPAnalysis
  gyroData?: GyroFrame[]
  moveTimings?: MoveFrame[]
  isManual?: boolean
  isRepeatedScramble?: boolean
}

export interface AppSettings {
  animationSpeed: number
  gyroEnabled: boolean
  theme: string
  showNet?: boolean
}

export interface MoveWithTime {
  move: string
  time: number
}

export type CalibrationType = 'gyro' | 'cube' | null
