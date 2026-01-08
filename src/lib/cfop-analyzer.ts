import { type CubeFaces, type Color } from './cube-faces'

export interface CFOPPhase {
  name: string
  moves: string[]
  skipped: boolean
}

export interface CFOPAnalysis {
  crossColor: Color
  cross: CFOPPhase
  f2l: CFOPPhase[]
  oll: CFOPPhase
  pll: CFOPPhase
}

const CROSS_COLOR_TO_FACE: Record<Color, keyof CubeFaces> = {
  W: 'U',
  Y: 'D',
  G: 'F',
  B: 'B',
  R: 'R',
  O: 'L',
}

const OPPOSITE_FACE: Record<keyof CubeFaces, keyof CubeFaces> = {
  U: 'D',
  D: 'U',
  F: 'B',
  B: 'F',
  L: 'R',
  R: 'L',
}

function getCrossEdgePositions(crossFace: keyof CubeFaces): Array<{
  crossIdx: number
  adjFace: keyof CubeFaces
  adjIdx: number
}> {
  const edgeMap: Record<
    keyof CubeFaces,
    Array<{ crossIdx: number; adjFace: keyof CubeFaces; adjIdx: number }>
  > = {
    U: [
      { crossIdx: 7, adjFace: 'F', adjIdx: 1 },
      { crossIdx: 5, adjFace: 'R', adjIdx: 1 },
      { crossIdx: 1, adjFace: 'B', adjIdx: 1 },
      { crossIdx: 3, adjFace: 'L', adjIdx: 1 },
    ],
    D: [
      { crossIdx: 1, adjFace: 'F', adjIdx: 7 },
      { crossIdx: 3, adjFace: 'L', adjIdx: 7 },
      { crossIdx: 7, adjFace: 'B', adjIdx: 7 },
      { crossIdx: 5, adjFace: 'R', adjIdx: 7 },
    ],
    F: [
      { crossIdx: 1, adjFace: 'U', adjIdx: 7 },
      { crossIdx: 5, adjFace: 'R', adjIdx: 3 },
      { crossIdx: 7, adjFace: 'D', adjIdx: 1 },
      { crossIdx: 3, adjFace: 'L', adjIdx: 5 },
    ],
    B: [
      { crossIdx: 1, adjFace: 'U', adjIdx: 1 },
      { crossIdx: 3, adjFace: 'R', adjIdx: 5 },
      { crossIdx: 7, adjFace: 'D', adjIdx: 7 },
      { crossIdx: 5, adjFace: 'L', adjIdx: 3 },
    ],
    L: [
      { crossIdx: 1, adjFace: 'U', adjIdx: 3 },
      { crossIdx: 5, adjFace: 'F', adjIdx: 3 },
      { crossIdx: 7, adjFace: 'D', adjIdx: 3 },
      { crossIdx: 3, adjFace: 'B', adjIdx: 5 },
    ],
    R: [
      { crossIdx: 1, adjFace: 'U', adjIdx: 5 },
      { crossIdx: 3, adjFace: 'F', adjIdx: 5 },
      { crossIdx: 7, adjFace: 'D', adjIdx: 5 },
      { crossIdx: 5, adjFace: 'B', adjIdx: 3 },
    ],
  }
  return edgeMap[crossFace]
}

function isCrossSolved(cube: CubeFaces, crossColor: Color): boolean {
  const crossFace = CROSS_COLOR_TO_FACE[crossColor]
  const edgePositions = getCrossEdgePositions(crossFace)

  for (const pos of edgePositions) {
    if (cube[crossFace][pos.crossIdx] !== crossColor) return false
    const adjCenter = cube[pos.adjFace][4]
    if (cube[pos.adjFace][pos.adjIdx] !== adjCenter) return false
  }
  return true
}

function detectCrossColor(cube: CubeFaces): Color | null {
  const colors: Color[] = ['W', 'Y', 'G', 'B', 'R', 'O']
  for (const color of colors) {
    if (isCrossSolved(cube, color)) {
      return color
    }
  }
  return null
}

interface SlotConfig {
  corner: { pos: [keyof CubeFaces, number][]; colors: (cube: CubeFaces) => Color[] }
  edge: { pos: [keyof CubeFaces, number][]; colors: (cube: CubeFaces) => Color[] }
}

