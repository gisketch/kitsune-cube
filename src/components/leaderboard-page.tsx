import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  collectionGroup,
  query,
  getDocs,
  getDoc,
  doc,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db, isOfflineMode } from '@/lib/firebase'
import {
  Trophy,
  Medal,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Users,
  WifiOff,
  Zap,
  BarChart3,
  Play,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatTime } from '@/lib/format'
import { getLevelFromXP } from '@/lib/experience'
import { createSolvedCube, applyMove, COLOR_HEX, type CubeFaces } from '@/lib/cube-faces'

type LeaderboardTab = 'avgTime' | 'level' | 'achievements' | 'singleSolve'

interface LeaderboardUser {
  id: string
  displayName: string
  photoURL: string | null
  level: number
  totalXP: number
  achievementsCompleted: number
  avgSolveTime: number | null
  bestSolveTime: number | null
  totalSolves: number
}

interface LeaderboardSolve {
  id: string
  solveId: string
  ownerId: string
  displayName: string
  photoURL: string | null
  time: number
  scramble: string
  date: string
  solution: string[]
  gyroData?: unknown[]
  cfopAnalysis?: unknown
  moveTimings?: unknown[]
}

const ITEMS_PER_PAGE = 50

export function LeaderboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<LeaderboardTab>('avgTime')
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [solves, setSolves] = useState<LeaderboardSolve[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)

  const isUserTab = tab !== 'singleSolve'

  const handleViewSolve = useCallback((solve: LeaderboardSolve) => {
    navigate(`/solve/${solve.ownerId}/${solve.solveId}`)
  }, [navigate])

  const resetPagination = useCallback(() => {
    setPage(1)
    setHasMore(true)
    setLastDoc(null)
    setUsers([])
    setSolves([])
  }, [])

  useEffect(() => {
    resetPagination()
  }, [tab, resetPagination])

  useEffect(() => {
    if (isOfflineMode || !db) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      setLoading(true)

      try {
        if (isUserTab) {
          await fetchUserLeaderboard()
        } else {
          await fetchSolveLeaderboard()
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tab, page, isUserTab])

  async function fetchUserLeaderboard() {
    const usersRef = collection(db!, 'users')

    let q
    if (page === 1 || !lastDoc) {
      q = query(usersRef, orderBy('totalXP', 'desc'), limit(ITEMS_PER_PAGE))
    } else {
      q = query(usersRef, orderBy('totalXP', 'desc'), startAfter(lastDoc), limit(ITEMS_PER_PAGE))
    }

    const snapshot = await getDocs(q)
    const leaderboardUsers: LeaderboardUser[] = []

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()
      const totalXP = data.totalXP || 0
      const stats = data.stats || {}
      const achievements = data.achievements || []

      let achievementsCompleted = 0
      for (const ach of achievements) {
        achievementsCompleted += ach.unlockedTiers?.length || 0
      }

      const { level } = getLevelFromXP(totalXP)

      leaderboardUsers.push({
        id: docSnap.id,
        displayName: data.displayName || 'Anonymous',
        photoURL: data.photoURL || null,
        level,
        totalXP,
        achievementsCompleted,
        avgSolveTime: stats.verifiedAvgSolveTime ?? stats.avgSolveTime ?? null,
        bestSolveTime: stats.verifiedBestSolveTime ?? stats.bestSolveTime ?? null,
        totalSolves: stats.verifiedTotalSolves || stats.totalSolves || 0,
      })
    }

    const sortedUsers = sortUsers(leaderboardUsers, tab)

    if (snapshot.docs.length > 0) {
      setLastDoc(snapshot.docs[snapshot.docs.length - 1])
    }
    setUsers(sortedUsers)
    setHasMore(snapshot.docs.length === ITEMS_PER_PAGE)
  }

  async function fetchSolveLeaderboard() {
    const solvesRef = collectionGroup(db!, 'solves')

    let q
    if (page === 1 || !lastDoc) {
      q = query(solvesRef, orderBy('time', 'asc'), limit(ITEMS_PER_PAGE * 3))
    } else {
      q = query(solvesRef, orderBy('time', 'asc'), startAfter(lastDoc), limit(ITEMS_PER_PAGE * 3))
    }

    const snapshot = await getDocs(q)
    const leaderboardSolves: LeaderboardSolve[] = []
    const userCache = new Map<string, { displayName: string; photoURL: string | null }>()

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()

      if (data.isManual || data.isRepeatedScramble || data.dnf) {
        continue
      }

      if (!data.solution || data.solution.length === 0) {
        continue
      }

      const pathParts = docSnap.ref.path.split('/')
      const ownerId = pathParts[1]

      let ownerInfo = userCache.get(ownerId)
      if (!ownerInfo) {
        try {
          const userDoc = await getDoc(doc(db!, 'users', ownerId))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            ownerInfo = {
              displayName: userData.displayName || 'Cuber',
              photoURL: userData.photoURL || null,
            }
          } else {
            ownerInfo = { displayName: 'Cuber', photoURL: null }
          }
          userCache.set(ownerId, ownerInfo)
        } catch {
          ownerInfo = { displayName: 'Cuber', photoURL: null }
        }
      }

      leaderboardSolves.push({
        id: docSnap.id,
        solveId: data.solveId || docSnap.id,
        ownerId,
        displayName: ownerInfo.displayName,
        photoURL: ownerInfo.photoURL,
        time: data.plusTwo ? data.time + 2000 : data.time,
        scramble: data.scramble || '',
        date: data.date || '',
        solution: data.solution || [],
        gyroData: data.gyroData,
        cfopAnalysis: data.cfopAnalysis,
        moveTimings: data.moveTimings,
      })

      if (leaderboardSolves.length >= ITEMS_PER_PAGE) break
    }

    if (snapshot.docs.length > 0) {
      setLastDoc(snapshot.docs[snapshot.docs.length - 1])
    }
    setSolves(leaderboardSolves)
    setHasMore(snapshot.docs.length >= ITEMS_PER_PAGE)
  }

  function sortUsers(userList: LeaderboardUser[], category: LeaderboardTab): LeaderboardUser[] {
    const sorted = [...userList]

    switch (category) {
      case 'avgTime':
        return sorted
          .filter((u) => u.avgSolveTime !== null && u.avgSolveTime > 0 && u.totalSolves >= 5)
          .sort((a, b) => (a.avgSolveTime || Infinity) - (b.avgSolveTime || Infinity))
      case 'achievements':
        return sorted.sort((a, b) => b.achievementsCompleted - a.achievementsCompleted)
      case 'level':
      default:
        return sorted.sort((a, b) => b.level - a.level || b.totalXP - a.totalXP)
    }
  }

  const getRankIcon = (index: number) => {
    const rank = (page - 1) * ITEMS_PER_PAGE + index + 1
    if (rank === 1) return <Crown className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: '#FFD700' }} />
    if (rank === 2) return <Medal className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: '#C0C0C0' }} />
    if (rank === 3) return <Medal className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: '#CD7F32' }} />
    return <span className="font-mono text-xs sm:text-sm" style={{ color: 'var(--theme-sub)' }}>{rank}</span>
  }

  const getUserPrimaryValue = (u: LeaderboardUser) => {
    switch (tab) {
      case 'avgTime':
        return u.avgSolveTime !== null ? formatTime(u.avgSolveTime) : '-'
      case 'achievements':
        return `${u.achievementsCompleted} badges`
      case 'level':
      default:
        return `Lv. ${u.level}`
    }
  }

  const tabs: { id: LeaderboardTab; label: string; shortLabel: string; icon: typeof Trophy }[] = [
    { id: 'avgTime', label: 'Average Time', shortLabel: 'Avg', icon: Clock },
    { id: 'level', label: 'Level', shortLabel: 'Lvl', icon: Crown },
    { id: 'achievements', label: 'Achievements', shortLabel: 'Ach', icon: Trophy },
    { id: 'singleSolve', label: 'Best Solves', shortLabel: 'Best', icon: Zap },
  ]

  const goToPreviousPage = () => {
    if (page > 1) {
      setLastDoc(null)
      setPage(page - 1)
    }
  }

  const goToNextPage = () => {
    if (hasMore) {
      setPage(page + 1)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl overflow-y-auto px-4 py-4 md:px-8 pb-8">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-6 w-6" style={{ color: 'var(--theme-accent)' }} />
        <h2 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--theme-text)' }}>
          Leaderboard
        </h2>
      </div>

      <div className="flex gap-1.5 sm:gap-2 mb-4 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap"
              style={{
                backgroundColor: tab === t.id ? 'var(--theme-accent)' : 'var(--theme-bgSecondary)',
                color: tab === t.id ? 'var(--theme-bg)' : 'var(--theme-text)',
              }}
            >
              <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.shortLabel}</span>
            </button>
          )
        })}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--theme-bgSecondary)' }}>
        {isUserTab ? <UserLeaderboardHeader tab={tab} /> : <SolveLeaderboardHeader />}

        {isOfflineMode ? (
          <OfflineMessage />
        ) : loading ? (
          <LoadingSpinner />
        ) : isUserTab ? (
          users.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <UserLeaderboardBody
              users={users}
              currentUserId={user?.uid}
              getRankIcon={getRankIcon}
              getPrimaryValue={getUserPrimaryValue}
            />
          )
        ) : solves.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <SolveLeaderboardBody solves={solves} getRankIcon={getRankIcon} onViewSolve={handleViewSolve} />
        )}

        <PaginationFooter
          page={page}
          itemCount={isUserTab ? users.length : solves.length}
          hasMore={hasMore}
          onPrevious={goToPreviousPage}
          onNext={goToNextPage}
        />
      </div>
    </div>
  )
}

