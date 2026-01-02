import { connectSmartPuzzle, type BluetoothPuzzle, type MoveEvent } from 'cubing/bluetooth'
import { BaseAdapter } from './base-adapter'
import type { CubeCapabilities, AdapterConnectOptions, CubeBrand } from './types'

export class GiikerAdapter extends BaseAdapter {
  readonly brand: CubeBrand = 'giiker'
  readonly isExperimental = true
  readonly capabilities: CubeCapabilities = {
    gyroscope: false,
    battery: false,
    facelets: true,
  }

  private puzzle: BluetoothPuzzle | null = null

  async connect(_options: AdapterConnectOptions = {}): Promise<void> {
    if (this._isConnected) {
      return
    }

    this.puzzle = await connectSmartPuzzle()
    this._deviceName = this.puzzle.name?.() ?? 'GiiKER Cube'
    this._isConnected = true

    this.puzzle.addAlgLeafListener((event: MoveEvent) => {
      const move = event.latestAlgLeaf.toString()
      this.emitMove(move, event.timeStamp)
    })

    this.puzzle.addEventListener('disconnect', () => {
      this.emitDisconnect()
      this.puzzle = null
    })
  }

  async disconnect(): Promise<void> {
    if (this.puzzle) {
      this.puzzle.disconnect()
      this.puzzle = null
      this._isConnected = false
      this._deviceName = null
    }
  }

  async requestBattery(): Promise<void> {
    // GiiKER cubes don't support battery level queries via cubing.js
  }

  async requestFacelets(): Promise<void> {
    // Facelets are obtained via getPattern() but not emitted as events
    // in cubing.js - would need to call puzzle.getPattern() and convert
  }
}
