import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { StatusBar, CubeConnectionStatus } from '@/components/layout/StatusBar'
import { KeyboardHints } from '@/components/keyboard-hints'
import { CommandPalette } from '@/components/command-palette'
import { CubeViewer, type RubiksCubeRef, type CubeColors } from '@/components/cube'
import { ScrambleNotation } from '@/components/scramble-notation'
import { SolveResults } from '@/components/solve-results'
import { RecentSolves } from '@/components/recent-solves'
import { Simulator } from '@/components/simulator'
import { SettingsPanel } from '@/components/settings-panel'
import { AccountPage } from '@/components/account-page'
import { AchievementsPage } from '@/components/achievements-page'
import { LeaderboardPage } from '@/components/leaderboard-page'
import { ManualTimerDisplay } from '@/components/manual-timer-display'
import { SolvePage } from '@/components/solve-page'
import { useCubeState } from '@/hooks/useCubeState'
import { useCubeFaces } from '@/hooks/useCubeFaces'
import { useGanCube } from '@/hooks/useGanCube'
import { useScrambleTracker } from '@/hooks/useScrambleTracker'
import { useSolves } from '@/hooks/useSolves'
import { useSettings } from '@/hooks/useSettings'
import { useSolveSession } from '@/contexts/SolveSessionContext'
import { useAchievements } from '@/contexts/AchievementsContext'
import { ConnectionModal } from '@/components/connection-modal'
import { CalibrationModal } from '@/components/calibration-modal'
import { CubeInfoModal } from '@/components/cube-info-modal'
import { generateScramble, SOLVED_FACELETS } from '@/lib/cube-state'
import { setCubeColors } from '@/lib/cube-state'
import { setCubeFaceColors } from '@/lib/cube-faces'
import { getCubeColors } from '@/lib/themes'
import { DEFAULT_CONFIG } from '@/config/scene-config'
import type { KPattern } from 'cubing/kpuzzle'

type TabType = 'timer' | 'account' | 'achievements' | 'leaderboard' | 'simulator' | 'settings'

interface MoveWithTime {
  move: string
  time: number
}

const CALIBRATION_SEQUENCE_TIMEOUT = 800

const TAB_TO_PATH: Record<TabType, string> = {
  timer: '/',
  account: '/account',
  achievements: '/achievements',
  leaderboard: '/leaderboard',
  simulator: '/simulator',
  settings: '/settings',
}

