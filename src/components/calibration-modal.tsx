import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw, RefreshCw } from 'lucide-react'
import { CubeViewer, type RubiksCubeRef } from '@/components/cube'
import type { KPattern } from 'cubing/kpuzzle'
import { useRef } from 'react'
import * as THREE from 'three'

interface CalibrationModalProps {
  isOpen: boolean
  onClose: () => void
  pattern?: KPattern | null
  onSyncCube: () => void
  onRecalibrateGyro: () => void
  isConnected: boolean
  hasGyroscope?: boolean
}

export function CalibrationModal({
  isOpen,
  onClose,
  pattern,
  onSyncCube,
  onRecalibrateGyro,
  isConnected,
  hasGyroscope = true,
}: CalibrationModalProps) {
  const cubeRef = useRef<RubiksCubeRef>(null)
  const quaternionRef = useRef(new THREE.Quaternion())

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 h-full w-full p-6 shadow-2xl md:h-auto md:max-w-md md:rounded-2xl"
            style={{
              backgroundColor: 'var(--theme-bgSecondary)',
              border: '1px solid var(--theme-subAlt)',
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
                Cube Calibration
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 transition-colors"
                style={{ color: 'var(--theme-sub)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className="mb-6 aspect-square w-full overflow-hidden rounded-xl"
              style={{ backgroundColor: 'var(--theme-bg)' }}
            >
              <CubeViewer pattern={pattern} quaternionRef={quaternionRef} cubeRef={cubeRef} />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={onSyncCube}
                disabled={!isConnected}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: 'var(--theme-bg)',
                }}
              >
                <RefreshCw className="h-5 w-5" />
                <span>Sync Cube</span>
              </button>
              <p className="text-center text-xs" style={{ color: 'var(--theme-sub)' }}>
                Make sure the physical cube is solved, then press to sync the virtual cube
              </p>

              {hasGyroscope && (
                <>
                  <div className="my-2 h-px" style={{ backgroundColor: 'var(--theme-subAlt)' }} />

                  <button
                    onClick={onRecalibrateGyro}
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--theme-subAlt)',
                      color: 'var(--theme-text)',
                    }}
                  >
                    <RotateCcw className="h-5 w-5" />
                    <span>Recalibrate Gyro</span>
                  </button>
                  <p className="text-center text-xs" style={{ color: 'var(--theme-sub)' }}>
                    Hold the cube with white on top and green facing you, then press to reset gyro
                  </p>
                </>
              )}
            </div>

            {!isConnected && (
              <div className="mt-4 rounded-lg bg-yellow-500/10 p-3 text-center text-sm text-yellow-500">
                Connect your cube first to enable calibration
              </div>
            )}

            <div
              className="mt-4 rounded-lg p-3"
              style={{ backgroundColor: 'var(--theme-bg)' }}
            >
              <p
                className="mb-2 text-xs font-medium"
                style={{ color: 'var(--theme-text)' }}
              >
                Quick Gestures
              </p>
              <div className="space-y-1 text-xs" style={{ color: 'var(--theme-sub)' }}>
                {hasGyroscope && (
                  <p>
                    <span style={{ color: 'var(--theme-accent)' }}>4× U moves</span> — Recalibrate
                    gyro
                  </p>
                )}
                <p>
                  <span style={{ color: 'var(--theme-accent)' }}>4× F moves</span> — Sync cube state
                </p>
                <p>
                  <span style={{ color: 'var(--theme-accent)' }}>4× D moves</span> — Generate new
                  scramble
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
