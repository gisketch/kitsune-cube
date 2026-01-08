import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchSolveByShortId } from '@/hooks/useSolves'
import { SolveResults } from '@/components/solve-results'
import { useScrambleTracker } from '@/hooks/useScrambleTracker'
import { useSEO } from '@/lib/seo'
import type { Solve } from '@/types'

function formatTime(ms: number): string {
  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = (totalSeconds % 60).toFixed(2)
  if (minutes > 0) {
    return `${minutes}:${seconds.padStart(5, '0')}`
  }
  return `${seconds}s`
}

export function ShortSolvePage() {
  const { shortId } = useParams<{ shortId: string }>()
  const navigate = useNavigate()
  const { setScramble } = useScrambleTracker()
  const [solve, setSolve] = useState<Solve | null>(null)
  const [userInfo, setUserInfo] = useState<{ name?: string; avatar?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const ogImageUrl = useMemo(() => {
    if (!solve) return undefined
    
    const params = new URLSearchParams()
    params.set('time', solve.time.toString())
    params.set('scramble', solve.scramble)
    if (userInfo?.name) params.set('name', userInfo.name)
    if (userInfo?.avatar) params.set('avatar', userInfo.avatar)
    
    return `https://kitsunecube.com/api/og-image?${params.toString()}`
  }, [solve, userInfo])

  useSEO({
    title: solve ? `${formatTime(solve.time)} Solve - Kitsune Cube` : 'Solve - Kitsune Cube',
    description: solve ? `Check out this ${formatTime(solve.time)} cube solve on Kitsune Cube!` : 'View a cube solve on Kitsune Cube',
    ogImage: ogImageUrl,
  })

  useEffect(() => {
    async function loadSolve() {
      if (!shortId) {
        setLoading(false)
        return
      }

      const result = await fetchSolveByShortId(shortId)
      setSolve(result.solve)
      setUserInfo(result.userInfo)
      setLoading(false)
    }

    loadSolve()
  }, [shortId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-[var(--theme-sub)]">Loading solve...</div>
      </div>
    )
  }

  if (!solve) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="text-[var(--theme-sub)]">Solve not found</div>
        <button
          onClick={() => navigate('/app')}
          className="rounded-lg bg-[var(--theme-main)] px-4 py-2 text-[var(--theme-bg)] hover:opacity-90"
        >
          Go to Timer
        </button>
      </div>
    )
  }

  return (
    <SolveResults
      time={solve.time}
      moves={solve.solution?.length || 0}
      analysis={solve.cfopAnalysis || null}
      scramble={solve.scramble}
      solve={solve}
      showBackButton
      onBack={() => navigate('/app')}
      onRepeatScramble={() => {
        setScramble(solve.scramble)
        navigate('/app')
      }}
      isManual={solve.isManual}
      solveId={solve.id}
      isOwner={false}
    />
  )
}
