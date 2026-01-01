import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogIn,
  LogOut,
  Cloud,
  CloudOff,
  Loader2,
  ChevronDown,
  User,
  Settings,
  FlaskConical,
  UserCircle,
  Bluetooth,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  BatteryWarning,
  RotateCcw,
  Trophy,
  Users,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useExperience } from '@/contexts/ExperienceContext'

interface ProfileMenuProps {
  isCloudSync?: boolean
  onNavigate: (page: 'timer' | 'account' | 'achievements' | 'leaderboard' | 'simulator' | 'settings') => void
  isConnected: boolean
  isConnecting: boolean
  onConnect: () => void
  onDisconnect: () => void
  batteryLevel: number | null
  onCalibrate?: () => void
}

const menuItems = [
  { id: 'account' as const, label: 'Account', icon: UserCircle },
  { id: 'achievements' as const, label: 'Achievements', icon: Trophy },
  { id: 'leaderboard' as const, label: 'Leaderboard', icon: Users },
  { id: 'simulator' as const, label: 'Simulator', icon: FlaskConical },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
]

export function ProfileMenu({
  isCloudSync,
  onNavigate,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
  batteryLevel,
  onCalibrate,
}: ProfileMenuProps) {
  const { user, loading, signInWithGoogle, logout } = useAuth()
  const { getXPData, loading: xpLoading, recentXPGain, clearRecentXPGain } = useExperience()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showXPNotification, setShowXPNotification] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const xpData = getXPData()

  useEffect(() => {
    if (recentXPGain && recentXPGain > 0) {
      setShowXPNotification(true)
      const timer = setTimeout(() => {
        setShowXPNotification(false)
        clearRecentXPGain()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [recentXPGain, clearRecentXPGain])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getBatteryIcon = () => {
    if (batteryLevel === null) return Battery
    if (batteryLevel <= 10) return BatteryWarning
    if (batteryLevel <= 30) return BatteryLow
    if (batteryLevel <= 70) return BatteryMedium
    return BatteryFull
  }

  const BatteryIcon = getBatteryIcon()

  if (loading) {
    return (
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: 'var(--theme-subAlt)' }}
      >
        <Loader2
          className="h-4 w-4 animate-spin"
          style={{ color: 'var(--theme-sub)' }}
        />
      </div>
    )
  }

  return (
    <div
      className="relative pb-2"
      ref={dropdownRef}
      onMouseEnter={() => setIsDropdownOpen(true)}
      onMouseLeave={() => setIsDropdownOpen(false)}
    >
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-base transition-colors"
          style={{ color: 'var(--theme-text)' }}
        >
          {user ? (
            user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: 'var(--theme-bg)',
                }}
              >
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
            )
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--theme-subAlt)' }}
            >
              <User className="h-4 w-4" />
            </div>
          )}
          <span className="hidden sm:inline">
            {user ? user.displayName?.split(' ')[0] || 'Account' : 'Guest'}
          </span>
          <span
            className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold"
            style={{
              backgroundColor: 'var(--theme-accent)',
              color: 'var(--theme-bg)',
            }}
          >
            {xpLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              xpData.level
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <div className="w-full px-3">
          <div
            className="h-1 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: 'var(--theme-subAlt)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                backgroundColor: 'var(--theme-accent)',
                width: xpLoading ? '0%' : `${Math.min(xpData.progress * 100, 100)}%`,
              }}
            />
          </div>
        </div>
        <AnimatePresence>
          {showXPNotification && recentXPGain && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 4 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              className="absolute right-3 top-full text-xs font-bold"
              style={{ color: 'var(--theme-accent)' }}
            >
              +{recentXPGain} XP
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-full z-50 w-56 rounded-lg py-1 shadow-lg"
            style={{
              backgroundColor: 'var(--theme-bgSecondary)',
              border: '1px solid var(--theme-subAlt)',
            }}
          >
            {user && (
              <>
                <div
                  className="border-b px-3 py-2"
                  style={{ borderColor: 'var(--theme-subAlt)' }}
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--theme-text)' }}
                  >
                    {user.displayName}
                  </p>
                  <p
                    className="truncate text-xs"
                    style={{ color: 'var(--theme-sub)' }}
                  >
                    {user.email}
                  </p>
                  <div
                    className="mt-1 flex items-center gap-1"
                    style={{ color: 'var(--theme-sub)' }}
                  >
                    {isCloudSync ? (
                      <>
                        <Cloud className="h-3 w-3" style={{ color: 'var(--theme-accent)' }} />
                        <span className="text-xs">Cloud sync</span>
                      </>
                    ) : (
                      <>
                        <CloudOff className="h-3 w-3" />
                        <span className="text-xs">Local only</span>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {!user && (
              <>
                <button
                  onClick={() => {
                    signInWithGoogle()
                    setIsDropdownOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:opacity-80"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign in with Google</span>
                </button>
                <div className="my-1 h-px" style={{ backgroundColor: 'var(--theme-subAlt)' }} />
              </>
            )}

            <div
              className="px-3 py-2 text-xs font-medium uppercase"
              style={{ color: 'var(--theme-sub)' }}
            >
              Smart Cube
            </div>

            <button
              onClick={() => {
                isConnected ? onDisconnect() : onConnect()
                setIsDropdownOpen(false)
              }}
              disabled={isConnecting}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:opacity-80"
              style={{ color: isConnected ? '#4ade80' : 'var(--theme-text)' }}
            >
              <Bluetooth className={`h-4 w-4 ${isConnecting ? 'animate-pulse' : ''}`} />
              <span>
                {isConnected ? 'Disconnect' : isConnecting ? 'Connecting...' : 'Connect Cube'}
              </span>
            </button>

            {isConnected && batteryLevel !== null && (
              <div
                className="flex items-center gap-2 px-3 py-2 text-sm"
                style={{ color: batteryLevel <= 20 ? 'var(--theme-error)' : 'var(--theme-sub)' }}
              >
                <BatteryIcon className="h-4 w-4" />
                <span>{batteryLevel}%</span>
              </div>
            )}

            {isConnected && onCalibrate && (
              <button
                onClick={() => {
                  onCalibrate()
                  setIsDropdownOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:opacity-80"
                style={{ color: 'var(--theme-text)' }}
              >
                <RotateCcw className="h-4 w-4" />
                <span>Calibrate Cube</span>
              </button>
            )}

            <div className="my-1 h-px" style={{ backgroundColor: 'var(--theme-subAlt)' }} />

            <div
              className="px-3 py-2 text-xs font-medium uppercase"
              style={{ color: 'var(--theme-sub)' }}
            >
              Navigation
            </div>

            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id)
                  setIsDropdownOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:opacity-80"
                style={{ color: 'var(--theme-text)' }}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}

            {user && (
              <>
                <div className="my-1 h-px" style={{ backgroundColor: 'var(--theme-subAlt)' }} />

                <button
                  onClick={() => {
                    logout()
                    setIsDropdownOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:opacity-80"
                  style={{ color: 'var(--theme-error)' }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
