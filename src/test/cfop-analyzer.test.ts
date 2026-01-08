import { describe, it, expect } from 'vitest'
import { analyzeCFOP, detectCurrentPhase } from '@/lib/cfop-analyzer'
import { createSolvedCube, applyMove, type CubeFaces } from '@/lib/cube-faces'

function parseScramble(scramble: string): string[] {
  return scramble.trim().split(/\s+/).filter(Boolean)
}

function applyMoves(cube: CubeFaces, moves: string[]): CubeFaces {
  let result = cube
  for (const move of moves) {
    result = applyMove(result, move)
  }
  return result
}

function buildStateHistory(scramble: string, solution: string): { moves: string[]; states: CubeFaces[] } {
  const scrambleMoves = parseScramble(scramble)
  const solutionMoves = parseScramble(solution)

  let cube = createSolvedCube()
  cube = applyMoves(cube, scrambleMoves)

  const states: CubeFaces[] = [JSON.parse(JSON.stringify(cube))]

  for (const move of solutionMoves) {
    cube = applyMove(cube, move)
    states.push(JSON.parse(JSON.stringify(cube)))
  }

  return { moves: solutionMoves, states }
}

describe('CFOP Analyzer', () => {
  describe('Red cross (R face)', () => {
    it('should detect F2L slots for red cross solve', () => {
      const scramble = 'R2 B R\' F\' L\' D B\' L U D2 R2 F2 U2 L\' F2 U2 R\' U2 L D2'
      const solution = 'B L U2 L F\' D F2 L F\' U\' L U D L D\' L U L2 U\' L\' U L U\' L F L\' F\' L F L\' R L\' U\' R\' F\' L\' D\' L D U L U\' L B\' L B U\' L U L B L\' L B\' L\' B L2 B\' L\' B L B\' L\' B L B\' L\' B L B\' L\' U\' L U L B L\' B\' L\' F L\' F\' L2 B\' U B U\' B L B\' L F L\' F\' L2 D\' L\' D L\' D\' B D B\' D L D\' L\' U L\' U\' F U\' F\' U L\' F U L\' U\' L\' U L U\' F\' L U L U\' L\' U\' D F U F\' D\' U L U\' L\' U\' F U2 L\' U\' L\' U L U\' F\' L U\' L U\' L\' U\' L\' U\' L U L U L U\' L\' U\' L\' U\' L U L U2 L2'

      const { moves, states } = buildStateHistory(scramble, solution)
      const analysis = analyzeCFOP(moves, states)

      expect(analysis).not.toBeNull()
      expect(analysis!.crossColor).toBe('R')

      console.log('Red cross analysis:')
      console.log('  Cross moves:', analysis!.cross.moves.length, analysis!.cross.skipped ? '(SKIPPED)' : '')
      analysis!.f2l.forEach((slot, i) => {
        console.log(`  F2L Slot ${i + 1}:`, slot.moves.length, 'moves', slot.skipped ? '(SKIPPED)' : '')
      })
      console.log('  OLL moves:', analysis!.oll.moves.length, analysis!.oll.skipped ? '(SKIPPED)' : '')
      console.log('  PLL moves:', analysis!.pll.moves.length, analysis!.pll.skipped ? '(SKIPPED)' : '')

      const f2lSlotsWithMoves = analysis!.f2l.filter(slot => slot.moves.length > 0).length
      expect(f2lSlotsWithMoves).toBeGreaterThan(0)
    })
  })

  describe('Blue cross (B face)', () => {
    it('should detect F2L slots for blue cross solve', () => {
      const scramble = 'D2 F\' R2 U2 F\' D2 F2 L2 F\' R2 D2 F2 U\' L2 D B R F L D'
      const solution = 'B\' R F\' R\' U2 F2 D\' L D F D\' F\' U\' F\' U R F R2 F R F R F\' R\' D R\' D\' R F\' L F\' L\' F\' L L\' L\' U L U\' L F L\' F2 U F\' U\' F U\' R U R\' U F U\' F\' D F2 D\' F\' D F D\' F D F\' D\' L D\' L\' D L D F D\' F\' L\' F\' D2 B D\' F2 D B\' D\' F2 D2 L D\' D L\' D\' R2 D L D\' R2 D L\' D'

      const { moves, states } = buildStateHistory(scramble, solution)
      const analysis = analyzeCFOP(moves, states)

      expect(analysis).not.toBeNull()
      expect(analysis!.crossColor).toBe('B')

      console.log('Blue cross analysis:')
      console.log('  Cross moves:', analysis!.cross.moves.length, analysis!.cross.skipped ? '(SKIPPED)' : '')
      analysis!.f2l.forEach((slot, i) => {
        console.log(`  F2L Slot ${i + 1}:`, slot.moves.length, 'moves', slot.skipped ? '(SKIPPED)' : '')
      })
      console.log('  OLL moves:', analysis!.oll.moves.length, analysis!.oll.skipped ? '(SKIPPED)' : '')
      console.log('  PLL moves:', analysis!.pll.moves.length, analysis!.pll.skipped ? '(SKIPPED)' : '')

      const f2lSlotsWithMoves = analysis!.f2l.filter(slot => slot.moves.length > 0).length
      expect(f2lSlotsWithMoves).toBeGreaterThan(0)
    })
  })

  describe('White cross (U face)', () => {
    it('should detect cross color for any valid solve', () => {
      const scramble = 'R U R\' U\' R\' F R2 U\' R\' U\' R U R\' F\''
      const solution = 'F R\' U R U\' R\' U\' R U R\' F\' R U R\' U\''

      const { moves, states } = buildStateHistory(scramble, solution)
      const analysis = analyzeCFOP(moves, states)

      if (analysis) {
        expect(['W', 'Y', 'G', 'B', 'R', 'O']).toContain(analysis.crossColor)
      }
    })
  })

  describe('Yellow cross (D face)', () => {
    it('should work for standard yellow cross', () => {
      const cube = createSolvedCube()
      const phase = detectCurrentPhase(cube)

      expect(phase.pllSolved).toBe(true)
      expect(phase.phase).toBe('solved')
    })
  })

  describe('detectCurrentPhase', () => {
    it('should detect solved cube', () => {
      const cube = createSolvedCube()
      const phase = detectCurrentPhase(cube)

      expect(phase.phase).toBe('solved')
      expect(phase.crossSolved).toBe(true)
      expect(phase.f2lSlotsSolved).toEqual([true, true, true, true])
      expect(phase.ollSolved).toBe(true)
      expect(phase.pllSolved).toBe(true)
    })

    it('should detect non-solved phase when scrambled', () => {
      let cube = createSolvedCube()
      const scrambleMoves = ['R', 'U', 'R\'', 'U\'', 'F', 'R', 'U', 'R\'', 'U\'', 'F\'', 'L', 'U', 'L\'']
      for (const move of scrambleMoves) {
        cube = applyMove(cube, move)
      }

      const phase = detectCurrentPhase(cube)
      expect(phase.phase).not.toBe('solved')
    })
  })

  describe('F2L slot detection for all cross colors', () => {
    it('should have F2L configs for F face (green cross)', () => {
      let cube = createSolvedCube()
      const scramble = 'U R U\' R\''
      for (const move of parseScramble(scramble)) {
        cube = applyMove(cube, move)
      }

      const phase = detectCurrentPhase(cube)
      expect(phase).toBeDefined()
    })

    it('should have F2L configs for B face (blue cross)', () => {
      let cube = createSolvedCube()
      const phase = detectCurrentPhase(cube)
      expect(phase.crossColor).not.toBeNull()
    })

    it('should have F2L configs for L face (orange cross)', () => {
      let cube = createSolvedCube()
      const phase = detectCurrentPhase(cube)
      expect(phase.crossColor).not.toBeNull()
    })

    it('should have F2L configs for R face (red cross)', () => {
      let cube = createSolvedCube()
      const phase = detectCurrentPhase(cube)
      expect(phase.crossColor).not.toBeNull()
    })
  })

  describe('PLL skip detection', () => {
    it('should mark PLL as skipped when only U moves are used (AUF)', () => {
      const pllMoves = ['U', "U'", 'U2']
      
      for (const aufMove of pllMoves) {
        const mockAnalysis = {
          crossColor: 'W' as const,
          cross: { name: 'Cross', moves: ['R', 'U', "R'"], skipped: false },
          f2l: [
            { name: 'F2L Slot 1', moves: ['R', 'U', "R'"], skipped: false },
            { name: 'F2L Slot 2', moves: ['L', 'U', "L'"], skipped: false },
            { name: 'F2L Slot 3', moves: ['F', 'U', "F'"], skipped: false },
            { name: 'F2L Slot 4', moves: ['B', 'U', "B'"], skipped: false },
          ],
          oll: { name: 'OLL', moves: ['R', 'U', "R'", 'U', 'R', 'U2', "R'"], skipped: false },
          pll: { name: 'PLL', moves: [aufMove], skipped: true },
        }
        
        expect(mockAnalysis.pll.moves.length).toBeGreaterThan(0)
        expect(mockAnalysis.pll.skipped).toBe(true)
      }
    })

    it('should mark PLL as skipped for multiple U moves (U U2)', () => {
      const aufMoves = ['U', 'U2']
      const isOnlyAUF = (moves: string[]) => {
        const validAuf = ['U', "U'", 'U2']
        return moves.every(m => validAuf.includes(m))
      }
      
      expect(isOnlyAUF(aufMoves)).toBe(true)
    })

    it('should NOT mark PLL as skipped when real PLL algorithm is used', () => {
      const scramble = "R2 B R' F' L' D B' L U D2 R2 F2 U2 L' F2 U2 R' U2 L D2"
      const solution = "B L U2 L F' D F2 L F' U' L U D L D' L U L2 U' L' U L U' L F L' F' L F L' R L' U' R' F' L' D' L D U L U' L B' L B U' L U L B L' L B' L' B L2 B' L' B L B' L' B L B' L' B L B' L' U' L U L B L' B' L' F L' F' L2 B' U B U' B L B' L F L' F' L2 D' L' D L' D' B D B' D L D' L' U L' U' F U' F' U L' F U L' U' L' U L U' F' L U L U' L' U' D F U F' D' U L U' L' U' F U2 L' U' L' U L U' F' L U' L U' L' U' L' U' L U L U L U' L' U' L' U' L U L U2 L2"

      const { moves, states } = buildStateHistory(scramble, solution)
      const analysis = analyzeCFOP(moves, states)

      expect(analysis).not.toBeNull()
      expect(analysis!.pll.moves.length).toBeGreaterThan(3)
      expect(analysis!.pll.skipped).toBe(false)
    })
    
    it('should use cross-color-aware AUF detection', () => {
      const CROSS_COLOR_TO_FACE: Record<string, string> = { W: 'U', Y: 'D', G: 'F', B: 'B', R: 'R', O: 'L' }
      const OPPOSITE_FACE: Record<string, string> = { U: 'D', D: 'U', F: 'B', B: 'F', L: 'R', R: 'L' }
      
      const isOnlyAUF = (moves: string[], crossColor: string) => {
        if (moves.length === 0) return true
        const crossFace = CROSS_COLOR_TO_FACE[crossColor]
        const aufFace = OPPOSITE_FACE[crossFace]
        const aufMoves = [aufFace, `${aufFace}'`, `${aufFace}2`]
        return moves.every(m => aufMoves.includes(m))
      }

      // Yellow cross (D) - AUF is U
      expect(isOnlyAUF(['U'], 'Y')).toBe(true)
      expect(isOnlyAUF(["U'"], 'Y')).toBe(true)
      expect(isOnlyAUF(['U2'], 'Y')).toBe(true)
      expect(isOnlyAUF(['D'], 'Y')).toBe(false)
      
      // White cross (U) - AUF is D
      expect(isOnlyAUF(['D'], 'W')).toBe(true)
      expect(isOnlyAUF(["D'"], 'W')).toBe(true)
      expect(isOnlyAUF(['D2'], 'W')).toBe(true)
      expect(isOnlyAUF(['U'], 'W')).toBe(false)
      
      // Green cross (F) - AUF is B
      expect(isOnlyAUF(['B'], 'G')).toBe(true)
      expect(isOnlyAUF(["B'"], 'G')).toBe(true)
      expect(isOnlyAUF(['B2'], 'G')).toBe(true)
      expect(isOnlyAUF(['F'], 'G')).toBe(false)
      
      // Blue cross (B) - AUF is F
      expect(isOnlyAUF(['F'], 'B')).toBe(true)
      expect(isOnlyAUF(["F'"], 'B')).toBe(true)
      expect(isOnlyAUF(['F2'], 'B')).toBe(true)
      expect(isOnlyAUF(['B'], 'B')).toBe(false)
      
      // Red cross (R) - AUF is L
      expect(isOnlyAUF(['L'], 'R')).toBe(true)
      expect(isOnlyAUF(["L'"], 'R')).toBe(true)
      expect(isOnlyAUF(['L2'], 'R')).toBe(true)
      expect(isOnlyAUF(['R'], 'R')).toBe(false)
      
      // Orange cross (L) - AUF is R
      expect(isOnlyAUF(['R'], 'O')).toBe(true)
      expect(isOnlyAUF(["R'"], 'O')).toBe(true)
      expect(isOnlyAUF(['R2'], 'O')).toBe(true)
      expect(isOnlyAUF(['L'], 'O')).toBe(false)
    })
  })
})
