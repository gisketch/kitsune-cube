import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
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
  X,
  Menu,
  Trophy,
  Users,
  LogIn,
  LogOut,
  Cloud,
  CloudOff,
} from 'lucide-react'
import { ProfileMenu } from '@/components/profile-menu'
import { useAuth } from '@/contexts/AuthContext'

interface HeaderProps {
  onNavigate: (page: 'timer' | 'account' | 'achievements' | 'leaderboard' | 'simulator' | 'settings') => void
  isConnected: boolean
  isConnecting: boolean
  onConnect: () => void
  onDisconnect: () => void
  batteryLevel: number | null
  onCalibrate?: () => void
  isCloudSync?: boolean
}

const menuItems = [
  { id: 'timer' as const, label: 'Timer', icon: RotateCcw },
  { id: 'account' as const, label: 'Account', icon: UserCircle },
  { id: 'achievements' as const, label: 'Achievements', icon: Trophy },
  { id: 'leaderboard' as const, label: 'Leaderboard', icon: Users },
  { id: 'simulator' as const, label: 'Simulator', icon: FlaskConical },
  { id: 'settings' as const, label: 'Settings', icon: Settings },
]

export function Header({
  onNavigate,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
  batteryLevel,
  onCalibrate,
  isCloudSync,
}: HeaderProps) {
  const { user, signInWithGoogle, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const getBatteryIcon = () => {
    if (batteryLevel === null) return Battery
    if (batteryLevel <= 10) return BatteryWarning
    if (batteryLevel <= 30) return BatteryLow
    if (batteryLevel <= 70) return BatteryMedium
    return BatteryFull
  }

  const BatteryIcon = getBatteryIcon()

  const handleMobileNavigate = (page: 'timer' | 'account' | 'achievements' | 'leaderboard' | 'simulator' | 'settings') => {
    onNavigate(page)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4">
        <button
          onClick={() => onNavigate('timer')}
          className="hidden items-center gap-2 text-xl font-semibold transition-colors md:flex"
          style={{ color: 'var(--theme-accent)' }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--theme-accent)' }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              style={{ fill: 'var(--theme-bg)' }}
            >
              <path d="M80 40 L95 5 L55 40 Z" />
              <path d="M20 40 L5 5 L45 40 Z" />
              <path d="M50 95 L20 40 L80 40 Z" />
            </svg>
          </div>
          <span>Kitsune Cube</span>
        </button>

        <button
          onClick={() => onNavigate('timer')}
          className="flex items-center gap-2 md:hidden"
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ backgroundColor: 'var(--theme-accent)' }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              style={{ fill: 'var(--theme-bg)' }}
            >
              <path d="M80 40 L95 5 L55 40 Z" />
              <path d="M20 40 L5 5 L45 40 Z" />
              <path d="M50 95 L20 40 L80 40 Z" />
            </svg>
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--theme-accent)' }}
          >
            Kitsune Cube
          </span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center gap-1 text-sm transition-colors md:hidden"
          style={{ color: 'var(--theme-text)' }}
        >
          <Menu className="h-5 w-5" style={{ color: 'var(--theme-sub)' }} />
        </button>

        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => onNavigate('leaderboard')}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-80"
            style={{ backgroundColor: 'var(--theme-subAlt)' }}
            title="Leaderboard"
          >
            <Users className="h-4 w-4" style={{ color: 'var(--theme-text)', fill: 'var(--theme-text)' }} />
          </button>
          <button
            onClick={() => onNavigate('achievements')}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-80"
            style={{ backgroundColor: 'var(--theme-subAlt)' }}
            title="Achievements"
          >
            <Trophy className="h-4 w-4" style={{ color: 'var(--theme-text)', fill: 'var(--theme-text)' }} />
          </button>
          <ProfileMenu
            isCloudSync={isCloudSync}
            onNavigate={onNavigate}
            isConnected={isConnected}
            isConnecting={isConnecting}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
            batteryLevel={batteryLevel}
            onCalibrate={onCalibrate}
          />
        </div>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col md:hidden"
            style={{ backgroundColor: 'var(--theme-bg)' }}
          >
            <div className="flex items-center justify-between px-4 py-3">
              {user ? (
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="h-8 w-8 rounded-full" />
                  ) : (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                      style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-bg)' }}
                    >
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                      {user.displayName?.split(' ')[0] || 'Account'}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--theme-sub)' }}>
                      {isCloudSync ? (
                        <><Cloud className="h-3 w-3" style={{ color: 'var(--theme-accent)' }} /> Cloud sync</>
                      ) : (
                        <><CloudOff className="h-3 w-3" /> Local only</>
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { signInWithGoogle(); setIsMobileMenuOpen(false) }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                  style={{ backgroundColor: 'var(--theme-subAlt)', color: 'var(--theme-text)' }}
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign in</span>
                </button>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-2"
                style={{ color: 'var(--theme-sub)' }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
              <div
                className="mb-2 text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--theme-sub)' }}
              >
                Navigation
              </div>
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMobileNavigate(item.id)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors"
                  style={{
                    color: 'var(--theme-text)',
                    backgroundColor: 'var(--theme-bgSecondary)',
                  }}
                >
                  <item.icon className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="my-2 h-px" style={{ backgroundColor: 'var(--theme-subAlt)' }} />

              <div
                className="mb-2 text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--theme-sub)' }}
              >
                Smart Cube
              </div>
              <button
                onClick={() => {
                  isConnected ? onDisconnect() : onConnect()
                  setIsMobileMenuOpen(false)
                }}
                disabled={isConnecting}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors"
                style={{
                  color: isConnected ? '#4ade80' : 'var(--theme-text)',
                  backgroundColor: 'var(--theme-bgSecondary)',
                }}
              >
                <Bluetooth className={`h-4 w-4 ${isConnecting ? 'animate-pulse' : ''}`} />
                <span>
                  {isConnected ? 'Disconnect' : isConnecting ? 'Connecting...' : 'Connect Cube'}
                </span>
              </button>

              {isConnected && batteryLevel !== null && (
                <div
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm"
                  style={{
                    color: batteryLevel <= 20 ? 'var(--theme-error)' : 'var(--theme-sub)',
                    backgroundColor: 'var(--theme-bgSecondary)',
                  }}
                >
                  <BatteryIcon className="h-4 w-4" />
                  <span>Battery: {batteryLevel}%</span>
                </div>
              )}

              {isConnected && onCalibrate && (
                <button
                  onClick={() => {
                    onCalibrate()
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors"
                  style={{
                    color: 'var(--theme-text)',
                    backgroundColor: 'var(--theme-bgSecondary)',
                  }}
                >
                  <RotateCcw className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
                  <span>Calibrate Cube</span>
                </button>
              )}

              {user && (
                <>
                  <div className="my-2 h-px" style={{ backgroundColor: 'var(--theme-subAlt)' }} />
                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false) }}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors"
                    style={{
                      color: 'var(--theme-error)',
                      backgroundColor: 'var(--theme-bgSecondary)',
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
