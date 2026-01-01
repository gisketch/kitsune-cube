import { useState, useRef, useCallback, useEffect } from 'react'
import type { InspectionTime } from './useSettings'

export type TimerStatus = 'idle' | 'inspection' | 'running' | 'stopped'

export interface TimerState {
  status: TimerStatus
  time: number
  inspectionTime: number
}

interface UseTimerOptions {
  inspectionTime?: InspectionTime
  customInspectionTime?: number
}

export function useTimer({
  inspectionTime = 'none',
  customInspectionTime = 15,
}: UseTimerOptions = {}) {
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [time, setTime] = useState(0)
  const [inspectionRemaining, setInspectionRemaining] = useState(0)
  const startTimeRef = useRef<number>(0)
  const inspectionStartRef = useRef<number>(0)
  const animationFrameRef = useRef<number>(0)
  const inspectionFrameRef = useRef<number>(0)

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
      setStatus('inspection')
      setInspectionRemaining(0)
    } else {
      inspectionStartRef.current = Date.now()
      setInspectionRemaining(duration)
      setStatus('inspection')
      inspectionFrameRef.current = requestAnimationFrame(updateInspection)
    }
    setTime(0)
  }, [getInspectionDuration, updateInspection])

  const startTimer = useCallback(() => {
    if (status !== 'inspection') return
    cancelAnimationFrame(inspectionFrameRef.current)
    startTimeRef.current = Date.now()
    setStatus('running')
    animationFrameRef.current = requestAnimationFrame(updateTime)
  }, [status, updateTime])

  const stopTimer = useCallback(() => {
    if (status !== 'running') return
    cancelAnimationFrame(animationFrameRef.current)
    const finalTime = Date.now() - startTimeRef.current
    setTime(finalTime)
    setStatus('stopped')
    return finalTime
  }, [status])

  const reset = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current)
    cancelAnimationFrame(inspectionFrameRef.current)
    setStatus('idle')
    setTime(0)
    setInspectionRemaining(0)
  }, [])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current)
      cancelAnimationFrame(inspectionFrameRef.current)
    }
  }, [])

  return {
    status,
    time,
    inspectionRemaining,
    startInspection,
    startTimer,
    stopTimer,
    reset,
  }
}
