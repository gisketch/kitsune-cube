import { motion, AnimatePresence } from 'framer-motion'
import { X, Battery, BatteryWarning, RotateCcw, RefreshCw, BluetoothOff } from 'lucide-react'

interface CubeInfoModalProps {
  isOpen: boolean
  onClose: () => void
  batteryLevel: number | null
  onResetGyro: () => void
  onSyncCube: () => void
  onDisconnect?: () => void
}

export function CubeInfoModal({
  isOpen,
  onClose,
  batteryLevel,
  onResetGyro,
  onSyncCube,
  onDisconnect,
}: CubeInfoModalProps) {
  const isLowBattery = batteryLevel !== null && batteryLevel <= 20
  const BatteryIcon = isLowBattery ? BatteryWarning : Battery

  const getBatteryColor = () => {
    if (batteryLevel === null) return 'var(--theme-sub)'
    if (batteryLevel <= 20) return 'var(--theme-error)'
    if (batteryLevel <= 50) return '#F59E0B'
    return '#10B981'
  }

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
              className="pointer-events-auto h-full w-full overflow-hidden p-6 shadow-2xl md:h-auto md:max-w-sm md:rounded-xl"
              style={{
                backgroundColor: 'var(--theme-bgSecondary)',
                border: '1px solid var(--theme-subAlt)',
              }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--theme-text)' }}>
                  Cube Information
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 transition-colors hover:bg-[var(--theme-subAlt)]"
                  style={{ color: 'var(--theme-sub)' }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div
                  className="flex items-center justify-between rounded-lg p-4"
                  style={{ backgroundColor: 'var(--theme-bg)' }}
                >
                  <div className="flex items-center gap-3">
                    <BatteryIcon className="h-6 w-6" style={{ color: getBatteryColor() }} />
                    <div>
                      <div className="text-sm" style={{ color: 'var(--theme-sub)' }}>
                        Battery Level
                      </div>
                      <div className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
                        {batteryLevel !== null ? `${batteryLevel}%` : 'Unknown'}
                      </div>
                    </div>
                  </div>

                  {batteryLevel !== null && (
                    <div
                      className="h-3 w-24 overflow-hidden rounded-full"
                      style={{ backgroundColor: 'var(--theme-subAlt)' }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${batteryLevel}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: getBatteryColor() }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--theme-sub)' }}>
                    Calibration
                  </h3>

                  <button
                    onClick={() => {
                      onResetGyro()
                      onClose()
                    }}
                    className="flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-[var(--theme-subAlt)]"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      color: 'var(--theme-text)',
                    }}
                  >
                    <RotateCcw className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                    <div className="text-left">
                      <div className="font-medium">Reset Gyro</div>
                      <div className="text-xs" style={{ color: 'var(--theme-sub)' }}>
                        Recalibrate cube orientation (U4)
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onSyncCube()
                      onClose()
                    }}
                    className="flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-[var(--theme-subAlt)]"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      color: 'var(--theme-text)',
                    }}
                  >
                    <RefreshCw className="h-5 w-5" style={{ color: 'var(--theme-accent)' }} />
                    <div className="text-left">
                      <div className="font-medium">Sync Cube State</div>
                      <div className="text-xs" style={{ color: 'var(--theme-sub)' }}>
                        Reset to solved state (F4)
                      </div>
                    </div>
                  </button>
                </div>

                {onDisconnect && (
                  <div className="pt-2" style={{ borderTop: '1px solid var(--theme-subAlt)' }}>
                    <button
                      onClick={() => {
                        onDisconnect()
                        onClose()
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-lg p-3 transition-colors hover:bg-[var(--theme-error)]/10"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        color: 'var(--theme-error)',
                      }}
                    >
                      <BluetoothOff className="h-5 w-5" />
                      <span className="font-medium">Disconnect Cube</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
