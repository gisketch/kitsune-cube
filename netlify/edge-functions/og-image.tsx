import React from 'https://esm.sh/react@18.2.0'
import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.6/mod.ts'

const CUBE_COLORS: Record<string, string> = {
  W: '#FFFFFF',
  Y: '#FFEB3B',
  R: '#F44336',
  O: '#FF9800',
  B: '#2196F3',
  G: '#4CAF50',
}

const MOVES: Record<string, (cube: Record<string, string[]>) => void> = {
  R: (c) => { const t = [...c.U]; [c.U[2], c.U[5], c.U[8]] = [c.F[2], c.F[5], c.F[8]]; [c.F[2], c.F[5], c.F[8]] = [c.D[2], c.D[5], c.D[8]]; [c.D[2], c.D[5], c.D[8]] = [c.B[6], c.B[3], c.B[0]]; [c.B[6], c.B[3], c.B[0]] = [t[2], t[5], t[8]]; rotateFaceCW(c, 'R') },
  "R'": (c) => { for (let i = 0; i < 3; i++) MOVES.R(c) },
  R2: (c) => { for (let i = 0; i < 2; i++) MOVES.R(c) },
  L: (c) => { const t = [...c.U]; [c.U[0], c.U[3], c.U[6]] = [c.B[8], c.B[5], c.B[2]]; [c.B[8], c.B[5], c.B[2]] = [c.D[0], c.D[3], c.D[6]]; [c.D[0], c.D[3], c.D[6]] = [c.F[0], c.F[3], c.F[6]]; [c.F[0], c.F[3], c.F[6]] = [t[0], t[3], t[6]]; rotateFaceCW(c, 'L') },
  "L'": (c) => { for (let i = 0; i < 3; i++) MOVES.L(c) },
  L2: (c) => { for (let i = 0; i < 2; i++) MOVES.L(c) },
  U: (c) => { const t = [...c.F]; [c.F[0], c.F[1], c.F[2]] = [c.R[0], c.R[1], c.R[2]]; [c.R[0], c.R[1], c.R[2]] = [c.B[0], c.B[1], c.B[2]]; [c.B[0], c.B[1], c.B[2]] = [c.L[0], c.L[1], c.L[2]]; [c.L[0], c.L[1], c.L[2]] = [t[0], t[1], t[2]]; rotateFaceCW(c, 'U') },
  "U'": (c) => { for (let i = 0; i < 3; i++) MOVES.U(c) },
  U2: (c) => { for (let i = 0; i < 2; i++) MOVES.U(c) },
  D: (c) => { const t = [...c.F]; [c.F[6], c.F[7], c.F[8]] = [c.L[6], c.L[7], c.L[8]]; [c.L[6], c.L[7], c.L[8]] = [c.B[6], c.B[7], c.B[8]]; [c.B[6], c.B[7], c.B[8]] = [c.R[6], c.R[7], c.R[8]]; [c.R[6], c.R[7], c.R[8]] = [t[6], t[7], t[8]]; rotateFaceCW(c, 'D') },
  "D'": (c) => { for (let i = 0; i < 3; i++) MOVES.D(c) },
  D2: (c) => { for (let i = 0; i < 2; i++) MOVES.D(c) },
  F: (c) => { const t = [...c.U]; [c.U[6], c.U[7], c.U[8]] = [c.L[8], c.L[5], c.L[2]]; [c.L[2], c.L[5], c.L[8]] = [c.D[0], c.D[1], c.D[2]]; [c.D[0], c.D[1], c.D[2]] = [c.R[6], c.R[3], c.R[0]]; [c.R[0], c.R[3], c.R[6]] = [t[6], t[7], t[8]]; rotateFaceCW(c, 'F') },
  "F'": (c) => { for (let i = 0; i < 3; i++) MOVES.F(c) },
  F2: (c) => { for (let i = 0; i < 2; i++) MOVES.F(c) },
  B: (c) => { const t = [...c.U]; [c.U[0], c.U[1], c.U[2]] = [c.R[2], c.R[5], c.R[8]]; [c.R[2], c.R[5], c.R[8]] = [c.D[8], c.D[7], c.D[6]]; [c.D[6], c.D[7], c.D[8]] = [c.L[0], c.L[3], c.L[6]]; [c.L[0], c.L[3], c.L[6]] = [t[2], t[1], t[0]]; rotateFaceCW(c, 'B') },
  "B'": (c) => { for (let i = 0; i < 3; i++) MOVES.B(c) },
  B2: (c) => { for (let i = 0; i < 2; i++) MOVES.B(c) },
}

