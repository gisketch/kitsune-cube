import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { runDesyncCheck } from './debug-desync'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Header } from '@/components/layout/Header'
import { Footer, MobileFooter } from '@/components/layout/Footer'
import { StatusBar, CubeConnectionStatus, BatteryStatus } from '@/components/layout/StatusBar'
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
import { FAQPage } from '@/components/faq-page'
import { SolvesListSidebar } from '@/components/solves-list-sidebar'
import { ScrambleWidget } from '@/components/scramble-widget'
import { StatsWidget, MobileStatsButton } from '@/components/stats-widget'
import { SEOHead } from '@/lib/seo'
import { useCubeState } from '@/hooks/useCubeState'
import { useCubeFaces } from '@/hooks/useCubeFaces'
import { useSmartCube, MAC_ADDRESS_STORAGE_KEY } from '@/hooks/useSmartCube'
import { useScrambleTracker } from '@/hooks/useScrambleTracker'
import { useSolves } from '@/hooks/useSolves'
import { useSettings } from '@/hooks/useSettings'
import { useAuth } from '@/contexts/AuthContext'
import { useSolveSession } from '@/contexts/SolveSessionContext'
import { useAchievements } from '@/contexts/AchievementsContext'
import { BrandPickerModal, SmartCubeConnectionModal } from '@/components/brand-picker-modal'
import { CalibrationModal } from '@/components/calibration-modal'
import { CubeInfoModal } from '@/components/cube-info-modal'
import { generateScramble, SOLVED_FACELETS } from '@/lib/cube-state'
import { setCubeColors } from '@/lib/cube-state'
import { setCubeFaceColors } from '@/lib/cube-faces'
import { getCubeColors } from '@/lib/themes'
import { db, isOfflineMode } from '@/lib/firebase'
import { DEFAULT_CONFIG } from '@/config/scene-config'
import type { CubeBrand } from '@/lib/cube-protocols'
import type { KPattern } from 'cubing/kpuzzle'

type TabType = 'timer' | 'account' | 'achievements' | 'leaderboard' | 'simulator' | 'settings'

interface MoveWithTime {
  move: string
  time: number
}

const CALIBRATION_SEQUENCE_TIMEOUT = 800


const TAB_TO_PATH: Record<TabType, string> = {
  timer: '/app',
  account: '/app/account',
  achievements: '/app/achievements',
  leaderboard: '/app/leaderboard',
  simulator: '/app/simulator',
  settings: '/app/settings',
}

