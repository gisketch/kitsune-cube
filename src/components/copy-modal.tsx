import { X, Copy, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CopyModalProps {
  isOpen: boolean
  onClose: () => void
  onCopySolution: () => void
  onCopyScramble: () => void
}

export function CopyModal({ isOpen, onClose, onCopySolution, onCopyScramble }: CopyModalProps) {
  if (!isOpen) return null

  const handleCopySolution = () => {
    onCopySolution()
    onClose()
  }

  const handleCopyScramble = () => {
    onCopyScramble()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xs rounded-xl p-5"
        style={{ backgroundColor: 'var(--theme-bg)', border: '1px solid var(--theme-subAlt)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 transition-colors hover:opacity-80"
          style={{ color: 'var(--theme-sub)' }}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col">
          <h2 className="mb-4 text-base font-semibold" style={{ color: 'var(--theme-text)' }}>
            Copy to Clipboard
          </h2>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleCopySolution}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors"
              style={{ 
                backgroundColor: 'var(--theme-accent)', 
                color: 'var(--theme-bg)' 
              }}
            >
              <Copy className="h-4 w-4" />
              Copy Solution
            </Button>
            <Button
              onClick={handleCopyScramble}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors"
              style={{ 
                backgroundColor: 'var(--theme-subAlt)', 
                color: 'var(--theme-text)' 
              }}
            >
              <Shuffle className="h-4 w-4" />
              Copy Scramble
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
