import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Box, Bluetooth, History, Settings, Search } from 'lucide-react'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onResetGyro: () => void
  onResetCube: () => void
  onConnectCube: () => void
  onNavigate: (page: 'timer' | 'account' | 'simulator' | 'settings') => void
  isConnected: boolean
}

interface Command {
  id: string
  label: string
  icon: typeof RotateCcw
  action: () => void
  keywords: string[]
}

export function CommandPalette({
  isOpen,
  onClose,
  onResetGyro,
  onResetCube,
  onConnectCube,
  onNavigate,
  isConnected,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands: Command[] = [
    {
      id: 'reset-gyro',
      label: 'Reset Gyro',
      icon: RotateCcw,
      action: () => {
        onResetGyro()
        onClose()
      },
      keywords: ['gyro', 'calibrate', 'orientation'],
    },
    {
      id: 'reset-cube',
      label: 'Reset Cube',
      icon: Box,
      action: () => {
        onResetCube()
        onClose()
      },
      keywords: ['cube', 'sync', 'calibrate', 'solved'],
    },
    {
      id: 'connect-cube',
      label: isConnected ? 'Disconnect Cube' : 'Connect Cube',
      icon: Bluetooth,
      action: () => {
        onConnectCube()
        onClose()
      },
      keywords: ['bluetooth', 'gan', 'smart cube', 'connect', 'disconnect'],
    },
    {
      id: 'solve-history',
      label: 'Account & Solve History',
      icon: History,
      action: () => {
        onNavigate('account')
        onClose()
      },
      keywords: ['solves', 'times', 'history', 'records', 'account', 'profile'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: () => {
        onNavigate('settings')
        onClose()
      },
      keywords: ['settings', 'preferences', 'options', 'theme'],
    },
  ]

  const filteredCommands = query
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(query.toLowerCase()) ||
          cmd.keywords.some((kw) => kw.toLowerCase().includes(query.toLowerCase())),
      )
    : commands

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [filteredCommands, selectedIndex, onClose],
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={onClose}
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-auto h-full w-full overflow-hidden shadow-2xl md:h-auto md:max-w-lg md:rounded-lg"
              style={{
                backgroundColor: 'var(--theme-bgSecondary)',
                border: '1px solid var(--theme-subAlt)',
              }}
            >
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid var(--theme-subAlt)' }}
              >
                <Search className="h-5 w-5" style={{ color: 'var(--theme-sub)' }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command..."
                  className="flex-1 bg-transparent text-base outline-none"
                  style={{ color: 'var(--theme-text)' }}
                />
              </div>

              <div className="max-h-80 overflow-y-auto py-2">
                {filteredCommands.length === 0 ? (
                  <div
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: 'var(--theme-sub)' }}
                  >
                    No commands found
                  </div>
                ) : (
                  filteredCommands.map((cmd, index) => {
                    const Icon = cmd.icon
                    const isSelected = index === selectedIndex
                    return (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
                        style={{
                          backgroundColor: isSelected ? 'var(--theme-subAlt)' : 'transparent',
                          color: 'var(--theme-text)',
                        }}
                      >
                        <Icon
                          className="h-4 w-4"
                          style={{ color: isSelected ? 'var(--theme-accent)' : 'var(--theme-sub)' }}
                        />
                        <span>{cmd.label}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
