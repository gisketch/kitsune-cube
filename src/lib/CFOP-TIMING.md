# CFOP Timing Analysis System

This document describes the CFOP (Cross, F2L, OLL, PLL) recognition vs execution timing analysis system.

## Overview

The CFOP timing system analyzes solve data to accurately calculate **recognition time** and **execution time** for each phase of the solve. This provides real, data-driven insights rather than assumed ratios.

## Key Concepts

### Recognition Time
The time spent looking at the cube and planning the next moves **before starting to turn**.

- **Cross**: Recognition time = 0 (happens during inspection before the timer starts)
- **F2L Slots**: Time gap between the last move of the previous phase and the first move of the current phase
- **OLL**: Time gap between the last F2L move and the first OLL move
- **PLL**: Time gap between the last OLL move and the first PLL move

### Execution Time
The time spent actively turning the cube during a phase.

- Calculated as the time from the first move of the phase to the last move of the phase

## How It Works

### Data Requirements

The system requires:
1. `CFOPAnalysis` - Which moves belong to which phase
2. `MoveFrame[]` - Timestamps for each move (`{ time: number, move: string }`)

### Algorithm

```
For each phase:
  1. Find the move indices for this phase from CFOPAnalysis
  2. Get the timestamp of the previous phase's last move
  3. Get the timestamp of this phase's first move
  4. Recognition Time = firstMoveTime - previousPhaseEndTime
  5. Execution Time = lastMoveTime - firstMoveTime
```

### Special Cases

- **Cross**: Always has 0 recognition time (inspection happens before timer)
- **Skipped phases**: Return 0 for both recognition and execution
- **Missing move timings**: Falls back to estimated durations based on move count ratio

## Module: `cfop-timing.ts`

### Types

```typescript
interface PhaseTiming {
  name: string
  recognitionTime: number      // Time spent looking/planning (ms)
  executionTime: number        // Time spent turning (ms)
  totalDuration: number        // recognition + execution (ms)
  recognitionRatio: number     // 0-1, recognition/total
  moveCount: number
  startTime: number            // First move timestamp
  endTime: number              // Last move timestamp
}

interface CFOPTimingAnalysis {
  cross: PhaseTiming
  f2l: PhaseTiming[]           // 4 individual slot timings
  oll: PhaseTiming
  pll: PhaseTiming
  aggregated: {                // Combined F2L timing
    cross: PhaseTiming
    f2l: PhaseTiming
    oll: PhaseTiming
    pll: PhaseTiming
  }
}
```

### Functions

#### `calculatePhaseTimings(analysis, moveTimings)`

Main function that calculates timing for all CFOP phases.

**Parameters:**
- `analysis: CFOPAnalysis` - The CFOP phase breakdown with moves
- `moveTimings: MoveFrame[]` - Array of move timestamps

**Returns:** `CFOPTimingAnalysis | null`

Returns `null` if moveTimings is empty.

#### `getRecognitionRatio(timing)`

Utility to get the recognition ratio from a PhaseTiming.

## UI Integration

The solve results display uses this data to show:
1. **Tooltips**: Show actual recognition/execution times and percentages
2. **Bar charts**: Visual representation with recognition (lighter) vs execution (darker)
3. **Cross phase**: Hides recognition row since it's always 0

### Component Props

The bar and stat card components accept:
- `recognitionTime: number` - Actual recognition time in ms
- `executionTime: number` - Actual execution time in ms
- `hideRecognition?: boolean` - Set to true for Cross phase

## Example

Given a solve with these move timings:
```
Cross:  R(0ms), U(200ms), F(400ms)
F2L 1:  L(1000ms), U'(1200ms), L'(1400ms)
OLL:    F(2000ms), R(2100ms), U(2200ms)
PLL:    R(2700ms), U(2800ms), R'(2900ms)
```

Results:
| Phase | Recognition | Execution | Total |
|-------|-------------|-----------|-------|
| Cross | 0ms | 400ms | 400ms |
| F2L 1 | 600ms | 400ms | 1000ms |
| OLL | 600ms | 200ms | 800ms |
| PLL | 500ms | 200ms | 700ms |

## Fallback Behavior

When move timings are not available (e.g., manual solves):
1. Durations are estimated based on move count ratio
2. Recognition/execution default to phase duration (100% execution)
3. UI still works but shows estimated data

## Testing

Tests are located in `src/lib/cfop-timing.test.ts`:

```bash
npx vitest run src/lib/cfop-timing.test.ts
```

Test coverage includes:
- Empty moveTimings handling
- Cross with 0 recognition
- F2L recognition gaps
- Sequential F2L slot timings
- OLL/PLL recognition calculation
- Skipped phase handling
- Recognition ratio calculation
- Total duration calculation
- AUF adjustments in PLL
- Aggregated F2L timing