const PATH_TO_TAB: Record<string, TabType> = {
  '/': 'timer',
  '/account': 'account',
  '/achievements': 'achievements',
  '/leaderboard': 'leaderboard',
  '/simulator': 'simulator',
  '/settings': 'settings',
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const activeTab = useMemo(() => {
    const path = location.pathname
    if (path.startsWith('/solve/')) return 'account'
    return PATH_TO_TAB[path] || 'timer'
  }, [location.pathname])

  const handleNavigate = useCallback((tab: TabType) => {
    navigate(TAB_TO_PATH[tab])
  }, [navigate])

  const [_isScrambling, setIsScrambling] = useState(false)
  const [frozenPattern, setFrozenPattern] = useState<KPattern | null>(null)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const cubeRef = useRef<RubiksCubeRef>(null)
  const recentMovesRef = useRef<MoveWithTime[]>([])

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
    syncWithFacelets,
    setSolved,
    startSolving,
  } = useScrambleTracker()

  const {
    timer,
    manualTimer,
    gyroRecorder,
    solveSaved,
    lastSolveTime,
    lastMoveCount,
    lastScramble,
    lastAnalysis,
    isRepeatedScramble,
    manualTimerEnabled,
    setManualTimerEnabled,
    setRepeatedScramble,
    saveSolve,
    scrambleTrigger,
    resetSolveSession,
  } = useSolveSession()

  const { solves, deleteSolve: rawDeleteSolve, migrateLocalToCloud, isCloudSync } = useSolves()
  const { recalculateStats } = useAchievements()
  const { settings, updateSetting } = useSettings()

  const deleteSolve = useCallback(async (id: string) => {
    await rawDeleteSolve(id)
    const remainingSolves = solves.filter(s => s.id !== id)
    await recalculateStats(remainingSolves)
  }, [rawDeleteSolve, solves, recalculateStats])
  
  const [manualScramble, setManualScramble] = useState('')

  const cubeColorValues = useMemo(
    () => getCubeColors(settings.cubeTheme, settings.theme),
    [settings.cubeTheme, settings.theme],
  )

  const cubeColors: CubeColors = useMemo(
    () => ({
      white: cubeColorValues.cubeWhite,
      yellow: cubeColorValues.cubeYellow,
      green: cubeColorValues.cubeGreen,
      blue: cubeColorValues.cubeBlue,
      red: cubeColorValues.cubeRed,
      orange: cubeColorValues.cubeOrange,
      inner: '#0a0a0a',
    }),
    [cubeColorValues],
  )

  useEffect(() => {
    setCubeColors(cubeColorValues as Parameters<typeof setCubeColors>[0])
    setCubeFaceColors(cubeColorValues as Parameters<typeof setCubeFaceColors>[0])
  }, [cubeColorValues])
  const {
    faces: cubeFaces,
    performMove: updateCubeFaces,
    reset: resetCubeFaces,
    isSolved: checkCubeSolved,
    getHistory,
    clearHistory,
    applyScramble,
  } = useCubeFaces()

  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false)
  const [isCubeInfoOpen, setIsCubeInfoOpen] = useState(false)
  const hasInitializedRef = useRef(false)

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

    if (solved && (scrambleState.status === 'scrambling' || scrambleState.status === 'diverged')) {
      syncWithFacelets(SOLVED_FACELETS)
    }

    if (solved && timer.status === 'running' && !solveSaved) {
      const finalTime = timer.stopTimer()
      if (finalTime && scrambleState.originalScramble) {
        const history = getHistory()
        const recordedData = gyroRecorder.stopRecording()

        saveSolve({
          time: finalTime,
          scramble: scrambleState.originalScramble,
          solution: history.moves,
          states: history.states,
          isManual: false,
          gyroData: recordedData.gyroData,
          moveTimings: recordedData.moveTimings,
        })
      }
    }
  }, [
    cubeFaces,
    checkCubeSolved,
    setSolved,
    syncWithFacelets,
    timer,
    scrambleState.originalScramble,
    scrambleState.isSolved,
    scrambleState.status,
    getHistory,
    gyroRecorder,
    solveSaved,
    saveSolve,
  ])

  useEffect(() => {
    if (scrambleState.status === 'completed' && timer.status === 'idle') {
      if (scrambleState.originalScramble) {
        applyScramble(scrambleState.originalScramble)
      }
      timer.startInspection()
      startSolving()
    }
  }, [
    scrambleState.status,
    scrambleState.originalScramble,
    timer,
    startSolving,
    applyScramble,
  ])

  const calibrationActionsRef = useRef<{ resetGyro: () => void; syncCube: () => void; nextScramble: () => void }>({
    resetGyro: () => {},
    syncCube: () => {},
    nextScramble: () => {},
  })

  const checkCalibrationSequence = useCallback((move: string): 'gyro' | 'cube' | 'scramble' | null => {
    const now = Date.now()
    recentMovesRef.current.push({ move, time: now })

    recentMovesRef.current = recentMovesRef.current.filter(
      (m) => now - m.time < CALIBRATION_SEQUENCE_TIMEOUT,
    )

    const recentMoves = recentMovesRef.current.map((m) => m.move)

    if (recentMoves.length >= 4) {
      const lastFour = recentMoves.slice(-4)
      if (lastFour.every((m) => m === 'U' || m === "U'")) {
        const uCount = lastFour.filter((m) => m === 'U').length
        const uPrimeCount = lastFour.filter((m) => m === "U'").length
        if (uCount === 4 || uPrimeCount === 4 || (uCount === 2 && uPrimeCount === 2)) {
          recentMovesRef.current = []
          return 'gyro'
        }
      }
      if (lastFour.every((m) => m === 'F' || m === "F'")) {
        const fCount = lastFour.filter((m) => m === 'F').length
        const fPrimeCount = lastFour.filter((m) => m === "F'").length
        if (fCount === 4 || fPrimeCount === 4 || (fCount === 2 && fPrimeCount === 2)) {
          recentMovesRef.current = []
          return 'cube'
        }
      }
      if (lastFour.every((m) => m === 'D' || m === "D'")) {
        const dCount = lastFour.filter((m) => m === 'D').length
        const dPrimeCount = lastFour.filter((m) => m === "D'").length
        if (dCount === 4 || dPrimeCount === 4 || (dCount === 2 && dPrimeCount === 2)) {
          recentMovesRef.current = []
          return 'scramble'
        }
      }
    }

    return null
  }, [])

  const handleMove = useCallback(
    async (move: string) => {
      cubeRef.current?.performMove(move)
      const newFacelets = await updateCubeState(move)
      updateCubeFaces(move)

      const isTimerActive = timer.status === 'running' || timer.status === 'inspection'
      if (!isTimerActive) {
        const calibration = checkCalibrationSequence(move)
        if (calibration === 'gyro') {
          calibrationActionsRef.current.resetGyro()
          syncWithFacelets(newFacelets)
          return
        }
        if (calibration === 'cube') {
          calibrationActionsRef.current.syncCube()
          syncWithFacelets(newFacelets)
          return
        }
        if (calibration === 'scramble' && timer.status === 'stopped') {
          calibrationActionsRef.current.nextScramble()
          return
        }
      }

      trackMove(move)
      syncWithFacelets(newFacelets)
      gyroRecorder.recordMove(move)

      if (timer.status === 'inspection') {
        timer.startTimer()
        gyroRecorder.startRecording()
      }
    },
    [trackMove, syncWithFacelets, timer, updateCubeState, updateCubeFaces, gyroRecorder, checkCalibrationSequence],
  )

  const {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    quaternionRef,
    resetGyro,
    error,
    clearError,
    isMacAddressRequired,
    submitMacAddress,
    batteryLevel,
    refreshBattery,
  } = useGanCube(handleMove)

  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      gyroRecorder.recordGyroFrame(quaternionRef.current)
    }, 50)

    return () => clearInterval(interval)
  }, [isConnected, gyroRecorder, quaternionRef])

  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'success' | 'error'
    title: string
    message: string
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  })

  const handleNewScramble = useCallback(async () => {
    setIsScrambling(true)
    setRepeatedScramble(false)
    resetSolveSession()
    clearHistory()
    const scrambleAlg = await generateScramble()
    setScramble(scrambleAlg)
    setManualScramble(scrambleAlg)
    setIsScrambling(false)
  }, [setScramble, resetSolveSession, clearHistory, setRepeatedScramble])

  const handleRepeatScramble = useCallback(() => {
    if (!lastScramble) return
    setRepeatedScramble(true)
    resetSolveSession()
    clearHistory()
    setScramble(lastScramble)
    setManualScramble(lastScramble)
  }, [lastScramble, setScramble, resetSolveSession, clearHistory, setRepeatedScramble])

  useEffect(() => {
    handleNewScramble()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (scrambleTrigger > 0) {
      handleNewScramble()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrambleTrigger])

  useEffect(() => {
    setManualTimerEnabled(!isConnected && activeTab === 'timer')
  }, [isConnected, activeTab, setManualTimerEnabled])

  useEffect(() => {
    if (manualTimer.status === 'stopped' && manualTimerEnabled && manualScramble && !solveSaved) {
      saveSolve({
        time: manualTimer.time,
        scramble: manualScramble,
        solution: [],
        isManual: true,
      })
    }
  }, [manualTimer.status, manualTimer.time, manualTimerEnabled, manualScramble, solveSaved, saveSolve])

  const handleSyncCube = useCallback(async () => {
    await resetCubeState()
    resetCubeFaces()
    cubeRef.current?.reset()
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
    calibrationActionsRef.current = {
      resetGyro,
      syncCube: handleSyncCube,
      nextScramble: handleNewScramble,
    }
  }, [resetGyro, handleSyncCube, handleNewScramble])

  useEffect(() => {
    if (isConnected && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      resetGyro()
      handleSyncCube()
    }
    if (!isConnected) {
      hasInitializedRef.current = false
    }
  }, [isConnected, resetGyro, handleSyncCube])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        resetGyro()
      } else if (e.key === 'F4') {
        e.preventDefault()
        handleSyncCube()
      } else if ((e.ctrlKey && e.key === 'k') || e.key === 'Escape') {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      } else if (e.shiftKey && e.key === 'Enter' && !isConnected) {
        e.preventDefault()
        connect()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resetGyro, handleSyncCube, isConnected, connect])

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
    if (error || isMacAddressRequired) clearError()
  }

  const handleOpenCubeInfo = useCallback(() => {
    refreshBattery()
    setIsCubeInfoOpen(true)
  }, [refreshBattery])

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--theme-bg)' }}
    >
      <div className="flex flex-1 flex-col w-full max-w-7xl mx-auto">
        <ConnectionModal
          isOpen={modalState.isOpen || isMacAddressRequired || !!error}
          onClose={closeModal}
          type={error || isMacAddressRequired ? 'error' : modalState.type}
          title={
            isMacAddressRequired
              ? 'Manual MAC Address Required'
              : error
                ? 'Connection Failed'
                : modalState.title
          }
          message={
            isMacAddressRequired
              ? 'Unable to determine cube MAC address automatically. Please enter it manually.'
              : error || modalState.message
          }
          isMacRequired={isMacAddressRequired}
          onSubmitMac={submitMacAddress}
        />

        <CalibrationModal
          isOpen={isCalibrationOpen}
          onClose={() => setIsCalibrationOpen(false)}
          pattern={cubeState?.pattern}
          onSyncCube={handleSyncCube}
          onRecalibrateGyro={handleRecalibrateGyro}
          isConnected={isConnected}
        />

        <CubeInfoModal
          isOpen={isCubeInfoOpen}
          onClose={() => setIsCubeInfoOpen(false)}
          batteryLevel={batteryLevel}
          onResetGyro={resetGyro}
          onSyncCube={handleSyncCube}
          onDisconnect={disconnect}
        />

        <Header
          onNavigate={handleNavigate}
          isConnected={isConnected}
          isConnecting={isConnecting}
          onConnect={connect}
          onDisconnect={disconnect}
          batteryLevel={batteryLevel}
          onCalibrate={() => setIsCalibrationOpen(true)}
          isCloudSync={isCloudSync}
        />

        <main className="flex flex-1 flex-col min-h-0">
          <Routes>
            <Route path="/" element={
              <div className="flex flex-1 flex-col items-center gap-0 px-6 pt-2 md:justify-center md:gap-4 md:p-4 md:pt-4">
                <StatusBar
                  solves={solves}
                  batteryLevel={batteryLevel}
                  isConnected={isConnected}
                  isConnecting={isConnecting}
                  onConnect={connect}
                  onOpenCubeInfo={handleOpenCubeInfo}
                  inspectionTime={settings.inspectionTime}
                  customInspectionTime={settings.customInspectionTime}
                  onInspectionChange={(time) => updateSetting('inspectionTime', time)}
                />
                {((timer.status === 'stopped' || manualTimer.status === 'stopped') && lastSolveTime > 0) ? (
                  <SolveResults
                    time={lastSolveTime}
                    moves={lastMoveCount}
                    analysis={lastAnalysis}
                    onNextScramble={handleNewScramble}
                    onRepeatScramble={handleRepeatScramble}
                    onViewStats={() => {
                      if (solves.length > 0) {
                        navigate(`/solve/${solves[0].id}`)
                      }
                    }}
                    scramble={lastScramble}
                    solve={solves.length > 0 ? solves[0] : undefined}
                    isManual={manualTimerEnabled}
                  />
                ) : (
                  <>
                    <ScrambleNotation
                      trackerState={scrambleState}
                      timerStatus={timer.status}
                      time={timer.time}
                      isManual={manualTimerEnabled}
                      manualScramble={manualScramble}
                      isRepeatedScramble={isRepeatedScramble}
                      inspectionRemaining={timer.inspectionRemaining}
                    />

                    {manualTimerEnabled ? (
                      <ManualTimerDisplay
                        status={manualTimer.status}
                        time={manualTimer.time}
                        inspectionRemaining={manualTimer.inspectionRemaining}
                        onConnect={connect}
                      />
                    ) : (
                      <div className="relative aspect-square w-full max-w-[240px] md:max-w-sm">
                        {!isLoading && (
                          <CubeViewer
                            pattern={frozenPattern}
                            quaternionRef={quaternionRef}
                            cubeRef={cubeRef}
                            config={DEFAULT_CONFIG}
                            animationSpeed={settings.animationSpeed}
                            cubeColors={cubeColors}
                          />
                        )}
                      </div>
                    )}

                    <CubeConnectionStatus
                      batteryLevel={batteryLevel}
                      isConnected={isConnected}
                      isConnecting={isConnecting}
                      onConnect={connect}
                      onOpenCubeInfo={handleOpenCubeInfo}
                    />

                    <RecentSolves solves={solves} />
                  </>
                )}
              </div>
            } />
            <Route path="/account" element={
              <AccountPage
                solves={solves}
                onDeleteSolve={deleteSolve}
                onViewSolveDetails={(solve) => navigate(`/solve/${solve.id}`)}
              />
            } />
            <Route path="/solve/:solveId" element={<SolvePage />} />
            <Route path="/solve/:userId/:solveId" element={<SolvePage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/settings" element={
              <SettingsPanel
                onMigrateToCloud={migrateLocalToCloud}
                isCloudSync={isCloudSync}
              />
            } />
          </Routes>
        </main>

        <div className="hidden md:block mt-auto">
          <KeyboardHints isConnected={isConnected} />
          <Footer />
        </div>

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onResetGyro={() => {
            resetGyro()
          }}
          onResetCube={handleSyncCube}
          onConnectCube={() => {
            if (isConnected) {
              disconnect()
            } else {
              connect()
            }
          }}
          onNavigate={handleNavigate}
          isConnected={isConnected}
        />
      </div>
    </div>
  )
}

export default App
