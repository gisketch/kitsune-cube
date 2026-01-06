import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, ExternalLink, MessageCircle } from 'lucide-react'
import { getVersionWithDate } from '@/lib/version'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl shadow-2xl md:max-h-[85vh] md:max-w-lg md:rounded-2xl"
            style={{
              backgroundColor: 'var(--theme-bg)',
              border: '1px solid var(--theme-subAlt)',
            }}
          >
            <div
              className="flex items-center justify-between border-b px-4 py-3 md:px-6 md:py-4"
              style={{ borderColor: 'var(--theme-subAlt)' }}
            >
              <div className="flex items-center gap-2 md:gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg md:h-10 md:w-10 md:rounded-xl"
                  style={{ backgroundColor: 'var(--theme-accent)' }}
                >
                  <svg
                    className="h-5 w-5 md:h-6 md:w-6"
                    viewBox="0 0 100 100"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M25 42 L35 22 L45 42 Z" style={{ fill: 'var(--theme-bg)' }} />
                    <path d="M55 42 L65 22 L75 42 Z" style={{ fill: 'var(--theme-bg)' }} />
                    <path d="M25 42 H75 V65 L50 90 L25 65 Z" style={{ fill: 'var(--theme-bg)' }} />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold md:text-lg" style={{ color: 'var(--theme-text)' }}>
                    Kitsune Cube
                  </h2>
                  <p className="text-[10px] md:text-xs" style={{ color: 'var(--theme-sub)' }}>
                    {getVersionWithDate()}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 transition-colors hover:opacity-80"
                style={{ backgroundColor: 'var(--theme-subAlt)', color: 'var(--theme-sub)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="flex flex-col gap-4 md:gap-6">
                <section>
                  <p className="text-xs leading-relaxed md:text-sm" style={{ color: 'var(--theme-text)' }}>
                    Hi! This is a passion project of mine. When I learned about smart cubes, I was
                    ecstatic to make my own app and integrate it. I've always loved building these
                    types of applications.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed md:mt-3 md:text-sm" style={{ color: 'var(--theme-text)' }}>
                    My goal is to make this one of the best speedcubing tools out there and help
                    push innovation in the community forward. Whether you're a beginner or a
                    world-class solver, I hope Kitsune Cube helps you on your journey.
                  </p>
                </section>

                <section
                  className="rounded-lg p-3 md:rounded-xl md:p-4"
                  style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
                >
                  <h3
                    className="mb-2 text-[10px] font-medium uppercase tracking-wider md:mb-3 md:text-xs"
                    style={{ color: 'var(--theme-sub)' }}
                  >
                    Credits
                  </h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium md:text-sm" style={{ color: 'var(--theme-text)' }}>
                          gisketch
                        </span>
                        <span className="ml-2 text-xs md:text-sm" style={{ color: 'var(--theme-sub)' }}>
                          Developer & Design
                        </span>
                      </div>
                      <a
                        href="https://github.com/gisketch"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                        style={{ color: 'var(--theme-accent)' }}
                      >
                        GitHub <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </section>

                <section
                  className="rounded-lg p-3 md:rounded-xl md:p-4"
                  style={{ backgroundColor: 'var(--theme-bgSecondary)' }}
                >
                  <h3
                    className="mb-2 text-[10px] font-medium uppercase tracking-wider md:mb-3 md:text-xs"
                    style={{ color: 'var(--theme-sub)' }}
                  >
                    Special Thanks
                  </h3>
                  <div className="flex flex-col gap-2 md:gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium md:text-sm" style={{ color: 'var(--theme-text)' }}>
                          Chribot
                        </span>
                        <p className="text-[10px] md:text-xs" style={{ color: 'var(--theme-sub)' }}>
                          Fork for MoYu cube support
                        </p>
                      </div>
                      <a
                        href="https://github.com/Chribot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                        style={{ color: 'var(--theme-accent)' }}
                      >
                        GitHub <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                          DeathAlchemy
                        </span>
                        <p className="text-xs" style={{ color: 'var(--theme-sub)' }}>
                          Bug reports and testing
                        </p>
                      </div>
                      <a
                        href="https://github.com/Aurous"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                        style={{ color: 'var(--theme-accent)' }}
                      >
                        GitHub <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                          bellalMohamed
                        </span>
                        <p className="text-xs" style={{ color: 'var(--theme-sub)' }}>
                          Bug reports and testing
                        </p>
                      </div>
                      <a
                        href="https://github.com/bellalMohamed"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                        style={{ color: 'var(--theme-accent)' }}
                      >
                        GitHub <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </section>

                <section
                  className="rounded-xl p-4"
                  style={{
                    background: 'linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-main) 100%)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <MessageCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--theme-bg)' }} />
                    <div>
                      <h3 className="font-medium" style={{ color: 'var(--theme-bg)' }}>
                        Join the Community
                      </h3>
                      <p className="mt-1 text-sm opacity-90" style={{ color: 'var(--theme-bg)' }}>
                        Connect with other cubers, share your times, and help shape the future of
                        Kitsune Cube.
                      </p>
                      <a
                        href="https://discord.gg/XPQr4wpQVg"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-accent)' }}
                      >
                        Join Discord <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </section>

                <div className="flex items-center justify-center gap-1 text-sm" style={{ color: 'var(--theme-sub)' }}>
                  Made with <Heart className="mx-1 h-4 w-4" style={{ color: 'var(--theme-error)', fill: 'var(--theme-error)' }} /> for the cubing community
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
