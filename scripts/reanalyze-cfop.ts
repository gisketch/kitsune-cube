import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, type DocumentData } from 'firebase-admin/firestore'

type Color = 'W' | 'Y' | 'G' | 'B' | 'R' | 'O'

interface CubeFaces {
  U: Color[]
  D: Color[]
  F: Color[]
  B: Color[]
  L: Color[]
  R: Color[]
}

interface CFOPPhase {
  name: string
  moves: string[]
  skipped: boolean
}

interface CFOPAnalysis {
  crossColor: Color
  cross: CFOPPhase
  f2l: CFOPPhase[]
  oll: CFOPPhase
  pll: CFOPPhase
}

function createSolvedCube(): CubeFaces {
  return {
    U: ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
    D: ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    F: ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'],
    B: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B'],
    L: ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
    R: ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
  }
}

function rotateFaceCW(face: Color[]): Color[] {
  return [face[6], face[3], face[0], face[7], face[4], face[1], face[8], face[5], face[2]]
}

function applyMove(cube: CubeFaces, move: string): CubeFaces {
  const result: CubeFaces = {
    U: [...cube.U],
    D: [...cube.D],
    F: [...cube.F],
    B: [...cube.B],
    L: [...cube.L],
    R: [...cube.R],
  }

  const face = move[0]
  const isPrime = move.includes("'")
  const isDouble = move.includes('2')
  const times = isDouble ? 2 : isPrime ? 3 : 1

  for (let t = 0; t < times; t++) {
    switch (face) {
      case 'U': {
        result.U = rotateFaceCW(result.U)
        const temp = [result.F[0], result.F[1], result.F[2]]
        result.F[0] = result.R[0]; result.F[1] = result.R[1]; result.F[2] = result.R[2]
        result.R[0] = result.B[0]; result.R[1] = result.B[1]; result.R[2] = result.B[2]
        result.B[0] = result.L[0]; result.B[1] = result.L[1]; result.B[2] = result.L[2]
        result.L[0] = temp[0]; result.L[1] = temp[1]; result.L[2] = temp[2]
        break
      }
      case 'D': {
        result.D = rotateFaceCW(result.D)
        const temp = [result.F[6], result.F[7], result.F[8]]
        result.F[6] = result.L[6]; result.F[7] = result.L[7]; result.F[8] = result.L[8]
        result.L[6] = result.B[6]; result.L[7] = result.B[7]; result.L[8] = result.B[8]
        result.B[6] = result.R[6]; result.B[7] = result.R[7]; result.B[8] = result.R[8]
        result.R[6] = temp[0]; result.R[7] = temp[1]; result.R[8] = temp[2]
        break
      }
      case 'F': {
        result.F = rotateFaceCW(result.F)
        const temp = [result.U[6], result.U[7], result.U[8]]
        result.U[6] = result.L[8]; result.U[7] = result.L[5]; result.U[8] = result.L[2]
        result.L[2] = result.D[0]; result.L[5] = result.D[1]; result.L[8] = result.D[2]
        result.D[0] = result.R[6]; result.D[1] = result.R[3]; result.D[2] = result.R[0]
        result.R[0] = temp[0]; result.R[3] = temp[1]; result.R[6] = temp[2]
        break
      }
      case 'B': {
        result.B = rotateFaceCW(result.B)
        const temp = [result.U[0], result.U[1], result.U[2]]
        result.U[0] = result.R[2]; result.U[1] = result.R[5]; result.U[2] = result.R[8]
        result.R[2] = result.D[8]; result.R[5] = result.D[7]; result.R[8] = result.D[6]
        result.D[6] = result.L[0]; result.D[7] = result.L[3]; result.D[8] = result.L[6]
        result.L[0] = temp[2]; result.L[3] = temp[1]; result.L[6] = temp[0]
        break
      }
      case 'L': {
        result.L = rotateFaceCW(result.L)
        const temp = [result.U[0], result.U[3], result.U[6]]
        result.U[0] = result.B[8]; result.U[3] = result.B[5]; result.U[6] = result.B[2]
        result.B[2] = result.D[6]; result.B[5] = result.D[3]; result.B[8] = result.D[0]
        result.D[0] = result.F[0]; result.D[3] = result.F[3]; result.D[6] = result.F[6]
        result.F[0] = temp[0]; result.F[3] = temp[1]; result.F[6] = temp[2]
        break
      }
      case 'R': {
        result.R = rotateFaceCW(result.R)
        const temp = [result.U[2], result.U[5], result.U[8]]
        result.U[2] = result.F[2]; result.U[5] = result.F[5]; result.U[8] = result.F[8]
        result.F[2] = result.D[2]; result.F[5] = result.D[5]; result.F[8] = result.D[8]
        result.D[2] = result.B[6]; result.D[5] = result.B[3]; result.D[8] = result.B[0]
        result.B[0] = temp[2]; result.B[3] = temp[1]; result.B[6] = temp[0]
        break
      }
    }
  }
  return result
}

