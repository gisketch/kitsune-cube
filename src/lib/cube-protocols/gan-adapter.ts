import { connectGanCube, type GanCubeConnection, type GanCubeEvent } from 'gan-web-bluetooth'
import { BaseAdapter } from './base-adapter'
import type { CubeCapabilities, AdapterConnectOptions, CubeBrand } from './types'

const VALID_MOVE_REGEX = /^[RLUDFB]['2]?$/

export interface GanAdapterOptions {
  brand?: CubeBrand
  hasGyroscope?: boolean
}

export class GanAdapter extends BaseAdapter {
  readonly brand: CubeBrand
  readonly isExperimental: boolean
  readonly capabilities: CubeCapabilities

  private connection: GanCubeConnection | null = null

  constructor(options: GanAdapterOptions = {}) {
    super()
    this.brand = options.brand ?? 'gan'
    this.isExperimental = this.brand !== 'gan'
    this.capabilities = {
      gyroscope: options.hasGyroscope ?? this.brand === 'gan',
      battery: true,
      facelets: true,
    }
  }

  async connect(options: AdapterConnectOptions = {}): Promise<void> {
    if (this._isConnected) {
      return
    }

    const macAddressProvider = options.macAddressProvider
      ? async (_device: BluetoothDevice, isFallbackCall?: boolean): Promise<string | null> => {
          return options.macAddressProvider!(isFallbackCall ?? false)
        }
      : undefined

    this.connection = await connectGanCube(macAddressProvider)
    this._deviceName = this.connection.deviceName
    this._isConnected = true

    this.connection.events$.subscribe({
      next: (event) => this.handleGanEvent(event),
      error: (err) => {
        console.error(`[${this.brand}] Connection error:`, err)
        this.emitDisconnect()
      },
      complete: () => {
        this.emitDisconnect()
      },
    })
  }

  private handleGanEvent(event: GanCubeEvent): void {
    const timestamp = event.timestamp ?? Date.now()

    switch (event.type) {
      case 'MOVE':
        if (event.move && VALID_MOVE_REGEX.test(event.move)) {
          this.emitMove(event.move, timestamp)
        }
        break

      case 'GYRO':
        if (this.capabilities.gyroscope && event.quaternion) {
          this.emitGyro(
            {
              x: event.quaternion.x,
              y: event.quaternion.y,
              z: event.quaternion.z,
              w: event.quaternion.w,
            },
            timestamp,
          )
        }
        break

      case 'BATTERY':
        if (event.batteryLevel !== undefined) {
          this.emitBattery(event.batteryLevel, timestamp)
        }
        break

      case 'FACELETS':
        if (event.facelets) {
          this.emitFacelets(event.facelets, timestamp)
        }
        break

      case 'DISCONNECT':
        this.connection = null
        this.emitDisconnect(timestamp)
        break
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.disconnect()
      this.connection = null
      this._isConnected = false
      this._deviceName = null
    }
  }

  async requestBattery(): Promise<void> {
    if (this.connection) {
      await this.connection.sendCubeCommand({ type: 'REQUEST_BATTERY' })
    }
  }

  async requestFacelets(): Promise<void> {
    if (this.connection) {
      await this.connection.sendCubeCommand({ type: 'REQUEST_FACELETS' })
    }
  }
}