function getF2LSlotConfigs(crossFace: keyof CubeFaces): SlotConfig[] {
  if (crossFace === 'D') {
    return [
      {
        corner: { pos: [['D', 0], ['F', 8], ['R', 6]], colors: (c: CubeFaces) => [c.D[4], c.F[4], c.R[4]] },
        edge: { pos: [['F', 5], ['R', 3]], colors: (c: CubeFaces) => [c.F[4], c.R[4]] },
      },
      {
        corner: { pos: [['D', 2], ['R', 8], ['B', 6]], colors: (c: CubeFaces) => [c.D[4], c.R[4], c.B[4]] },
        edge: { pos: [['R', 5], ['B', 3]], colors: (c: CubeFaces) => [c.R[4], c.B[4]] },
      },
      {
        corner: { pos: [['D', 8], ['B', 8], ['L', 6]], colors: (c: CubeFaces) => [c.D[4], c.B[4], c.L[4]] },
        edge: { pos: [['B', 5], ['L', 3]], colors: (c: CubeFaces) => [c.B[4], c.L[4]] },
      },
      {
        corner: { pos: [['D', 6], ['L', 8], ['F', 6]], colors: (c: CubeFaces) => [c.D[4], c.L[4], c.F[4]] },
        edge: { pos: [['L', 5], ['F', 3]], colors: (c: CubeFaces) => [c.L[4], c.F[4]] },
      },
    ]
  }

  if (crossFace === 'U') {
    return [
      {
        corner: { pos: [['U', 8], ['F', 2], ['R', 0]], colors: (c: CubeFaces) => [c.U[4], c.F[4], c.R[4]] },
        edge: { pos: [['F', 5], ['R', 3]], colors: (c: CubeFaces) => [c.F[4], c.R[4]] },
      },
      {
        corner: { pos: [['U', 2], ['R', 2], ['B', 0]], colors: (c: CubeFaces) => [c.U[4], c.R[4], c.B[4]] },
        edge: { pos: [['R', 5], ['B', 3]], colors: (c: CubeFaces) => [c.R[4], c.B[4]] },
      },
      {
        corner: { pos: [['U', 0], ['B', 2], ['L', 0]], colors: (c: CubeFaces) => [c.U[4], c.B[4], c.L[4]] },
        edge: { pos: [['B', 5], ['L', 3]], colors: (c: CubeFaces) => [c.B[4], c.L[4]] },
      },
      {
        corner: { pos: [['U', 6], ['L', 2], ['F', 0]], colors: (c: CubeFaces) => [c.U[4], c.L[4], c.F[4]] },
        edge: { pos: [['L', 5], ['F', 3]], colors: (c: CubeFaces) => [c.L[4], c.F[4]] },
      },
    ]
  }

  if (crossFace === 'F') {
    return [
      {
        corner: { pos: [['F', 2], ['U', 6], ['R', 0]], colors: (c: CubeFaces) => [c.F[4], c.U[4], c.R[4]] },
        edge: { pos: [['U', 5], ['R', 1]], colors: (c: CubeFaces) => [c.U[4], c.R[4]] },
      },
      {
        corner: { pos: [['F', 8], ['R', 6], ['D', 0]], colors: (c: CubeFaces) => [c.F[4], c.R[4], c.D[4]] },
        edge: { pos: [['R', 7], ['D', 3]], colors: (c: CubeFaces) => [c.R[4], c.D[4]] },
      },
      {
        corner: { pos: [['F', 6], ['D', 6], ['L', 8]], colors: (c: CubeFaces) => [c.F[4], c.D[4], c.L[4]] },
        edge: { pos: [['D', 3], ['L', 7]], colors: (c: CubeFaces) => [c.D[4], c.L[4]] },
      },
      {
        corner: { pos: [['F', 0], ['L', 2], ['U', 6]], colors: (c: CubeFaces) => [c.F[4], c.L[4], c.U[4]] },
        edge: { pos: [['L', 1], ['U', 3]], colors: (c: CubeFaces) => [c.L[4], c.U[4]] },
      },
    ]
  }

  if (crossFace === 'B') {
    return [
      {
        corner: { pos: [['B', 2], ['U', 0], ['L', 0]], colors: (c: CubeFaces) => [c.B[4], c.U[4], c.L[4]] },
        edge: { pos: [['U', 3], ['L', 1]], colors: (c: CubeFaces) => [c.U[4], c.L[4]] },
      },
      {
        corner: { pos: [['B', 0], ['R', 2], ['U', 2]], colors: (c: CubeFaces) => [c.B[4], c.R[4], c.U[4]] },
        edge: { pos: [['R', 1], ['U', 5]], colors: (c: CubeFaces) => [c.R[4], c.U[4]] },
      },
      {
        corner: { pos: [['B', 6], ['D', 2], ['R', 8]], colors: (c: CubeFaces) => [c.B[4], c.D[4], c.R[4]] },
        edge: { pos: [['D', 5], ['R', 7]], colors: (c: CubeFaces) => [c.D[4], c.R[4]] },
      },
      {
        corner: { pos: [['B', 8], ['L', 6], ['D', 8]], colors: (c: CubeFaces) => [c.B[4], c.L[4], c.D[4]] },
        edge: { pos: [['L', 7], ['D', 3]], colors: (c: CubeFaces) => [c.L[4], c.D[4]] },
      },
    ]
  }

  if (crossFace === 'R') {
    return [
      {
        corner: { pos: [['R', 0], ['F', 2], ['U', 8]], colors: (c: CubeFaces) => [c.R[4], c.F[4], c.U[4]] },
        edge: { pos: [['F', 1], ['U', 7]], colors: (c: CubeFaces) => [c.F[4], c.U[4]] },
      },
      {
        corner: { pos: [['R', 6], ['D', 0], ['F', 8]], colors: (c: CubeFaces) => [c.R[4], c.D[4], c.F[4]] },
        edge: { pos: [['D', 1], ['F', 7]], colors: (c: CubeFaces) => [c.D[4], c.F[4]] },
      },
      {
        corner: { pos: [['R', 8], ['B', 6], ['D', 2]], colors: (c: CubeFaces) => [c.R[4], c.B[4], c.D[4]] },
        edge: { pos: [['B', 7], ['D', 7]], colors: (c: CubeFaces) => [c.B[4], c.D[4]] },
      },
      {
        corner: { pos: [['R', 2], ['U', 2], ['B', 0]], colors: (c: CubeFaces) => [c.R[4], c.U[4], c.B[4]] },
        edge: { pos: [['U', 1], ['B', 1]], colors: (c: CubeFaces) => [c.U[4], c.B[4]] },
      },
    ]
  }

  if (crossFace === 'L') {
    return [
      {
        corner: { pos: [['L', 2], ['U', 6], ['F', 0]], colors: (c: CubeFaces) => [c.L[4], c.U[4], c.F[4]] },
        edge: { pos: [['U', 7], ['F', 1]], colors: (c: CubeFaces) => [c.U[4], c.F[4]] },
      },
      {
        corner: { pos: [['L', 0], ['B', 2], ['U', 0]], colors: (c: CubeFaces) => [c.L[4], c.B[4], c.U[4]] },
        edge: { pos: [['B', 1], ['U', 1]], colors: (c: CubeFaces) => [c.B[4], c.U[4]] },
      },
      {
        corner: { pos: [['L', 6], ['D', 8], ['B', 8]], colors: (c: CubeFaces) => [c.L[4], c.D[4], c.B[4]] },
        edge: { pos: [['D', 7], ['B', 7]], colors: (c: CubeFaces) => [c.D[4], c.B[4]] },
      },
      {
        corner: { pos: [['L', 8], ['F', 6], ['D', 6]], colors: (c: CubeFaces) => [c.L[4], c.F[4], c.D[4]] },
        edge: { pos: [['F', 7], ['D', 1]], colors: (c: CubeFaces) => [c.F[4], c.D[4]] },
      },
    ]
  }

  return []
}

