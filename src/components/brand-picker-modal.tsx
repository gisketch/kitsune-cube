import { X, Bluetooth, FlaskConical, Compass, ExternalLink, Box, Check } from 'lucide-react'
import { useState } from 'react'
import { CUBE_BRANDS, type CubeBrand, getBrandInfo } from '@/lib/cube-protocols'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
                      <div className="space-y-1">
                        {brandInfo.supportedModels.map((model) => (
                          <div
                            key={model}
                            className="flex items-center gap-2 text-xs"
                            style={{ color: 'var(--theme-text)' }}
                          >
                            <Check className="h-3 w-3 flex-shrink-0" style={{ color: brandColor }} />
                            <span>{model}</span>
                          </div>
                        ))}
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

  if (!isOpen) return null

  const brandInfo = brand ? getBrandInfo(brand) : null
  const brandColor = brand ? BRAND_COLORS[brand] : 'var(--theme-main)'

  const handleSubmit = () => {
    if (onSubmitMac && macAddress) {
      onSubmitMac(macAddress)
      setMacAddress('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="relative h-full w-full overflow-hidden shadow-2xl duration-200 animate-in fade-in zoom-in-95 md:h-auto md:max-w-sm md:rounded-2xl"
        style={{ backgroundColor: 'var(--theme-bg)' }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--theme-subAlt)' }}
        >
          <div className="flex items-center gap-3">
            {brandInfo && (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
              >
                <Box className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className="text-base font-semibold"
                  style={{ color: type === 'error' ? 'var(--theme-error)' : 'var(--theme-text)' }}
                >
                  {title}
                </h2>
                {brandInfo?.experimental && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
                    style={{ backgroundColor: 'var(--theme-error)', color: 'var(--theme-bg)' }}
                  >
                    Beta
                  </span>
                )}
              </div>
              {brandInfo && (
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

        <div className="p-5">
          <p className="text-sm" style={{ color: 'var(--theme-sub)' }}>
            {message}
          </p>

          {isMacRequired && (
            <div className="mt-4 flex flex-col gap-2">
              <label
                htmlFor="mac-address"
                className="text-xs font-medium"
                style={{ color: 'var(--theme-text)' }}
              >
                MAC Address
              </label>
              <input
                id="mac-address"
                type="text"
                placeholder="E3:8C:8A:AB:0B:C9"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                className="h-10 rounded-lg px-3 text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--theme-subAlt)',
                  color: 'var(--theme-text)',
                  border: '1px solid var(--theme-sub)',
                }}
              />
              <p className="text-xs" style={{ color: 'var(--theme-sub)' }}>
                Format: XX:XX:XX:XX:XX:XX
              </p>
            </div>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="h-9 rounded-lg px-4 text-sm font-medium transition-colors hover:bg-[var(--theme-subAlt)]"
              style={{ color: 'var(--theme-text)' }}
            >
              {isMacRequired ? 'Cancel' : 'Close'}
            </button>
            {isMacRequired && (
              <button
                onClick={handleSubmit}
                className="h-9 rounded-lg px-4 text-sm font-medium transition-colors"
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
