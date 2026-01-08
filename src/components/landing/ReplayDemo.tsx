import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, ExternalLink, Loader2, RotateCw } from 'lucide-react'
import { query, orderBy, limit, getDocs, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { formatTime } from '@/lib/format'

interface LeaderboardSolve {
  id: string
  solveId: string
  ownerId: string
  displayName: string
  photoURL: string | null
  time: number
  scramble: string
  moveCount: number
}

async function fetchTopSolves(): Promise<LeaderboardSolve[]> {
  if (!db) return []

  const firestore = db

  try {
    const usersRef = collection(firestore, 'users')
    const usersQuery = query(usersRef, orderBy('stats.verifiedBestSolveTime', 'asc'), limit(15))
    const usersSnapshot = await getDocs(usersQuery)

    const solvePromises = usersSnapshot.docs.map(async (userDoc) => {
      const userData = userDoc.data()
      const stats = userData.stats || {}
      const bestTime = stats.verifiedBestSolveTime

      if (!bestTime || bestTime <= 0) return null

      const solvesRef = collection(firestore, 'users', userDoc.id, 'solves')
      const solveQuery = query(solvesRef, orderBy('time', 'asc'), limit(5))
      const solvesSnapshot = await getDocs(solveQuery)

      for (const solveDoc of solvesSnapshot.docs) {
        const solveData = solveDoc.data()

        if (solveData.isManual || solveData.dnf) continue
        if (!solveData.solution || solveData.solution.length === 0) continue

        return {
          id: solveDoc.id,
          solveId: solveData.solveId || solveDoc.id,
          ownerId: userDoc.id,
          displayName: userData.displayName || 'Cuber',
          photoURL: userData.photoURL || null,
          time: solveData.plusTwo ? solveData.time + 2000 : solveData.time,
          scramble: solveData.scramble || '',
          moveCount: solveData.solution?.length || 0,
        } as LeaderboardSolve
      }
      return null
    })

    const results = await Promise.all(solvePromises)
    return results.filter((s): s is LeaderboardSolve => s !== null)
  } catch (error) {
    console.error('Error fetching top solves:', error)
    return []
  }
}

export function ReplayDemo() {
  const [topSolves, setTopSolves] = useState<LeaderboardSolve[]>([])
  const [currentSolve, setCurrentSolve] = useState<LeaderboardSolve | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSolves() {
      setIsLoading(true)
      const solves = await fetchTopSolves()
      setTopSolves(solves)
      if (solves.length > 0) {
        const randomIndex = Math.floor(Math.random() * solves.length)
        setCurrentSolve(solves[randomIndex])
      }
      setIsLoading(false)
    }
    loadSolves()
  }, [])

  const pickRandomSolve = useCallback(() => {
    if (topSolves.length > 0) {
      const randomIndex = Math.floor(Math.random() * topSolves.length)
      setCurrentSolve(topSolves[randomIndex])
    }
  }, [topSolves])

  if (isLoading) {
    return (
      <section id="replay" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--theme-accent)' }} />
          </div>
        </div>
      </section>
    )
  }

  if (!currentSolve) {
    return null
  }

  return (
    <section id="replay" className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl" style={{ color: 'var(--theme-text)' }}>
            Watch Real Solves
          </h2>
          <p className="mx-auto max-w-2xl text-lg" style={{ color: 'var(--theme-sub)' }}>
            Every move tracked. Every solve replayable. Learn from the best in the community.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="overflow-hidden rounded-2xl p-6"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-sub-alt)' }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {currentSolve.photoURL ? (
                <img
                  src={currentSolve.photoURL}
                  alt={currentSolve.displayName}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold"
                  style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-bg)' }}
                >
                  {currentSolve.displayName[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
                  {currentSolve.displayName}
                </p>
                <p className="text-4xl font-bold tabular-nums" style={{ color: 'var(--theme-accent)' }}>
                  {formatTime(currentSolve.time)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="rounded-lg px-4 py-2" style={{ backgroundColor: 'var(--theme-sub-alt)' }}>
                <p className="text-sm" style={{ color: 'var(--theme-sub)' }}>Moves</p>
                <p className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
                  {currentSolve.moveCount}
                </p>
              </div>
              <div className="rounded-lg px-4 py-2" style={{ backgroundColor: 'var(--theme-sub-alt)' }}>
                <p className="text-sm" style={{ color: 'var(--theme-sub)' }}>TPS</p>
                <p className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
                  {(currentSolve.moveCount / (currentSolve.time / 1000)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium" style={{ color: 'var(--theme-sub)' }}>
              Scramble
            </p>
            <p
              className="rounded-lg p-3 font-mono text-sm"
              style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)' }}
            >
              {currentSolve.scramble}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={pickRandomSolve}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--theme-sub-alt)', color: 'var(--theme-text)' }}
            >
              <RotateCw className="h-4 w-4" />
              Random Solve
            </button>

            <a
              href={`/app/solve/${currentSolve.ownerId}/${currentSolve.solveId}`}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-bg)' }}
            >
              <Play className="h-4 w-4" />
              Watch Full Replay
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
