import { describe, it, expect } from 'vitest'
import { analyzeCFOP, detectCurrentPhase } from './cfop-analyzer'
import { applyMove, createSolvedCube, type CubeFaces } from './cube-faces'
import { parseScramble, type ParsedMove } from './move-utils'

function parsedMovesToStrings(moves: ParsedMove[]): string[] {
  return moves.map((m) => m.original)
}

function generateStateHistory(scrambledCube: CubeFaces, solutionMoves: ParsedMove[]): CubeFaces[] {
  const history: CubeFaces[] = [scrambledCube]
  let currentState = scrambledCube

  for (const move of solutionMoves) {
    currentState = applyMove(currentState, move.original)
    history.push(currentState)
  }

  return history
}

function applyScramble(scramble: string): CubeFaces {
  const moves = parseScramble(scramble)
  let cube = createSolvedCube()
  for (const move of moves) {
    cube = applyMove(cube, move.original)
  }
  return cube
}

describe('CFOP Analyzer - Cross Detection', () => {
  describe('White Cross (U face)', () => {
    it('detects white cross correctly', () => {
      const whiteCrossState: CubeFaces = {
        U: ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
        D: ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
        F: ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'],
        B: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B'],
        L: ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
        R: ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
      }

      const phase = detectCurrentPhase(whiteCrossState)
      expect(phase.crossColor).toBe('W')
      expect(phase.crossSolved).toBe(true)
    })
  })

  describe('Yellow Cross (D face)', () => {
    it('detects yellow cross correctly', () => {
      const phase = detectCurrentPhase(createSolvedCube())
      expect(phase.crossSolved).toBe(true)
    })
  })

  describe('Red Cross (R face)', () => {
    it('detects red cross when solved', () => {
      const redCrossSolved: CubeFaces = {
        U: ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'],
        D: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B'],
        F: ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
        B: ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
        L: ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
        R: ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
      }

      const phase = detectCurrentPhase(redCrossSolved)
      expect(phase.crossColor).toBe('R')
      expect(phase.crossSolved).toBe(true)
    })
  })

  describe('Blue Cross (B face)', () => {
    it('detects blue cross when solved', () => {
      const blueCrossSolved: CubeFaces = {
        U: ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
        D: ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
        F: ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
        B: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B'],
        L: ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
        R: ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'],
      }

      const phase = detectCurrentPhase(blueCrossSolved)
      expect(phase.crossColor).toBe('B')
      expect(phase.crossSolved).toBe(true)
    })
  })
})

describe('CFOP Analyzer - F2L Detection for All Cross Colors', () => {
  describe('Red Cross F2L Detection', () => {
    const scramble = "U' B R' U2 F R' U' R D' R' U2 F2 R D2 R2 D2 B2 D2 L' B2 L"
    const solution =
      "U L F2 U B' U' B R' U R L2 U2 L2 D2 L U2 L' D' L' D L' B' L B F L F' F L' F' L F L' F' U L' U' B L' B' L2 F L' F' L D F L F' L' D' L' F L F' L F L2 F' L2 F L F' L F L2 F' L2 F2 R R' F D F' U2 F D' F' U2 F2 L'"

    it('should detect F2L slots are NOT all skipped for red cross solve', () => {
      const scrambledCube = applyScramble(scramble)
      const solutionMoves = parseScramble(solution)
      const stateHistory = generateStateHistory(scrambledCube, solutionMoves)

      const analysis = analyzeCFOP(parsedMovesToStrings(solutionMoves), stateHistory)

      expect(analysis).not.toBeNull()
      expect(analysis!.crossColor).toBe('R')

      const allF2LSkipped = analysis!.f2l.every((slot) => slot.skipped)
      expect(allF2LSkipped).toBe(false)
    })

    it('should have at least some F2L moves detected', () => {
      const scrambledCube = applyScramble(scramble)
      const solutionMoves = parseScramble(solution)
      const stateHistory = generateStateHistory(scrambledCube, solutionMoves)

      const analysis = analyzeCFOP(parsedMovesToStrings(solutionMoves), stateHistory)

      expect(analysis).not.toBeNull()

      const totalF2LMoves = analysis!.f2l.reduce((sum, slot) => sum + slot.moves.length, 0)
      expect(totalF2LMoves).toBeGreaterThan(0)
    })
  })

  describe('Blue Cross F2L Detection', () => {
    const scramble = "U B L2 D B2 L U2 D' F L2 U B2 D' B2 D2 B2 R2 B2 R2 U' R2"
    const solution =
      "F' D' L F D' L D' L' F R U' R D' F D F2 U F' U' L F L' F' L F2 L' F' L F F L' F' L F L' F2 D' F D F R F' R' L F L' F2 L F2 L' F L F L' F' L F L' F' L F F L' F' L F L' F L' F L F D F' D' F L F' L' F' U' F U F U F' U' F' R' F R F L F L' F L F2 L' L' F L' F' L B' L' B L' F B' L2 F' L2 B L2 F"

    it('should detect F2L slots are NOT all skipped for blue cross solve', () => {
      const scrambledCube = applyScramble(scramble)
      const solutionMoves = parseScramble(solution)
      const stateHistory = generateStateHistory(scrambledCube, solutionMoves)

      const analysis = analyzeCFOP(parsedMovesToStrings(solutionMoves), stateHistory)

      expect(analysis).not.toBeNull()
      expect(analysis!.crossColor).toBe('B')

      const allF2LSkipped = analysis!.f2l.every((slot) => slot.skipped)
      expect(allF2LSkipped).toBe(false)
    })

    it('should have at least some F2L moves detected', () => {
      const scrambledCube = applyScramble(scramble)
      const solutionMoves = parseScramble(solution)
      const stateHistory = generateStateHistory(scrambledCube, solutionMoves)

      const analysis = analyzeCFOP(parsedMovesToStrings(solutionMoves), stateHistory)

      expect(analysis).not.toBeNull()

      const totalF2LMoves = analysis!.f2l.reduce((sum, slot) => sum + slot.moves.length, 0)
      expect(totalF2LMoves).toBeGreaterThan(0)
    })
  })
})