function parseScramble(scramble: string): string[] {
  return scramble.trim().split(/\s+/).filter(Boolean)
}

const CROSS_COLOR_TO_FACE: Record<Color, keyof CubeFaces> = {
  W: 'U', Y: 'D', G: 'F', B: 'B', R: 'R', O: 'L',
}

const OPPOSITE_FACE: Record<keyof CubeFaces, keyof CubeFaces> = {
  U: 'D', D: 'U', F: 'B', B: 'F', L: 'R', R: 'L',
}

function getCrossEdgePositions(crossFace: keyof CubeFaces) {
  const edgeMap: Record<keyof CubeFaces, Array<{ crossIdx: number; adjFace: keyof CubeFaces; adjIdx: number }>> = {
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
    if (isCrossSolved(cube, color)) return color
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
      { corner: { pos: [['D', 0], ['F', 8], ['R', 6]], colors: (c) => [c.D[4], c.F[4], c.R[4]] }, edge: { pos: [['F', 5], ['R', 3]], colors: (c) => [c.F[4], c.R[4]] } },
      { corner: { pos: [['D', 2], ['R', 8], ['B', 6]], colors: (c) => [c.D[4], c.R[4], c.B[4]] }, edge: { pos: [['R', 5], ['B', 3]], colors: (c) => [c.R[4], c.B[4]] } },
      { corner: { pos: [['D', 8], ['B', 8], ['L', 6]], colors: (c) => [c.D[4], c.B[4], c.L[4]] }, edge: { pos: [['B', 5], ['L', 3]], colors: (c) => [c.B[4], c.L[4]] } },
      { corner: { pos: [['D', 6], ['L', 8], ['F', 6]], colors: (c) => [c.D[4], c.L[4], c.F[4]] }, edge: { pos: [['L', 5], ['F', 3]], colors: (c) => [c.L[4], c.F[4]] } },
    ]
  }
  if (crossFace === 'U') {
    return [
      { corner: { pos: [['U', 8], ['F', 2], ['R', 0]], colors: (c) => [c.U[4], c.F[4], c.R[4]] }, edge: { pos: [['F', 5], ['R', 3]], colors: (c) => [c.F[4], c.R[4]] } },
      { corner: { pos: [['U', 2], ['R', 2], ['B', 0]], colors: (c) => [c.U[4], c.R[4], c.B[4]] }, edge: { pos: [['R', 5], ['B', 3]], colors: (c) => [c.R[4], c.B[4]] } },
      { corner: { pos: [['U', 0], ['B', 2], ['L', 0]], colors: (c) => [c.U[4], c.B[4], c.L[4]] }, edge: { pos: [['B', 5], ['L', 3]], colors: (c) => [c.B[4], c.L[4]] } },
      { corner: { pos: [['U', 6], ['L', 2], ['F', 0]], colors: (c) => [c.U[4], c.L[4], c.F[4]] }, edge: { pos: [['L', 5], ['F', 3]], colors: (c) => [c.L[4], c.F[4]] } },
    ]
  }
  if (crossFace === 'F') {
    return [
      { corner: { pos: [['F', 2], ['U', 6], ['R', 0]], colors: (c) => [c.F[4], c.U[4], c.R[4]] }, edge: { pos: [['U', 5], ['R', 1]], colors: (c) => [c.U[4], c.R[4]] } },
      { corner: { pos: [['F', 8], ['R', 6], ['D', 0]], colors: (c) => [c.F[4], c.R[4], c.D[4]] }, edge: { pos: [['R', 7], ['D', 3]], colors: (c) => [c.R[4], c.D[4]] } },
      { corner: { pos: [['F', 6], ['D', 6], ['L', 8]], colors: (c) => [c.F[4], c.D[4], c.L[4]] }, edge: { pos: [['D', 3], ['L', 7]], colors: (c) => [c.D[4], c.L[4]] } },
      { corner: { pos: [['F', 0], ['L', 2], ['U', 6]], colors: (c) => [c.F[4], c.L[4], c.U[4]] }, edge: { pos: [['L', 1], ['U', 3]], colors: (c) => [c.L[4], c.U[4]] } },
    ]
  }
  if (crossFace === 'B') {
    return [
      { corner: { pos: [['B', 2], ['U', 0], ['L', 0]], colors: (c) => [c.B[4], c.U[4], c.L[4]] }, edge: { pos: [['U', 3], ['L', 1]], colors: (c) => [c.U[4], c.L[4]] } },
      { corner: { pos: [['B', 0], ['R', 2], ['U', 2]], colors: (c) => [c.B[4], c.R[4], c.U[4]] }, edge: { pos: [['R', 1], ['U', 5]], colors: (c) => [c.R[4], c.U[4]] } },
      { corner: { pos: [['B', 6], ['D', 2], ['R', 8]], colors: (c) => [c.B[4], c.D[4], c.R[4]] }, edge: { pos: [['D', 5], ['R', 7]], colors: (c) => [c.D[4], c.R[4]] } },
      { corner: { pos: [['B', 8], ['L', 6], ['D', 8]], colors: (c) => [c.B[4], c.L[4], c.D[4]] }, edge: { pos: [['L', 7], ['D', 3]], colors: (c) => [c.L[4], c.D[4]] } },
    ]
  }
  if (crossFace === 'R') {
    return [
      { corner: { pos: [['R', 0], ['F', 2], ['U', 8]], colors: (c) => [c.R[4], c.F[4], c.U[4]] }, edge: { pos: [['F', 1], ['U', 7]], colors: (c) => [c.F[4], c.U[4]] } },
      { corner: { pos: [['R', 6], ['D', 0], ['F', 8]], colors: (c) => [c.R[4], c.D[4], c.F[4]] }, edge: { pos: [['D', 1], ['F', 7]], colors: (c) => [c.D[4], c.F[4]] } },
      { corner: { pos: [['R', 8], ['B', 6], ['D', 2]], colors: (c) => [c.R[4], c.B[4], c.D[4]] }, edge: { pos: [['B', 7], ['D', 7]], colors: (c) => [c.B[4], c.D[4]] } },
      { corner: { pos: [['R', 2], ['U', 2], ['B', 0]], colors: (c) => [c.R[4], c.U[4], c.B[4]] }, edge: { pos: [['U', 1], ['B', 1]], colors: (c) => [c.U[4], c.B[4]] } },
    ]
  }
  if (crossFace === 'L') {
    return [
      { corner: { pos: [['L', 2], ['U', 6], ['F', 0]], colors: (c) => [c.L[4], c.U[4], c.F[4]] }, edge: { pos: [['U', 7], ['F', 1]], colors: (c) => [c.U[4], c.F[4]] } },
      { corner: { pos: [['L', 0], ['B', 2], ['U', 0]], colors: (c) => [c.L[4], c.B[4], c.U[4]] }, edge: { pos: [['B', 1], ['U', 1]], colors: (c) => [c.B[4], c.U[4]] } },
      { corner: { pos: [['L', 6], ['D', 8], ['B', 8]], colors: (c) => [c.L[4], c.D[4], c.B[4]] }, edge: { pos: [['D', 7], ['B', 7]], colors: (c) => [c.D[4], c.B[4]] } },
      { corner: { pos: [['L', 8], ['F', 6], ['D', 6]], colors: (c) => [c.L[4], c.F[4], c.D[4]] }, edge: { pos: [['F', 7], ['D', 1]], colors: (c) => [c.F[4], c.D[4]] } },
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

function analyzeCFOP(moves: string[], stateHistory: CubeFaces[]): CFOPAnalysis | null {
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

  if (!crossColor) return null

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
    if (isOLLSolved(stateHistory[i], crossColor)) {
      ollMoveIndex = i - 1
      break
    }
  }

  const pllStartIdx = ollMoveIndex >= 0 ? ollMoveIndex + 1
    : f2lSlotIndices.length > 0 ? f2lSlotIndices[f2lSlotIndices.length - 1] + 1
    : crossMoveIndex + 1

  for (let i = pllStartIdx; i < stateHistory.length; i++) {
    if (isPLLSolved(stateHistory[i])) {
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
      f2lPhases.push({ name: `F2L Slot ${i + 1}`, moves: slotMoves, skipped: slotMoves.length === 0 })
      prevIndex = slotMoveIndex
    } else {
      f2lPhases.push({ name: `F2L Slot ${i + 1}`, moves: [], skipped: true })
    }
  }

  const ollStartIdx = f2lSlotIndices.length > 0 ? f2lSlotIndices[f2lSlotIndices.length - 1] : crossMoveIndex
  const ollEndIdx = ollMoveIndex >= 0 ? ollMoveIndex : pllMoveIndex >= 0 ? pllMoveIndex : moves.length - 1
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
    cross: { name: 'Cross', moves: crossMoves, skipped: crossMoves.length === 0 },
    f2l: f2lPhases,
    oll: { name: 'OLL', moves: ollMoves, skipped: ollMoves.length === 0 },
    pll: { name: 'PLL', moves: pllMoves, skipped: pllSkipped },
  }
}

