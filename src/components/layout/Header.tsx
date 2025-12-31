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
} from 'lucide-react'
import { ProfileMenu } from '@/components/profile-menu'
import { AuthButton } from '@/components/auth-button'

interface HeaderProps {
  onNavigate: (page: 'timer' | 'account' | 'simulator' | 'settings') => void
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

  const handleMobileNavigate = (page: 'timer' | 'account' | 'simulator' | 'settings') => {
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
            style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-bg)' }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M12 2L4 8v2c0 1.1.4 2.1 1 3l-1 4c-.2.8.1 1.6.7 2.1.6.5 1.4.7 2.1.4L9 18.5c.9.3 1.9.5 3 .5s2.1-.2 3-.5l2.2 1c.7.3 1.5.1 2.1-.4.6-.5.9-1.3.7-2.1l-1-4c.6-.9 1-1.9 1-3V8l-8-6zm-4 8.5c-.8 0-1.5-.7-1.5-1.5S7.2 7.5 8 7.5s1.5.7 1.5 1.5S8.8 10.5 8 10.5zm8 0c-.8 0-1.5-.7-1.5-1.5S15.2 7.5 16 7.5s1.5.7 1.5 1.5-0.7 1.5-1.5 1.5zm-4 5c-1.1 0-2-.4-2.5-1h5c-.5.6-1.4 1-2.5 1z"/>
            </svg>
          </div>
          <span>kitsunecube</span>
        </button>

        <button
          onClick={() => onNavigate('timer')}
          className="flex items-center gap-2 md:hidden"
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md"
            style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-bg)' }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 2L4 8v2c0 1.1.4 2.1 1 3l-1 4c-.2.8.1 1.6.7 2.1.6.5 1.4.7 2.1.4L9 18.5c.9.3 1.9.5 3 .5s2.1-.2 3-.5l2.2 1c.7.3 1.5.1 2.1-.4.6-.5.9-1.3.7-2.1l-1-4c.6-.9 1-1.9 1-3V8l-8-6zm-4 8.5c-.8 0-1.5-.7-1.5-1.5S7.2 7.5 8 7.5s1.5.7 1.5 1.5S8.8 10.5 8 10.5zm8 0c-.8 0-1.5-.7-1.5-1.5S15.2 7.5 16 7.5s1.5.7 1.5 1.5-0.7 1.5-1.5 1.5zm-4 5c-1.1 0-2-.4-2.5-1h5c-.5.6-1.4 1-2.5 1z"/>
            </svg>
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--theme-accent)' }}
          >
            kitsunecube
          </span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center gap-1 text-sm transition-colors md:hidden"
          style={{ color: 'var(--theme-text)' }}
        >
          <Menu className="h-5 w-5" style={{ color: 'var(--theme-sub)' }} />
        </button>

        <div className="hidden md:block">
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
              <AuthButton isCloudSync={isCloudSync} />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-2"
                style={{ color: 'var(--theme-sub)' }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 px-4 py-6">
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
                  className="flex items-center gap-4 rounded-lg px-4 py-4 text-lg transition-colors"
                  style={{
                    color: 'var(--theme-text)',
                    backgroundColor: 'var(--theme-bgSecondary)',
                  }}
                >
                  <item.icon className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="my-4 h-px" style={{ backgroundColor: 'var(--theme-subAlt)' }} />

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
                className="flex items-center gap-4 rounded-lg px-4 py-4 text-lg transition-colors"
                style={{
                  color: isConnected ? '#4ade80' : 'var(--theme-text)',
                  backgroundColor: 'var(--theme-bgSecondary)',
                }}
              >
                <Bluetooth className={`h-5 w-5 ${isConnecting ? 'animate-pulse' : ''}`} />
                <span>
                  {isConnected ? 'Disconnect' : isConnecting ? 'Connecting...' : 'Connect Cube'}
                </span>
              </button>

              {isConnected && batteryLevel !== null && (
                <div
                  className="flex items-center gap-4 rounded-lg px-4 py-4 text-lg"
                  style={{
                    color: batteryLevel <= 20 ? 'var(--theme-error)' : 'var(--theme-sub)',
                    backgroundColor: 'var(--theme-bgSecondary)',
                  }}
                >
                  <BatteryIcon className="h-5 w-5" />
                  <span>Battery: {batteryLevel}%</span>
                </div>
              )}

              {isConnected && onCalibrate && (
                <button
                  onClick={() => {
                    onCalibrate()
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex items-center gap-4 rounded-lg px-4 py-4 text-lg transition-colors"
                  style={{
                    color: 'var(--theme-text)',
                    backgroundColor: 'var(--theme-bgSecondary)',
                  }}
                >
                  <RotateCcw className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                  <span>Calibrate Cube</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
