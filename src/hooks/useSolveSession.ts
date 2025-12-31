import { useState, useCallback, useRef, useEffect } from 'react'
import { useCubeState } from './useCubeState'
import { useCubeFaces } from './useCubeFaces'
import { useScrambleTracker } from './useScrambleTracker'
import { useTimer } from './useTimer'
import { useSolves } from './useSolves'
import { useGyroRecorder } from './useGyroRecorder'
import { useSettings } from './useSettings'
import { useGanCube } from './useGanCube'
import { useCalibrationSequence } from './useCalibrationSequence'
import { generateScramble } from '@/lib/cube-state'
import { analyzeCFOP, type CFOPAnalysis } from '@/lib/cfop-analyzer'
import type { RubiksCubeRef } from '@/components/cube'
import type { KPattern } from 'cubing/kpuzzle'

export function useSolveSession() {
  const [frozenPattern, setFrozenPattern] = useState<KPattern | null>(null)
  const [lastAnalysis, setLastAnalysis] = useState<CFOPAnalysis | null>(null)
  const [lastSolveTime, setLastSolveTime] = useState<number>(0)
  const [lastMoveCount, setLastMoveCount] = useState<number>(0)
  const [lastScramble, setLastScramble] = useState<string>('')
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false)

  const cubeRef = useRef<RubiksCubeRef>(null)
  const solveSavedRef = useRef(false)

  const {
    cubeState,
    isLoading,
    performMove: updateCubeState,
    reset: resetCubeState,
  } = useCubeState()
  const {
    state: scrambleState,
    setScramble,
    performMove: trackMove,
    setSolved,
    startSolving,
  } = useScrambleTracker()

  const timer = useTimer()
  const { solves, addSolve, deleteSolve } = useSolves()
  const { settings } = useSettings()
  const gyroRecorder = useGyroRecorder()
  const {
    faces: cubeFaces,
    performMove: updateCubeFaces,
    reset: resetCubeFaces,
    isSolved: checkCubeSolved,
    getHistory,
    clearHistory,
    applyScramble,
  } = useCubeFaces()

  const { handleCalibration, setActions } = useCalibrationSequence()

  const handleMove = useCallback(
    (move: string) => {
      if (handleCalibration(move)) return

      trackMove(move)
      cubeRef.current?.performMove(move)
      updateCubeState(move)
      updateCubeFaces(move)
      gyroRecorder.recordMove(move)

      if (timer.status === 'inspection') {
        timer.startTimer()
      }
    },
    [trackMove, timer, updateCubeState, updateCubeFaces, gyroRecorder, handleCalibration],
  )

  const ganCube = useGanCube(handleMove)
  const { resetGyro, quaternionRef, isConnected } = ganCube

  useEffect(() => {
    if (cubeState?.pattern && !frozenPattern) {
      setFrozenPattern(cubeState.pattern)
    }
  }, [cubeState?.pattern, frozenPattern])

  useEffect(() => {
    const solved = checkCubeSolved()

    if (solved !== scrambleState.isSolved) {
      setSolved(solved)
    }

    if (solved && timer.status === 'running' && !solveSavedRef.current) {
      solveSavedRef.current = true
      const finalTime = timer.stopTimer()
      if (finalTime && scrambleState.originalScramble) {
        const history = getHistory()
        const analysis = analyzeCFOP(history.moves, history.states)
        setLastAnalysis(analysis)
        setLastSolveTime(finalTime)
        setLastMoveCount(history.moves.length)
        setLastScramble(scrambleState.originalScramble)

        const recordedData = gyroRecorder.stopRecording()

        addSolve({
          time: finalTime,
          scramble: scrambleState.originalScramble,
          solution: history.moves,
          cfopAnalysis: analysis || undefined,
          gyroData: recordedData.gyroData.length > 0 ? recordedData.gyroData : undefined,
          moveTimings: recordedData.moveTimings.length > 0 ? recordedData.moveTimings : undefined,
        })
      }
    }
  }, [
    cubeFaces,
    checkCubeSolved,
    setSolved,
    timer,
    scrambleState.originalScramble,
    scrambleState.isSolved,
    addSolve,
    getHistory,
    gyroRecorder,
  ])

  useEffect(() => {
    if (scrambleState.status === 'completed' && timer.status === 'idle') {
      if (scrambleState.originalScramble) {
        applyScramble(scrambleState.originalScramble)
      }
      timer.startInspection()
      startSolving()
      gyroRecorder.startRecording()
    }
  }, [
    scrambleState.status,
    scrambleState.originalScramble,
    timer,
    startSolving,
    applyScramble,
    gyroRecorder,
  ])

  useEffect(() => {
    if (!gyroRecorder.isRecording() || !isConnected) return

    const interval = setInterval(() => {
      gyroRecorder.recordGyroFrame(quaternionRef.current)
    }, 50)

    return () => clearInterval(interval)
  }, [isConnected, gyroRecorder, quaternionRef])

  const handleNewScramble = useCallback(async () => {
    solveSavedRef.current = false
    timer.reset()
    clearHistory()
    setLastAnalysis(null)
    setLastSolveTime(0)
    setLastMoveCount(0)
    const scrambleAlg = await generateScramble()
    setScramble(scrambleAlg)
  }, [setScramble, timer, clearHistory])

  const handleRepeatScramble = useCallback(() => {
    if (!lastScramble) return
    solveSavedRef.current = false
    timer.reset()
    clearHistory()
    setLastAnalysis(null)
    setLastSolveTime(0)
    setLastMoveCount(0)
    setScramble(lastScramble)
  }, [lastScramble, setScramble, timer, clearHistory])

  const handleSyncCube = useCallback(async () => {
    await resetCubeState()
    resetCubeFaces()
    const { createSolvedState } = await import('@/lib/cube-state')
    const solved = await createSolvedState()
    setFrozenPattern(solved.pattern)
    setIsCalibrationOpen(false)
  }, [resetCubeState, resetCubeFaces])

  const handleRecalibrateGyro = useCallback(() => {
    resetGyro()
    setIsCalibrationOpen(false)
  }, [resetGyro])

  useEffect(() => {
    setActions({
      resetGyro,
      syncCube: handleSyncCube,
    })
  }, [resetGyro, handleSyncCube, setActions])

  return {
    cubeRef,
    cubeState,
    isLoading,
    frozenPattern,
    scrambleState,
    timer,
    solves,
    deleteSolve,
    settings,
    ganCube,
    lastAnalysis,
    lastSolveTime,
    lastMoveCount,
    lastScramble,
    isCalibrationOpen,
    setIsCalibrationOpen,
    handleNewScramble,
    handleRepeatScramble,
    handleSyncCube,
    handleRecalibrateGyro,
    setScramble,
  }
}
