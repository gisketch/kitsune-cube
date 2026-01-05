import { describe, it, expect } from 'vitest'
import { calculatePhaseTimings } from './cfop-timing'
import type { CFOPAnalysis } from './cfop-analyzer'
import type { MoveFrame } from '@/types'

describe('CFOP Recognition vs Execution Timing', () => {
  describe('calculatePhaseTimings', () => {
    it('should return null when moveTimings is empty', () => {
      const analysis: CFOPAnalysis = {
        crossColor: 'W',
        cross: { name: 'Cross', moves: ['R', 'U'], skipped: false },
        f2l: [
          { name: 'F2L Slot 1', moves: ['R', 'U', 'R\''], skipped: false },
          { name: 'F2L Slot 2', moves: [], skipped: true },
          { name: 'F2L Slot 3', moves: [], skipped: true },
          { name: 'F2L Slot 4', moves: [], skipped: true },
        ],
        oll: { name: 'OLL', moves: [], skipped: true },
        pll: { name: 'PLL', moves: [], skipped: true },
      }

      const result = calculatePhaseTimings(analysis, [])
      expect(result).toBeNull()
    })

    it('should calculate cross with 0 recognition time', () => {
      const analysis: CFOPAnalysis = {
        crossColor: 'W',
        cross: { name: 'Cross', moves: ['R', 'U', 'F'], skipped: false },
        f2l: [
          { name: 'F2L Slot 1', moves: [], skipped: true },
          { name: 'F2L Slot 2', moves: [], skipped: true },
          { name: 'F2L Slot 3', moves: [], skipped: true },
          { name: 'F2L Slot 4', moves: [], skipped: true },
        ],
        oll: { name: 'OLL', moves: [], skipped: true },
        pll: { name: 'PLL', moves: [], skipped: true },
      }

      const moveTimings: MoveFrame[] = [
        { time: 0, move: 'R' },
        { time: 200, move: 'U' },
        { time: 400, move: 'F' },
      ]

      const result = calculatePhaseTimings(analysis, moveTimings)

      expect(result).not.toBeNull()
      expect(result!.cross.recognitionTime).toBe(0)
      expect(result!.cross.executionTime).toBe(400)
    })

    it('should calculate F2L recognition as gap between cross end and F2L start', () => {
      const analysis: CFOPAnalysis = {
        crossColor: 'W',
        cross: { name: 'Cross', moves: ['R', 'U'], skipped: false },
        f2l: [
          { name: 'F2L Slot 1', moves: ['L', 'U\'', 'L\''], skipped: false },
          { name: 'F2L Slot 2', moves: [], skipped: true },
          { name: 'F2L Slot 3', moves: [], skipped: true },
          { name: 'F2L Slot 4', moves: [], skipped: true },
        ],
        oll: { name: 'OLL', moves: [], skipped: true },
        pll: { name: 'PLL', moves: [], skipped: true },
      }

      const moveTimings: MoveFrame[] = [
        { time: 0, move: 'R' },
        { time: 200, move: 'U' },
        { time: 800, move: 'L' },
        { time: 1000, move: 'U\'' },
        { time: 1200, move: 'L\'' },
      ]

      const result = calculatePhaseTimings(analysis, moveTimings)

      expect(result).not.toBeNull()
      expect(result!.f2l[0].recognitionTime).toBe(600)
      expect(result!.f2l[0].executionTime).toBe(400)
    })

    it('should calculate sequential F2L recognition times correctly', () => {
      const analysis: CFOPAnalysis = {
        crossColor: 'W',
        cross: { name: 'Cross', moves: ['R'], skipped: false },
        f2l: [
          { name: 'F2L Slot 1', moves: ['L', 'U'], skipped: false },
          { name: 'F2L Slot 2', moves: ['R', 'U\''], skipped: false },
          { name: 'F2L Slot 3', moves: [], skipped: true },
          { name: 'F2L Slot 4', moves: [], skipped: true },
        ],
        oll: { name: 'OLL', moves: [], skipped: true },
        pll: { name: 'PLL', moves: [], skipped: true },
      }

      const moveTimings: MoveFrame[] = [
        { time: 0, move: 'R' },
        { time: 500, move: 'L' },
        { time: 700, move: 'U' },
        { time: 1500, move: 'R' },
        { time: 1700, move: 'U\'' },
      ]

      const result = calculatePhaseTimings(analysis, moveTimings)

      expect(result!.f2l[0].recognitionTime).toBe(500)
      expect(result!.f2l[0].executionTime).toBe(200)
      expect(result!.f2l[1].recognitionTime).toBe(800)
      expect(result!.f2l[1].executionTime).toBe(200)
    })

    it('should calculate OLL recognition as gap between F2L end and OLL start', () => {
      const analysis: CFOPAnalysis = {
        crossColor: 'W',
        cross: { name: 'Cross', moves: ['R'], skipped: false },
        f2l: [
          { name: 'F2L Slot 1', moves: ['L'], skipped: false },
          { name: 'F2L Slot 2', moves: [], skipped: true },
          { name: 'F2L Slot 3', moves: [], skipped: true },
          { name: 'F2L Slot 4', moves: [], skipped: true },
        ],
        oll: { name: 'OLL', moves: ['F', 'R', 'U'], skipped: false },
        pll: { name: 'PLL', moves: [], skipped: true },
      }

      const moveTimings: MoveFrame[] = [
        { time: 0, move: 'R' },
        { time: 200, move: 'L' },
        { time: 1000, move: 'F' },
        { time: 1100, move: 'R' },
        { time: 1200, move: 'U' },
      ]

      const result = calculatePhaseTimings(analysis, moveTimings)

      expect(result!.oll.recognitionTime).toBe(800)
      expect(result!.oll.executionTime).toBe(200)
    })

    it('should calculate PLL recognition as gap between OLL end and PLL start', () => {
      const analysis: CFOPAnalysis = {
        crossColor: 'W',
        cross: { name: 'Cross', moves: ['R'], skipped: false },
        f2l: [
          { name: 'F2L Slot 1', moves: [], skipped: true },
          { name: 'F2L Slot 2', moves: [], skipped: true },
          { name: 'F2L Slot 3', moves: [], skipped: true },
          { name: 'F2L Slot 4', moves: [], skipped: true },
        ],
        oll: { name: 'OLL', moves: ['F'], skipped: false },
        pll: { name: 'PLL', moves: ['R', 'U', 'R\''], skipped: false },
      }

      const moveTimings: MoveFrame[] = [
        { time: 0, move: 'R' },
        { time: 200, move: 'F' },
        { time: 1200, move: 'R' },
        { time: 1300, move: 'U' },
        { time: 1400, move: 'R\'' },
      ]

      const result = calculatePhaseTimings(analysis, moveTimings)

      expect(result!.pll.recognitionTime).toBe(1000)
      expect(result!.pll.executionTime).toBe(200)
    })

    it('should handle skipped phases correctly', () => {
      const analysis: CFOPAnalysis = {
        crossColor: 'W',
        cross: { name: 'Cross', moves: ['R'], skipped: false },
        f2l: [
          { name: 'F2L Slot 1', moves: [], skipped: true },
          { name: 'F2L Slot 2', moves: [], skipped: true },
          { name: 'F2L Slot 3', moves: [], skipped: true },
          { name: 'F2L Slot 4', moves: [], skipped: true },
        ],
        oll: { name: 'OLL', moves: [], skipped: true },
        pll: { name: 'PLL', moves: ['U'], skipped: false },
      }

      const moveTimings: MoveFrame[] = [
        { time: 0, move: 'R' },
        { time: 500, move: 'U' },
      ]

      const result = calculatePhaseTimings(analysis, moveTimings)

      expect(result!.cross.recognitionTime).toBe(0)
      expect(result!.f2l[0].recognitionTime).toBe(0)
      expect(result!.f2l[0].executionTime).toBe(0)
      expect(result!.oll.recognitionTime).toBe(0)
      expect(result!.oll.executionTime).toBe(0)
      expect(result!.pll.recognitionTime).toBe(500)
      expect(result!.pll.executionTime).toBe(0)
    })

    it('should return recognition ratio for each phase', () => {
      const analysis: CFOPAnalysis = {
        crossColor: 'W',
        cross: { name: 'Cross', moves: ['R', 'U'], skipped: false },
        f2l: [
          { name: 'F2L Slot 1', moves: ['L', 'U\''], skipped: false },
          { name: 'F2L Slot 2', moves: [], skipped: true },
          { name: 'F2L Slot 3', moves: [], skipped: true },
          { name: 'F2L Slot 4', moves: [], skipped: true },
        ],
        oll: { name: 'OLL', moves: [], skipped: true },
        pll: { name: 'PLL', moves: [], skipped: true },
      }

      const moveTimings: MoveFrame[] = [
        { time: 0, move: 'R' },
        { time: 200, move: 'U' },
        { time: 400, move: 'L' },
        { time: 600, move: 'U\'' },
      ]

      const result = calculatePhaseTimings(analysis, moveTimings)

      expect(result!.cross.recognitionRatio).toBe(0)
      expect(result!.f2l[0].recognitionRatio).toBeCloseTo(200 / 400, 2)
    })

    it('should calculate total phase duration including recognition', () => {
      const analysis: CFOPAnalysis = {
        crossColor: 'W',
        cross: { name: 'Cross', moves: ['R'], skipped: false },
        f2l: [
          { name: 'F2L Slot 1', moves: ['L', 'U'], skipped: false },
          { name: 'F2L Slot 2', moves: [], skipped: true },
          { name: 'F2L Slot 3', moves: [], skipped: true },
          { name: 'F2L Slot 4', moves: [], skipped: true },
        ],
        oll: { name: 'OLL', moves: [], skipped: true },
        pll: { name: 'PLL', moves: [], skipped: true },
      }

      const moveTimings: MoveFrame[] = [
        { time: 0, move: 'R' },
        { time: 500, move: 'L' },
        { time: 700, move: 'U' },
      ]

      const result = calculatePhaseTimings(analysis, moveTimings)

      expect(result!.f2l[0].totalDuration).toBe(700)
    })

    it('should handle AUF adjustments in PLL (execution continues to last move)', () => {
      const analysis: CFOPAnalysis = {
        crossColor: 'W',
        cross: { name: 'Cross', moves: ['R'], skipped: false },
        f2l: [
          { name: 'F2L Slot 1', moves: [], skipped: true },
          { name: 'F2L Slot 2', moves: [], skipped: true },
          { name: 'F2L Slot 3', moves: [], skipped: true },
          { name: 'F2L Slot 4', moves: [], skipped: true },
        ],
        oll: { name: 'OLL', moves: ['F'], skipped: false },
        pll: { name: 'PLL', moves: ['R', 'U', 'R\'', 'U'], skipped: false },
      }

      const moveTimings: MoveFrame[] = [
        { time: 0, move: 'R' },
        { time: 100, move: 'F' },
        { time: 300, move: 'R' },
        { time: 400, move: 'U' },
        { time: 500, move: 'R\'' },
        { time: 600, move: 'U' },
      ]

      const result = calculatePhaseTimings(analysis, moveTimings)

      expect(result!.pll.executionTime).toBe(300)
    })
  })

  describe('getAggregatePhaseTiming', () => {
    it('should aggregate F2L slots into total F2L timing', () => {
      const analysis: CFOPAnalysis = {
        crossColor: 'W',
        cross: { name: 'Cross', moves: ['R'], skipped: false },
        f2l: [
          { name: 'F2L Slot 1', moves: ['L'], skipped: false },
          { name: 'F2L Slot 2', moves: ['R'], skipped: false },
          { name: 'F2L Slot 3', moves: ['F'], skipped: false },
          { name: 'F2L Slot 4', moves: ['B'], skipped: false },
        ],
        oll: { name: 'OLL', moves: [], skipped: true },
        pll: { name: 'PLL', moves: [], skipped: true },
      }

      const moveTimings: MoveFrame[] = [
        { time: 0, move: 'R' },
        { time: 300, move: 'L' },
        { time: 600, move: 'R' },
        { time: 900, move: 'F' },
        { time: 1200, move: 'B' },
      ]

      const result = calculatePhaseTimings(analysis, moveTimings)

      expect(result!.aggregated.f2l.recognitionTime).toBe(300 + 300 + 300 + 300)
      expect(result!.aggregated.f2l.executionTime).toBe(0)
    })
  })
})
