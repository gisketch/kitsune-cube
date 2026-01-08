import { X, Bluetooth, FlaskConical, Compass, ExternalLink, Box, Check, Smartphone, Monitor, ChevronDown, ChevronUp, AlertTriangle, HelpCircle } from 'lucide-react'
import { useState, useMemo } from 'react'
import { CUBE_BRANDS, type CubeBrand, getBrandInfo } from '@/lib/cube-protocols'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type Platform = 'android' | 'windows' | 'mac' | 'linux' | 'ios' | 'unknown'

function detectPlatform(): Platform {
  const userAgent = navigator.userAgent.toLowerCase()
  if (/android/i.test(userAgent)) return 'android'
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios'
  if (/windows/i.test(userAgent)) return 'windows'
  if (/macintosh|mac os x/i.test(userAgent)) return 'mac'
  if (/linux/i.test(userAgent)) return 'linux'
  return 'unknown'
}

function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator
}

type ConnectionErrorType = 'no-ble' | 'mac-required' | 'cancelled' | 'device-not-found' | 'connection-failed' | 'unknown'

function categorizeError(errorMessage: string): ConnectionErrorType {
  const msg = errorMessage.toLowerCase()
  if (msg.includes('bluetooth') && (msg.includes('not supported') || msg.includes('not available') || msg.includes('undefined'))) {
    return 'no-ble'
  }
  if (msg.includes('mac') || msg.includes('address')) {
    return 'mac-required'
  }
  if (msg.includes('cancelled') || msg.includes('canceled') || msg.includes('user denied')) {
    return 'cancelled'
  }
  if (msg.includes('not found') || msg.includes('no device')) {
    return 'device-not-found'
  }
  if (msg.includes('connect') || msg.includes('failed')) {
    return 'connection-failed'
  }
  return 'unknown'
}

interface BrandPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectBrand: (brand: CubeBrand) => void
}

const BRAND_COLORS: Record<CubeBrand, string> = {
  gan: '#22c55e',
  moyu: '#ef4444',
  qiyi: '#3b82f6',
  giiker: '#eab308',
  mock: '#a855f7',
}

