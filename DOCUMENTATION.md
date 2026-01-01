# Smart Cube CFOP Analyzer - Documentation

A modern Rubik's Cube timer application that connects to GAN Smart Cubes via Bluetooth, tracks solves in real-time, and automatically analyzes your CFOP method execution.

---

## Table of Contents

1. [Application Flow](#application-flow)
2. [Entry Point & Providers](#entry-point--providers)
3. [Core State Management](#core-state-management)
4. [Hooks Reference](#hooks-reference)
5. [Library Modules](#library-modules)
6. [Components](#components)
7. [Contexts](#contexts)
8. [Types](#types)
9. [Data Flow Diagrams](#data-flow-diagrams)

---

## Application Flow

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              main.tsx                                        │
│   Wraps App with: ErrorBoundary → ThemeProvider → AuthProvider →            │
│   ExperienceProvider → AchievementsProvider → SolveSessionProvider          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               App.tsx                                        │
│                                                                              │
│   1. User connects GAN Smart Cube via Bluetooth (useGanCube)                │
│   2. App generates scramble (generateScramble)                               │
│   3. User executes scramble on cube → tracked visually (useScrambleTracker) │
│   4. Timer enters inspection mode when scramble complete                     │
│   5. First solve move starts timer (useTimer)                                │
│   6. Cube solved → timer stops → CFOP analysis runs (analyzeCFOP)           │
│   7. Solve saved to storage (useSolves) with analysis                       │
│   8. New scramble generated, cycle repeats                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Timer State Machine

```
                    ┌──────────────────────────────────────────┐
                    │                                          │
                    ▼                                          │
┌──────────┐   scramble    ┌─────────────┐   first    ┌───────────┐   solved   ┌─────────┐
│   idle   │ ─────────────►│ inspection  │ ──────────►│  running  │ ──────────►│ stopped │
└──────────┘   complete    └─────────────┘   move     └───────────┘            └─────────┘
     ▲                                                                              │
     │                          new scramble                                        │
     └──────────────────────────────────────────────────────────────────────────────┘
```

---

## Entry Point & Providers

### main.tsx

The application entry point that sets up the React tree with all context providers:

```
StrictMode
└── ErrorBoundary        → Catches and displays React errors
    └── ThemeProvider    → Manages dark/light themes and custom themes
        └── AuthProvider → Firebase authentication state
            └── ExperienceProvider → XP/leveling system
                └── AchievementsProvider → Achievement tracking
                    └── SolveSessionProvider → Core solve session state
                        └── App
```

---

## Core State Management

### App.tsx - Main Orchestrator

The central hub that coordinates all hooks and manages the solve lifecycle:

| State | Purpose |
|-------|---------|
| `activeTab` | Current navigation tab (timer/account/simulator/settings) |
| `frozenPattern` | KPattern snapshot for 3D cube rendering |
| `selectedSolve` | Currently selected solve for detail view |
| `solveViewMode` | View mode for solve details (list/results/stats/replay) |

**Key Callbacks:**
- `handleMove(move)` - Processes moves from smart cube, updates all state systems
- `handleNewScramble()` - Generates new scramble, resets solve session
- `handleSyncCube()` - Resets internal cube state to solved
- `checkCalibrationSequence(move)` - Detects gesture sequences (4x U/F/D moves)

**Calibration Gestures:**
- 4x U moves → Reset gyroscope
- 4x F moves → Sync cube state
- 4x D moves → Generate new scramble

---

## Hooks Reference

### useGanCube.ts
**Location:** `src/hooks/useGanCube.ts`

Manages Bluetooth connection to GAN Smart Cubes.

```typescript
const {
  connect,           // Initiate Bluetooth connection
  disconnect,        // Close connection
  isConnected,       // Connection state
  isConnecting,      // Connecting in progress
  quaternionRef,     // Real-time gyroscope orientation (THREE.Quaternion)
  resetGyro,         // Reset gyroscope to current orientation
  batteryLevel,      // Current battery percentage
  error,             // Connection error message
} = useGanCube(onMove)
```

**Event Handling:**
- `GYRO` - Updates quaternion for 3D cube orientation
- `MOVE` - Validates and forwards moves to callback
- `BATTERY` - Updates battery level
- `DISCONNECT` - Resets connection state

---

### useTimer.ts
**Location:** `src/hooks/useTimer.ts`

Simple timer with millisecond precision using `requestAnimationFrame`.

```typescript
const {
  status,            // 'idle' | 'inspection' | 'running' | 'stopped'
  time,              // Current time in milliseconds
  startInspection,   // Enter inspection phase
  startTimer,        // Start counting (only works from inspection)
  stopTimer,         // Stop and return final time
  reset,             // Reset to idle
} = useTimer()
```

---

### useScrambleTracker.ts
**Location:** `src/hooks/useScrambleTracker.ts`

Tracks user's progress through a scramble sequence with recovery detection.

```typescript
const {
  state: {
    status,           // 'idle' | 'scrambling' | 'diverged' | 'completed' | 'solving' | 'solved'
    originalScramble, // The scramble string
    moves,            // Array of move states with status
    currentIndex,     // Current position in scramble
    recoveryMoves,    // Moves needed to recover from divergence
    isSolved,         // Whether cube is solved
    solutionMoves,    // Moves made during solve phase
  },
  setScramble,        // Set new scramble
  performMove,        // Process a move during scrambling
  syncWithFacelets,   // Sync tracker with actual cube state
  setSolved,          // Update solved state
  startSolving,       // Transition to solving phase
} = useScrambleTracker()
```

**Move States:**
- `pending` - Not yet executed
- `current` - Currently expected move
- `completed` - Successfully executed
- `recovery` - Recovery move to get back on track

---

### useCubeFaces.ts
**Location:** `src/hooks/useCubeFaces.ts`

Maintains face-level cube state for CFOP analysis.

```typescript
const {
  faces,          // Current CubeFaces state
  performMove,    // Apply a single move
  applyScramble,  // Apply full scramble algorithm
  reset,          // Reset to solved state
  isSolved,       // Check if cube is solved
  getHistory,     // Get { moves: string[], states: CubeFaces[] }
  clearHistory,   // Clear move/state history
} = useCubeFaces()
```

**Why Two Cube States?**
- `useCubeState` - Uses `cubing` library's KPuzzle for 3D rendering
- `useCubeFaces` - Simple face array for CFOP detection algorithms

---

### useCubeState.ts
**Location:** `src/hooks/useCubeState.ts`

Cube state using the `cubing` library for accurate 3D representation.

```typescript
const {
  cubeState,         // { kpuzzle, pattern, transformation, facelets }
  isLoading,         // True while initializing
  performMove,       // Apply move, returns new facelets string
  reset,             // Reset to solved
  scramble,          // Generate and apply random scramble
  currentScramble,   // Current scramble algorithm
} = useCubeState()
```

---

### useGyroRecorder.ts
**Location:** `src/hooks/useGyroRecorder.ts`

Records gyroscope data and move timings for solve replay.

```typescript
const {
  startRecording,    // Begin recording session
  stopRecording,     // End recording, returns { gyroData, moveTimings }
  recordGyroFrame,   // Record quaternion at current time
  recordMove,        // Record move at current time
  isRecording,       // Check if recording active
} = useGyroRecorder()
```

**Recording Data:**
- Gyro frames sampled every 50ms
- Maximum 2000 frames (~100 seconds)
- Move timings with millisecond precision

---

### useSolves.ts
**Location:** `src/hooks/useSolves.ts`

Manages solve history with Firebase cloud sync or localStorage fallback.

```typescript
const {
  solves,               // Array of all solves
  loading,              // Loading state
  stats,                // { best, worst, average, ao5, ao12 }
  addSolve,             // Add new solve
  deleteSolve,          // Remove solve by ID
  updateSolve,          // Update solve properties
  clearSolves,          // Delete all solves
  migrateLocalToCloud,  // Sync localStorage to Firebase
  isCloudSync,          // Whether using cloud storage
} = useSolves()
```

---

### useSettings.ts
**Location:** `src/hooks/useSettings.ts`

Manages application settings with localStorage persistence.

```typescript
const {
  settings: {
    animationSpeed,   // 3D cube animation speed
    gyroEnabled,      // Enable gyroscope tracking
    theme,            // Application theme
    cubeTheme,        // Cube color scheme
    showNet,          // Show 2D cube net
  },
  updateSettings,     // Partial settings update
} = useSettings()
```

---

## Library Modules

### cfop-analyzer.ts
**Location:** `src/lib/cfop-analyzer.ts`

The core CFOP phase detection algorithm.

```typescript
interface CFOPAnalysis {
  crossColor: Color      // 'W' | 'Y' | 'G' | 'B' | 'R' | 'O'
  cross: CFOPPhase       // { name, moves[], skipped }
  f2l: CFOPPhase[]       // 4 F2L slot phases
  oll: CFOPPhase         // OLL phase
  pll: CFOPPhase         // PLL phase
}

function analyzeCFOP(moves: string[], stateHistory: CubeFaces[]): CFOPAnalysis | null
```

**Detection Algorithm:**
1. **Cross Detection** - Iterates through state history until 4 edge pieces form a cross with correct center alignment
2. **F2L Slots** - Tracks when each corner-edge pair is correctly positioned
3. **OLL Detection** - All pieces on top face match top color
4. **PLL Detection** - Entire cube solved

---

### cube-faces.ts
**Location:** `src/lib/cube-faces.ts`

Face-based cube representation using 9-element color arrays per face.

```typescript
type Color = 'W' | 'Y' | 'G' | 'B' | 'R' | 'O'

interface CubeFaces {
  U: Color[]  // Up (White)
  D: Color[]  // Down (Yellow)
  F: Color[]  // Front (Green)
  B: Color[]  // Back (Blue)
  L: Color[]  // Left (Orange)
  R: Color[]  // Right (Red)
}

// Face indexing (0-8):
// 0 1 2
// 3 4 5  (4 is center)
// 6 7 8

function applyMove(cube: CubeFaces, move: string): CubeFaces
function isSolved(cube: CubeFaces): boolean
function createSolvedCube(): CubeFaces
```

---

### cube-state.ts
**Location:** `src/lib/cube-state.ts`

Cube state using the `cubing` library for accurate puzzle representation.

```typescript
interface CubeState {
  kpuzzle: KPuzzle
  pattern: KPattern
  transformation: KTransformation
  facelets: string  // 54-character string (UUUUUUUUURRRRRRRRRFFF...)
}

async function generateScramble(): Promise<string>
async function createSolvedState(): Promise<CubeState>
function applyMoveToFacelets(facelets: string, move: string): string
```

---

### move-utils.ts
**Location:** `src/lib/move-utils.ts`

Move parsing and manipulation utilities.

```typescript
interface ParsedMove {
  face: string        // R, L, U, D, F, B
  modifier: string    // '', "'", '2'
  notation: string    // Full notation: "R'", "U2", etc.
}

function parseScramble(scramble: string): ParsedMove[]
function getInverseMove(move: ParsedMove): ParsedMove
function isSameFace(a: ParsedMove, b: ParsedMove): boolean
```

---

## Components

### Layout Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `Header` | `src/components/layout/Header.tsx` | Navigation tabs, branding |
| `Footer` | `src/components/layout/Footer.tsx` | App footer |
| `StatusBar` | `src/components/layout/StatusBar.tsx` | Connection status, battery |

### Core Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CubeViewer` | `src/components/cube/index.tsx` | 3D Rubik's Cube with Three.js |
| `RubiksCube` | `src/components/cube/RubiksCube.tsx` | Three.js cube mesh and animations |
| `ScrambleNotation` | `src/components/scramble-notation.tsx` | Interactive scramble progress display |
| `TimerDisplay` | `src/components/timer-display.tsx` | Timer UI with status |
| `ManualTimerDisplay` | `src/components/manual-timer-display.tsx` | Space-bar controlled timer |
| `SolveResults` | `src/components/solve-results.tsx` | Post-solve results with CFOP breakdown |
| `CFOPAnalysisDisplay` | `src/components/cfop-analysis.tsx` | CFOP phase breakdown visualization |
| `RecentSolves` | `src/components/recent-solves.tsx` | Quick view of last few solves |

### Page Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `AccountPage` | `src/components/account-page.tsx` | User stats, solve history, CFOP averages |
| `AchievementsPage` | `src/components/achievements-page.tsx` | Achievement badges and progress |
| `LeaderboardPage` | `src/components/leaderboard-page.tsx` | Community leaderboards |
| `Simulator` | `src/components/simulator.tsx` | CFOP algorithm simulator |
| `SettingsPanel` | `src/components/settings-panel.tsx` | Theme and animation settings |

### Modal Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ConnectionModal` | `src/components/connection-modal.tsx` | Bluetooth connection dialog |
| `CalibrationModal` | `src/components/calibration-modal.tsx` | Cube sync and gyro calibration |
| `CubeInfoModal` | `src/components/cube-info-modal.tsx` | Connected cube information |
| `CommandPalette` | `src/components/command-palette.tsx` | Ctrl+K command search |

---

## Contexts

### SolveSessionContext.tsx
**Location:** `src/contexts/SolveSessionContext.tsx`

Central context for the current solve session state.

```typescript
interface SolveSessionContextValue {
  timer: ReturnType<typeof useTimer>
  manualTimer: ReturnType<typeof useManualTimer>
  gyroRecorder: ReturnType<typeof useGyroRecorder>
  
  scramble: string
  isRepeatedScramble: boolean
  solveSaved: boolean
  lastSolveTime: number
  lastMoveCount: number
  lastScramble: string
  lastAnalysis: CFOPAnalysis | null
  
  saveSolve: (params) => void
  resetSolveSession: () => void
  triggerNewScramble: () => void
}
```

**saveSolve Flow:**
1. Marks solve as saved
2. Runs CFOP analysis on move history
3. Adds to persistent storage
4. Awards XP (if not repeated scramble)
5. Updates achievement statistics

---

### AuthContext.tsx
**Location:** `src/contexts/AuthContext.tsx`

Firebase authentication state management.

### ExperienceContext.tsx
**Location:** `src/contexts/ExperienceContext.tsx`

XP and leveling system for gamification.

### AchievementsContext.tsx
**Location:** `src/contexts/AchievementsContext.tsx`

Achievement tracking and unlocking.

---

## Types

### src/types/index.ts

Central type definitions:

```typescript
type TabType = 'timer' | 'solves' | 'simulator' | 'settings'
type SolveViewMode = 'list' | 'results' | 'stats' | 'replay'
type TimerStatus = 'idle' | 'inspection' | 'running' | 'stopped'

interface Solve {
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

interface GyroFrame {
  time: number
  quaternion: { x: number; y: number; z: number; w: number }
}

interface MoveFrame {
  time: number
  move: string
}
```

---

## Data Flow Diagrams

### Move Processing Flow

```
GAN Smart Cube (Bluetooth)
         │
         ▼
┌─────────────────────┐
│    useGanCube       │ → Validates move format
│    handleEvent()    │ → Updates quaternionRef
└─────────────────────┘
         │
         ▼ onMove callback
┌─────────────────────┐
│    App.handleMove() │ → Checks calibration sequences
└─────────────────────┘
         │
    ┌────┴────┬──────────────┬──────────────┐
    ▼         ▼              ▼              ▼
┌────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────┐
│cubeRef │ │updateCube  │ │updateCube  │ │trackMove()  │
│.perform│ │State()     │ │Faces()     │ │(scramble    │
│Move()  │ │(KPuzzle)   │ │(faces)     │ │tracker)     │
└────────┘ └────────────┘ └────────────┘ └─────────────┘
    │           │              │
    ▼           ▼              ▼
3D Render   facelets       State History
            string         for CFOP
```

### Solve Recording Flow

```
Scramble Completed
         │
         ▼
timer.startInspection()
         │
         ▼ First Move
timer.startTimer() + gyroRecorder.startRecording()
         │
         ▼ Each Move
gyroRecorder.recordMove()
useCubeFaces.performMove() → stateHistory grows
         │
         ▼ Cube Solved (isSolved() returns true)
timer.stopTimer() → finalTime
gyroRecorder.stopRecording() → gyroData, moveTimings
         │
         ▼
analyzeCFOP(history.moves, history.states)
         │
         ▼
addSolve({
  time,
  scramble,
  solution,
  cfopAnalysis,
  gyroData,
  moveTimings
})
         │
         ▼
localStorage / Firebase
```

### Component Hierarchy

```
App.tsx
├── Header
│   └── Navigation Tabs
├── Main Content (based on activeTab)
│   ├── Timer View
│   │   ├── ScrambleNotation
│   │   ├── CubeViewer (3D)
│   │   ├── TimerDisplay / ManualTimerDisplay
│   │   ├── SolveResults (after solve)
│   │   └── RecentSolves
│   ├── AccountPage
│   │   ├── CFOPStatsWidget
│   │   └── SolvesList
│   ├── AchievementsPage
│   ├── LeaderboardPage
│   ├── Simulator
│   └── SettingsPanel
├── StatusBar
├── Footer
└── Modals
    ├── ConnectionModal
    ├── CalibrationModal
    ├── CubeInfoModal
    └── CommandPalette
```

---

## File Structure Reference

```
src/
├── main.tsx                    # Entry point, provider tree
├── App.tsx                     # Main orchestrator component
├── App.css                     # Global app styles
├── index.css                   # Tailwind base styles
│
├── components/
│   ├── cube/
│   │   ├── index.tsx          # CubeViewer (Canvas wrapper)
│   │   └── RubiksCube.tsx     # Three.js cube mesh
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── StatusBar.tsx
│   ├── ui/                    # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── tooltip.tsx
│   │   └── ...
│   ├── account-page.tsx
│   ├── achievements-page.tsx
│   ├── cfop-analysis.tsx
│   ├── calibration-modal.tsx
│   ├── connection-modal.tsx
│   ├── scramble-notation.tsx
│   ├── settings-panel.tsx
│   ├── simulator.tsx
│   ├── solve-results.tsx
│   ├── timer-display.tsx
│   └── ...
│
├── hooks/
│   ├── useGanCube.ts          # Bluetooth smart cube connection
│   ├── useTimer.ts            # Solve timer
│   ├── useManualTimer.ts      # Spacebar timer for non-smart cube
│   ├── useScrambleTracker.ts  # Scramble execution tracking
│   ├── useCubeState.ts        # KPuzzle-based cube state
│   ├── useCubeFaces.ts        # Face-array cube state
│   ├── useGyroRecorder.ts     # Gyro/move recording
│   ├── useSolves.ts           # Solve history management
│   ├── useSettings.ts         # App settings
│   └── useCalibrationSequence.ts
│
├── lib/
│   ├── cfop-analyzer.ts       # CFOP phase detection algorithm
│   ├── cube-faces.ts          # Face-based cube operations
│   ├── cube-state.ts          # cubing library integration
│   ├── move-utils.ts          # Move parsing utilities
│   ├── solve-stats.ts         # Statistics calculations
│   ├── themes.ts              # Theme definitions
│   ├── firebase.ts            # Firebase configuration
│   ├── format.ts              # Time/date formatting
│   └── constants.ts           # Shared constants
│
├── contexts/
│   ├── SolveSessionContext.tsx
│   ├── AuthContext.tsx
│   ├── ExperienceContext.tsx
│   └── AchievementsContext.tsx
│
├── types/
│   ├── index.ts               # Central type definitions
│   └── achievements.ts
│
└── config/
    └── scene-config.ts        # 3D scene configuration
```

---

## Key External Dependencies

| Package | Purpose |
|---------|---------|
| `gan-web-bluetooth` | GAN Smart Cube Bluetooth protocol |
| `cubing` | Cube state, scramble generation, algorithms |
| `three` | 3D rendering engine |
| `@react-three/fiber` | React renderer for Three.js |
| `@react-three/drei` | Three.js helpers (OrbitControls, etc.) |
| `firebase` | Authentication and cloud storage |
| `framer-motion` | Animations |
| `tailwindcss` | Styling |

---

## Quick Reference

### Starting a Solve Session
1. Connect smart cube (or use manual timer)
2. Scramble is generated and displayed
3. Execute scramble moves on physical cube
4. When complete, enter inspection mode
5. First solve move starts timer
6. Solve the cube
7. Timer stops, CFOP analysis runs
8. Review results, start next solve

### Keyboard Shortcuts
- `F2` - Reset gyroscope
- `F4` - Sync cube state to solved
- `Ctrl+K` - Open command palette
- `Space` - Manual timer (when disconnected)

### Gesture Shortcuts (on cube)
- `4x U` - Reset gyroscope
- `4x F` - Sync cube state
- `4x D` - New scramble (when timer stopped)