function UserLeaderboardHeader({ tab }: { tab: LeaderboardTab }) {
  return (
    <div
      className="grid grid-cols-[32px_1fr_50px_50px] sm:grid-cols-[50px_1fr_90px_90px_100px] gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-medium uppercase tracking-wider"
      style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-sub)' }}
    >
      <div>#</div>
      <div>User</div>
      <div className="text-right">Avg</div>
      <div className="text-right hidden sm:block">Best</div>
      <div className="text-right">
        {tab === 'avgTime' ? 'Avg' : tab === 'achievements' ? 'Bdg' : 'Lvl'}
      </div>
    </div>
  )
}

function SolveLeaderboardHeader() {
  return (
    <div
      className="hidden sm:grid grid-cols-[50px_28px_1fr_1fr_80px_80px] gap-2 px-4 py-3 text-xs font-medium uppercase tracking-wider"
      style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-sub)' }}
    >
      <div>#</div>
      <div></div>
      <div>Cuber</div>
      <div>Scramble</div>
      <div className="text-right">Time</div>
      <div className="text-right">Actions</div>
    </div>
  )
}

interface UserLeaderboardBodyProps {
  users: LeaderboardUser[]
  currentUserId?: string
  getRankIcon: (index: number) => React.ReactNode
  getPrimaryValue: (u: LeaderboardUser) => string
}