function isF2LSlotSolved(cube: CubeFaces, crossColor: Color, slotIndex: number): boolean {
  const crossFace = CROSS_COLOR_TO_FACE[crossColor]
  const configs = getF2LSlotConfigs(crossFace)

  if (slotIndex >= configs.length) return false

  const config = configs[slotIndex]

  const cornerColors = config.corner.colors(cube)
  for (let i = 0; i < config.corner.pos.length; i++) {
    const [face, idx] = config.corner.pos[i]
    if (cube[face][idx] !== cornerColors[i]) return false
  }

  const edgeColors = config.edge.colors(cube)
  for (let i = 0; i < config.edge.pos.length; i++) {
    const [face, idx] = config.edge.pos[i]
    if (cube[face][idx] !== edgeColors[i]) return false
  }

  return true
}

function isOLLSolved(cube: CubeFaces, crossColor: Color): boolean {
  const topFace = OPPOSITE_FACE[CROSS_COLOR_TO_FACE[crossColor]]
  const topColor = cube[topFace][4]
  return cube[topFace].every((c: Color) => c === topColor)
}

function isPLLSolved(cube: CubeFaces): boolean {
  const faces: (keyof CubeFaces)[] = ['U', 'D', 'F', 'B', 'L', 'R']
  for (const face of faces) {
    const center = cube[face][4]
    if (!cube[face].every((c: Color) => c === center)) return false
  }
  return true
}

