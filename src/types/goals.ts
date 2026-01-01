export interface PhaseGoal {
  moves: number
  time: number
}

export interface CFOPGoals {
  cross: PhaseGoal
  f2l: PhaseGoal
  oll: PhaseGoal
  pll: PhaseGoal
}

export interface UserGoals {
  method: 'cfop'
  preset: string | null
  goals: CFOPGoals
  totalTime: number | null
}

export interface GoalCheckResult {
  movesMet: boolean
  timeMet: boolean
  eitherMet: boolean
}

export const GOAL_PRESETS: Record<string, CFOPGoals> = {
  beginner: {
    cross: { moves: 12, time: 5000 },
    f2l: { moves: 50, time: 25000 },
    oll: { moves: 15, time: 5000 },
    pll: { moves: 15, time: 5000 },
  },
  intermediate: {
    cross: { moves: 8, time: 3000 },
    f2l: { moves: 40, time: 18000 },
    oll: { moves: 12, time: 3000 },
    pll: { moves: 12, time: 3000 },
  },
  advanced: {
    cross: { moves: 8, time: 2000 },
    f2l: { moves: 35, time: 12000 },
    oll: { moves: 10, time: 2000 },
    pll: { moves: 10, time: 2000 },
  },
  'sub-20': {
    cross: { moves: 7, time: 2000 },
    f2l: { moves: 30, time: 10000 },
    oll: { moves: 9, time: 2000 },
    pll: { moves: 9, time: 2000 },
  },
  'sub-15': {
    cross: { moves: 6, time: 1500 },
    f2l: { moves: 25, time: 7000 },
    oll: { moves: 8, time: 1500 },
    pll: { moves: 8, time: 1500 },
  },
}

export const TOTAL_TIME_PRESETS: Record<string, number> = {
  beginner: 60000,
  intermediate: 40000,
  advanced: 25000,
  'sub-20': 20000,
  'sub-15': 15000,
}

export const DEFAULT_GOALS: CFOPGoals = GOAL_PRESETS.intermediate
