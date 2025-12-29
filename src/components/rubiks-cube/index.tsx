import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { RubiksCube, type RubiksCubeRef } from './RubiksCube'
import { useRef, useEffect, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useGanCube } from '@/hooks/useGanCube'
import { Loader2, Bluetooth, RefreshCw } from 'lucide-react'
import { ConnectionModal } from '@/components/connection-modal'

interface RubiksCubeViewerProps {
  className?: string
}

export function RubiksCubeViewer({ className }: RubiksCubeViewerProps) {
  const cubeRef = useRef<RubiksCubeRef>(null)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: 'success' | 'error'
    title: string
    message: string
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  })
  
  const [lastMove, setLastMove] = useState<string>('')
  
  const handleMove = useCallback((move: string) => {
    setLastMove(move)
    cubeRef.current?.performMove(move)
  }, [])

  const { 
    connect, 
    disconnect, 
    isConnected, 
    isConnecting, 
    quaternionRef, 
    resetGyro,
    error,
    deviceName,
    clearError,
    isMacAddressRequired,
    submitMacAddress,
    debugLog
  } = useGanCube(handleMove)

  // Handle connection success
  useEffect(() => {
    if (isConnected) {
      setModalState({
        isOpen: true,
        type: 'success',
        title: 'Connected Successfully',
        message: `Successfully connected to ${deviceName || 'GAN Cube'}. You can now track your solves in real-time.`
      })
    }
  }, [isConnected, deviceName])

  // Handle connection error or MAC requirement
  useEffect(() => {
    if (isMacAddressRequired) {
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Manual MAC Address Required',
        message: 'Unable to determine cube MAC address automatically. Please enter it manually to proceed.'
      })
    } else if (error) {
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Connection Failed',
        message: error
      })
    }
  }, [error, isMacAddressRequired])

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }))
    if (error || isMacAddressRequired) clearError()
  }

  return (
    <div className={className}>
      <ConnectionModal 
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        isMacRequired={isMacAddressRequired}
        onSubmitMac={submitMacAddress}
      />

      <div className="relative h-full w-full">
        <Canvas camera={{ position: [6, 4.5, 6], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={0.5} />
          <directionalLight position={[-10, -10, -5]} intensity={0.2} />
          <RubiksCube ref={cubeRef} quaternionRef={quaternionRef} />
          <OrbitControls
            enablePan={false}
            minDistance={5}
            maxDistance={12}
            enableDamping
            dampingFactor={0.05}
          />
          <Environment preset="studio" />
        </Canvas>

        {/* Connection Controls */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <Button 
              variant={isConnected ? "secondary" : "default"}
              onClick={isConnected ? disconnect : connect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Bluetooth className="mr-2 h-4 w-4" />
              )}
              {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect Cube' : 'Connect Cube'}
            </Button>
            
            {isConnected && (
              <Button variant="secondary" onClick={resetGyro}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset Gyro
              </Button>
            )}
          </div>
          
          {isConnected && lastMove && (
            <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-md text-sm font-mono w-fit">
              Last Move: {lastMove}
            </div>
          )}

          {/* Debug Tools */}
          <div className="flex flex-col gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => handleMove("U")}>
              Test Move "U"
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleMove("R")}>
              Test Move "R"
            </Button>
          </div>

          {/* Debug Log */}
          <div className="bg-black/80 text-green-400 p-2 rounded text-xs font-mono h-40 overflow-y-auto w-64 pointer-events-auto">
            <div className="font-bold border-b border-green-800 mb-1">Debug Log</div>
            {debugLog.length === 0 && <div className="opacity-50">No events yet...</div>}
            {debugLog.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
