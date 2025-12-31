import { useMemo, useState } from 'react'
import { Trash2, BarChart3, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Solve } from '@/hooks/useSolves'
import { createSolvedCube, applyMove, COLOR_HEX, type CubeFaces } from '@/lib/cube-faces'

const ITEMS_PER_PAGE = 50

interface SolvesListProps {
  solves: Solve[]
  onDelete?: (id: string) => void
  onViewDetails?: (solve: Solve) => void
  hideStats?: boolean
}

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
    <div className="grid grid-cols-3 gap-[1px]" style={{ width: 27, height: 27 }}>
      {face.map((color, i) => (
        <div
          key={i}
          className="rounded-[1px]"
          style={{
            backgroundColor: COLOR_HEX[color as keyof typeof COLOR_HEX] || '#888',
            width: 8,
            height: 8,
          }}
        />
      ))}
    </div>
  )
}

function calculateAverages(solves: Solve[]) {
  if (solves.length === 0) return { ao5: null, ao12: null, ao50: null, ao100: null, best: null }

  const times = solves.filter((s) => !s.dnf).map((s) => (s.plusTwo ? s.time + 2000 : s.time))
  if (times.length === 0) return { ao5: null, ao12: null, ao50: null, ao100: null, best: null }

  const best = Math.min(...times)

  const calcAo = (n: number) => {
    if (times.length < n) return null
    const lastN = times.slice(0, n)
    const sorted = [...lastN].sort((a, b) => a - b)
    const trimmed = sorted.slice(1, -1)
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length
  }

  return {
    ao5: calcAo(5),
    ao12: calcAo(12),
    ao50: calcAo(50),
    ao100: calcAo(100),
    best,
  }
}

function StatCard({ label, value }: { label: string; value: string | null }) {
  return (
    <div
      className="flex flex-col items-center rounded-lg px-4 py-2"
      style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
    >
      <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--theme-sub)' }}>
        {label}
      </span>
      <span className="font-mono text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
        {value ?? '-'}
      </span>
    </div>
  )
}

function StatsHeader({ solves }: { solves: Solve[] }) {
  const stats = useMemo(() => calculateAverages(solves), [solves])

  return (
    <div
      className="mb-4 flex flex-wrap justify-center gap-3 rounded-lg p-4"
      style={{ backgroundColor: 'var(--theme-bg)' }}
    >
      <StatCard label="ao5" value={stats.ao5 ? formatTime(stats.ao5) : null} />
      <StatCard label="ao12" value={stats.ao12 ? formatTime(stats.ao12) : null} />
      <StatCard label="ao50" value={stats.ao50 ? formatTime(stats.ao50) : null} />
      <StatCard label="ao100" value={stats.ao100 ? formatTime(stats.ao100) : null} />
      <div
        className="flex flex-col items-center rounded-lg px-4 py-2"
        style={{ backgroundColor: 'var(--theme-accent)', opacity: 0.9 }}
      >
        <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--theme-bg)' }}>
          PB
        </span>
        <span className="font-mono text-lg font-semibold" style={{ color: 'var(--theme-bg)' }}>
          {stats.best ? formatTime(stats.best) : '-'}
        </span>
      </div>
    </div>
  )
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded p-1.5 transition-colors disabled:opacity-30"
        style={{ color: 'var(--theme-text)' }}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="px-3 text-sm" style={{ color: 'var(--theme-sub)' }}>
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded p-1.5 transition-colors disabled:opacity-30"
        style={{ color: 'var(--theme-text)' }}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}

function SolveRow({
  solve,
  index,
  total,
  onDelete,
  onViewDetails,
}: {
  solve: Solve
  index: number
  total: number
  onDelete?: (id: string) => void
  onViewDetails?: (solve: Solve) => void
}) {
  const scrambledState = useMemo(() => getScrambledState(solve.scramble), [solve.scramble])
  const solveNumber = total - index

  const handleRowClick = () => {
    if (onViewDetails) {
      onViewDetails(solve)
    }
  }

  return (
    <tr
      className="cursor-pointer transition-colors"
      style={{ borderBottom: '1px solid var(--theme-subAlt)' }}
      onClick={handleRowClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--theme-bgSecondary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      <td className="px-3 py-3 text-center" style={{ color: 'var(--theme-sub)', width: 50 }}>
        <span className="text-sm font-medium">#{solveNumber}</span>
      </td>
      <td className="px-3 py-3" style={{ width: 45 }}>
        <MiniFace face={scrambledState.F} />
      </td>
      <td className="px-4 py-3" style={{ width: 100 }}>
        <span className="font-mono text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
          {formatTime(solve.time)}
        </span>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <span className="line-clamp-1 font-mono text-xs" style={{ color: 'var(--theme-sub)' }}>
          {solve.scramble}
        </span>
      </td>
      <td className="px-3 py-3 text-right" style={{ width: 120 }}>
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (onViewDetails) onViewDetails(solve)
            }}
            className="rounded p-1.5 transition-colors hover:opacity-80"
            style={{ color: 'var(--theme-accent)' }}
            title="Full Stats"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          {solve.solution.length > 0 && solve.gyroData && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onViewDetails) onViewDetails(solve)
              }}
              className="rounded p-1.5 transition-colors hover:opacity-80"
              style={{ color: 'var(--theme-accent)' }}
              title="Replay"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(solve.id)
              }}
              className="rounded p-1.5 transition-colors hover:opacity-80"
              style={{ color: 'var(--theme-error)' }}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export function SolvesList({ solves, onDelete, onViewDetails, hideStats }: SolvesListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(solves.length / ITEMS_PER_PAGE)
  
  const paginatedSolves = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return solves.slice(start, start + ITEMS_PER_PAGE)
  }, [solves, currentPage])

  if (solves.length === 0) {
    return (
      <div
        className="flex h-64 flex-col items-center justify-center"
        style={{ color: 'var(--theme-sub)' }}
      >
        <p className="text-lg">No solves yet</p>
        <p className="mt-1 text-sm">Complete a solve to see it here</p>
      </div>
    )
  }

  const pageStartIndex = (currentPage - 1) * ITEMS_PER_PAGE

  return (
    <div>
      {!hideStats && <StatsHeader solves={solves} />}
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--theme-subAlt)' }}>
              <th
                className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--theme-sub)', width: 50 }}
              >
                #
              </th>
              <th
                className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--theme-sub)', width: 45 }}
              ></th>
              <th
                className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--theme-sub)', width: 100 }}
              >
                Time
              </th>
              <th
                className="hidden px-4 py-2 text-left text-xs font-medium uppercase tracking-wider md:table-cell"
                style={{ color: 'var(--theme-sub)' }}
              >
                Scramble
              </th>
              <th
                className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--theme-sub)', width: 120 }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedSolves.map((solve, index) => (
              <SolveRow
                key={solve.id}
                solve={solve}
                index={pageStartIndex + index}
                total={solves.length}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
              />
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