function buildStateHistory(scramble: string, solution: string[]): CubeFaces[] {
  const scrambleMoves = parseScramble(scramble)

  let cube = createSolvedCube()
  for (const move of scrambleMoves) {
    cube = applyMove(cube, move)
  }

  const states: CubeFaces[] = [JSON.parse(JSON.stringify(cube))]
  for (const move of solution) {
    cube = applyMove(cube, move)
    states.push(JSON.parse(JSON.stringify(cube)))
  }

  return states
}

function isOnlyAUFMoves(moves: string[], crossColor: Color): boolean {
  if (moves.length === 0) return true
  const crossFace = CROSS_COLOR_TO_FACE[crossColor]
  const aufFace = OPPOSITE_FACE[crossFace]
  const aufMoves = [aufFace, `${aufFace}'`, `${aufFace}2`]
  return moves.every(m => aufMoves.includes(m))
}

function needsReanalysis(solve: DocumentData): boolean {
  if (!solve.cfopAnalysis || !solve.solution || solve.solution.length === 0) {
    return false
  }

  const analysis = solve.cfopAnalysis as CFOPAnalysis
  const crossColor = analysis.crossColor

  if (crossColor !== 'W' && crossColor !== 'Y') {
    const allF2LSkipped = analysis.f2l.every(slot => slot.skipped)
    if (allF2LSkipped) return true
  }

  if (!analysis.pll.skipped && isOnlyAUFMoves(analysis.pll.moves, crossColor)) {
    return true
  }

  return false
}

