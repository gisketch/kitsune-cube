import { connectSmartCube } from 'btcube-web'
import { BaseAdapter } from './base-adapter'
import type { CubeCapabilities, AdapterConnectOptions, CubeBrand } from './types'

type BTCubeConnection = Awaited<ReturnType<typeof connectSmartCube>>

export class QiyiAdapter extends BaseAdapter {
  readonly brand: CubeBrand = 'qiyi'
  readonly isExperimental = true
  readonly capabilities: CubeCapabilities = {
    gyroscope: false,
    battery: true,
    facelets: true,
  }

  private connection: BTCubeConnection | null = null

  async connect(options: AdapterConnectOptions = {}): Promise<void> {
    if (this._isConnected) {
      return
    }

    const macAddressProvider = options.macAddressProvider
      ? async (_device: BluetoothDevice): Promise<string> => {
          const mac = await options.macAddressProvider!(true)
          return mac ?? '00:00:00:00:00:00'
        }
      : undefined

    this.connection = await connectSmartCube(macAddressProvider)
    this._deviceName = this.connection.device.name ?? 'QiYi Cube'
    this._isConnected = true

    this.connection.events.moves.subscribe({
      next: (moveEvent) => {
        this.emitMove(moveEvent.move)
      },
      error: (err) => {
        console.error('[qiyi] Move stream error:', err)
      },
    })

    this.connection.events.info.subscribe({
      next: (infoEvent) => {
        if (infoEvent.type === 'battery') {
          this.emitBattery(infoEvent.battery)
        }
      },
      error: (err) => {
        console.error('[qiyi] Info stream error:', err)
      },
    })

    this.connection.device.addEventListener('gattserverdisconnected', () => {
      this.emitDisconnect()
      this.connection = null
    })
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.commands.disconnect()
      this.connection = null
      this._isConnected = false
      this._deviceName = null
    }
  }

  async requestBattery(): Promise<void> {
    // btcube-web automatically provides battery info via info events
  }

  async requestFacelets(): Promise<void> {
    if (this.connection) {
      await this.connection.commands.freshState()
    }
  }
}
