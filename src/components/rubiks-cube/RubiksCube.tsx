import * as THREE from 'three'
import { useMemo, useState, useRef, forwardRef, useImperativeHandle, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'

const CUBE_SIZE = 0.95
const GAP = 0.00 // Very small gap
const OFFSET = 1 + GAP

// Stickerless colors (vibrant)
const COLORS = {
  white: '#ffffff',
  yellow: '#ffd500',
  red: '#b90000',
  orange: '#ff5900',
  blue: '#0045ad',
  green: '#009b48',
  inner: '#0a0a0a',
}

type PieceType = 'corner' | 'edge' | 'center'
type FacePosition = 'top' | 'bottom' | 'left' | 'right' | 'front' | 'back'

interface CubieFaceProps {
  pieceType: PieceType
  color: string
  rotation?: number
}

// Geometry constants
const FACE_SIZE = CUBE_SIZE * 0.48 // Increased back to cover more
const EXTRUDE_SETTINGS = {
  depth: 0.04, // Thin cap
  bevelEnabled: true,
  bevelThickness: 0.02,
  bevelSize: 0.02,
  bevelSegments: 4,
}

function createCornerShape(): THREE.Shape {
  const size = FACE_SIZE
  const radius = 0.08
  const shape = new THREE.Shape()

  shape.moveTo(-size + radius, -size)
  shape.lineTo(size - radius, -size)
  shape.quadraticCurveTo(size, -size, size, -size + radius)
  shape.lineTo(size, size - radius)
  shape.quadraticCurveTo(size, size, size - radius, size)
  shape.lineTo(-size + radius, size)
  shape.quadraticCurveTo(-size, size, -size, size - radius)
  shape.lineTo(-size, -size + radius)
  shape.quadraticCurveTo(-size, -size, -size + radius, -size)

  return shape
}

function createEdgeShape(): THREE.Shape {
  const size = FACE_SIZE
  const smallRadius = 0.04
  const bigRadius = 0.25

  const shape = new THREE.Shape()

  // Orientation: +y is "Outside", -y is "Inside"
  // Top-Left (-x, +y) & Top-Right (+x, +y): Small Radius
  // Bottom-Left (-x, -y) & Bottom-Right (+x, -y): Big Radius

  // Start from bottom-left
  shape.moveTo(-size + bigRadius, -size)
  
  // Bottom edge to bottom-right
  shape.lineTo(size - bigRadius, -size)
  shape.quadraticCurveTo(size, -size, size, -size + bigRadius)
  
  // Right edge to top-right
  shape.lineTo(size, size - smallRadius)
  shape.quadraticCurveTo(size, size, size - smallRadius, size)
  
  // Top edge to top-left
  shape.lineTo(-size + smallRadius, size)
  shape.quadraticCurveTo(-size, size, -size, size - smallRadius)
  
  // Left edge to bottom-left
  shape.lineTo(-size, -size + bigRadius)
  shape.quadraticCurveTo(-size, -size, -size + bigRadius, -size)

  return shape
}

function createCenterShape(): THREE.Shape {
  const size = FACE_SIZE
  const chamfer = 0.15 // Diagonal corners
  const shape = new THREE.Shape()

  shape.moveTo(-size + chamfer, -size)
  shape.lineTo(size - chamfer, -size)
  shape.lineTo(size, -size + chamfer)
  shape.lineTo(size, size - chamfer)
  shape.lineTo(size - chamfer, size)
  shape.lineTo(-size + chamfer, size)
  shape.lineTo(-size, size - chamfer)
  shape.lineTo(-size, -size + chamfer)
  shape.closePath()

  return shape
}

function CubieFace({ pieceType, color, rotation = 0 }: CubieFaceProps) {
  const geometry = useMemo(() => {
    let shape: THREE.Shape

    if (pieceType === 'corner') {
      shape = createCornerShape()
    } else if (pieceType === 'edge') {
      shape = createEdgeShape()
    } else {
      shape = createCenterShape()
    }

    // Center the geometry
    const geo = new THREE.ExtrudeGeometry(shape, EXTRUDE_SETTINGS)
    geo.center()
    return geo
  }, [pieceType])

  return (
    <mesh geometry={geometry} rotation={[0, 0, rotation]}>
      <meshPhysicalMaterial
        color={color}
        roughness={0.2}
        metalness={0.0}
        clearcoat={0.3}
        clearcoatRoughness={0.1}
        reflectivity={0.1}
      />
    </mesh>
  )
}

interface CubieProps {
  position: [number, number, number]
  colors: {
    top?: string
    bottom?: string
    left?: string
    right?: string
    front?: string
    back?: string
  }
  pieceType: PieceType
  coords: { x: number; y: number; z: number }
}

function getFaceRotation(
  face: FacePosition,
  x: number,
  y: number,
  z: number
): number {
  // Returns rotation in radians for the face shape
  // Goal: Align shape's +y (Outside) with the cube's outer edge direction

  if (face === 'top') {
    // Top Face (y=1). Default Up points to Back (-z)
    if (z === 1) return Math.PI // Front Edge -> Rotate 180
    if (z === -1) return 0 // Back Edge -> Rotate 0
    if (x === 1) return -Math.PI / 2 // Right Edge -> Rotate -90
    if (x === -1) return Math.PI / 2 // Left Edge -> Rotate 90
  }

  if (face === 'bottom') {
    // Bottom Face (y=-1). Default Up points to Front (+z)
    if (z === 1) return 0 // Front Edge -> Rotate 0
    if (z === -1) return Math.PI // Back Edge -> Rotate 180
    if (x === 1) return -Math.PI / 2 // Right Edge -> Rotate -90
    if (x === -1) return Math.PI / 2 // Left Edge -> Rotate 90
  }

  if (face === 'front') {
    // Front Face (z=1). Default Up points to Top (+y)
    if (y === 1) return 0 // Top Edge -> Rotate 0
    if (y === -1) return Math.PI // Bottom Edge -> Rotate 180
    if (x === 1) return -Math.PI / 2 // Right Edge -> Rotate -90
    if (x === -1) return Math.PI / 2 // Left Edge -> Rotate 90
  }

  if (face === 'back') {
    // Back Face (z=-1). Default Up points to Top (+y)
    if (y === 1) return 0 // Top Edge -> Rotate 0
    if (y === -1) return Math.PI // Bottom Edge -> Rotate 180
    if (x === 1) return Math.PI / 2 // Right Edge (World Right) -> Rotate 90
    if (x === -1) return -Math.PI / 2 // Left Edge (World Left) -> Rotate -90
  }

  if (face === 'right') {
    // Right Face (x=1). Default Up points to Top (+y)
    if (y === 1) return 0 // Top Edge -> Rotate 0
    if (y === -1) return Math.PI // Bottom Edge -> Rotate 180
    if (z === 1) return Math.PI / 2 // Front Edge -> Rotate 90
    if (z === -1) return -Math.PI / 2 // Back Edge -> Rotate -90
  }

  if (face === 'left') {
    // Left Face (x=-1). Default Up points to Top (+y)
    if (y === 1) return 0 // Top Edge -> Rotate 0
    if (y === -1) return Math.PI // Bottom Edge -> Rotate 180
    if (z === 1) return -Math.PI / 2 // Front Edge -> Rotate -90
    if (z === -1) return Math.PI / 2 // Back Edge -> Rotate 90
  }

  return 0
}

function Cubie({ position, colors, pieceType, coords, name }: CubieProps & { name: string }) {
  // Position faces slightly outside the inner box
  const faceOffset = CUBE_SIZE * 0.46

  // Custom geometry for center piece body
  const centerBodyGeometry = useMemo(() => {
    if (pieceType !== 'center') return null
    const shape = createCenterShape()
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: CUBE_SIZE * 0.92,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 4,
    })
    geo.center()
    return geo
  }, [pieceType])

  return (
    <group position={position} name={name}>
      {/* Inner black mechanism */}
      {pieceType === 'center' ? (
        // For center pieces, use the hexagonal shape for the body too
        // We need to rotate it to match the face orientation
        <group rotation={
          // Determine rotation based on which face is colored
          colors.top ? [-Math.PI / 2, 0, 0] :
          colors.bottom ? [Math.PI / 2, 0, 0] :
          colors.front ? [0, 0, 0] :
          colors.back ? [0, Math.PI, 0] :
          colors.right ? [0, Math.PI / 2, 0] :
          colors.left ? [0, -Math.PI / 2, 0] : [0, 0, 0]
        }>
          <mesh geometry={centerBodyGeometry!}>
            <meshStandardMaterial
              color={COLORS.inner}
              roughness={0.6}
              metalness={0.4}
            />
          </mesh>
        </group>
      ) : (
        // For corners and edges, use a slightly smaller rounded box
        // This prevents the "ball inside" look while keeping it smooth
        <RoundedBox
          args={[CUBE_SIZE * 0.96, CUBE_SIZE * 0.96, CUBE_SIZE * 0.96]}
          radius={0.08} // Sharper corners to match faces better
          smoothness={4}
        >
          <meshStandardMaterial
            color={COLORS.inner}
            roughness={0.6}
            metalness={0.4}
          />
        </RoundedBox>
      )}

      {colors.top && (
        <group position={[0, faceOffset, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <CubieFace
            pieceType={pieceType}
            color={colors.top}
            rotation={getFaceRotation('top', coords.x, coords.y, coords.z)}
          />
        </group>
      )}
      {colors.bottom && (
        <group position={[0, -faceOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <CubieFace
            pieceType={pieceType}
            color={colors.bottom}
            rotation={getFaceRotation('bottom', coords.x, coords.y, coords.z)}
          />
        </group>
      )}
      {colors.front && (
        <group position={[0, 0, faceOffset]}>
          <CubieFace
            pieceType={pieceType}
            color={colors.front}
            rotation={getFaceRotation('front', coords.x, coords.y, coords.z)}
          />
        </group>
      )}
      {colors.back && (
        <group position={[0, 0, -faceOffset]} rotation={[0, Math.PI, 0]}>
          <CubieFace
            pieceType={pieceType}
            color={colors.back}
            rotation={getFaceRotation('back', coords.x, coords.y, coords.z)}
          />
        </group>
      )}
      {colors.right && (
        <group position={[faceOffset, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <CubieFace
            pieceType={pieceType}
            color={colors.right}
            rotation={getFaceRotation('right', coords.x, coords.y, coords.z)}
          />
        </group>
      )}
      {colors.left && (
        <group position={[-faceOffset, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <CubieFace
            pieceType={pieceType}
            color={colors.left}
            rotation={getFaceRotation('left', coords.x, coords.y, coords.z)}
          />
        </group>
      )}
    </group>
  )
}

function getPieceType(x: number, y: number, z: number): PieceType {
  const nonZeroCount = [x, y, z].filter((v) => v !== 0).length
  if (nonZeroCount === 3) return 'corner'
  if (nonZeroCount === 2) return 'edge'
  return 'center'
}

function getCubieColors(
  x: number,
  y: number,
  z: number
): CubieProps['colors'] {
  const colors: CubieProps['colors'] = {}

  if (y === 1) colors.top = COLORS.white
  if (y === -1) colors.bottom = COLORS.yellow
  if (z === 1) colors.front = COLORS.green
  if (z === -1) colors.back = COLORS.blue
  if (x === 1) colors.right = COLORS.red
  if (x === -1) colors.left = COLORS.orange

  return colors
}

export interface RubiksCubeRef {
  performMove: (move: string) => void
}

interface RubiksCubeProps {
  quaternionRef?: React.MutableRefObject<THREE.Quaternion>
}

export const RubiksCube = memo(forwardRef<RubiksCubeRef, RubiksCubeProps>(({ quaternionRef }, ref) => {
  const groupRef = useRef<THREE.Group>(null)
  
  // Smooth gyro interpolation
  useFrame((_, delta) => {
    if (groupRef.current && quaternionRef?.current) {
      // Slerp towards the target quaternion
      // Adjust speed (15) for smoothness vs responsiveness
      groupRef.current.quaternion.slerp(quaternionRef.current, 15 * delta)
    }
  })
  
  // Store logical state of the cube
  // Map of position string "x,y,z" to current cubie data
  const [cubeState] = useState<{
    [key: string]: {
      initialPos: [number, number, number]
      currentPos: [number, number, number]
      rotation: [number, number, number]
      colors: CubieProps['colors']
      pieceType: PieceType
      name: string
    }
  }>(() => {
    const state: any = {}
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue
          const key = `${x},${y},${z}`
          state[key] = {
            initialPos: [x * OFFSET, y * OFFSET, z * OFFSET],
            currentPos: [x, y, z],
            rotation: [0, 0, 0],
            colors: getCubieColors(x, y, z),
            pieceType: getPieceType(x, y, z),
            name: key
          }
        }
      }
    }
    return state
  })

  // Animation state
  const animationQueue = useRef<{ axis: 'x'|'y'|'z', layer: number, angle: number }[]>([])
  const currentAnimation = useRef<{ 
    axis: 'x'|'y'|'z', 
    layer: number, 
    targetAngle: number, 
    currentAngle: number,
    cubies: THREE.Object3D[] 
  } | null>(null)

  useImperativeHandle(ref, () => ({
    performMove: (move: string) => {
      const cleanMove = move.trim()
      console.log('Performing move:', cleanMove)
      const moveMap: any = {
        'U': { axis: 'y', layer: 1, angle: -Math.PI / 2 },
        "U'": { axis: 'y', layer: 1, angle: Math.PI / 2 },
        'U2': { axis: 'y', layer: 1, angle: -Math.PI },
        "U2'": { axis: 'y', layer: 1, angle: Math.PI },
        
        'D': { axis: 'y', layer: -1, angle: Math.PI / 2 },
        "D'": { axis: 'y', layer: -1, angle: -Math.PI / 2 },
        'D2': { axis: 'y', layer: -1, angle: Math.PI },
        "D2'": { axis: 'y', layer: -1, angle: -Math.PI },

        'L': { axis: 'x', layer: -1, angle: Math.PI / 2 },
        "L'": { axis: 'x', layer: -1, angle: -Math.PI / 2 },
        'L2': { axis: 'x', layer: -1, angle: Math.PI },
        "L2'": { axis: 'x', layer: -1, angle: -Math.PI },

        'R': { axis: 'x', layer: 1, angle: -Math.PI / 2 },
        "R'": { axis: 'x', layer: 1, angle: Math.PI / 2 },
        'R2': { axis: 'x', layer: 1, angle: -Math.PI },
        "R2'": { axis: 'x', layer: 1, angle: Math.PI },

        'F': { axis: 'z', layer: 1, angle: -Math.PI / 2 },
        "F'": { axis: 'z', layer: 1, angle: Math.PI / 2 },
        'F2': { axis: 'z', layer: 1, angle: -Math.PI },
        "F2'": { axis: 'z', layer: 1, angle: Math.PI },

        'B': { axis: 'z', layer: -1, angle: Math.PI / 2 },
        "B'": { axis: 'z', layer: -1, angle: -Math.PI / 2 },
        'B2': { axis: 'z', layer: -1, angle: Math.PI },
        "B2'": { axis: 'z', layer: -1, angle: -Math.PI },
      }
      
      if (moveMap[cleanMove]) {
        animationQueue.current.push(moveMap[cleanMove])
      } else {
        console.warn('Unknown move:', cleanMove)
      }
    }
  }))

  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Start new animation if queue has items and not currently animating
    if (!currentAnimation.current && animationQueue.current.length > 0) {
      const nextMove = animationQueue.current.shift()!
      console.log('Starting animation for move:', nextMove)
      
      // Find cubies in the layer
      const targetCubies: THREE.Object3D[] = []
      
      // We need to find which cubies are currently in the target layer
      // Since we rotate the objects, their world position changes.
      // We can check their position relative to the group.
      
      groupRef.current.children.forEach(child => {
        // Round position to nearest integer to handle float errors
        const x = child.position.x / OFFSET
        const y = child.position.y / OFFSET
        const z = child.position.z / OFFSET
        
        if (nextMove.axis === 'x' && Math.abs(x - nextMove.layer) < 0.1) targetCubies.push(child)
        if (nextMove.axis === 'y' && Math.abs(y - nextMove.layer) < 0.1) targetCubies.push(child)
        if (nextMove.axis === 'z' && Math.abs(z - nextMove.layer) < 0.1) targetCubies.push(child)
      })

      console.log(`Found ${targetCubies.length} cubies for layer ${nextMove.axis}=${nextMove.layer}`)

      currentAnimation.current = {
        ...nextMove,
        currentAngle: 0,
        targetAngle: nextMove.angle,
        cubies: targetCubies
      }
    }

    // Process current animation
    if (currentAnimation.current) {
      const anim = currentAnimation.current
      const speed = 15 // Increased speed for responsiveness
      const step = anim.targetAngle > 0 ? speed * delta : -speed * delta
      
      let finished = false
      let rotationStep = step
      
      // Check if we overshoot or reach target
      if ((anim.targetAngle > 0 && anim.currentAngle + step >= anim.targetAngle) ||
          (anim.targetAngle < 0 && anim.currentAngle + step <= anim.targetAngle)) {
        rotationStep = anim.targetAngle - anim.currentAngle
        finished = true
      }

      // Apply rotation to each cubie
      // We rotate around the group's local axis
      const axisVector = new THREE.Vector3(
        anim.axis === 'x' ? 1 : 0,
        anim.axis === 'y' ? 1 : 0,
        anim.axis === 'z' ? 1 : 0
      )

      const rotQuat = new THREE.Quaternion().setFromAxisAngle(axisVector, rotationStep)

      anim.cubies.forEach(cubie => {
        // Rotate position (works in local space)
        cubie.position.applyAxisAngle(axisVector, rotationStep)
        // Rotate orientation (premultiply to apply rotation in parent's frame)
        cubie.quaternion.premultiply(rotQuat)
      })

      anim.currentAngle += rotationStep

      if (finished) {
        // Snap positions to grid to prevent drift
        anim.cubies.forEach(cubie => {
          cubie.position.x = Math.round(cubie.position.x / OFFSET) * OFFSET
          cubie.position.y = Math.round(cubie.position.y / OFFSET) * OFFSET
          cubie.position.z = Math.round(cubie.position.z / OFFSET) * OFFSET
          
          cubie.updateMatrix()
        })
        currentAnimation.current = null
      }
    }
  })

  return (
    <group ref={groupRef}>
      {Object.values(cubeState).map((cubie) => (
        <Cubie
          key={cubie.name}
          name={cubie.name}
          position={cubie.initialPos}
          colors={cubie.colors}
          pieceType={cubie.pieceType}
          coords={{ x: cubie.currentPos[0], y: cubie.currentPos[1], z: cubie.currentPos[2] }}
        />
      ))}
    </group>
  )
}))
