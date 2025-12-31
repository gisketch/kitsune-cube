import { useEffect, useState, useMemo } from 'react'
import { collection, query, getDocs, orderBy, limit, startAfter, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Trophy, Medal, Clock, Loader2, ChevronLeft, ChevronRight, Crown, Target, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatTime } from '@/lib/format'

type LeaderboardCategory = 'level' | 'avgTime' | 'achievements'

interface LeaderboardUser {
  id: string
  displayName: string
  photoURL: string | null
  level: number
  totalXP: number
  achievementsCompleted: number
  avgSolveTime: number | null
  totalSolves: number
}

const ITEMS_PER_PAGE = 50

function calculateLevel(xp: number): number {
  let level = 1
  let xpRequired = 500
  let remaining = xp
  while (remaining >= xpRequired) {
    remaining -= xpRequired
    level++
    xpRequired = 500 + level * 50
  }
  return level
}

export function LeaderboardPage() {
  const { user } = useAuth()
  const [category, setCategory] = useState<LeaderboardCategory>('level')
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [pageCache, setPageCache] = useState<Map<number, { users: LeaderboardUser[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }>>(new Map())

  useEffect(() => {
    setPage(1)
    setHasMore(true)
    setPageCache(new Map())
    setUsers([])
  }, [category])

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      
      const cached = pageCache.get(page)
      if (cached) {
        setUsers(cached.users)
        setLoading(false)
        return
      }

      try {
        const usersRef = collection(db, 'users')
        let q
        
        if (page === 1) {
          q = query(usersRef, orderBy('totalXP', 'desc'), limit(ITEMS_PER_PAGE))
        } else {
          const prevPageCache = pageCache.get(page - 1)
          if (prevPageCache?.lastDoc) {
            q = query(usersRef, orderBy('totalXP', 'desc'), startAfter(prevPageCache.lastDoc), limit(ITEMS_PER_PAGE))
          } else {
            q = query(usersRef, orderBy('totalXP', 'desc'), limit(ITEMS_PER_PAGE))
          }
        }

        const snapshot = await getDocs(q)
        const leaderboardUsers: LeaderboardUser[] = []

        for (const doc of snapshot.docs) {
          const data = doc.data()
          const totalXP = data.totalXP || 0
          const stats = data.stats || {}
          const achievements = data.achievements || []
          
          let achievementsCompleted = 0
          for (const ach of achievements) {
            achievementsCompleted += (ach.unlockedTiers?.length || 0)
          }

          leaderboardUsers.push({
            id: doc.id,
            displayName: data.displayName || 'Anonymous',
            photoURL: data.photoURL || null,
            level: calculateLevel(totalXP),
            totalXP,
            achievementsCompleted,
            avgSolveTime: stats.avgSolveTime || null,
            totalSolves: stats.totalSolves || 0,
          })
        }

        const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null
        
        setPageCache(prev => new Map(prev).set(page, { users: leaderboardUsers, lastDoc: newLastDoc }))
        setUsers(leaderboardUsers)
        setHasMore(snapshot.docs.length === ITEMS_PER_PAGE)
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [page, category, pageCache])

  const sortedUsers = useMemo(() => {
    const filtered = [...users]
    
    switch (category) {
      case 'avgTime':
        return filtered
          .filter(u => u.avgSolveTime !== null && u.totalSolves >= 100)
          .sort((a, b) => (a.avgSolveTime || Infinity) - (b.avgSolveTime || Infinity))
      case 'achievements':
        return filtered.sort((a, b) => b.achievementsCompleted - a.achievementsCompleted)
      default:
        return filtered.sort((a, b) => b.level - a.level || b.totalXP - a.totalXP)
    }
  }, [users, category])

  const getRankIcon = (index: number) => {
    const rank = (page - 1) * ITEMS_PER_PAGE + index + 1
    if (rank === 1) return <Crown className="h-5 w-5" style={{ color: '#FFD700' }} />
    if (rank === 2) return <Medal className="h-5 w-5" style={{ color: '#C0C0C0' }} />
    if (rank === 3) return <Medal className="h-5 w-5" style={{ color: '#CD7F32' }} />
    return <span className="font-mono text-sm" style={{ color: 'var(--theme-sub)' }}>{rank}</span>
  }

  const getCategoryValue = (u: LeaderboardUser) => {
    switch (category) {
      case 'avgTime':
        return u.avgSolveTime !== null ? formatTime(u.avgSolveTime) : '-'
      case 'achievements':
        return u.achievementsCompleted
      default:
        return `Lv. ${u.level}`
    }
  }

  const categories: { id: LeaderboardCategory; label: string; icon: typeof Trophy }[] = [
    { id: 'level', label: 'Level', icon: Crown },
    { id: 'avgTime', label: 'Avg Time (100+ solves)', icon: Clock },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
  ]

  return (
    <div className="mx-auto w-full max-w-4xl overflow-y-auto px-4 py-4 md:px-8 pb-8">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-6 w-6" style={{ color: 'var(--theme-accent)' }} />
        <h2 className="text-lg sm:text-xl font-semibold" style={{ color: 'var(--theme-text)' }}>
          Leaderboard
        </h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(cat => {
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
              style={{
                backgroundColor: category === cat.id ? 'var(--theme-accent)' : 'var(--theme-bgSecondary)',
                color: category === cat.id ? 'var(--theme-bg)' : 'var(--theme-text)',
              }}
            >
              <Icon className="h-4 w-4" />
              {cat.label}
            </button>
          )
        })}
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
      >
        <div
          className="grid grid-cols-[60px_1fr_80px_80px_100px] gap-2 px-4 py-3 text-xs font-medium uppercase tracking-wider"
          style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-sub)' }}
        >
          <div>Rank</div>
          <div>User</div>
          <div className="text-right">Level</div>
          <div className="text-right">Solves</div>
          <div className="text-right">
            {category === 'avgTime' ? 'Avg Time' : category === 'achievements' ? 'Badges' : 'XP'}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--theme-accent)' }} />
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 mb-2" style={{ color: 'var(--theme-sub)' }} />
            <p style={{ color: 'var(--theme-sub)' }}>
              {category === 'avgTime' ? 'No users with 100+ solves yet' : 'No users found'}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--theme-subAlt)' }}>
            {sortedUsers.map((u, index) => {
              const isCurrentUser = user?.uid === u.id
              return (
                <div
                  key={u.id}
                  className="grid grid-cols-[60px_1fr_80px_80px_100px] gap-2 px-4 py-3 items-center transition-colors"
                  style={{
                    backgroundColor: isCurrentUser ? 'var(--theme-accent)10' : 'transparent',
                    borderLeft: isCurrentUser ? '3px solid var(--theme-accent)' : '3px solid transparent',
                  }}
                >
                  <div className="flex items-center justify-center">
                    {getRankIcon(index)}
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    {u.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt={u.displayName}
                        className="h-8 w-8 rounded-full shrink-0"
                      />
                    ) : (
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shrink-0"
                        style={{
                          backgroundColor: 'var(--theme-accent)',
                          color: 'var(--theme-bg)',
                        }}
                      >
                        {u.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      className="truncate font-medium"
                      style={{ color: isCurrentUser ? 'var(--theme-accent)' : 'var(--theme-text)' }}
                    >
                      {u.displayName}
                      {isCurrentUser && <span className="text-xs ml-1">(You)</span>}
                    </span>
                  </div>
                  <div className="text-right font-mono" style={{ color: 'var(--theme-text)' }}>
                    {u.level}
                  </div>
                  <div className="text-right font-mono" style={{ color: 'var(--theme-sub)' }}>
                    {u.totalSolves.toLocaleString()}
                  </div>
                  <div className="text-right font-mono font-medium" style={{ color: 'var(--theme-accent)' }}>
                    {getCategoryValue(u)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: 'var(--theme-bg)', borderTop: '1px solid var(--theme-subAlt)' }}
        >
          <span className="text-xs" style={{ color: 'var(--theme-sub)' }}>
            Page {page} • {sortedUsers.length} results
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'var(--theme-bgSecondary)',
                color: 'var(--theme-text)',
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'var(--theme-bgSecondary)',
                color: 'var(--theme-text)',
              }}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