const PATH_TO_TAB: Record<string, TabType> = {
  '/app': 'timer',
  '/app/account': 'account',
  '/app/achievements': 'achievements',
  '/app/leaderboard': 'leaderboard',
  '/app/simulator': 'simulator',
  '/app/settings': 'settings',
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const activeTab = useMemo(() => {
    const path = location.pathname
    if (path.startsWith('/app/solve/')) return 'account'
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
  const { user } = useAuth()

  const [savedMacAddress, setSavedMacAddress] = useState<string | null>(null)

  useEffect(() => {
    const loadSavedMacAddress = async () => {
      if (user && db && !isOfflineMode) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists() && userDoc.data().macAddress) {
            setSavedMacAddress(userDoc.data().macAddress)
            localStorage.setItem(MAC_ADDRESS_STORAGE_KEY, userDoc.data().macAddress)
            return
          }
        } catch (e) {
          console.warn('Failed to load MAC address from cloud:', e)
        }
      }
      const localMac = localStorage.getItem(MAC_ADDRESS_STORAGE_KEY)
      if (localMac) {
        setSavedMacAddress(localMac)
      }
    }
    loadSavedMacAddress()
  }, [user])

  useEffect(() => {
    runDesyncCheck()
  }, [])

  const handleMacAddressResolved = useCallback(async (mac: string) => {
    setSavedMacAddress(mac)
    if (user && db && !isOfflineMode) {
      try {
        await setDoc(doc(db, 'users', user.uid), { macAddress: mac }, { merge: true })
      } catch (e) {
        console.warn('Failed to save MAC address to cloud:', e)
      }
    }
  }, [user])

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
    resetGyro: () => { },
    syncCube: () => { },
    nextScramble: () => { },
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
    connect: smartCubeConnect,
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
    brand,
    hasGyroscope,
    setBrand,
  } = useSmartCube({
    onMove: handleMove,
    savedMacAddress,
    onMacAddressResolved: handleMacAddressResolved,
  })

  const [isBrandPickerOpen, setIsBrandPickerOpen] = useState(false)

  const handleConnectClick = useCallback(() => {
    if (brand) {
      smartCubeConnect()
    } else {
      setIsBrandPickerOpen(true)
    }
  }, [brand, smartCubeConnect])

  const handleSelectBrand = useCallback((selectedBrand: CubeBrand) => {
    setBrand(selectedBrand)
    setIsBrandPickerOpen(false)
    smartCubeConnect(selectedBrand)
  }, [setBrand, smartCubeConnect])

  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      gyroRecorder.recordGyroFrame(quaternionRef.current)
    }, 50)

    return () => clearInterval(interval)
  }, [isConnected, gyroRecorder, quaternionRef])

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
        handleConnectClick()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resetGyro, handleSyncCube, isConnected, handleConnectClick])

  const closeModal = () => {
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
      <SEOHead />
      <div className="flex flex-1 flex-col w-full max-w-7xl mx-auto">
        <BrandPickerModal
          isOpen={isBrandPickerOpen}
          onClose={() => setIsBrandPickerOpen(false)}
          onSelectBrand={handleSelectBrand}
        />

        <SmartCubeConnectionModal
          isOpen={isMacAddressRequired || !!error}
          onClose={closeModal}
          type={error || isMacAddressRequired ? 'error' : 'success'}
          title={
            isMacAddressRequired
              ? 'Manual MAC Address Required'
              : error
                ? 'Connection Failed'
                : 'Connected'
          }
          message={
            isMacAddressRequired
              ? 'Unable to determine cube MAC address automatically. Please enter it manually.'
              : error || ''
          }
          isMacRequired={isMacAddressRequired}
          onSubmitMac={submitMacAddress}
          brand={brand}
        />

        <CalibrationModal
          isOpen={isCalibrationOpen}
          onClose={() => setIsCalibrationOpen(false)}
          pattern={cubeState?.pattern}
          onSyncCube={handleSyncCube}
          onRecalibrateGyro={handleRecalibrateGyro}
          isConnected={isConnected}
          hasGyroscope={hasGyroscope}
        />

        <CubeInfoModal
          isOpen={isCubeInfoOpen}
          onClose={() => setIsCubeInfoOpen(false)}
          batteryLevel={batteryLevel}
          onResetGyro={resetGyro}
          onSyncCube={handleSyncCube}
          onDisconnect={disconnect}
          brand={brand}
          hasGyroscope={hasGyroscope}
        />

        <Header
          onNavigate={handleNavigate}
          isConnected={isConnected}
          isConnecting={isConnecting}
          onConnect={handleConnectClick}
          onDisconnect={disconnect}
          batteryLevel={batteryLevel}
          onCalibrate={() => setIsCalibrationOpen(true)}
          isCloudSync={isCloudSync}
        />

        <main className="flex flex-1 flex-col min-h-0">
          <Routes>
            <Route index element={
              settings.timerLayoutMode === 'detailed' ? (
                <div className="flex flex-1 flex-col px-4 pt-2 md:px-6">
                  {/* Desktop: 3-column layout */}
                  <div className="hidden flex-1 gap-4 md:grid md:grid-cols-[minmax(160px,240px)_1fr_minmax(180px,260px)]">
                    {/* Left sidebar: Solves list - hidden when showing results */}
                    <div className="flex min-w-0 flex-col overflow-hidden">
                      {!((timer.status === 'stopped' || manualTimer.status === 'stopped') && lastSolveTime > 0) && (
                        <SolvesListSidebar solves={solves} maxItems={12} />
                      )}
                    </div>

                    {/* Center: Timer area */}
                    <div className="flex flex-col items-center justify-center gap-4">
                      <StatusBar
                        solves={solves}
                        inspectionTime={settings.inspectionTime}
                        customInspectionTime={settings.customInspectionTime}
                        onInspectionChange={(time) => updateSetting('inspectionTime', time)}
                        layoutMode={settings.timerLayoutMode}
                        onLayoutModeChange={(mode) => updateSetting('timerLayoutMode', mode)}
                      />
                      {((timer.status === 'stopped' || manualTimer.status === 'stopped') && lastSolveTime > 0) ? (
                        <SolveResults
                          time={lastSolveTime}
                          moves={lastMoveCount}
                          analysis={lastAnalysis}
                          onNextScramble={handleNewScramble}
                          onRepeatScramble={handleRepeatScramble}
                          onDeleteSolve={(id) => {
                            deleteSolve(id)
                            handleNewScramble()
                          }}
                          scramble={lastScramble}
                          solve={solves.length > 0 ? solves[0] : undefined}
                          isManual={manualTimerEnabled}
                          userId={user?.uid}
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
                              onConnect={handleConnectClick}
                            />
                          ) : (
                            <div className="relative aspect-square w-full max-w-sm">
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

                          <BatteryStatus
                            batteryLevel={batteryLevel}
                            isConnected={isConnected}
                            onOpenCubeInfo={handleOpenCubeInfo}
                          />
                        </>
                      )}
                    </div>

                    {/* Right sidebar: Stats and Scramble preview - hidden when showing results */}
                    <div className="flex min-w-0 flex-col gap-4 overflow-hidden">
                      {!((timer.status === 'stopped' || manualTimer.status === 'stopped') && lastSolveTime > 0) && (
                        <>
                          <StatsWidget
                            solves={solves}
                            isVisible={settings.showStatsWidget}
                            onToggleVisibility={() => updateSetting('showStatsWidget', !settings.showStatsWidget)}
                          />
                          <ScrambleWidget scramble={manualScramble} compact />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Mobile: Single column layout */}
                  <div className="flex flex-1 flex-col items-center gap-2 md:hidden">
                    <StatusBar
                      solves={solves}
                      inspectionTime={settings.inspectionTime}
                      customInspectionTime={settings.customInspectionTime}
                      onInspectionChange={(time) => updateSetting('inspectionTime', time)}
                      layoutMode={settings.timerLayoutMode}
                      onLayoutModeChange={(mode) => updateSetting('timerLayoutMode', mode)}
                    />
                    {((timer.status === 'stopped' || manualTimer.status === 'stopped') && lastSolveTime > 0) ? (
                      <SolveResults
                        time={lastSolveTime}
                        moves={lastMoveCount}
                        analysis={lastAnalysis}
                        onNextScramble={handleNewScramble}
                        onRepeatScramble={handleRepeatScramble}
                        onDeleteSolve={(id) => {
                          deleteSolve(id)
                          handleNewScramble()
                        }}
                        scramble={lastScramble}
                        solve={solves.length > 0 ? solves[0] : undefined}
                        isManual={manualTimerEnabled}
                        userId={user?.uid}
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

                        <div className="flex items-center gap-3">
                          <ScrambleWidget scramble={manualScramble} compact />
                        </div>

                        {manualTimerEnabled ? (
                          <ManualTimerDisplay
                            status={manualTimer.status}
                            time={manualTimer.time}
                            inspectionRemaining={manualTimer.inspectionRemaining}
                            onConnect={handleConnectClick}
                          />
                        ) : (
                          <div className="relative aspect-square w-full max-w-[240px]">
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
                          onConnect={handleConnectClick}
                          onOpenCubeInfo={handleOpenCubeInfo}
                        />

                        <MobileStatsButton
                          solves={solves}
                          isVisible={settings.showStatsWidget}
                          onToggleVisibility={() => updateSetting('showStatsWidget', !settings.showStatsWidget)}
                        />

                        <RecentSolves solves={solves} />
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center gap-0 px-6 pt-2 md:justify-center md:gap-4 md:p-4 md:pt-4">
                  <StatusBar
                    solves={solves}
                    inspectionTime={settings.inspectionTime}
                    customInspectionTime={settings.customInspectionTime}
                    onInspectionChange={(time) => updateSetting('inspectionTime', time)}
                    layoutMode={settings.timerLayoutMode}
                    onLayoutModeChange={(mode) => updateSetting('timerLayoutMode', mode)}
                  />
                  {((timer.status === 'stopped' || manualTimer.status === 'stopped') && lastSolveTime > 0) ? (
                    <SolveResults
                      time={lastSolveTime}
                      moves={lastMoveCount}
                      analysis={lastAnalysis}
                      onNextScramble={handleNewScramble}
                      onRepeatScramble={handleRepeatScramble}
                      onDeleteSolve={(id) => {
                        deleteSolve(id)
                        handleNewScramble()
                      }}
                      scramble={lastScramble}
                      solve={solves.length > 0 ? solves[0] : undefined}
                      isManual={manualTimerEnabled}
                      userId={user?.uid}
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
                          onConnect={handleConnectClick}
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
                        onConnect={handleConnectClick}
                        onOpenCubeInfo={handleOpenCubeInfo}
                      />

                      <RecentSolves solves={solves} />
                    </>
                  )}
                </div>
              )
            } />
            <Route path="account" element={
              <AccountPage
                solves={solves}
                onDeleteSolve={deleteSolve}
                onViewSolveDetails={(solve) => navigate(user?.uid ? `/app/solve/${user.uid}/${solve.id}` : `/app/solve/${solve.id}`)}
              />
            } />
            <Route path="solve/:solveId" element={<SolvePage />} />
            <Route path="solve/:userId/:solveId" element={<SolvePage />} />
            <Route path="achievements" element={<AchievementsPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="simulator" element={<Simulator />} />
            <Route path="settings" element={
              <SettingsPanel
                onMigrateToCloud={migrateLocalToCloud}
                isCloudSync={isCloudSync}
              />
            } />
            <Route path="faq" element={<FAQPage />} />
          </Routes>
        </main>

        <div className="hidden md:block mt-auto">
          <KeyboardHints isConnected={isConnected} />
          <Footer />
        </div>

        <div className="md:hidden mt-auto">
          <MobileFooter />
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
              handleConnectClick()
            }
          }}
          onNavigate={handleNavigate}
          isConnected={isConnected}
        />
      </div>
    </div>
  )
}

export { App as TimerApp }
export default App