export function analyzeCFOP(moves: string[], stateHistory: CubeFaces[]): CFOPAnalysis | null {
  if (moves.length === 0 || stateHistory.length < 2) return null

  let crossColor: Color | null = null
  let crossMoveIndex = -1
  const f2lSlotIndices: number[] = []
  let ollMoveIndex = -1
  let pllMoveIndex = -1

  for (let i = 1; i < stateHistory.length; i++) {
    const state = stateHistory[i]
    const detected = detectCrossColor(state)
    if (detected) {
      crossColor = detected
      crossMoveIndex = i - 1
      break
    }
  }

  if (!crossColor) {
    return null
  }

  const solvedSlots = new Set<number>()
  let lastF2LMoveIndex = crossMoveIndex

  for (let i = crossMoveIndex + 1; i < stateHistory.length; i++) {
    const state = stateHistory[i]

    if (!isCrossSolved(state, crossColor)) continue

    for (let slot = 0; slot < 4; slot++) {
      if (!solvedSlots.has(slot) && isF2LSlotSolved(state, crossColor, slot)) {
        solvedSlots.add(slot)
        f2lSlotIndices.push(i - 1)
        lastF2LMoveIndex = i - 1
      }
    }

    if (solvedSlots.size === 4) break
  }

  for (let i = lastF2LMoveIndex + 1; i < stateHistory.length; i++) {
    const state = stateHistory[i]
    if (isOLLSolved(state, crossColor)) {
      ollMoveIndex = i - 1
      break
    }
  }

  const pllStartIdx =
    ollMoveIndex >= 0
      ? ollMoveIndex + 1
      : f2lSlotIndices.length > 0
        ? f2lSlotIndices[f2lSlotIndices.length - 1] + 1
        : crossMoveIndex + 1

  for (let i = pllStartIdx; i < stateHistory.length; i++) {
    const state = stateHistory[i]
    if (isPLLSolved(state)) {
      pllMoveIndex = i - 1
      break
    }
  }

  if (pllMoveIndex < 0 && moves.length > 0) {
    pllMoveIndex = moves.length - 1
  }

  const crossMoves = moves.slice(0, crossMoveIndex + 1)

  const f2lPhases: CFOPPhase[] = []
  let prevIndex = crossMoveIndex

  for (let i = 0; i < 4; i++) {
    if (i < f2lSlotIndices.length) {
      const slotMoveIndex = f2lSlotIndices[i]
      const slotMoves = moves.slice(prevIndex + 1, slotMoveIndex + 1)
      f2lPhases.push({
        name: `F2L Slot ${i + 1}`,
        moves: slotMoves,
        skipped: slotMoves.length === 0,
      })
      prevIndex = slotMoveIndex
    } else {
      f2lPhases.push({
        name: `F2L Slot ${i + 1}`,
        moves: [],
        skipped: true,
      })
    }
  }

  const ollStartIdx =
    f2lSlotIndices.length > 0 ? f2lSlotIndices[f2lSlotIndices.length - 1] : crossMoveIndex
  const ollEndIdx =
    ollMoveIndex >= 0 ? ollMoveIndex : pllMoveIndex >= 0 ? pllMoveIndex : moves.length - 1
  const ollMoves = moves.slice(ollStartIdx + 1, ollEndIdx + 1)

  const pllMoves = pllMoveIndex >= 0 ? moves.slice(ollEndIdx + 1, pllMoveIndex + 1) : []

  const isOnlyAUF = (movesToCheck: string[], crossCol: Color): boolean => {
    if (movesToCheck.length === 0) return true
    const crossFace = CROSS_COLOR_TO_FACE[crossCol]
    const aufFace = OPPOSITE_FACE[crossFace]
    const aufMoves = [aufFace, `${aufFace}'`, `${aufFace}2`]
    return movesToCheck.every(m => aufMoves.includes(m))
  }

  const pllSkipped = pllMoves.length === 0 || isOnlyAUF(pllMoves, crossColor)

  return {
    crossColor,
    cross: {
      name: 'Cross',
      moves: crossMoves,
      skipped: crossMoves.length === 0,
    },
    f2l: f2lPhases,
    oll: {
      name: 'OLL',
      moves: ollMoves,
      skipped: ollMoves.length === 0,
    },
    pll: {
      name: 'PLL',
      moves: pllMoves,
      skipped: pllSkipped,
    },
  }
}