describe('CFOP Analyzer - F2L Slot Detection for All Cross Colors', () => {
  it('should detect all F2L slots as solved for a fully solved red-cross oriented cube', () => {
    const redCrossSolved: CubeFaces = {
      U: ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'],
      D: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B'],
      F: ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
      B: ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
      L: ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
      R: ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
    }

    const phase = detectCurrentPhase(redCrossSolved)

    expect(phase.crossColor).toBe('R')
    expect(phase.f2lSlotsSolved).toEqual([true, true, true, true])
  })

  it('should detect all F2L slots as solved for a fully solved blue-cross oriented cube', () => {
    const blueCrossSolved: CubeFaces = {
      U: ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
      D: ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
      F: ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
      B: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B'],
      L: ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
      R: ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'],
    }

    const phase = detectCurrentPhase(blueCrossSolved)

    expect(phase.crossColor).toBe('B')
    expect(phase.f2lSlotsSolved).toEqual([true, true, true, true])
  })

  it('should detect all F2L slots as solved for a fully solved green-cross oriented cube', () => {
    const greenCrossSolved: CubeFaces = {
      U: ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
      D: ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
      F: ['G', 'G', 'G', 'G', 'G', 'G', 'G', 'G', 'G'],
      B: ['B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B'],
      L: ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
      R: ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
    }

    const phase = detectCurrentPhase(greenCrossSolved)

    expect(phase.crossColor).toBe('G')
    expect(phase.f2lSlotsSolved).toEqual([true, true, true, true])
  })

  it('should detect all F2L slots as solved for standard solved cube (white cross)', () => {
    const phase = detectCurrentPhase(createSolvedCube())

    expect(phase.crossColor).toBe('W')
    expect(phase.f2lSlotsSolved).toEqual([true, true, true, true])
  })
})

describe('CFOP Analyzer - Phase Transitions', () => {
  it('OLL moves should not include F2L moves when F2L is properly detected', () => {
    const scramble = "U' B R' U2 F R' U' R D' R' U2 F2 R D2 R2 D2 B2 D2 L' B2 L"
    const solution =
      "U L F2 U B' U' B R' U R L2 U2 L2 D2 L U2 L' D' L' D L' B' L B F L F' F L' F' L F L' F' U L' U' B L' B' L2 F L' F' L D F L F' L' D' L' F L F' L F L2 F' L2 F L F' L F L2 F' L2 F2 R R' F D F' U2 F D' F' U2 F2 L'"

    const scrambledCube = applyScramble(scramble)
    const solutionMoves = parseScramble(solution)
    const stateHistory = generateStateHistory(scrambledCube, solutionMoves)

    const analysis = analyzeCFOP(parsedMovesToStrings(solutionMoves), stateHistory)

    expect(analysis).not.toBeNull()

    expect(analysis!.oll.moves.length).toBeLessThan(30)
  })
})
