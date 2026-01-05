import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSolves, fetchPublicSolveWithUser } from '@/hooks/useSolves'
import { SolveResults } from '@/components/solve-results'
import { useScrambleTracker } from '@/hooks/useScrambleTracker'
import { useAuth } from '@/contexts/AuthContext'
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

export function SolvePage() {
  const { userId, solveId } = useParams<{ userId?: string; solveId: string }>()
  const navigate = useNavigate()
  const { solves, deleteSolve } = useSolves()
  const { setScramble } = useScrambleTracker()
  const { user } = useAuth()
  const [publicSolve, setPublicSolve] = useState<Solve | null>(null)
  const [publicUserInfo, setPublicUserInfo] = useState<{ name?: string; avatar?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const localSolve = solves.find((s) => s.id === solveId)
  const solve = localSolve || publicSolve

  const ogImageUrl = useMemo(() => {
    if (!solve) return undefined
    
    const params = new URLSearchParams()
    params.set('time', solve.time.toString())
    params.set('scramble', solve.scramble)
    
    if (localSolve && user) {
      params.set('name', user.displayName || 'Anonymous')
      if (user.photoURL) params.set('avatar', user.photoURL)
    } else if (publicUserInfo) {
      if (publicUserInfo.name) params.set('name', publicUserInfo.name)
      if (publicUserInfo.avatar) params.set('avatar', publicUserInfo.avatar)
    }
    
    return `https://kitsunecube.com/api/og-image?${params.toString()}`
  }, [solve, localSolve, user, publicUserInfo])

  useSEO(solve ? {
    title: `${formatTime(solve.time)} Solve - Kitsune Cube`,
    description: `Check out this ${formatTime(solve.time)} cube solve on Kitsune Cube!`,
    ogImage: ogImageUrl,
    ogType: 'article',
  } : undefined)

  useEffect(() => {
    if (localSolve) {
      setLoading(false)
      return
    }

    if (!solveId) {
      setLoading(false)
      return
    }

    setLoading(true)
    fetchPublicSolveWithUser(solveId, userId).then(({ solve: fetchedSolve, userInfo }) => {
      setPublicSolve(fetchedSolve)
      setPublicUserInfo(userInfo)
      setLoading(false)
    })
  }, [solveId, userId, localSolve])

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: 'var(--theme-accent)' }} />
        <p style={{ color: 'var(--theme-sub)' }}>Loading solve...</p>
      </div>
    )
  }

  if (!solve) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
          Solve not found
        </div>
        <p className="text-center" style={{ color: 'var(--theme-sub)' }}>
          This solve may have been deleted or doesn't exist.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 rounded-lg px-6 py-2 font-medium transition-colors"
          style={{
            backgroundColor: 'var(--theme-accent)',
            color: 'var(--theme-bg)',
          }}
        >
          Go Home
        </button>
      </div>
    )
  }

  return (
    <SolveResults
      time={solve.time}
      moves={solve.solution.length}
      analysis={solve.cfopAnalysis || null}
      scramble={solve.scramble}
      showBackButton
      onBack={() => navigate(-1)}
      onRepeatScramble={() => {
        setScramble(solve.scramble)
        navigate('/app')
      }}
      onDeleteSolve={localSolve ? async (id) => {
        await deleteSolve(id)
        navigate('/app')
      } : undefined}
      solve={solve}
      solveId={solveId}
      isOwner={!!localSolve}
    />
  )
}
