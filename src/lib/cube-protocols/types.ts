import type { Observable } from 'rxjs'

export type CubeBrand = 'gan' | 'moyu' | 'qiyi' | 'giiker' | 'mock'

export interface CubeQuaternion {
  x: number
  y: number
  z: number
  w: number
}

export interface CubeMoveEvent {
  type: 'move'
  move: string
  timestamp: number
}

export interface CubeGyroEvent {
  type: 'gyro'
  quaternion: CubeQuaternion
  timestamp: number
}

export interface CubeBatteryEvent {
  type: 'battery'
  level: number
  timestamp: number
}

export interface CubeDisconnectEvent {
  type: 'disconnect'
  timestamp: number
}

export interface CubeFaceletsEvent {
  type: 'facelets'
  facelets: string
  timestamp: number
}

export type SmartCubeEvent =
  | CubeMoveEvent
  | CubeGyroEvent
  | CubeBatteryEvent
  | CubeDisconnectEvent
  | CubeFaceletsEvent

export interface CubeCapabilities {
  gyroscope: boolean
  battery: boolean
  facelets: boolean
}

export interface SmartCubeAdapter {
  readonly brand: CubeBrand
  readonly isExperimental: boolean
  readonly capabilities: CubeCapabilities
  readonly deviceName: string | null
  readonly isConnected: boolean

  events$: Observable<SmartCubeEvent>

  connect(options?: AdapterConnectOptions): Promise<void>
  disconnect(): Promise<void>
  requestBattery(): Promise<void>
  requestFacelets(): Promise<void>
  destroy(): void
}

export interface AdapterConnectOptions {
  macAddressProvider?: (isFallbackCall: boolean) => Promise<string | null>
}

export interface CubeBrandInfo {
  brand: CubeBrand
  displayName: string
  experimental: boolean
  hasGyro: boolean
  description: string
  supportedModels: string[]
}

export const CUBE_BRANDS: CubeBrandInfo[] = [
  {
    brand: 'gan',
    displayName: 'GAN',
    experimental: false,
    hasGyro: true,
    description: 'Full support with gyroscope for replays',
    supportedModels: [
      'GAN 14 ui FreePlay',
      'GAN 12 ui FreePlay',
      'GAN 12 ui',
      'GAN 12 ui Maglev',
      'GAN 356i Carry 2',
      'GAN 356i Carry S',
      'GAN 356i Carry',
      'GAN 356i 3',
      'GAN Mini ui FreePlay',
      'Monster Go 3Ai',
    ],
  },
  {
    brand: 'moyu',
    displayName: 'MoYu',
    experimental: true,
    hasGyro: false,
    description: 'Move tracking only, no gyroscope',
    supportedModels: ['MoYu AI 2023', 'MoYu WeiLong V10 AI'],
  },
  {
    brand: 'qiyi',
    displayName: 'QiYi',
    experimental: true,
    hasGyro: false,
    description: 'Move tracking only, no gyroscope',
    supportedModels: ['QiYi AI Smart Cube'],
  },
  {
    brand: 'giiker',
    displayName: 'GiiKER',
    experimental: true,
    hasGyro: false,
    description: 'Move tracking only, no gyroscope',
    supportedModels: ['GiiKER i3S', 'GiiKER i2', 'Xiaomi Giiker'],
  },
  {
    brand: 'mock',
    displayName: 'Mock Cube (Dev)',
    experimental: true,
    hasGyro: true,
    description: 'Simulated cube for development testing',
    supportedModels: ['Virtual Cube'],
  },
]

export function getBrandInfo(brand: CubeBrand): CubeBrandInfo {
  const info = CUBE_BRANDS.find((b) => b.brand === brand)
  if (!info) {
    throw new Error(`Unknown cube brand: ${brand}`)
  }
  return info
}

export function isBrandSupported(brand: string): brand is CubeBrand {
  return CUBE_BRANDS.some((b) => b.brand === brand)
}
