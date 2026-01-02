import { Subject, type Observable } from 'rxjs'
import type {
  SmartCubeAdapter,
  SmartCubeEvent,
  CubeCapabilities,
  AdapterConnectOptions,
  CubeBrand,
} from './types'

export abstract class BaseAdapter implements SmartCubeAdapter {
  abstract readonly brand: CubeBrand
  abstract readonly isExperimental: boolean
  abstract readonly capabilities: CubeCapabilities

  protected eventsSubject = new Subject<SmartCubeEvent>()
  protected _deviceName: string | null = null
  protected _isConnected = false

  get events$(): Observable<SmartCubeEvent> {
    return this.eventsSubject.asObservable()
  }

  get deviceName(): string | null {
    return this._deviceName
  }

  get isConnected(): boolean {
    return this._isConnected
  }

  abstract connect(options?: AdapterConnectOptions): Promise<void>
  abstract disconnect(): Promise<void>
  abstract requestBattery(): Promise<void>
  abstract requestFacelets(): Promise<void>

  protected emitMove(move: string, timestamp?: number): void {
    this.eventsSubject.next({
      type: 'move',
      move,
      timestamp: timestamp ?? Date.now(),
    })
  }

  protected emitGyro(
    quaternion: { x: number; y: number; z: number; w: number },
    timestamp?: number,
  ): void {
    this.eventsSubject.next({
      type: 'gyro',
      quaternion,
      timestamp: timestamp ?? Date.now(),
    })
  }

  protected emitBattery(level: number, timestamp?: number): void {
    this.eventsSubject.next({
      type: 'battery',
      level,
      timestamp: timestamp ?? Date.now(),
    })
  }

  protected emitDisconnect(timestamp?: number): void {
    this._isConnected = false
    this._deviceName = null
    this.eventsSubject.next({
      type: 'disconnect',
      timestamp: timestamp ?? Date.now(),
    })
  }

  protected emitFacelets(facelets: string, timestamp?: number): void {
    this.eventsSubject.next({
      type: 'facelets',
      facelets,
      timestamp: timestamp ?? Date.now(),
    })
  }

  destroy(): void {
    this.disconnect()
    this.eventsSubject.complete()
  }
}
