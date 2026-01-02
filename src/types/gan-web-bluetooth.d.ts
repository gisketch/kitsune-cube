declare module 'gan-web-bluetooth' {
  export type MacAddressProvider = (
    device: BluetoothDevice,
    isFallbackCall?: boolean,
  ) => Promise<string | null>

  export interface GanCubeConnection {
    events$: import('rxjs').Observable<GanCubeEvent>
    deviceName: string
    disconnect(): Promise<void>
    sendCubeCommand(cmd: { type: string }): Promise<void>
  }

  export interface GanCubeEvent {
    type: 'GYRO' | 'MOVE' | 'FACELETS' | 'HARDWARE' | 'BATTERY' | 'DISCONNECT'
    timestamp?: number
    quaternion?: { x: number; y: number; z: number; w: number }
    move?: string
    facelets?: string
    hardwareName?: string
    hardwareVersion?: string
    softwareVersion?: string
    gyroSupported?: boolean
    batteryLevel?: number
  }

  export function connectGanCube(
    macAddressProvider?: MacAddressProvider,
  ): Promise<GanCubeConnection>

  export const cubeTimestampLinearFit: unknown
  export const cubeTimestampCalcSkew: unknown
  export const makeTimeFromTimestamp: unknown
}