async function reanalyzeCFOP() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!serviceAccount) {
      console.error('FIREBASE_SERVICE_ACCOUNT environment variable is required')
      console.log('Set it to the path of your service account JSON file or the JSON content')
      process.exit(1)
    }

    try {
      const credential = serviceAccount.startsWith('{')
        ? cert(JSON.parse(serviceAccount))
        : cert(serviceAccount)

      initializeApp({ credential })
    } catch (error) {
      console.error('Failed to initialize Firebase:', error)
      process.exit(1)
    }
  }

  const db = getFirestore()

  console.log('Fetching all solves with CFOP analysis...')
  const snapshot = await db.collectionGroup('solves').get()

  const solvesToReanalyze = snapshot.docs.filter(doc => needsReanalysis(doc.data()))
  console.log(`Found ${solvesToReanalyze.length} solves that need re-analysis`)
  console.log(`(out of ${snapshot.docs.length} total solves)`)

  if (solvesToReanalyze.length === 0) {
    console.log('No solves need re-analysis!')
    return
  }

  let updated = 0
  let failed = 0
  let skipped = 0
  const batchSize = 500

  for (let i = 0; i < solvesToReanalyze.length; i += batchSize) {
    const batch = db.batch()
    const chunk = solvesToReanalyze.slice(i, i + batchSize)
    let batchUpdates = 0

    for (const doc of chunk) {
      const solve = doc.data()

      try {
        const scramble = solve.scramble as string
        const solution = solve.solution as string[]

        if (!scramble || !solution || solution.length === 0) {
          skipped++
          continue
        }

        const stateHistory = buildStateHistory(scramble, solution)
        const newAnalysis = analyzeCFOP(solution, stateHistory)

        if (!newAnalysis) {
          skipped++
          continue
        }

        batch.update(doc.ref, { cfopAnalysis: newAnalysis })
        batchUpdates++
        updated++
      } catch (error) {
        console.error(`Failed to re-analyze ${doc.ref.path}:`, error)
        failed++
      }
    }

    if (batchUpdates > 0) {
      await batch.commit()
    }
    console.log(`Progress: ${Math.min(i + batchSize, solvesToReanalyze.length)}/${solvesToReanalyze.length}`)
  }

  console.log(`\nRe-analysis complete!`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Failed: ${failed}`)
}

reanalyzeCFOP().catch(console.error)
