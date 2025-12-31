import { useMemo } from 'react'
import type { Solve } from '@/hooks/useSolves'
import { createSolvedCube, applyMove, COLOR_HEX, type CubeFaces } from '@/lib/cube-faces'

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const centiseconds = Math.floor((ms % 1000) / 10)

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
  }
  return `${seconds}.${centiseconds.toString().padStart(2, '0')}`
}

function getScrambledState(scramble: string): CubeFaces {
  const moves = scramble
    .trim()
    .split(/\s+/)
    .filter((m) => m.length > 0)
  let cube = createSolvedCube()
  for (const move of moves) {
    cube = applyMove(cube, move)
  }
  return cube
}

function MiniFace({ face }: { face: string[] }) {
  return (
    <div className="grid grid-cols-3 gap-[1px]" style={{ width: 21, height: 21 }}>
      {face.map((color, i) => (
        <div
          key={i}
          className="rounded-[1px]"
          style={{
            backgroundColor: COLOR_HEX[color as keyof typeof COLOR_HEX] || '#888',
            width: 6,
            height: 6,
          }}
        />
      ))}
    </div>
  )
}

interface RecentSolvesProps {
  solves: Solve[]
}

export function RecentSolves({ solves }: RecentSolvesProps) {
  const recentSolves = useMemo(() => solves.slice(0, 5), [solves])

  if (recentSolves.length === 0) {
    return null
  }

  return (
    <div className="mt-2 w-full md:hidden">
      <div className="flex flex-col">
        {recentSolves.map((solve, index) => {
          const scrambledState = getScrambledState(solve.scramble)
          const solveNumber = solves.length - index

          return (
            <div
              key={solve.id}
              className="flex items-center gap-2 py-1.5"
              style={{ borderBottom: index < recentSolves.length - 1 ? '1px solid var(--theme-subAlt)' : 'none' }}
            >
              <span
                className="w-8 text-xs font-medium"
                style={{ color: 'var(--theme-sub)' }}
              >
                #{solveNumber}
              </span>
              <MiniFace face={scrambledState.F} />
              <div className="flex flex-1 items-center justify-end gap-1">
                {solve.isManual && (
                  <span 
                    className="rounded px-1 py-0.5 text-[8px] font-medium uppercase"
                    style={{ backgroundColor: 'var(--theme-subAlt)', color: 'var(--theme-sub)' }}
                  >
                    m
                  </span>
                )}
                <span
                  className="font-mono text-sm font-medium"
                  style={{ color: 'var(--theme-text)' }}
                >
                  {formatTime(solve.time)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
