import { createContext, useContext, useState, useCallback, type ReactNode, type ComponentType, type SVGProps } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

const TOAST_DURATION = 3000

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>

const iconMap: Record<ToastType, IconComponent> = {
  success: Check,
  error: AlertCircle,
  info: Info,
}

const colorMap: Record<ToastType, string> = {
  success: 'bg-green-500/20 border-green-500/50 text-green-400',
  error: 'bg-red-500/20 border-red-500/50 text-red-400',
  info: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, TOAST_DURATION)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:bottom-4 sm:right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => {
            const Icon = iconMap[toast.type]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg border backdrop-blur-md shadow-lg ${colorMap[toast.type]}`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="text-xs sm:text-sm font-medium flex-1">{toast.message}</span>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-0.5 sm:p-1 rounded hover:bg-white/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