export function BrandPickerModal({
  isOpen,
  onClose,
  onSelectBrand,
}: BrandPickerModalProps) {
  const [hoveredBrand, setHoveredBrand] = useState<CubeBrand | null>(null)

  if (!isOpen) return null

  const visibleBrands = CUBE_BRANDS.filter((b) => b.brand !== 'mock' || import.meta.env.DEV)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative flex h-full w-full flex-col overflow-hidden shadow-2xl duration-200 animate-in fade-in zoom-in-95 md:h-auto md:max-w-md md:rounded-2xl"
        style={{ backgroundColor: 'var(--theme-bg)' }}
      >
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: 'var(--theme-subAlt)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'var(--theme-main)', color: 'var(--theme-bg)' }}
            >
              <Bluetooth className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--theme-text)' }}>
                Connect Smart Cube
              </h2>
              <p className="text-xs" style={{ color: 'var(--theme-sub)' }}>
                Select your cube brand
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--theme-subAlt)]"
            style={{ color: 'var(--theme-sub)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <TooltipProvider delayDuration={300}>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
            {visibleBrands.map((brandInfo) => {
              const isHovered = hoveredBrand === brandInfo.brand
              const brandColor = BRAND_COLORS[brandInfo.brand]

              return (
                <Tooltip key={brandInfo.brand}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSelectBrand(brandInfo.brand)}
                      onMouseEnter={() => setHoveredBrand(brandInfo.brand)}
                      onMouseLeave={() => setHoveredBrand(null)}
                      className="group flex items-center gap-4 rounded-xl p-4 text-left transition-all duration-150"
                      style={{
                        backgroundColor: isHovered ? 'var(--theme-subAlt)' : 'transparent',
                        border: `1px solid ${isHovered ? 'var(--theme-sub)' : 'var(--theme-subAlt)'}`,
                      }}
                    >
                      <div
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-150 group-hover:scale-105"
                        style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
                      >
                        <Box className="h-6 w-6" />
                      </div>

                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: 'var(--theme-text)' }}>
                            {brandInfo.displayName}
                          </span>
                          {brandInfo.experimental && (
                            <span
                              className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                              style={{ backgroundColor: 'var(--theme-error)', color: 'var(--theme-bg)' }}
                            >
                              Beta
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--theme-sub)' }}>
                          {brandInfo.hasGyro ? (
                            <span className="flex items-center gap-1">
                              <Compass className="h-3 w-3" />
                              Gyroscope
                            </span>
                          ) : (
                            <span className="opacity-60">No Gyroscope</span>
                          )}
                          <span className="opacity-40">•</span>
                          <span>{brandInfo.supportedModels.length} models</span>
                        </div>
                      </div>

                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ backgroundColor: 'var(--theme-main)', color: 'var(--theme-bg)' }}
                      >
                        <Bluetooth className="h-4 w-4" />
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    align="start"
                    className="max-h-64 max-w-xs overflow-y-auto p-0"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      border: '1px solid var(--theme-subAlt)',
                    }}
                  >
                    <div className="p-3">
                      <p
                        className="mb-2 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: brandColor }}
                      >
                        Supported Models
                      </p>
                      <div className="space-y-1.5">
                        {brandInfo.supportedModels.map((model) => (
                          <div
                            key={model.name}
                            className="flex items-start gap-2 text-xs"
                            style={{ color: 'var(--theme-text)' }}
                          >
                            {model.status === 'confirmed' ? (
                              <Check className="mt-0.5 h-3 w-3 flex-shrink-0" style={{ color: '#22c55e' }} />
                            ) : (
                              <HelpCircle className="mt-0.5 h-3 w-3 flex-shrink-0" style={{ color: 'var(--theme-sub)' }} />
                            )}
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span>{model.name}</span>
                                {model.hasGyro && (
                                  <Compass className="h-3 w-3" style={{ color: 'var(--theme-accent)' }} />
                                )}
                              </div>
                              {model.note && (
                                <span className="text-[10px]" style={{ color: 'var(--theme-sub)' }}>
                                  {model.note}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-3 border-t pt-2 text-[10px]" style={{ borderColor: 'var(--theme-subAlt)', color: 'var(--theme-sub)' }}>
                        <span className="flex items-center gap-1">
                          <Check className="h-2.5 w-2.5" style={{ color: '#22c55e' }} /> Confirmed
                        </span>
                        <span className="flex items-center gap-1">
                          <HelpCircle className="h-2.5 w-2.5" /> Needs testing
                        </span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </TooltipProvider>

        <div
          className="border-t px-4 py-4"
          style={{ borderColor: 'var(--theme-subAlt)', backgroundColor: 'var(--theme-bgSecondary)' }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <FlaskConical className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: 'var(--theme-sub)' }} />
              <div className="flex-1">
                <p className="text-xs font-medium" style={{ color: 'var(--theme-text)' }}>
                  Testing Experimental Cubes
                </p>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--theme-sub)' }}>
                  MoYu, QiYi, and GiiKER support is new. Help us improve by reporting connection issues, 
                  move tracking problems, or battery reading errors.
                </p>
              </div>
            </div>
            <a
              href="https://discord.gg/XPQr4wpQVg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--theme-main)', color: 'var(--theme-bg)' }}
            >
              Report Issues on Discord
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SmartCubeConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'success' | 'error'
  title: string
  message: string
  isMacRequired?: boolean
  onSubmitMac?: (mac: string) => void
  brand?: CubeBrand | null
}

function MacAddressInstructions() {
  const [isExpanded, setIsExpanded] = useState(false)
  const platform = useMemo(() => detectPlatform(), [])

  const androidInstructions = [
    'Turn on your Smart Cube and rotate any side to wake it up',
    'Open Google Chrome on your Android phone',
    'Type this in the address bar: chrome://bluetooth-internals/#devices',
    'Tap "Start Scan" and wait a few seconds',
    'Find your cube in the list (look for "GAN", "MoYu", "QiYi", or a code like "GAN-xxxxx")',
    'The MAC address is in the "Address" column — it looks like XX:XX:XX:XX:XX:XX',
  ]

  const pcInstructions = [
    'Turn on your Smart Cube and rotate any side to wake it up',
    'Open Google Chrome on your computer',
    'Type this in the address bar: chrome://bluetooth-internals/#devices',
    'Click "Start Scan" and wait a few seconds',
    'Find your cube in the list (look for "GAN", "MoYu", "QiYi", or similar names)',
    'Copy the address from the "Address" column (format: XX:XX:XX:XX:XX:XX)',
  ]

  const instructions = platform === 'android' ? androidInstructions : pcInstructions
  const deviceType = platform === 'android' ? 'phone' : 'computer'

  return (
    <div
      className="mt-4 rounded-xl"
      style={{ backgroundColor: 'var(--theme-subAlt)' }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4" style={{ color: 'var(--theme-main)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
            How do I find my cube's MAC address?
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" style={{ color: 'var(--theme-sub)' }} />
        ) : (
          <ChevronDown className="h-4 w-4" style={{ color: 'var(--theme-sub)' }} />
        )}
      </button>

      {isExpanded && (
        <div className="border-t px-4 pb-4 pt-2" style={{ borderColor: 'var(--theme-sub)' }}>
          <div className="mb-3 flex items-center gap-2">
            {platform === 'android' ? (
              <Smartphone className="h-4 w-4" style={{ color: 'var(--theme-main)' }} />
            ) : (
              <Monitor className="h-4 w-4" style={{ color: 'var(--theme-main)' }} />
            )}
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--theme-main)' }}>
              Instructions for your {deviceType}
            </span>
          </div>

          <ol className="space-y-2">
            {instructions.map((step, index) => (
              <li key={index} className="flex gap-3 text-xs" style={{ color: 'var(--theme-text)' }}>
                <span
                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: 'var(--theme-main)', color: 'var(--theme-bg)' }}
                >
                  {index + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>

          <div
            className="mt-3 rounded-lg p-3 text-xs"
            style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-sub)' }}
          >
            <strong style={{ color: 'var(--theme-text)' }}>Tip:</strong> Make sure your cube is turned on and 
            nearby. If you don't see it, try rotating a side to wake it up, then scan again.
          </div>
        </div>
      )}
    </div>
  )
}

function BrowserNotSupportedMessage() {
  const platform = useMemo(() => detectPlatform(), [])

  const getSupportedBrowsers = () => {
    if (platform === 'ios') {
      return {
        message: "Unfortunately, Apple doesn't allow Bluetooth connections in web browsers on iPhone and iPad yet.",
        browsers: [],
        suggestion: 'Try using an Android phone or a computer with Chrome, Edge, or Brave browser instead.',
      }
    }
    if (platform === 'android') {
      return {
        message: 'Your current browser cannot connect to Bluetooth devices.',
        browsers: ['Google Chrome', 'Microsoft Edge', 'Brave Browser', 'Opera'],
        suggestion: 'Download one of these browsers from the Play Store:',
      }
    }
    return {
      message: 'Your current browser cannot connect to Bluetooth devices.',
      browsers: ['Google Chrome', 'Microsoft Edge', 'Brave Browser', 'Opera'],
      suggestion: 'Try using one of these browsers instead:',
    }
  }

  const { message, browsers, suggestion } = getSupportedBrowsers()

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex items-start gap-3 rounded-xl p-4"
        style={{ backgroundColor: 'var(--theme-error)', color: 'var(--theme-bg)' }}
      >
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-medium">Browser Not Supported</p>
          <p className="mt-1 text-sm opacity-90">{message}</p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm" style={{ color: 'var(--theme-text)' }}>
          {suggestion}
        </p>
        {browsers.length > 0 && (
          <div className="space-y-2">
            {browsers.map((browser) => (
              <div
                key={browser}
                className="flex items-center gap-3 rounded-lg p-3"
                style={{ backgroundColor: 'var(--theme-subAlt)' }}
              >
                <Check className="h-4 w-4" style={{ color: 'var(--theme-main)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                  {browser}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--theme-sub)' }}>
        These browsers support Web Bluetooth, which is required to connect to your smart cube wirelessly.
      </p>
    </div>
  )
}

function UserFriendlyErrorMessage({ errorMessage }: { errorMessage: string }) {
  const errorType = useMemo(() => categorizeError(errorMessage), [errorMessage])

  if (errorType === 'no-ble') {
    return <BrowserNotSupportedMessage />
  }

  if (errorType === 'cancelled') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm" style={{ color: 'var(--theme-text)' }}>
          The connection was cancelled. No worries — you can try again whenever you're ready!
        </p>
        <div
          className="rounded-lg p-3 text-xs"
          style={{ backgroundColor: 'var(--theme-subAlt)', color: 'var(--theme-sub)' }}
        >
          <strong style={{ color: 'var(--theme-text)' }}>Tip:</strong> When the Bluetooth popup appears, 
          select your cube from the list and click "Pair" to connect.
        </div>
      </div>
    )
  }

  if (errorType === 'device-not-found') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm" style={{ color: 'var(--theme-text)' }}>
          We couldn't find your smart cube. Let's make sure everything is set up correctly:
        </p>
        <div className="space-y-2">
          {[
            'Make sure your cube is turned on (check for a light or sound when you rotate it)',
            'Keep the cube close to your device (within a few feet)',
            'Try rotating a side to wake it up',
            'Make sure Bluetooth is enabled on your device',
          ].map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs"
              style={{ color: 'var(--theme-sub)' }}
            >
              <span style={{ color: 'var(--theme-main)' }}>•</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (errorType === 'connection-failed') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm" style={{ color: 'var(--theme-text)' }}>
          The connection didn't work this time. Here are some things to try:
        </p>
        <div className="space-y-2">
          {[
            'Move your cube closer to your device',
            'Turn the cube off and on again',
            'Refresh this page and try connecting again',
            'Make sure no other app is connected to your cube',
          ].map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs"
              style={{ color: 'var(--theme-sub)' }}
            >
              <span style={{ color: 'var(--theme-main)' }}>•</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: 'var(--theme-text)' }}>
        Something went wrong while trying to connect to your cube.
      </p>
      <div
        className="rounded-lg p-3 text-xs font-mono"
        style={{ backgroundColor: 'var(--theme-subAlt)', color: 'var(--theme-sub)' }}
      >
        {errorMessage}
      </div>
      <p className="text-xs" style={{ color: 'var(--theme-sub)' }}>
        Try refreshing the page and connecting again. If the problem persists, 
        join our Discord for help.
      </p>
    </div>
  )
}

export function SmartCubeConnectionModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  isMacRequired,
  onSubmitMac,
  brand,
}: SmartCubeConnectionModalProps) {
  const [macAddress, setMacAddress] = useState('')
  const isBleSupported = useMemo(() => isWebBluetoothSupported(), [])
  const errorType = useMemo(() => message ? categorizeError(message) : null, [message])

  if (!isOpen) return null

  const brandInfo = brand ? getBrandInfo(brand) : null
  const brandColor = brand ? BRAND_COLORS[brand] : 'var(--theme-main)'
  const showNoBleError = !isBleSupported || errorType === 'no-ble'

  const getTitle = () => {
    if (showNoBleError) return 'Browser Not Supported'
    if (isMacRequired) return 'One More Step Needed'
    if (errorType === 'cancelled') return 'Connection Cancelled'
    if (errorType === 'device-not-found') return "Cube Not Found"
    if (errorType === 'connection-failed') return 'Connection Issue'
    return title
  }

  const handleSubmit = () => {
    if (onSubmitMac && macAddress) {
      onSubmitMac(macAddress)
      setMacAddress('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative h-full w-full overflow-hidden shadow-2xl duration-200 animate-in fade-in zoom-in-95 md:h-auto md:max-w-md md:rounded-2xl"
        style={{ backgroundColor: 'var(--theme-bg)' }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--theme-subAlt)' }}
        >
          <div className="flex items-center gap-3">
            {brandInfo && !showNoBleError && (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
              >
                <Box className="h-5 w-5" />
              </div>
            )}
            {showNoBleError && (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: 'var(--theme-error)', color: 'var(--theme-bg)' }}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className="text-base font-semibold"
                  style={{ color: showNoBleError ? 'var(--theme-error)' : type === 'error' ? 'var(--theme-error)' : 'var(--theme-text)' }}
                >
                  {getTitle()}
                </h2>
                {brandInfo?.experimental && !showNoBleError && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
                    style={{ backgroundColor: 'var(--theme-error)', color: 'var(--theme-bg)' }}
                  >
                    Beta
                  </span>
                )}
              </div>
              {brandInfo && !showNoBleError && (
                <p className="text-xs" style={{ color: 'var(--theme-sub)' }}>
                  {brandInfo.displayName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--theme-subAlt)]"
            style={{ color: 'var(--theme-sub)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {showNoBleError ? (
            <BrowserNotSupportedMessage />
          ) : isMacRequired ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm" style={{ color: 'var(--theme-text)' }}>
                  We need your cube's MAC address to complete the connection. This is a one-time setup — we'll remember it for next time!
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="mac-address"
                  className="text-xs font-medium"
                  style={{ color: 'var(--theme-text)' }}
                >
                  Enter MAC Address
                </label>
                <input
                  id="mac-address"
                  type="text"
                  placeholder="XX:XX:XX:XX:XX:XX"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value.toUpperCase())}
                  className="h-12 rounded-xl px-4 text-sm font-mono tracking-wider focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--theme-subAlt)',
                    color: 'var(--theme-text)',
                    border: '1px solid var(--theme-sub)',
                  }}
                />
                <p className="text-xs" style={{ color: 'var(--theme-sub)' }}>
                  Example: C3:21:89:44:1A:2B
                </p>
              </div>

              <MacAddressInstructions />
            </div>
          ) : (
            <UserFriendlyErrorMessage errorMessage={message} />
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="h-10 rounded-xl px-5 text-sm font-medium transition-colors hover:bg-[var(--theme-subAlt)]"
              style={{ color: 'var(--theme-text)' }}
            >
              {isMacRequired ? 'Cancel' : 'Got it'}
            </button>
            {isMacRequired && !showNoBleError && (
              <button
                onClick={handleSubmit}
                disabled={!macAddress.trim()}
                className="h-10 rounded-xl px-5 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--theme-main)', color: 'var(--theme-bg)' }}
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