export function formatCFOPAnalysis(analysis: CFOPAnalysis): string {
  const lines: string[] = []

  lines.push(
    `Cross (${analysis.crossColor}): ${analysis.cross.skipped ? 'Skipped' : analysis.cross.moves.join(' ')}`,
  )

  for (const slot of analysis.f2l) {
    lines.push(`${slot.name}: ${slot.skipped ? 'Skipped' : slot.moves.join(' ')}`)
  }

  lines.push(`OLL: ${analysis.oll.skipped ? 'Skipped' : analysis.oll.moves.join(' ')}`)
  lines.push(`PLL: ${analysis.pll.skipped ? 'Skipped' : analysis.pll.moves.join(' ')}`)

  return lines.join('\n')
}

export type CFOPPhaseName = 'cross' | 'f2l-1' | 'f2l-2' | 'f2l-3' | 'f2l-4' | 'oll' | 'pll' | 'solved' | 'scrambled'

export interface CurrentCFOPPhase {
  phase: CFOPPhaseName
  crossColor: Color | null
  crossSolved: boolean
  f2lSlotsSolved: boolean[]
  ollSolved: boolean
  pllSolved: boolean
}

export function detectCurrentPhase(cube: CubeFaces): CurrentCFOPPhase {
  const crossColor = detectCrossColor(cube)
  const crossSolved = crossColor !== null
  
  if (!crossSolved) {
    return {
      phase: 'cross',
      crossColor: null,
      crossSolved: false,
      f2lSlotsSolved: [false, false, false, false],
      ollSolved: false,
      pllSolved: false,
    }
  }
  
  const f2lSlotsSolved = [
    isF2LSlotSolved(cube, crossColor, 0),
    isF2LSlotSolved(cube, crossColor, 1),
    isF2LSlotSolved(cube, crossColor, 2),
    isF2LSlotSolved(cube, crossColor, 3),
  ]
  
  const allF2LSolved = f2lSlotsSolved.every(Boolean)
  const ollSolved = allF2LSolved && isOLLSolved(cube, crossColor)
  const pllSolved = ollSolved && isPLLSolved(cube)
  
  if (pllSolved) {
    return { phase: 'solved', crossColor, crossSolved: true, f2lSlotsSolved, ollSolved: true, pllSolved: true }
  }
  
  if (ollSolved) {
    return { phase: 'pll', crossColor, crossSolved: true, f2lSlotsSolved, ollSolved: true, pllSolved: false }
  }
  
  if (allF2LSolved) {
    return { phase: 'oll', crossColor, crossSolved: true, f2lSlotsSolved, ollSolved: false, pllSolved: false }
  }
  
  const nextSlot = f2lSlotsSolved.findIndex(solved => !solved)
  const phase = `f2l-${nextSlot + 1}` as CFOPPhaseName
  
  return { phase, crossColor, crossSolved: true, f2lSlotsSolved, ollSolved: false, pllSolved: false }
}
