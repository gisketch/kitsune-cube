import { useMemo, useState } from 'react'
import { Edit2, Check, X } from 'lucide-react'
import type { Solve } from '@/hooks/useSolves'
import { useAuth } from '@/contexts/AuthContext'
import { SolvesList } from '@/components/solves-list'

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
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName || 'Guest')

  const handleSave = () => {
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDisplayName(user?.displayName || 'Guest')
    setIsEditing(false)
  }

  return (
    <div
      className="flex items-center gap-4 rounded-xl p-4"
      style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
    >
      {user?.photoURL ? (
        <img
          src={user.photoURL}
          alt={user.displayName || 'User'}
          className="h-16 w-16 rounded-full"
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
            />
            <button
              onClick={handleSave}
              className="rounded-lg p-1.5 transition-colors hover:opacity-80"
              style={{ color: 'var(--theme-accent)' }}
            >
              <Check className="h-5 w-5" />
            </button>
            <button
              onClick={handleCancel}
              className="rounded-lg p-1.5 transition-colors hover:opacity-80"
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

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 sm:grid-cols-3 md:grid-cols-6">
          <StatCard label="PB" value={stats.best ? formatTime(stats.best) : null} highlight />
          <StatCard label="ao5" value={stats.ao5 ? formatTime(stats.ao5) : null} />
          <StatCard label="ao12" value={stats.ao12 ? formatTime(stats.ao12) : null} />
          <StatCard label="ao50" value={stats.ao50 ? formatTime(stats.ao50) : null} />
          <StatCard label="ao100" value={stats.ao100 ? formatTime(stats.ao100) : null} />
          <StatCard label="Mean" value={stats.mean ? formatTime(stats.mean) : null} />
        </div>

        <ActivityCalendar solves={solves} />

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
