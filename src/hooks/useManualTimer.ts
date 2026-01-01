import { useState, useRef, useCallback, useEffect } from 'react'
import type { InspectionTime } from './useSettings'

export type ManualTimerStatus = 'idle' | 'holding' | 'ready' | 'inspection' | 'running' | 'stopped'

interface UseManualTimerOptions {
  enabled?: boolean
  onNextScramble?: () => void
  inspectionTime?: InspectionTime
  customInspectionTime?: number
  holdThreshold?: number
}

export function useManualTimer({
  enabled = true,
  onNextScramble,
  inspectionTime = 'none',
  customInspectionTime = 15,
  holdThreshold = 300,
}: UseManualTimerOptions = {}) {
  const [status, setStatus] = useState<ManualTimerStatus>('idle')
  const [time, setTime] = useState(0)
  const [inspectionRemaining, setInspectionRemaining] = useState(0)

  const startTimeRef = useRef<number>(0)
  const inspectionStartRef = useRef<number>(0)
  const animationFrameRef = useRef<number>(0)
  const inspectionFrameRef = useRef<number>(0)
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const statusRef = useRef(status)
  statusRef.current = status

  const onNextScrambleRef = useRef(onNextScramble)
  onNextScrambleRef.current = onNextScramble

  const getInspectionDuration = useCallback(() => {
    if (inspectionTime === 'none') return 0
    if (inspectionTime === 'custom') return customInspectionTime * 1000
    return parseInt(inspectionTime) * 1000
  }, [inspectionTime, customInspectionTime])

  const updateTime = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current
    setTime(elapsed)
    animationFrameRef.current = requestAnimationFrame(updateTime)
  }, [])

  const updateInspection = useCallback(() => {
    const elapsed = Date.now() - inspectionStartRef.current
    const duration = getInspectionDuration()
    const remaining = Math.max(0, duration - elapsed)
    setInspectionRemaining(remaining)

    if (remaining > 0) {
      inspectionFrameRef.current = requestAnimationFrame(updateInspection)
    }
  }, [getInspectionDuration])

  const startInspection = useCallback(() => {
    const duration = getInspectionDuration()
    if (duration === 0) {
      startTimeRef.current = Date.now()
      setStatus('running')
      animationFrameRef.current = requestAnimationFrame(updateTime)
    } else {
      inspectionStartRef.current = Date.now()
      setInspectionRemaining(duration)
      setStatus('inspection')
      inspectionFrameRef.current = requestAnimationFrame(updateInspection)
    }
  }, [getInspectionDuration, updateTime, updateInspection])

  const startTimer = useCallback(() => {
    cancelAnimationFrame(inspectionFrameRef.current)
    startTimeRef.current = Date.now()
    setStatus('running')
    animationFrameRef.current = requestAnimationFrame(updateTime)
  }, [updateTime])

  const reset = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current)
    cancelAnimationFrame(inspectionFrameRef.current)
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
    setStatus('idle')
    setTime(0)
    setInspectionRemaining(0)
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
        }, holdThreshold)
      } else if (currentStatus === 'inspection') {
        setStatus('holding')
        holdTimeoutRef.current = setTimeout(() => {
          setStatus('ready')
        }, holdThreshold)
      } else if (currentStatus === 'running') {
        cancelAnimationFrame(animationFrameRef.current)
        const finalTime = Date.now() - startTimeRef.current
        setTime(finalTime)
        setStatus('stopped')
      } else if (currentStatus === 'stopped') {
        setStatus('idle')
        setTime(0)
        setInspectionRemaining(0)
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
        if (inspectionStartRef.current > 0) {
          setStatus('inspection')
        } else {
          setStatus('idle')
        }
      } else if (currentStatus === 'ready') {
        if (inspectionStartRef.current > 0) {
          startTimer()
        } else {
          startInspection()
        }
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
      const isInteractiveElement = target.closest('button, a, input, select, textarea, [role="button"], [data-no-timer]')
      if (target.closest('header, footer, nav')) return

      const currentStatus = statusRef.current

      if (currentStatus === 'idle') {
        if (isInteractiveElement) return
        setStatus('holding')
        holdTimeoutRef.current = setTimeout(() => {
          setStatus('ready')
        }, holdThreshold)
      } else if (currentStatus === 'inspection') {
        if (isInteractiveElement) return
        setStatus('holding')
        holdTimeoutRef.current = setTimeout(() => {
          setStatus('ready')
        }, holdThreshold)
      } else if (currentStatus === 'running') {
        cancelAnimationFrame(animationFrameRef.current)
        const finalTime = Date.now() - startTimeRef.current
        setTime(finalTime)
        setStatus('stopped')
      } else if (currentStatus === 'stopped') {
        if (isInteractiveElement) return
        setStatus('idle')
        setTime(0)
        setInspectionRemaining(0)
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
        if (inspectionStartRef.current > 0) {
          setStatus('inspection')
        } else {
          setStatus('idle')
        }
      } else if (currentStatus === 'ready') {
        if (inspectionStartRef.current > 0) {
          startTimer()
        } else {
          startInspection()
        }
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
      cancelAnimationFrame(inspectionFrameRef.current)
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current)
      }
    }
  }, [enabled, holdThreshold, startInspection, startTimer])

  useEffect(() => {
    if (status === 'idle') {
      inspectionStartRef.current = 0
    }
  }, [status])

  return {
    status,
    time,
    inspectionRemaining,
    reset,
  }
}