function rotateFaceCW(cube: Record<string, string[]>, face: string) {
  const f = cube[face]
  const temp = f[0]
  f[0] = f[6]; f[6] = f[8]; f[8] = f[2]; f[2] = temp
  const temp2 = f[1]
  f[1] = f[3]; f[3] = f[7]; f[7] = f[5]; f[5] = temp2
}

function createSolvedCube(): Record<string, string[]> {
  return {
    U: Array(9).fill('W'),
    D: Array(9).fill('Y'),
    F: Array(9).fill('G'),
    B: Array(9).fill('B'),
    L: Array(9).fill('O'),
    R: Array(9).fill('R'),
  }
}

function applyScramble(scramble: string): Record<string, string[]> {
  const cube = createSolvedCube()
  const moves = scramble.trim().split(/\s+/).filter(m => m.length > 0)
  for (const move of moves) {
    if (MOVES[move]) {
      MOVES[move](cube)
    }
  }
  return cube
}

function formatTime(ms: number): string {
  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = (totalSeconds % 60).toFixed(2)
  if (minutes > 0) {
    return `${minutes}:${seconds.padStart(5, '0')}`
  }
  return seconds
}

function CubeCell({ color }: { color: string }) {
  return React.createElement('div', {
    style: {
      width: '80px',
      height: '80px',
      backgroundColor: color,
      borderRadius: '12px',
      boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.3)',
    }
  })
}

function CubeRow({ colors }: { colors: string[] }) {
  return React.createElement('div', { style: { display: 'flex', gap: '8px' } },
    React.createElement(CubeCell, { color: colors[0] }),
    React.createElement(CubeCell, { color: colors[1] }),
    React.createElement(CubeCell, { color: colors[2] }),
  )
}

export default async function handler(req: Request) {
  const url = new URL(req.url)
  
  const time = parseInt(url.searchParams.get('time') || '0')
  const scramble = decodeURIComponent(url.searchParams.get('scramble') || '')
  const userName = decodeURIComponent(url.searchParams.get('name') || 'Anonymous')
  const userAvatar = url.searchParams.get('avatar') ? decodeURIComponent(url.searchParams.get('avatar')!) : null

  const cube = applyScramble(scramble)
  const front = cube.F
  const colors = front.map(c => CUBE_COLORS[c] || '#888')

  const avatarElement = userAvatar 
    ? React.createElement('img', {
        src: userAvatar,
        width: 64,
        height: 64,
        style: {
          borderRadius: '50%',
          border: '3px solid #f97316',
        }
      })
    : React.createElement('div', {
        style: {
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#f97316',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#0a0a0a',
        }
      }, userName[0].toUpperCase())

  const element = React.createElement('div', {
    style: {
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
      fontFamily: 'system-ui, sans-serif',
      position: 'relative',
    }
  },
    React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '60px',
        padding: '40px',
      }
    },
      React.createElement('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '24px',
          border: '2px solid rgba(249, 115, 22, 0.3)',
        }
      },
        React.createElement(CubeRow, { colors: [colors[0], colors[1], colors[2]] }),
        React.createElement(CubeRow, { colors: [colors[3], colors[4], colors[5]] }),
        React.createElement(CubeRow, { colors: [colors[6], colors[7], colors[8]] }),
      ),
      React.createElement('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }
      },
        React.createElement('div', {
          style: {
            fontSize: '96px',
            fontWeight: 'bold',
            color: '#f97316',
            letterSpacing: '-2px',
          }
        }, formatTime(time)),
        React.createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }
        },
          avatarElement,
          React.createElement('span', {
            style: {
              fontSize: '32px',
              color: '#ffffff',
              fontWeight: '600',
            }
          }, userName),
        ),
      ),
    ),
    React.createElement('div', {
      style: {
        position: 'absolute',
        bottom: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }
    },
      React.createElement('div', {
        style: {
          width: '40px',
          height: '40px',
          backgroundColor: '#f97316',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }
      }, 
        React.createElement('svg', {
          width: 24,
          height: 24,
          viewBox: '0 0 100 100',
          xmlns: 'http://www.w3.org/2000/svg',
        },
          React.createElement('path', { d: 'M25 42 L35 22 L45 42 Z', fill: '#0a0a0a' }),
          React.createElement('path', { d: 'M55 42 L65 22 L75 42 Z', fill: '#0a0a0a' }),
          React.createElement('path', { d: 'M25 42 H75 V65 L50 90 L25 65 Z', fill: '#0a0a0a' }),
        ),
      ),
      React.createElement('span', {
        style: {
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#888888',
        }
      }, 'kitsunecube.com'),
    ),
  )

  return new ImageResponse(element, {
    width: 1200,
    height: 630,
  })
}

export const config = {
  path: '/api/og-image',
}
