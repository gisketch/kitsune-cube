import { useState, useRef, useCallback, useEffect } from 'react'
import { connectGanCube, type GanCubeConnection, type GanCubeEvent } from 'gan-web-bluetooth'
import * as THREE from 'three'

export interface GanCubeState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  deviceName: string | null
  isMacAddressRequired: boolean
  debugLog: string[]
  batteryLevel: number | null
}

export function useGanCube(onMove?: (move: string) => void) {
  const [state, setState] = useState<GanCubeState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    deviceName: null,
    isMacAddressRequired: false,
    debugLog: [],
    batteryLevel: null,
  })

  const addLog = useCallback((msg: string) => {
    setState((prev) => ({
      ...prev,
      debugLog: [msg, ...prev.debugLog].slice(0, 20),
    }))
  }, [])

  const connectionRef = useRef<GanCubeConnection | null>(null)
  const gyroOffsetRef = useRef<THREE.Quaternion>(new THREE.Quaternion())
  const rawQuaternionRef = useRef<THREE.Quaternion>(new THREE.Quaternion())
  const resolveMacPromiseRef = useRef<((mac: string | null) => void) | null>(null)

  // Refs for exposing data without re-renders
  const quaternionRef = useRef<THREE.Quaternion>(new THREE.Quaternion())
  const onMoveRef = useRef(onMove)

  useEffect(() => {
    onMoveRef.current = onMove
  }, [onMove])

  const handleEvent = useCallback(
    (event: GanCubeEvent) => {
      if (event.type === 'GYRO') {
        const { x, y, z, w } = event.quaternion

        const rawQuat = new THREE.Quaternion(x, z, -y, w)
        rawQuaternionRef.current.copy(rawQuat)

        const correctedQuat = gyroOffsetRef.current.clone().multiply(rawQuat)

        quaternionRef.current.copy(correctedQuat)
      } else if (event.type === 'MOVE') {
        const msg = `MOVE: ${event.move} (face: ${event.face}, dir: ${event.direction})`
        addLog(msg)
        onMoveRef.current?.(event.move)
      } else if (event.type === 'BATTERY') {
        addLog(`Battery: ${event.batteryLevel}%`)
        setState((prev) => ({ ...prev, batteryLevel: event.batteryLevel }))
      } else if (event.type === 'DISCONNECT') {
        addLog('Disconnected')
        setState((prev) => ({ ...prev, isConnected: false, batteryLevel: null }))
        connectionRef.current = null
      } else {
        addLog(`Event: ${event.type}`)
      }
    },
    [addLog],
  )

  const connect = useCallback(async () => {
    if (state.isConnected || state.isConnecting) return

    setState((prev) => ({ ...prev, isConnecting: true, error: null, isMacAddressRequired: false }))
    addLog('Starting connection...')

    try {
      const conn = await connectGanCube(async (_device: any, isFallbackCall?: boolean) => {
        if (isFallbackCall) {
          addLog('MAC Address required')
          setState((prev) => ({
            ...prev,
            isMacAddressRequired: true,
            error: 'Unable to determine cube MAC address automatically. Please enter it manually.',
          }))
          return new Promise<string | null>((resolve) => {
            resolveMacPromiseRef.current = resolve
          })
        }
        return null
      })
      connectionRef.current = conn

      conn.events$.subscribe(handleEvent)

      // Request initial state
      try {
        await conn.sendCubeCommand({ type: 'REQUEST_FACELETS' })
        await conn.sendCubeCommand({ type: 'REQUEST_BATTERY' })
      } catch (e) {
        console.warn('Failed to send initial commands', e)
      }

      addLog('Connected successfully')

      setState((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        deviceName: 'GAN Cube',
        error: null,
        isMacAddressRequired: false,
      }))
    } catch (error: any) {
      console.error('Failed to connect to GAN cube:', error)
      addLog(`Connection failed: ${error.message}`)
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect to cube',
        isMacAddressRequired: false,
      }))
    }
  }, [state.isConnected, state.isConnecting, handleEvent, addLog])

  const submitMacAddress = useCallback((mac: string) => {
    if (resolveMacPromiseRef.current) {
      resolveMacPromiseRef.current(mac)
      resolveMacPromiseRef.current = null
      setState((prev) => ({ ...prev, isMacAddressRequired: false, error: null }))
    }
  }, [])

  const disconnect = useCallback(async () => {
    if (connectionRef.current) {
      connectionRef.current.disconnect()
      connectionRef.current = null
      setState((prev) => ({
        ...prev,
        isConnected: false,
        deviceName: null,
        isMacAddressRequired: false,
      }))
    }
  }, [])

  const refreshBattery = useCallback(async () => {
    if (connectionRef.current) {
      try {
        await connectionRef.current.sendCubeCommand({ type: 'REQUEST_BATTERY' })
      } catch (e) {
        console.warn('Failed to request battery', e)
      }
    }
  }, [])

  const clearError = useCallback(() => {
    if (resolveMacPromiseRef.current) {
      resolveMacPromiseRef.current(null)
      resolveMacPromiseRef.current = null
    }
    setState((prev) => ({ ...prev, error: null, isMacAddressRequired: false }))
  }, [])

  const resetGyro = useCallback(() => {
    // Set offset such that current raw becomes the identity orientation
    // The user should hold the cube with white on top and green facing front
    // This means current raw should map to identity (no rotation)
    // offset = raw.inverse()
    gyroOffsetRef.current.copy(rawQuaternionRef.current).invert()

    // Reset the displayed quaternion to identity immediately
    quaternionRef.current.set(0, 0, 0, 1)
  }, [])

  return {
    ...state,
    connect,
    disconnect,
    resetGyro,
    clearError,
    submitMacAddress,
    quaternionRef,
    refreshBattery,
  }
}
