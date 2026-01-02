import { useState, useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import {
  createAdapter,
  getBrandInfo,
  type CubeBrand,
  type SmartCubeAdapter,
} from '@/lib/cube-protocols'

const MAC_ADDRESS_STORAGE_KEY = 'smart-cube-mac-address'

export interface SmartCubeState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  deviceName: string | null
  isMacAddressRequired: boolean
  debugLog: string[]
  batteryLevel: number | null
  brand: CubeBrand | null
  hasGyroscope: boolean
  isExperimental: boolean
}

interface UseSmartCubeOptions {
  onMove?: (move: string) => void
  savedMacAddress?: string | null
  onMacAddressResolved?: (mac: string) => void
  defaultBrand?: CubeBrand
}

export function useSmartCube(options: UseSmartCubeOptions = {}) {
  const { onMove, savedMacAddress, onMacAddressResolved, defaultBrand } = options
  
  const [state, setState] = useState<SmartCubeState>(() => {
    const brand = defaultBrand || null
    const brandInfo = brand ? getBrandInfo(brand) : null
    
    return {
      isConnected: false,
      isConnecting: false,
      error: null,
      deviceName: null,
      isMacAddressRequired: false,
      debugLog: [],
      batteryLevel: null,
      brand,
      hasGyroscope: brandInfo?.hasGyro ?? false,
      isExperimental: brandInfo?.experimental ?? false,
    }
  })

  const addLog = useCallback((msg: string) => {
    setState((prev) => ({
      ...prev,
      debugLog: [msg, ...prev.debugLog].slice(0, 20),
    }))
  }, [])

  const adapterRef = useRef<SmartCubeAdapter | null>(null)
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const gyroOffsetRef = useRef<THREE.Quaternion>(new THREE.Quaternion())
  const rawQuaternionRef = useRef<THREE.Quaternion>(new THREE.Quaternion())
  const resolveMacPromiseRef = useRef<((mac: string | null) => void) | null>(null)
  const quaternionRef = useRef<THREE.Quaternion>(new THREE.Quaternion())
  const onMoveRef = useRef(onMove)

  useEffect(() => {
    onMoveRef.current = onMove
  }, [onMove])

  const setBrand = useCallback((brand: CubeBrand) => {
    const brandInfo = getBrandInfo(brand)
    setState((prev) => ({
      ...prev,
      brand,
      hasGyroscope: brandInfo.hasGyro,
      isExperimental: brandInfo.experimental,
    }))
  }, [])

  const connect = useCallback(async (brandOverride?: CubeBrand) => {
    const brand = brandOverride || state.brand
    if (!brand) {
      setState((prev) => ({ ...prev, error: 'Please select a cube brand first' }))
      return
    }
    
    if (state.isConnected || state.isConnecting) return

    setState((prev) => ({ 
      ...prev, 
      isConnecting: true, 
      error: null, 
      isMacAddressRequired: false,
      brand,
    }))
    
    const brandInfo = getBrandInfo(brand)
    addLog(`Starting ${brandInfo.displayName} connection...`)

    try {
      const adapter = createAdapter(brand)
      adapterRef.current = adapter
      
      subscriptionRef.current = adapter.events$.subscribe((event) => {
        switch (event.type) {
          case 'move':
            addLog(`MOVE: ${event.move}`)
            onMoveRef.current?.(event.move)
            break
          case 'gyro':
            if (event.quaternion) {
              const { x, y, z, w } = event.quaternion
              const rawQuat = new THREE.Quaternion(x, z, -y, w)
              rawQuaternionRef.current.copy(rawQuat)
              const correctedQuat = gyroOffsetRef.current.clone().multiply(rawQuat)
              quaternionRef.current.copy(correctedQuat)
            }
            break
          case 'battery':
            addLog(`Battery: ${event.level}%`)
            setState((prev) => ({ ...prev, batteryLevel: event.level ?? null }))
            break
          case 'disconnect':
            addLog('Disconnected')
            setState((prev) => ({ ...prev, isConnected: false, batteryLevel: null }))
            adapterRef.current = null
            break
        }
      })
      
      const macResolver = async (): Promise<string | null> => {
        const storedMac = savedMacAddress || localStorage.getItem(MAC_ADDRESS_STORAGE_KEY)
        if (storedMac) {
          addLog(`Using saved MAC address: ${storedMac}`)
          return storedMac
        }
        
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
      
      await adapter.connect({ macAddressProvider: macResolver })

      try {
        await adapter.requestFacelets()
        await adapter.requestBattery()
      } catch (e) {
        console.warn('Failed to request initial state', e)
      }

      addLog('Connected successfully')

      setState((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        deviceName: brandInfo.displayName,
        error: null,
        isMacAddressRequired: false,
        hasGyroscope: brandInfo.hasGyro,
        isExperimental: brandInfo.experimental,
      }))
    } catch (error: any) {
      console.error(`Failed to connect to ${brand} cube:`, error)
      addLog(`Connection failed: ${error.message}`)
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
      adapterRef.current = null
      
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to connect to cube',
        isMacAddressRequired: false,
      }))
    }
  }, [state.brand, state.isConnected, state.isConnecting, addLog, savedMacAddress])

  const submitMacAddress = useCallback((mac: string) => {
    if (resolveMacPromiseRef.current) {
      localStorage.setItem(MAC_ADDRESS_STORAGE_KEY, mac)
      onMacAddressResolved?.(mac)
      resolveMacPromiseRef.current(mac)
      resolveMacPromiseRef.current = null
      setState((prev) => ({ ...prev, isMacAddressRequired: false, error: null }))
    }
  }, [onMacAddressResolved])

  const clearSavedMacAddress = useCallback(() => {
    localStorage.removeItem(MAC_ADDRESS_STORAGE_KEY)
  }, [])

  const disconnect = useCallback(async () => {
    subscriptionRef.current?.unsubscribe()
    subscriptionRef.current = null
    
    if (adapterRef.current) {
      await adapterRef.current.disconnect()
      adapterRef.current = null
      setState((prev) => ({
        ...prev,
        isConnected: false,
        deviceName: null,
        isMacAddressRequired: false,
      }))
    }
  }, [])

  const refreshBattery = useCallback(async () => {
    if (adapterRef.current) {
      try {
        await adapterRef.current.requestBattery?.()
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
    gyroOffsetRef.current.copy(rawQuaternionRef.current).invert()
    quaternionRef.current.set(0, 0, 0, 1)
  }, [])
  
  const getAdapter = useCallback(() => adapterRef.current, [])

  useEffect(() => {
    return () => {
      subscriptionRef.current?.unsubscribe()
      adapterRef.current?.disconnect()
    }
  }, [])

  return {
    ...state,
    connect,
    disconnect,
    resetGyro,
    clearError,
    submitMacAddress,
    clearSavedMacAddress,
    quaternionRef,
    refreshBattery,
    setBrand,
    getAdapter,
  }
}

export { MAC_ADDRESS_STORAGE_KEY }
