import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, LogOut, Cloud, CloudOff, Loader2, WifiOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthModal } from '@/components/auth-modal'

interface AuthButtonProps {
  isCloudSync?: boolean
}

export function AuthButton({ isCloudSync }: AuthButtonProps) {
  const { user, loading, isOffline, logout } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

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

  if (isOffline) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
        style={{
          backgroundColor: 'var(--theme-subAlt)',
          color: 'var(--theme-sub)',
        }}
      >
        <WifiOff className="h-4 w-4" />
        <span className="hidden sm:inline">Offline Mode</span>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:scale-105"
          style={{
            backgroundColor: 'var(--theme-subAlt)',
            color: 'var(--theme-text)',
          }}
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Sign in</span>
        </button>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all hover:scale-105"
        style={{ backgroundColor: 'var(--theme-subAlt)' }}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="h-7 w-7 rounded-full"
          />
        ) : (
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
            style={{
              backgroundColor: 'var(--theme-accent)',
              color: 'var(--theme-bg)',
            }}
          >
            {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>
        )}
        {isCloudSync ? (
          <Cloud
            className="h-3.5 w-3.5"
            style={{ color: 'var(--theme-accent)' }}
          />
        ) : (
          <CloudOff className="h-3.5 w-3.5" style={{ color: 'var(--theme-sub)' }} />
        )}
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 z-50 mt-2 w-56 origin-top-left rounded-lg p-1 shadow-xl"
              style={{
                backgroundColor: 'var(--theme-bgSecondary)',
                border: '1px solid var(--theme-subAlt)',
              }}
            >
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
              </div>

              <div className="py-1">
                <div
                  className="flex items-center gap-2 px-3 py-2"
                  style={{ color: 'var(--theme-sub)' }}
                >
                  {isCloudSync ? (
                    <>
                      <Cloud className="h-4 w-4" style={{ color: 'var(--theme-accent)' }} />
                      <span className="text-xs">Cloud sync enabled</span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="h-4 w-4" />
                      <span className="text-xs">Local storage only</span>
                    </>
                  )}
                </div>
              </div>

              <div
                className="border-t pt-1"
                style={{ borderColor: 'var(--theme-subAlt)' }}
              >
                <button
                  onClick={() => {
                    logout()
                    setIsDropdownOpen(false)
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:opacity-80"
                  style={{ color: 'var(--theme-error)' }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
