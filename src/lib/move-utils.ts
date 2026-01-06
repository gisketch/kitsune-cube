export type MoveBase = 'U' | 'D' | 'L' | 'R' | 'F' | 'B'
export type MoveModifier = '' | "'" | '2'
export type Move = `${MoveBase}${MoveModifier}`

export interface ParsedMove {
  face: MoveBase
  modifier: MoveModifier
  original: string
}

export function parseMove(move: string): ParsedMove | null {
  const trimmed = move.trim()
  if (!trimmed) return null

  const faceMatch = trimmed.match(/^([UDLRFB])(['2]?)$/)
  if (!faceMatch) return null

  return {
    face: faceMatch[1] as MoveBase,
    modifier: (faceMatch[2] || '') as MoveModifier,
    original: trimmed,
  }
}

export function parseScramble(scramble: string): ParsedMove[] {
  return scramble
    .split(/\s+/)
    .map(parseMove)
    .filter((m): m is ParsedMove => m !== null)
}

export function formatMove(face: MoveBase, modifier: MoveModifier): string {
  return `${face}${modifier}`
}

export function getInverseMove(move: ParsedMove): ParsedMove {
  let newModifier: MoveModifier
  if (move.modifier === '') {
    newModifier = "'"
  } else if (move.modifier === "'") {
    newModifier = ''
  } else {
    newModifier = '2'
  }

  return {
    face: move.face,
    modifier: newModifier,
    original: formatMove(move.face, newModifier),
  }
}

export function movesToQuarterTurns(modifier: MoveModifier): number {
  if (modifier === '') return 1
  if (modifier === "'") return 3
  return 2
}

export function quarterTurnsToModifier(turns: number): MoveModifier {
  const normalized = ((turns % 4) + 4) % 4
  if (normalized === 0) return '2'
  if (normalized === 1) return ''
  if (normalized === 2) return '2'
  return "'"
}

export function combineMove(expected: ParsedMove, actual: ParsedMove): ParsedMove | null {
  if (expected.face !== actual.face) return null

  const expectedTurns = movesToQuarterTurns(expected.modifier)
  const actualTurns = movesToQuarterTurns(actual.modifier)

  const remaining = (expectedTurns - actualTurns + 4) % 4

  if (remaining === 0) {
    return null
  }

  const newModifier = quarterTurnsToModifier(remaining)
  return {
    face: expected.face,
    modifier: newModifier,
    original: formatMove(expected.face, newModifier),
  }
}

export function isSameFace(move1: ParsedMove, move2: ParsedMove): boolean {
  return move1.face === move2.face
}

export function movesAreEqual(move1: ParsedMove, move2: ParsedMove): boolean {
  return move1.face === move2.face && move1.modifier === move2.modifier
}

export function consolidateMoves(moves: string[]): string[] {
  if (moves.length === 0) return []

  const result: string[] = []
  let i = 0

  while (i < moves.length) {
    const current = parseMove(moves[i])
    if (!current) {
      result.push(moves[i])
      i++
      continue
    }

    let totalQuarterTurns = movesToQuarterTurns(current.modifier)

    while (i + 1 < moves.length) {
      const next = parseMove(moves[i + 1])
      if (!next || next.face !== current.face) break
      totalQuarterTurns += movesToQuarterTurns(next.modifier)
      i++
    }

    const normalized = ((totalQuarterTurns % 4) + 4) % 4
    if (normalized === 0) {
      // Moves cancel out, don't add anything
    } else if (normalized === 1) {
      result.push(formatMove(current.face, ''))
    } else if (normalized === 2) {
      result.push(formatMove(current.face, '2'))
    } else {
      result.push(formatMove(current.face, "'"))
    }

    i++
  }

  return result
}

export function countConsolidatedMoves(moves: string[]): number {
  return consolidateMoves(moves).length
}
