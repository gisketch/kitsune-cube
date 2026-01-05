import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSolves, fetchPublicSolve } from '@/hooks/useSolves'
import { SolveResults } from '@/components/solve-results'
import { useScrambleTracker } from '@/hooks/useScrambleTracker'
import type { Solve } from '@/types'

export function SolvePage() {
  const { userId, solveId } = useParams<{ userId?: string; solveId: string }>()
  const navigate = useNavigate()
  const { solves, deleteSolve } = useSolves()
  const { setScramble } = useScrambleTracker()
  const [publicSolve, setPublicSolve] = useState<Solve | null>(null)
  const [loading, setLoading] = useState(true)

  const localSolve = solves.find((s) => s.id === solveId)

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
    fetchPublicSolve(solveId, userId).then((solve) => {
      setPublicSolve(solve)
      setLoading(false)
    })
  }, [solveId, userId, localSolve])

  const solve = localSolve || publicSolve

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
