import { useMemo, useState, useRef } from 'react'
import { Edit2, Check, X, Flame, Target, Zap, Star, Gamepad2, Loader2, Camera } from 'lucide-react'
import { updateProfile } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import type { Solve } from '@/hooks/useSolves'
import { useAuth } from '@/contexts/AuthContext'
import { useExperience } from '@/contexts/ExperienceContext'
import { useAchievements } from '@/contexts/AchievementsContext'
import { SolvesList } from '@/components/solves-list'
import { SolveChart } from '@/components/solve-chart'
import { getLevelTitle } from '@/types/achievements'
import { storage, isOfflineMode } from '@/lib/firebase'

interface AccountPageProps {
  solves: Solve[]
  onDeleteSolve?: (id: string) => void
  onViewSolveDetails?: (solve: Solve) => void
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  date: string
  count: number
}

function CalendarTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip.visible) return null

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-md px-2.5 py-1.5 text-xs shadow-lg"
      style={{
        left: tooltip.x,
        top: tooltip.y,
        backgroundColor: 'var(--theme-bg)',
        border: '1px solid var(--theme-subAlt)',
        color: 'var(--theme-text)',
        transform: 'translate(-50%, -100%)',
        marginTop: -8,
      }}
    >
      <div className="font-medium">{tooltip.count} solve{tooltip.count !== 1 ? 's' : ''}</div>
      <div style={{ color: 'var(--theme-sub)' }}>{tooltip.date}</div>
    </div>
  )
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const centiseconds = Math.floor((ms % 1000) / 10)

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`
  }
  return `${seconds}.${centiseconds.toString().padStart(2, '0')}`
}

function calculateStats(solves: Solve[]) {
  if (solves.length === 0) {
    return { ao5: null, ao12: null, ao50: null, ao100: null, mean: null, best: null, count: 0 }
  }

  const validSolves = solves.filter((s) => !s.dnf)
  const times = validSolves.map((s) => (s.plusTwo ? s.time + 2000 : s.time))

  if (times.length === 0) {
    return { ao5: null, ao12: null, ao50: null, ao100: null, mean: null, best: null, count: solves.length }
  }

  const best = Math.min(...times)
  const mean = times.reduce((a, b) => a + b, 0) / times.length

  const calcAo = (n: number) => {
    if (times.length < n) return null
    const lastN = times.slice(0, n)
    const sorted = [...lastN].sort((a, b) => a - b)
    const trimmed = sorted.slice(1, -1)
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length
  }

  return {
    ao5: calcAo(5),
    ao12: calcAo(12),
    ao50: calcAo(50),
    ao100: calcAo(100),
    mean,
    best,
    count: solves.length,
  }
}

function StatCard({ label, value, highlight }: { label: string; value: string | null; highlight?: boolean }) {
  return (
    <div
      className="flex flex-col items-center rounded-lg px-2 py-2 sm:px-4 sm:py-3"
      style={{
        backgroundColor: highlight ? 'var(--theme-accent)' : 'var(--theme-bgSecondary)',
      }}
    >
      <span
        className="text-[10px] sm:text-xs uppercase tracking-wider"
        style={{ color: highlight ? 'var(--theme-bg)' : 'var(--theme-sub)' }}
      >
        {label}
      </span>
      <span
        className="font-mono text-base sm:text-xl font-bold"
        style={{ color: highlight ? 'var(--theme-bg)' : 'var(--theme-text)' }}
      >
        {value ?? '-'}
      </span>
    </div>
  )
}

interface CFOPStats {
  avgCross: number | null
  avgF2L: number | null
  avgOLL: number | null
  avgPLL: number | null
  avgMoves: number | null
}

function calculateCFOPStats(solves: Solve[], count: number): CFOPStats {
  const validSolves = solves
    .filter((s) => !s.dnf && s.cfopAnalysis && !s.isManual)
    .slice(0, count)

  if (validSolves.length === 0) {
    return { avgCross: null, avgF2L: null, avgOLL: null, avgPLL: null, avgMoves: null }
  }

  const crossMoves: number[] = []
  const f2lMoves: number[] = []
  const ollMoves: number[] = []
  const pllMoves: number[] = []
  const totalMoves: number[] = []

  for (const solve of validSolves) {
    const analysis = solve.cfopAnalysis!
    if (!analysis.cross.skipped) crossMoves.push(analysis.cross.moves.length)
    
    const f2lTotal = analysis.f2l.reduce((sum, pair) => sum + (pair.skipped ? 0 : pair.moves.length), 0)
    if (f2lTotal > 0) f2lMoves.push(f2lTotal)
    
    if (!analysis.oll.skipped) ollMoves.push(analysis.oll.moves.length)
    if (!analysis.pll.skipped) pllMoves.push(analysis.pll.moves.length)
    
    totalMoves.push(solve.solution.length)
  }

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null

  return {
    avgCross: avg(crossMoves),
    avgF2L: avg(f2lMoves),
    avgOLL: avg(ollMoves),
    avgPLL: avg(pllMoves),
    avgMoves: avg(totalMoves),
  }
}

function CFOPStatsWidget({ solves }: { solves: Solve[] }) {
  const [sampleSize, setSampleSize] = useState(12)
  const stats = useMemo(() => calculateCFOPStats(solves, sampleSize), [solves, sampleSize])

  const formatMoves = (moves: number | null) => moves ? moves.toFixed(1) : '-'

  return (
    <div
      className="rounded-xl p-3 sm:p-4"
      style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="text-xs sm:text-sm font-medium uppercase tracking-wider"
          style={{ color: 'var(--theme-sub)' }}
        >
          CFOP Analysis
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--theme-sub)' }}>avg of</span>
          <select
            value={sampleSize}
            onChange={(e) => setSampleSize(Number(e.target.value))}
            className="rounded px-2 py-1 text-xs"
            style={{
              backgroundColor: 'var(--theme-subAlt)',
              color: 'var(--theme-text)',
              border: 'none',
            }}
          >
            <option value={5}>5</option>
            <option value={12}>12</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <div className="flex flex-col items-center rounded-lg px-2 py-2" style={{ backgroundColor: 'var(--theme-bg)' }}>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-sub)' }}>Cross</span>
          <span className="font-mono text-lg font-bold" style={{ color: 'var(--theme-text)' }}>{formatMoves(stats.avgCross)}</span>
          <span className="text-[9px]" style={{ color: 'var(--theme-sub)' }}>moves</span>
        </div>
        <div className="flex flex-col items-center rounded-lg px-2 py-2" style={{ backgroundColor: 'var(--theme-bg)' }}>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-sub)' }}>F2L</span>
          <span className="font-mono text-lg font-bold" style={{ color: 'var(--theme-text)' }}>{formatMoves(stats.avgF2L)}</span>
          <span className="text-[9px]" style={{ color: 'var(--theme-sub)' }}>moves</span>
        </div>
        <div className="flex flex-col items-center rounded-lg px-2 py-2" style={{ backgroundColor: 'var(--theme-bg)' }}>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-sub)' }}>OLL</span>
          <span className="font-mono text-lg font-bold" style={{ color: 'var(--theme-text)' }}>{formatMoves(stats.avgOLL)}</span>
          <span className="text-[9px]" style={{ color: 'var(--theme-sub)' }}>moves</span>
        </div>
        <div className="flex flex-col items-center rounded-lg px-2 py-2" style={{ backgroundColor: 'var(--theme-bg)' }}>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-sub)' }}>PLL</span>
          <span className="font-mono text-lg font-bold" style={{ color: 'var(--theme-text)' }}>{formatMoves(stats.avgPLL)}</span>
          <span className="text-[9px]" style={{ color: 'var(--theme-sub)' }}>moves</span>
        </div>
        <div className="col-span-2 sm:col-span-1 flex flex-col items-center rounded-lg px-2 py-2" style={{ backgroundColor: 'var(--theme-accent)', opacity: 0.9 }}>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-bg)' }}>Total</span>
          <span className="font-mono text-lg font-bold" style={{ color: 'var(--theme-bg)' }}>{formatMoves(stats.avgMoves)}</span>
          <span className="text-[9px]" style={{ color: 'var(--theme-bg)' }}>moves</span>
        </div>
      </div>

      <div className="mt-2 text-center text-[10px]" style={{ color: 'var(--theme-sub)' }}>
        Preferred Method: CFOP
      </div>
    </div>
  )
}

function StreakWidget() {
  const { streak, prestige } = useAchievements()
  const { getXPData } = useExperience()
  const xpData = getXPData()

  return (
    <div
      className="rounded-xl p-3 sm:p-4"
      style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col items-center rounded-lg px-2 py-3" style={{ backgroundColor: 'var(--theme-bg)' }}>
          <span className="font-mono text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>{streak.currentStreak}</span>
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-sub)' }}>
            <Flame className="h-3 w-3" style={{ color: streak.currentStreak > 0 ? 'var(--theme-accent)' : 'var(--theme-sub)' }} />
            Day Streak
          </span>
        </div>
        <div className="flex flex-col items-center rounded-lg px-2 py-3" style={{ backgroundColor: 'var(--theme-bg)' }}>
          <span className="font-mono text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>{streak.longestStreak}</span>
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-sub)' }}>
            <Target className="h-3 w-3" style={{ color: 'var(--theme-sub)' }} />
            Best Streak
          </span>
        </div>
        <div className="flex flex-col items-center rounded-lg px-2 py-3" style={{ backgroundColor: 'var(--theme-bg)' }}>
          <span className="font-mono text-2xl font-bold" style={{ color: 'var(--theme-accent)' }}>
            {((streak.streakMultiplier - 1) * 100).toFixed(0)}%
          </span>
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-sub)' }}>
            <Zap className="h-3 w-3" style={{ color: 'var(--theme-accent)' }} />
            XP Bonus
          </span>
        </div>
        <div className="flex flex-col items-center rounded-lg px-2 py-3" style={{ backgroundColor: 'var(--theme-bg)' }}>
          <span className="font-mono text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
            {getLevelTitle(xpData.level, prestige.stars).split(' ')[0]}
          </span>
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-sub)' }}>
            {prestige.stars > 0 ? <Star className="h-3 w-3" style={{ color: 'var(--theme-accent)' }} /> : <Gamepad2 className="h-3 w-3" style={{ color: 'var(--theme-sub)' }} />}
            {prestige.stars > 0 ? `${prestige.stars} Star${prestige.stars > 1 ? 's' : ''}` : 'Title'}
          </span>
        </div>
      </div>
      <div className="mt-2 text-center text-[10px]" style={{ color: 'var(--theme-sub)' }}>
        Solve at least 5 times daily to maintain your streak
      </div>
    </div>
  )
}

function getActivityData(solves: Solve[]): Map<string, number> {
  const activityMap = new Map<string, number>()

  for (const solve of solves) {
    const date = new Date(solve.date).toISOString().split('T')[0]
    activityMap.set(date, (activityMap.get(date) || 0) + 1)
  }

  return activityMap
}

function ActivityCalendar({ solves }: { solves: Solve[] }) {
  const activityData = useMemo(() => getActivityData(solves), [solves])
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, date: '', count: 0 })

  const weeks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const startDate = new Date(today)
    startDate.setFullYear(startDate.getFullYear() - 1)
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)
    
    const weeksArray: { date: Date; count: number; future: boolean }[][] = []
    
    let currentDate = new Date(startDate)
    
    while (currentDate <= today || weeksArray.length < 53) {
      const week: { date: Date; count: number; future: boolean }[] = []
      
      for (let day = 0; day < 7; day++) {
        const date = new Date(currentDate)
        date.setDate(currentDate.getDate() + day)
        
        const isFuture = date > today
        const dateStr = date.toISOString().split('T')[0]
        const count = isFuture ? 0 : (activityData.get(dateStr) || 0)
        
        week.push({ date, count, future: isFuture })
      }
      
      weeksArray.push(week)
      currentDate.setDate(currentDate.getDate() + 7)
      
      if (weeksArray.length >= 53) break
    }
    
    return weeksArray
  }, [activityData])

  const getOpacity = (count: number) => {
    if (count === 0) return 0.15
    if (count <= 3) return 0.4
    if (count <= 10) return 0.6
    if (count <= 25) return 0.8
    return 1
  }

  const totalSolves = solves.length
  const activeDays = activityData.size

  return (
    <div
      className="rounded-xl p-3 sm:p-4"
      style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm lowercase" style={{ color: 'var(--theme-sub)' }}>
            last 12 months
          </span>
          <span className="text-xs sm:text-sm" style={{ color: 'var(--theme-text)' }}>
            {totalSolves} solves
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--theme-sub)' }}>
          <span className="lowercase">less</span>
          {[0, 3, 10, 25, 50].map((level) => (
            <div
              key={level}
              className="w-[10px] h-[10px] sm:w-[11px] sm:h-[11px] rounded-sm"
              style={{
                backgroundColor: level === 0 ? 'var(--theme-subAlt)' : 'var(--theme-accent)',
                opacity: getOpacity(level),
              }}
            />
          ))}
          <span className="lowercase">more</span>
        </div>
      </div>

      <div className="overflow-visible p-1">
        <div className="flex gap-1">
          <div className="hidden sm:flex flex-col text-xs lowercase pr-2 shrink-0" style={{ color: 'var(--theme-sub)', gap: '4px' }}>
            <div className="flex-1 flex items-center justify-end">sun</div>
            <div className="flex-1"></div>
            <div className="flex-1 flex items-center justify-end">tue</div>
            <div className="flex-1"></div>
            <div className="flex-1 flex items-center justify-end">thu</div>
            <div className="flex-1"></div>
            <div className="flex-1 flex items-center justify-end">sat</div>
          </div>
          
          <div className="flex-1 overflow-visible">
            <div 
              className="grid w-full"
              style={{ 
                gridTemplateColumns: `repeat(53, 1fr)`,
                gap: '4px',
              }}
            >
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col" style={{ gap: '4px' }}>
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="w-full aspect-square rounded-[3px] transition-all cursor-pointer"
                      style={{
                        backgroundColor: day.future 
                          ? 'transparent' 
                          : day.count === 0 
                            ? 'var(--theme-subAlt)' 
                            : 'var(--theme-accent)',
                        opacity: day.future ? 0 : getOpacity(day.count),
                        outline: 'none',
                        boxShadow: 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (day.future) return
                        e.currentTarget.style.outline = '2px solid var(--theme-accent)'
                        e.currentTarget.style.outlineOffset = '1px'
                        const rect = e.currentTarget.getBoundingClientRect()
                        setTooltip({
                          visible: true,
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                          date: day.date.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          }),
                          count: day.count,
                        })
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.outline = 'none'
                        e.currentTarget.style.outlineOffset = '0'
                        setTooltip(prev => ({ ...prev, visible: false }))
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div 
          className="mt-2 text-[10px] sm:text-xs text-center lowercase"
          style={{ color: 'var(--theme-sub)' }}
        >
          {activeDays > 0 && `active ${activeDays} day${activeDays !== 1 ? 's' : ''} this year`}
        </div>
      </div>

      <CalendarTooltip tooltip={tooltip} />
    </div>
  )
}

function ProfileHeader() {
  const { user } = useAuth()
  const { getXPData, loading: xpLoading } = useExperience()
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName || 'Guest')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const xpData = getXPData()

  const handleSave = async () => {
    if (!user || !displayName.trim()) return
    
    setIsSaving(true)
    try {
      await updateProfile(user, { displayName: displayName.trim() })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update display name:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setDisplayName(user?.displayName || 'Guest')
    setIsEditing(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !storage || isOfflineMode) return

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      console.error('Invalid file type')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      console.error('File too large (max 5MB)')
      return
    }

    setIsUploadingPhoto(true)
    try {
      const storageRef = ref(storage, `profile-photos/${user.uid}`)
      await uploadBytes(storageRef, file)
      const photoURL = await getDownloadURL(storageRef)
      await updateProfile(user, { photoURL })
      window.location.reload()
    } catch (error) {
      console.error('Failed to upload photo:', error)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-4"
      style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold"
              style={{
                backgroundColor: 'var(--theme-accent)',
                color: 'var(--theme-bg)',
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          {user && !isOfflineMode && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:opacity-80 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: 'var(--theme-bg)',
                }}
              >
                {isUploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </>
          )}
        </div>

        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded-lg px-3 py-1.5 text-lg font-semibold"
                style={{
                  backgroundColor: 'var(--theme-subAlt)',
                  color: 'var(--theme-text)',
                  border: '1px solid var(--theme-accent)',
                }}
                autoFocus
                disabled={isSaving}
              />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg p-1.5 transition-colors hover:opacity-80 disabled:opacity-50"
                style={{ color: 'var(--theme-accent)' }}
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="rounded-lg p-1.5 transition-colors hover:opacity-80 disabled:opacity-50"
                style={{ color: 'var(--theme-error)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2
                className="text-xl font-semibold"
                style={{ color: 'var(--theme-text)' }}
              >
                {displayName}
              </h2>
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg p-1 transition-colors hover:opacity-80"
                style={{ color: 'var(--theme-sub)' }}
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="text-sm" style={{ color: 'var(--theme-sub)' }}>
            {user?.email || 'Not signed in'}
          </p>
        </div>

        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold"
          style={{
            backgroundColor: 'var(--theme-accent)',
            color: 'var(--theme-bg)',
          }}
        >
          {xpLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : xpData.level}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--theme-sub)' }}>
            Level {xpLoading ? '-' : xpData.level}
          </span>
          <span style={{ color: 'var(--theme-sub)' }}>
            {xpLoading ? '-' : xpData.currentXP} / {xpLoading ? '-' : xpData.xpForNextLevel} XP
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: 'var(--theme-subAlt)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              backgroundColor: 'var(--theme-accent)',
              width: xpLoading ? '0%' : `${Math.min(xpData.progress * 100, 100)}%`,
            }}
          />
        </div>
        <div
          className="text-right text-[10px]"
          style={{ color: 'var(--theme-sub)' }}
        >
          Total: {xpLoading ? '-' : xpData.totalXP} XP
        </div>
      </div>
    </div>
  )
}

export function AccountPage({ solves, onDeleteSolve, onViewSolveDetails }: AccountPageProps) {
  const stats = useMemo(() => calculateStats(solves), [solves])

  return (
    <div className="mx-auto w-full max-w-7xl overflow-y-auto px-4 py-4 md:px-8 pb-8">
      <h2 className="mb-4 text-lg sm:text-xl font-semibold" style={{ color: 'var(--theme-text)' }}>
        Account
      </h2>

      <div className="space-y-3 sm:space-y-4">
        <ProfileHeader />

        <StreakWidget />

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 sm:grid-cols-3 md:grid-cols-6">
          <StatCard label="PB" value={stats.best ? formatTime(stats.best) : null} highlight />
          <StatCard label="ao5" value={stats.ao5 ? formatTime(stats.ao5) : null} />
          <StatCard label="ao12" value={stats.ao12 ? formatTime(stats.ao12) : null} />
          <StatCard label="ao50" value={stats.ao50 ? formatTime(stats.ao50) : null} />
          <StatCard label="ao100" value={stats.ao100 ? formatTime(stats.ao100) : null} />
          <StatCard label="Mean" value={stats.mean ? formatTime(stats.mean) : null} />
        </div>

        <CFOPStatsWidget solves={solves} />

        <ActivityCalendar solves={solves} />

        <SolveChart solves={solves} />

        <div
          className="rounded-xl p-3 sm:p-4"
          style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
        >
          <h3
            className="mb-3 sm:mb-4 text-xs sm:text-sm font-medium uppercase tracking-wider"
            style={{ color: 'var(--theme-sub)' }}
          >
            Solve History ({stats.count} total)
          </h3>
          <SolvesList
            solves={solves}
            onDelete={onDeleteSolve}
            onViewDetails={onViewSolveDetails}
            hideStats
          />
        </div>
      </div>
    </div>
  )
}
