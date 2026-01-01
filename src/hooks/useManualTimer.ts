import { useState, useRef, useCallback, useEffect } from 'react'

export type ManualTimerStatus = 'idle' | 'holding' | 'ready' | 'running' | 'stopped'

const HOLD_THRESHOLD = 550

interface UseManualTimerOptions {
  enabled?: boolean
  onNextScramble?: () => void
}

export function useManualTimer({ enabled = true, onNextScramble }: UseManualTimerOptions = {}) {
  const [status, setStatus] = useState<ManualTimerStatus>('idle')
  const [time, setTime] = useState(0)
  const startTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number>(0)
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const statusRef = useRef(status)
  statusRef.current = status
  
  const onNextScrambleRef = useRef(onNextScramble)
  onNextScrambleRef.current = onNextScramble

  const updateTime = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current
    setTime(elapsed)
    animationFrameRef.current = requestAnimationFrame(updateTime)
  }, [])

  const reset = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current)
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
    setStatus('idle')
    setTime(0)
  }, [])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return
      e.preventDefault()

      const currentStatus = statusRef.current

      if (currentStatus === 'idle') {
        setStatus('holding')
        holdTimeoutRef.current = setTimeout(() => {
          setStatus('ready')
        }, HOLD_THRESHOLD)
      } else if (currentStatus === 'running') {
        cancelAnimationFrame(animationFrameRef.current)
        const finalTime = Date.now() - startTimeRef.current
        setTime(finalTime)
        setStatus('stopped')
      } else if (currentStatus === 'stopped') {
        setStatus('idle')
        setTime(0)
        onNextScrambleRef.current?.()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      e.preventDefault()

      const currentStatus = statusRef.current

      if (currentStatus === 'holding') {
        if (holdTimeoutRef.current) {
          clearTimeout(holdTimeoutRef.current)
          holdTimeoutRef.current = null
        }
        setStatus('idle')
      } else if (currentStatus === 'ready') {
        startTimeRef.current = Date.now()
        setStatus('running')
        animationFrameRef.current = requestAnimationFrame(updateTime)
      }
    }

    const handleAnyKeyDown = (e: KeyboardEvent) => {
      if (statusRef.current === 'running' && e.code !== 'Space') {
        e.preventDefault()
        cancelAnimationFrame(animationFrameRef.current)
        const finalTime = Date.now() - startTimeRef.current
        setTime(finalTime)
        setStatus('stopped')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('keydown', handleAnyKeyDown)

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('header, footer, nav, [data-no-timer]')) return

      const currentStatus = statusRef.current

      if (currentStatus === 'idle') {
        setStatus('holding')
        holdTimeoutRef.current = setTimeout(() => {
          setStatus('ready')
        }, HOLD_THRESHOLD)
      } else if (currentStatus === 'running') {
        cancelAnimationFrame(animationFrameRef.current)
        const finalTime = Date.now() - startTimeRef.current
        setTime(finalTime)
        setStatus('stopped')
      } else if (currentStatus === 'stopped') {
        setStatus('idle')
        setTime(0)
        onNextScrambleRef.current?.()
      }
    }

    const handleTouchEnd = () => {
      const currentStatus = statusRef.current

      if (currentStatus === 'holding') {
        if (holdTimeoutRef.current) {
          clearTimeout(holdTimeoutRef.current)
          holdTimeoutRef.current = null
        }
        setStatus('idle')
      } else if (currentStatus === 'ready') {
        startTimeRef.current = Date.now()
        setStatus('running')
        animationFrameRef.current = requestAnimationFrame(updateTime)
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('keydown', handleAnyKeyDown)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      cancelAnimationFrame(animationFrameRef.current)
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current)
      }
    }
  }, [enabled, updateTime])

  return {
    status,
    time,
    reset,
  }
}