function UserLeaderboardBody({
  users,
  currentUserId,
  getRankIcon,
  getPrimaryValue,
}: UserLeaderboardBodyProps) {
  return (
    <div className="divide-y" style={{ borderColor: 'var(--theme-subAlt)' }}>
      {users.map((u, index) => {
        const isCurrentUser = currentUserId === u.id
        return (
          <div
            key={u.id}
            className="grid grid-cols-[32px_1fr_50px_50px] sm:grid-cols-[50px_1fr_90px_90px_100px] gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 items-center transition-colors"
            style={{
              backgroundColor: isCurrentUser ? 'var(--theme-accent)10' : 'transparent',
              borderLeft: isCurrentUser ? '3px solid var(--theme-accent)' : '3px solid transparent',
            }}
          >
            <div className="flex items-center justify-center">{getRankIcon(index)}</div>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {u.photoURL ? (
                <img src={u.photoURL} alt={u.displayName} className="h-6 w-6 sm:h-8 sm:w-8 rounded-full shrink-0" />
              ) : (
                <div
                  className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-bold shrink-0"
                  style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-bg)' }}
                >
                  {u.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span
                  className="truncate font-medium text-xs sm:text-sm"
                  style={{ color: isCurrentUser ? 'var(--theme-accent)' : 'var(--theme-text)' }}
                >
                  {u.displayName}
                  {isCurrentUser && <span className="text-[10px] sm:text-xs ml-1 opacity-70">(You)</span>}
                </span>
                <span className="text-[10px] sm:text-xs" style={{ color: 'var(--theme-sub)' }}>
                  {u.totalSolves.toLocaleString()} solves
                </span>
              </div>
            </div>
            <div className="text-right font-mono text-[10px] sm:text-sm" style={{ color: 'var(--theme-text)' }}>
              {u.avgSolveTime ? formatTime(u.avgSolveTime) : '-'}
            </div>
            <div className="text-right font-mono text-[10px] sm:text-sm hidden sm:block" style={{ color: 'var(--theme-sub)' }}>
              {u.bestSolveTime ? formatTime(u.bestSolveTime) : '-'}
            </div>
            <div className="text-right font-mono font-medium text-[10px] sm:text-sm" style={{ color: 'var(--theme-accent)' }}>
              {getPrimaryValue(u)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface SolveLeaderboardBodyProps {
  solves: LeaderboardSolve[]
  getRankIcon: (index: number) => React.ReactNode
  onViewSolve: (solve: LeaderboardSolve) => void
}

function getScrambledState(scramble: string): CubeFaces {
  const moves = scramble.trim().split(/\s+/).filter((m) => m.length > 0)
  let cube = createSolvedCube()
  for (const move of moves) {
    cube = applyMove(cube, move)
  }
  return cube
}

function MiniFace({ face }: { face: string[] }) {
  return (
    <div className="grid grid-cols-3 gap-[1px]" style={{ width: 24, height: 24 }}>
      {face.map((color, i) => (
        <div
          key={i}
          className="rounded-[1px]"
          style={{
            backgroundColor: COLOR_HEX[color as keyof typeof COLOR_HEX] || '#888',
            width: 7,
            height: 7,
          }}
        />
      ))}
    </div>
  )
}

function SolveLeaderboardBody({ solves, getRankIcon, onViewSolve }: SolveLeaderboardBodyProps) {
  return (
    <div className="divide-y" style={{ borderColor: 'var(--theme-subAlt)' }}>
      {solves.map((solve, index) => {
        const scrambledState = useMemo(() => getScrambledState(solve.scramble), [solve.scramble])
        const hasReplay = solve.solution.length > 0 && solve.gyroData && solve.gyroData.length > 0

        return (
          <div
            key={solve.id}
            className="flex sm:grid sm:grid-cols-[50px_28px_1fr_1fr_80px_80px] gap-2 px-2 sm:px-4 py-2 sm:py-3 items-center cursor-pointer transition-colors hover:bg-[var(--theme-bg)]"
            onClick={() => onViewSolve(solve)}
          >
            <div className="flex items-center justify-center w-8 sm:w-auto shrink-0">{getRankIcon(index)}</div>
            <div className="shrink-0">
              <MiniFace face={scrambledState.F} />
            </div>
            <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-none">
              {solve.photoURL ? (
                <img
                  src={solve.photoURL}
                  alt={solve.displayName}
                  className="h-6 w-6 rounded-full shrink-0 hidden sm:block"
                />
              ) : (
                <div
                  className="h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 hidden sm:flex"
                  style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-bg)' }}
                >
                  {solve.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="truncate font-medium text-xs sm:text-sm" style={{ color: 'var(--theme-text)' }}>
                {solve.displayName}
              </span>
            </div>
            <div className="hidden sm:block min-w-0">
              <span
                className="font-mono text-[10px] sm:text-xs line-clamp-1"
                style={{ color: 'var(--theme-sub)' }}
                title={solve.scramble}
              >
                {solve.scramble}
              </span>
            </div>
            <div
              className="font-mono font-semibold text-xs sm:text-sm text-right shrink-0"
              style={{ color: 'var(--theme-accent)' }}
            >
              {formatTime(solve.time)}
            </div>
            <div className="flex items-center justify-end gap-1 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewSolve(solve)
                }}
                className="rounded p-1 sm:p-1.5 transition-colors hover:opacity-80"
                style={{ color: 'var(--theme-accent)' }}
                title="View Stats"
              >
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              {hasReplay && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewSolve(solve)
                  }}
                  className="rounded p-1 sm:p-1.5 transition-colors hover:opacity-80"
                  style={{ color: 'var(--theme-accent)' }}
                  title="Replay"
                >
                  <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OfflineMessage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <WifiOff className="h-12 w-12 mb-2" style={{ color: 'var(--theme-sub)' }} />
      <p className="font-medium" style={{ color: 'var(--theme-text)' }}>
        Offline Mode
      </p>
      <p className="text-sm" style={{ color: 'var(--theme-sub)' }}>
        Leaderboard requires an internet connection
      </p>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--theme-accent)' }} />
    </div>
  )
}

function EmptyState({ tab }: { tab: LeaderboardTab }) {
  const messages: Record<LeaderboardTab, string> = {
    avgTime: 'No users with enough solves yet',
    level: 'No users found',
    achievements: 'No users with achievements yet',
    singleSolve: 'No smart cube solves found',
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Trophy className="h-12 w-12 mb-2" style={{ color: 'var(--theme-sub)' }} />
      <p style={{ color: 'var(--theme-sub)' }}>{messages[tab]}</p>
    </div>
  )
}

interface PaginationFooterProps {
  page: number
  itemCount: number
  hasMore: boolean
  onPrevious: () => void
  onNext: () => void
}

function PaginationFooter({ page, itemCount, hasMore, onPrevious, onNext }: PaginationFooterProps) {
  return (
    <div
      className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3"
      style={{ backgroundColor: 'var(--theme-bg)', borderTop: '1px solid var(--theme-subAlt)' }}
    >
      <span className="text-[10px] sm:text-xs" style={{ color: 'var(--theme-sub)' }}>
        Pg {page} • {itemCount}
      </span>
      <div className="flex gap-1 sm:gap-2">
        <button
          onClick={onPrevious}
          disabled={page === 1}
          className="flex items-center gap-0.5 sm:gap-1 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--theme-bgSecondary)', color: 'var(--theme-text)' }}
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <button
          onClick={onNext}
          disabled={!hasMore}
          className="flex items-center gap-0.5 sm:gap-1 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--theme-bgSecondary)', color: 'var(--theme-text)' }}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>
      </div>
    </div>
  )
}
