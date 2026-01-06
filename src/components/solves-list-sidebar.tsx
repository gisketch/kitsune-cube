import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListOrdered } from 'lucide-react'
import type { Solve } from '@/types'
import { createSolvedCube, applyMove, COLOR_HEX, type CubeFaces } from '@/lib/cube-faces'
import { useAuth } from '@/contexts/AuthContext'

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

interface SolvesListSidebarProps {
  solves: Solve[]
  maxItems?: number
}

export function SolvesListSidebar({ solves, maxItems = 10 }: SolvesListSidebarProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const displaySolves = useMemo(() => solves.slice(0, maxItems), [solves, maxItems])

  return (
    <div className="flex w-full flex-col p-3">
      <div className="mb-2 flex items-center gap-2">
        <ListOrdered className="h-4 w-4" style={{ color: 'var(--theme-sub)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
          recent
        </span>
      </div>

      <div className="overflow-y-auto">
        {displaySolves.length === 0 ? (
          <div 
            className="flex items-center justify-center py-4 text-sm"
            style={{ color: 'var(--theme-sub)' }}
          >
            No solves yet
          </div>
        ) : (
          <div className="flex flex-col">
            {displaySolves.map((solve, index) => {
              const scrambledState = getScrambledState(solve.scramble)
              const solveNumber = solves.length - index

              return (
                <button
                  key={solve.id}
                  onClick={() => navigate(user?.uid ? `/app/solve/${user.uid}/${solve.id}` : `/app/solve/${solve.id}`)}
                  className="flex items-center gap-3 rounded px-1 py-1.5 transition-colors hover:bg-[var(--theme-subAlt)]"
                  style={{ 
                    borderBottom: index < displaySolves.length - 1 ? '1px solid var(--theme-subAlt)' : 'none' 
                  }}
                >
                  <span
                    className="w-6 text-xs font-medium"
                    style={{ color: 'var(--theme-sub)' }}
                  >
                    #{solveNumber}
                  </span>
                  <MiniFace face={scrambledState.F} />
                  <div className="flex flex-1 items-center justify-end gap-1">
                    {solve.dnf && (
                      <span 
                        className="rounded px-1 py-0.5 text-[8px] font-medium uppercase"
                        style={{ backgroundColor: 'var(--theme-error)', color: 'var(--theme-bg)' }}
                      >
                        dnf
                      </span>
                    )}
                    {solve.plusTwo && (
                      <span 
                        className="rounded px-1 py-0.5 text-[8px] font-medium"
                        style={{ backgroundColor: 'var(--theme-cubeOrange)', color: 'var(--theme-bg)' }}
                      >
                        +2
                      </span>
                    )}
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
                      style={{ color: solve.dnf ? 'var(--theme-sub)' : 'var(--theme-text)' }}
                    >
                      {solve.dnf ? 'DNF' : formatTime(solve.plusTwo ? solve.time + 2000 : solve.time)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {solves.length > maxItems && (
        <button
          onClick={() => navigate('/app/account')}
          className="mt-2 w-full rounded py-1.5 text-xs font-medium transition-colors hover:bg-[var(--theme-subAlt)]"
          style={{ color: 'var(--theme-accent)' }}
        >
          See all solves →
        </button>
      )}
    </div>
  )
}
