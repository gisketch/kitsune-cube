import { BaseAdapter } from './base-adapter'
import type { CubeCapabilities, AdapterConnectOptions, CubeBrand } from './types'

const CUBE_MOVES = ['R', "R'", 'R2', 'U', "U'", 'U2', 'F', "F'", 'F2', 'L', "L'", 'L2', 'D', "D'", 'D2', 'B', "B'", 'B2']

export interface MockAdapterOptions {
  autoGenerateMoves?: boolean
  moveIntervalMs?: number
  simulateGyro?: boolean
}

export class MockAdapter extends BaseAdapter {
  readonly brand: CubeBrand = 'mock'
  readonly isExperimental = true
  readonly capabilities: CubeCapabilities

  private moveInterval: ReturnType<typeof setInterval> | null = null
  private gyroInterval: ReturnType<typeof setInterval> | null = null
  private gyroAngle = 0
  private options: MockAdapterOptions

  constructor(options: MockAdapterOptions = {}) {
    super()
    this.options = {
      autoGenerateMoves: options.autoGenerateMoves ?? false,
      moveIntervalMs: options.moveIntervalMs ?? 2000,
      simulateGyro: options.simulateGyro ?? true,
    }
    this.capabilities = {
      gyroscope: this.options.simulateGyro ?? true,
      battery: true,
      facelets: true,
    }
  }

  async connect(_options: AdapterConnectOptions = {}): Promise<void> {
    if (this._isConnected) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 500))

    this._deviceName = 'Mock Cube (Development)'
    this._isConnected = true

    this.emitBattery(85)
    this.emitFacelets('UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB')

    if (this.options.autoGenerateMoves) {
      this.startAutoMoves()
    }

    if (this.options.simulateGyro) {
      this.startGyroSimulation()
    }
  }

  private startAutoMoves(): void {
    this.moveInterval = setInterval(() => {
      const randomMove = CUBE_MOVES[Math.floor(Math.random() * CUBE_MOVES.length)]
      this.emitMove(randomMove)
    }, this.options.moveIntervalMs)
  }

  private startGyroSimulation(): void {
    this.gyroInterval = setInterval(() => {
      this.gyroAngle += 0.02
      const quaternion = this.eulerToQuaternion(
        Math.sin(this.gyroAngle * 0.5) * 0.1,
        this.gyroAngle,
        Math.cos(this.gyroAngle * 0.3) * 0.1,
      )
      this.emitGyro(quaternion)
    }, 50)
  }

  private eulerToQuaternion(
    pitch: number,
    yaw: number,
    roll: number,
  ): { x: number; y: number; z: number; w: number } {
    const cy = Math.cos(yaw * 0.5)
    const sy = Math.sin(yaw * 0.5)
    const cp = Math.cos(pitch * 0.5)
    const sp = Math.sin(pitch * 0.5)
    const cr = Math.cos(roll * 0.5)
    const sr = Math.sin(roll * 0.5)

    return {
      w: cr * cp * cy + sr * sp * sy,
      x: sr * cp * cy - cr * sp * sy,
      y: cr * sp * cy + sr * cp * sy,
      z: cr * cp * sy - sr * sp * cy,
    }
  }

  simulateMove(move: string): void {
    if (this._isConnected) {
      this.emitMove(move)
    }
  }

  async disconnect(): Promise<void> {
    if (this.moveInterval) {
      clearInterval(this.moveInterval)
      this.moveInterval = null
    }
    if (this.gyroInterval) {
      clearInterval(this.gyroInterval)
      this.gyroInterval = null
    }
    this._isConnected = false
    this._deviceName = null
    this.emitDisconnect()
  }

  async requestBattery(): Promise<void> {
    if (this._isConnected) {
      this.emitBattery(Math.floor(Math.random() * 30) + 70)
    }
  }

  async requestFacelets(): Promise<void> {
    if (this._isConnected) {
      this.emitFacelets('UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB')
    }
  }
}
