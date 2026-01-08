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

export type ModelStatus = 'confirmed' | 'untested'

export interface CubeModelInfo {
  name: string
  hasGyro: boolean
  status: ModelStatus
  note?: string
}

export interface CubeBrandInfo {
  brand: CubeBrand
  displayName: string
  experimental: boolean
  hasGyro: boolean
  description: string
  supportedModels: CubeModelInfo[]
}

export const CUBE_BRANDS: CubeBrandInfo[] = [
  {
    brand: 'gan',
    displayName: 'GAN',
    experimental: false,
    hasGyro: true,
    description: 'Full support with gyroscope for replays',
    supportedModels: [
      { name: 'GAN 12 ui FreePlay', hasGyro: true, status: 'confirmed' },
      { name: 'GAN 356i 3', hasGyro: true, status: 'confirmed' },
      { name: 'GAN 356i Carry E', hasGyro: false, status: 'confirmed', note: 'No gyro hardware' },
      { name: 'GAN 356i Carry 2', hasGyro: false, status: 'confirmed', note: 'No gyro hardware (Gen3)' },
      { name: 'GAN 14 ui FreePlay', hasGyro: false, status: 'untested', note: 'Gyro unconfirmed' },
      { name: 'GAN 12 ui', hasGyro: true, status: 'untested' },
      { name: 'GAN 12 ui Maglev', hasGyro: true, status: 'untested' },
      { name: 'GAN 356i Carry S', hasGyro: true, status: 'untested' },
      { name: 'GAN 356i Carry', hasGyro: true, status: 'untested' },
      { name: 'GAN Mini ui FreePlay', hasGyro: true, status: 'untested' },
      { name: 'Monster Go 3Ai', hasGyro: true, status: 'untested' },
    ],
  },
  {
    brand: 'moyu',
    displayName: 'MoYu',
    experimental: true,
    hasGyro: true,
    description: 'Full support with gyroscope (V10 AI)',
    supportedModels: [
      { name: 'MoYu WeiLong V10 AI', hasGyro: true, status: 'untested', note: 'Gyro supported' },
      { name: 'MoYu AI 2023', hasGyro: false, status: 'untested', note: 'Uses GAN Gen2 protocol' },
    ],
  },
  {
    brand: 'qiyi',
    displayName: 'QiYi',
    experimental: true,
    hasGyro: false,
    description: 'Move tracking only, no gyroscope',
    supportedModels: [
      { name: 'QiYi QY-SC-S', hasGyro: false, status: 'confirmed' },
      { name: 'QiYi AI Smart Cube', hasGyro: false, status: 'untested' },
    ],
  },
  {
    brand: 'giiker',
    displayName: 'GiiKER',
    experimental: true,
    hasGyro: false,
    description: 'Move tracking only, no gyroscope',
    supportedModels: [
      { name: 'GiiKER i3S', hasGyro: false, status: 'untested' },
      { name: 'GiiKER i2', hasGyro: false, status: 'untested' },
      { name: 'Xiaomi Giiker', hasGyro: false, status: 'untested' },
    ],
  },
  {
    brand: 'mock',
    displayName: 'Mock Cube (Dev)',
    experimental: true,
    hasGyro: true,
    description: 'Simulated cube for development testing',
    supportedModels: [{ name: 'Virtual Cube', hasGyro: true, status: 'confirmed' }],
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
