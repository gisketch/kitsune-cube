import { useMemo, useState, useCallback } from 'react'
import { Trash2, BarChart3, Play, ChevronLeft, ChevronRight, Star, ArrowUpDown, Trophy } from 'lucide-react'
import type { Solve } from '@/hooks/useSolves'
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal'
import { createSolvedCube, applyMove, COLOR_HEX, type CubeFaces } from '@/lib/cube-faces'
import { useSettings } from '@/hooks/useSettings'
import { useToast } from '@/contexts/ToastContext'

interface SolvesListProps {
  solves: Solve[]
  onDelete?: (id: string) => void
  onViewDetails?: (solve: Solve) => void
  onToggleFavorite?: (id: string, isFavorite: boolean) => Promise<void> | void
  hideStats?: boolean
  maxFavorites?: number
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
  onToggleFavorite,
  isBest,
  canFavorite,
  onFavoriteSuccess,
}: {
  solve: Solve
  index: number
  total: number
  onDelete?: (id: string) => void
  onViewDetails?: (solve: Solve) => void
  onToggleFavorite?: (id: string, isFavorite: boolean) => Promise<void> | void
  isBest?: boolean
  canFavorite?: boolean
  onFavoriteSuccess?: (message: string) => void
}) {
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(null)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  
  const isFavorite = optimisticFavorite ?? solve.isFavorite
  
  const scrambledState = useMemo(() => getScrambledState(solve.scramble), [solve.scramble])
  const solveNumber = total - index

  const handleRowClick = () => {
    if (onViewDetails) {
      onViewDetails(solve)
    }
  }

  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onToggleFavorite) return
    if (!isFavorite && !canFavorite) return
    if (isTogglingFavorite) return

    const newFavoriteState = !isFavorite
    setOptimisticFavorite(newFavoriteState)
    setIsTogglingFavorite(true)

    try {
      await onToggleFavorite(solve.id, newFavoriteState)
      onFavoriteSuccess?.(newFavoriteState ? 'Added to favorites ⭐' : 'Removed from favorites')
    } catch {
      setOptimisticFavorite(null)
      onFavoriteSuccess?.('Failed to update favorite')
    } finally {
      setIsTogglingFavorite(false)
      setOptimisticFavorite(null)
    }
  }, [onToggleFavorite, isFavorite, canFavorite, isTogglingFavorite, solve.id, onFavoriteSuccess])

  const getRowStyle = () => {
    if (isBest) return { backgroundColor: 'rgba(var(--theme-accent-rgb, 255, 165, 0), 0.15)', borderLeft: '3px solid var(--theme-accent)' }
    if (isFavorite) return { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderLeft: '3px solid #ffd700' }
    return {}
  }

  return (
    <tr
      className="cursor-pointer transition-colors"
      style={{ borderBottom: '1px solid var(--theme-subAlt)', ...getRowStyle() }}
      onClick={handleRowClick}
      onMouseEnter={(e) => {
        if (!isBest && !isFavorite) {
          e.currentTarget.style.backgroundColor = 'var(--theme-bgSecondary)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isBest && !isFavorite) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      <td className="px-3 py-3 text-center" style={{ color: 'var(--theme-sub)', width: 50 }}>
        <div className="flex items-center justify-center gap-1">
          {isBest && <Trophy className="h-3 w-3" style={{ color: 'var(--theme-accent)' }} />}
          <span className="text-sm font-medium">#{solveNumber}</span>
        </div>
      </td>
      <td className="px-3 py-3" style={{ width: 45 }}>
        <MiniFace face={scrambledState.F} />
      </td>
      <td className="px-4 py-3" style={{ width: 100 }}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-semibold" style={{ color: isBest ? 'var(--theme-accent)' : 'var(--theme-text)' }}>
            {formatTime(solve.time)}
          </span>
          {solve.isManual && (
            <span 
              className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
              style={{ backgroundColor: 'var(--theme-subAlt)', color: 'var(--theme-sub)' }}
            >
              manual
            </span>
          )}
          {solve.isRepeatedScramble && (
            <span 
              className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
              style={{ backgroundColor: 'var(--theme-subAlt)', color: 'var(--theme-sub)' }}
            >
              repeated
            </span>
          )}
        </div>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">
        <span className="line-clamp-1 font-mono text-xs" style={{ color: 'var(--theme-sub)' }}>
          {solve.scramble}
        </span>
      </td>
      <td className="px-3 py-3 text-right" style={{ width: 140 }}>
        <div className="flex items-center justify-end gap-1">
          {onToggleFavorite && (
            <button
              onClick={handleFavoriteClick}
              disabled={isTogglingFavorite}
              className="rounded p-1.5 transition-all hover:opacity-80"
              style={{ 
                color: isFavorite ? '#ffd700' : 'var(--theme-sub)',
                opacity: (!isFavorite && !canFavorite) || isTogglingFavorite ? 0.3 : 1,
                cursor: !isFavorite && !canFavorite ? 'not-allowed' : 'pointer',
                transform: isTogglingFavorite ? 'scale(0.9)' : 'scale(1)',
              }}
              title={isFavorite ? 'Unfavorite' : canFavorite ? 'Favorite' : 'Max 25 favorites reached'}
            >
              <Star className="h-4 w-4" fill={isFavorite ? '#ffd700' : 'none'} />
            </button>
          )}
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

export function SolvesList({ solves, onDelete, onViewDetails, onToggleFavorite, hideStats, maxFavorites = 25 }: SolvesListProps) {
  const { settings } = useSettings()
  const { showToast } = useToast()
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<Set<'manual' | 'verified' | 'repeated' | 'favorites'>>(new Set())
  const [sortBy, setSortBy] = useState<'date' | 'time'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; solveId: string | null }>({ 
    isOpen: false, 
    solveId: null 
  })

  const itemsPerPage = settings.solvesPerPage

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, solveId: id })
  }

  const handleConfirmDelete = () => {
    if (deleteConfirm.solveId && onDelete) {
      onDelete(deleteConfirm.solveId)
    }
  }

  const handleFavoriteSuccess = useCallback((message: string) => {
    showToast(message, message.includes('Failed') ? 'error' : 'success')
  }, [showToast])

  const toggleFilter = (filter: 'manual' | 'verified' | 'repeated' | 'favorites') => {
    setFilters(prev => {
      const next = new Set(prev)
      if (next.has(filter)) {
        next.delete(filter)
      } else {
        next.add(filter)
      }
      return next
    })
    setCurrentPage(1)
  }

  const toggleSort = () => {
    if (sortBy === 'date') {
      setSortBy('time')
      setSortOrder('asc')
    } else if (sortBy === 'time' && sortOrder === 'asc') {
      setSortOrder('desc')
    } else {
      setSortBy('date')
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  const bestSolveId = useMemo(() => {
    const validSolves = solves.filter(s => !s.dnf)
    if (validSolves.length === 0) return null
    const best = validSolves.reduce((min, s) => (s.time < min.time ? s : min), validSolves[0])
    return best.id
  }, [solves])

  const favoriteCount = useMemo(() => solves.filter(s => s.isFavorite).length, [solves])
  const canFavorite = favoriteCount < maxFavorites

  const filteredAndSortedSolves = useMemo(() => {
    let result = solves
    
    if (filters.size > 0) {
      result = result.filter(s => {
        if (filters.has('favorites') && s.isFavorite) return true
        if (filters.has('manual') && s.isManual) return true
        if (filters.has('verified') && !s.isManual) return true
        if (filters.has('repeated') && s.isRepeatedScramble) return true
        return false
      })
    }

    if (sortBy === 'time') {
      result = [...result].sort((a, b) => {
        const timeA = a.dnf ? Infinity : (a.plusTwo ? a.time + 2000 : a.time)
        const timeB = b.dnf ? Infinity : (b.plusTwo ? b.time + 2000 : b.time)
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
      })
    } else {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
      })
    }

    return result
  }, [solves, filters, sortBy, sortOrder])

  const totalPages = Math.ceil(filteredAndSortedSolves.length / itemsPerPage)
  
  const paginatedSolves = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedSolves.slice(start, start + itemsPerPage)
  }, [filteredAndSortedSolves, currentPage, itemsPerPage])

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

  const pageStartIndex = (currentPage - 1) * itemsPerPage

  const filterButtons: Array<{ key: 'manual' | 'verified' | 'repeated' | 'favorites'; label: string; icon?: React.ReactNode }> = [
    { key: 'favorites', label: 'Favorites', icon: <Star className="h-3 w-3" /> },
    { key: 'verified', label: 'Verified' },
    { key: 'manual', label: 'Manual' },
    { key: 'repeated', label: 'Repeated' },
  ]

  return (
    <div>
      {!hideStats && <StatsHeader solves={solves} />}
      
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <button
          onClick={() => setFilters(new Set())}
          className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
          style={{
            backgroundColor: filters.size === 0 ? 'var(--theme-accent)' : 'var(--theme-subAlt)',
            color: filters.size === 0 ? 'var(--theme-bg)' : 'var(--theme-sub)',
          }}
        >
          All
        </button>
        {filterButtons.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: filters.has(key) ? (key === 'favorites' ? '#ffd700' : 'var(--theme-accent)') : 'var(--theme-subAlt)',
              color: filters.has(key) ? 'var(--theme-bg)' : 'var(--theme-sub)',
            }}
          >
            {icon}
            {label}
          </button>
        ))}
        <div className="mx-2 h-4 w-px" style={{ backgroundColor: 'var(--theme-subAlt)' }} />
        <button
          onClick={toggleSort}
          className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors"
          style={{
            backgroundColor: sortBy === 'time' ? 'var(--theme-accent)' : 'var(--theme-subAlt)',
            color: sortBy === 'time' ? 'var(--theme-bg)' : 'var(--theme-sub)',
          }}
        >
          <ArrowUpDown className="h-3 w-3" />
          {sortBy === 'date' ? 'Recent' : sortOrder === 'asc' ? 'Fastest' : 'Slowest'}
        </button>
        {filters.size > 0 && (
          <span className="flex items-center text-xs px-2" style={{ color: 'var(--theme-sub)' }}>
            ({filteredAndSortedSolves.length})
          </span>
        )}
      </div>

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
                style={{ color: 'var(--theme-sub)', width: 140 }}
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
                total={filteredAndSortedSolves.length}
                onDelete={onDelete ? handleDeleteClick : undefined}
                onViewDetails={onViewDetails}
                onToggleFavorite={onToggleFavorite}
                isBest={solve.id === bestSolveId}
                canFavorite={canFavorite}
                onFavoriteSuccess={handleFavoriteSuccess}
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
      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, solveId: null })}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
