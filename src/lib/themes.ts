export interface Theme {
  name: string
  colors: {
    bg: string
    bgSecondary: string
    main: string
    sub: string
    subAlt: string
    text: string
    error: string
    accent: string
    accentHover: string
    phaseCross: string
    phaseF2L1: string
    phaseF2L2: string
    phaseF2L3: string
    phaseF2L4: string
    phaseOLL: string
    phasePLL: string
    cubeWhite: string
    cubeYellow: string
    cubeGreen: string
    cubeBlue: string
    cubeRed: string
    cubeOrange: string
  }
}

export const themes: Record<string, Theme> = {
  kitsune: {
    name: 'Kitsune',
    colors: {
      bg: '#0c0a09',
      bgSecondary: '#1c1917',
      main: '#f97316',
      sub: '#78716c',
      subAlt: '#292524',
      text: '#fafaf9',
      error: '#ef4444',
      accent: '#f97316',
      accentHover: '#ea580c',
      phaseCross: '#c084fc',
      phaseF2L1: '#fb923c',
      phaseF2L2: '#fdba74',
      phaseF2L3: '#fed7aa',
      phaseF2L4: '#ffedd5',
      phaseOLL: '#fbbf24',
      phasePLL: '#4ade80',
      cubeWhite: '#fafaf9',
      cubeYellow: '#fbbf24',
      cubeGreen: '#22c55e',
      cubeBlue: '#3b82f6',
      cubeRed: '#ef4444',
      cubeOrange: '#f97316',
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      bg: '#0a0a0a',
      bgSecondary: '#171717',
      main: '#e2b714',
      sub: '#646669',
      subAlt: '#2c2e31',
      text: '#d1d0c5',
      error: '#ca4754',
      accent: '#e2b714',
      accentHover: '#c9a312',
      phaseCross: '#a855f7',
      phaseF2L1: '#3b82f6',
      phaseF2L2: '#60a5fa',
      phaseF2L3: '#93c5fd',
      phaseF2L4: '#bfdbfe',
      phaseOLL: '#eab308',
      phasePLL: '#22c55e',
      cubeWhite: '#e0e0e0',
      cubeYellow: '#e2b714',
      cubeGreen: '#22c55e',
      cubeBlue: '#3b82f6',
      cubeRed: '#ef4444',
      cubeOrange: '#f97316',
    },
  },
  light: {
    name: 'Light',
    colors: {
      bg: '#f5f5f5',
      bgSecondary: '#e8e8e8',
      main: '#2c2e31',
      sub: '#8a8a8a',
      subAlt: '#d1d0c5',
      text: '#2c2e31',
      error: '#ca4754',
      accent: '#e2b714',
      accentHover: '#c9a312',
      phaseCross: '#9333ea',
      phaseF2L1: '#2563eb',
      phaseF2L2: '#3b82f6',
      phaseF2L3: '#60a5fa',
      phaseF2L4: '#93c5fd',
      phaseOLL: '#ca8a04',
      phasePLL: '#16a34a',
      cubeWhite: '#ffffff',
      cubeYellow: '#eab308',
      cubeGreen: '#16a34a',
      cubeBlue: '#2563eb',
      cubeRed: '#dc2626',
      cubeOrange: '#ea580c',
    },
  },
  serikaDark: {
    name: 'Serika Dark',
    colors: {
      bg: '#323437',
      bgSecondary: '#2c2e31',
      main: '#e2b714',
      sub: '#646669',
      subAlt: '#2c2e31',
      text: '#d1d0c5',
      error: '#ca4754',
      accent: '#e2b714',
      accentHover: '#c9a312',
      phaseCross: '#a855f7',
      phaseF2L1: '#3b82f6',
      phaseF2L2: '#60a5fa',
      phaseF2L3: '#93c5fd',
      phaseF2L4: '#bfdbfe',
      phaseOLL: '#eab308',
      phasePLL: '#22c55e',
      cubeWhite: '#d1d0c5',
      cubeYellow: '#e2b714',
      cubeGreen: '#22c55e',
      cubeBlue: '#3b82f6',
      cubeRed: '#ef4444',
      cubeOrange: '#f97316',
    },
  },
  serikaLight: {
    name: 'Serika Light',
    colors: {
      bg: '#e1e1e3',
      bgSecondary: '#d1d0c5',
      main: '#323437',
      sub: '#5f6368',
      subAlt: '#c5c5c5',
      text: '#323437',
      error: '#ca4754',
      accent: '#e2b714',
      accentHover: '#c9a312',
      phaseCross: '#9333ea',
      phaseF2L1: '#2563eb',
      phaseF2L2: '#3b82f6',
      phaseF2L3: '#60a5fa',
      phaseF2L4: '#93c5fd',
      phaseOLL: '#ca8a04',
      phasePLL: '#16a34a',
      cubeWhite: '#ffffff',
      cubeYellow: '#eab308',
      cubeGreen: '#16a34a',
      cubeBlue: '#2563eb',
      cubeRed: '#dc2626',
      cubeOrange: '#ea580c',
    },
  },
  nord: {
    name: 'Nord',
    colors: {
      bg: '#2e3440',
      bgSecondary: '#3b4252',
      main: '#88c0d0',
      sub: '#616e88',
      subAlt: '#434c5e',
      text: '#d8dee9',
      error: '#bf616a',
      accent: '#88c0d0',
      accentHover: '#81a1c1',
      phaseCross: '#b48ead',
      phaseF2L1: '#5e81ac',
      phaseF2L2: '#81a1c1',
      phaseF2L3: '#88c0d0',
      phaseF2L4: '#8fbcbb',
      phaseOLL: '#ebcb8b',
      phasePLL: '#a3be8c',
      cubeWhite: '#eceff4',
      cubeYellow: '#ebcb8b',
      cubeGreen: '#a3be8c',
      cubeBlue: '#5e81ac',
      cubeRed: '#bf616a',
      cubeOrange: '#d08770',
    },
  },
  dracula: {
    name: 'Dracula',
    colors: {
      bg: '#282a36',
      bgSecondary: '#44475a',
      main: '#bd93f9',
      sub: '#6272a4',
      subAlt: '#383a47',
      text: '#f8f8f2',
      error: '#ff5555',
      accent: '#bd93f9',
      accentHover: '#a87bff',
      phaseCross: '#ff79c6',
      phaseF2L1: '#6272a4',
      phaseF2L2: '#8be9fd',
      phaseF2L3: '#66d9ef',
      phaseF2L4: '#a4ffff',
      phaseOLL: '#f1fa8c',
      phasePLL: '#50fa7b',
      cubeWhite: '#f8f8f2',
      cubeYellow: '#f1fa8c',
      cubeGreen: '#50fa7b',
      cubeBlue: '#6272a4',
      cubeRed: '#ff5555',
      cubeOrange: '#ffb86c',
    },
  },
  monokai: {
    name: 'Monokai',
    colors: {
      bg: '#272822',
      bgSecondary: '#3e3d32',
      main: '#f92672',
      sub: '#75715e',
      subAlt: '#3e3d32',
      text: '#f8f8f2',
      error: '#f92672',
      accent: '#a6e22e',
      accentHover: '#98d91e',
      phaseCross: '#ae81ff',
      phaseF2L1: '#66d9ef',
      phaseF2L2: '#7fdfff',
      phaseF2L3: '#99e5ff',
      phaseF2L4: '#b3ecff',
      phaseOLL: '#e6db74',
      phasePLL: '#a6e22e',
      cubeWhite: '#f8f8f2',
      cubeYellow: '#e6db74',
      cubeGreen: '#a6e22e',
      cubeBlue: '#66d9ef',
      cubeRed: '#f92672',
      cubeOrange: '#fd971f',
    },
  },
  ocean: {
    name: 'Ocean',
    colors: {
      bg: '#1b2838',
      bgSecondary: '#1e3a5f',
      main: '#66c0f4',
      sub: '#4a6fa5',
      subAlt: '#2a475e',
      text: '#c7d5e0',
      error: '#e74c3c',
      accent: '#66c0f4',
      accentHover: '#52a8db',
      phaseCross: '#9b59b6',
      phaseF2L1: '#2980b9',
      phaseF2L2: '#3498db',
      phaseF2L3: '#5dade2',
      phaseF2L4: '#85c1e9',
      phaseOLL: '#f39c12',
      phasePLL: '#27ae60',
      cubeWhite: '#ecf0f1',
      cubeYellow: '#f1c40f',
      cubeGreen: '#2ecc71',
      cubeBlue: '#3498db',
      cubeRed: '#e74c3c',
      cubeOrange: '#e67e22',
    },
  },
  matrix: {
    name: 'Matrix',
    colors: {
      bg: '#0d0208',
      bgSecondary: '#1a1a1a',
      main: '#00ff41',
      sub: '#008f11',
      subAlt: '#0d1f0d',
      text: '#00ff41',
      error: '#ff0000',
      accent: '#00ff41',
      accentHover: '#00cc33',
      phaseCross: '#9900ff',
      phaseF2L1: '#0066ff',
      phaseF2L2: '#0088ff',
      phaseF2L3: '#00aaff',
      phaseF2L4: '#00ccff',
      phaseOLL: '#ffff00',
      phasePLL: '#00ff41',
      cubeWhite: '#00ff41',
      cubeYellow: '#ccff00',
      cubeGreen: '#00ff41',
      cubeBlue: '#0088ff',
      cubeRed: '#ff0000',
      cubeOrange: '#ff6600',
    },
  },
  midnight: {
    name: 'Midnight',
    colors: {
      bg: '#0f0f1a',
      bgSecondary: '#1a1a2e',
      main: '#7c3aed',
      sub: '#4b5563',
      subAlt: '#252538',
      text: '#e5e5e5',
      error: '#ef4444',
      accent: '#7c3aed',
      accentHover: '#6d28d9',
      phaseCross: '#a855f7',
      phaseF2L1: '#3b82f6',
      phaseF2L2: '#60a5fa',
      phaseF2L3: '#93c5fd',
      phaseF2L4: '#bfdbfe',
      phaseOLL: '#eab308',
      phasePLL: '#22c55e',
      cubeWhite: '#e5e5e5',
      cubeYellow: '#eab308',
      cubeGreen: '#22c55e',
      cubeBlue: '#3b82f6',
      cubeRed: '#ef4444',
      cubeOrange: '#f97316',
    },
  },
  everforest: {
    name: 'Everforest',
    colors: {
      bg: '#2d353b',
      bgSecondary: '#343f44',
      main: '#a7c080',
      sub: '#859289',
      subAlt: '#3d484d',
      text: '#d3c6aa',
      error: '#e67e80',
      accent: '#a7c080',
      accentHover: '#8fb573',
      phaseCross: '#d699b6',
      phaseF2L1: '#7fbbb3',
      phaseF2L2: '#83c092',
      phaseF2L3: '#a7c080',
      phaseF2L4: '#d3c6aa',
      phaseOLL: '#dbbc7f',
      phasePLL: '#a7c080',
      cubeWhite: '#d3c6aa',
      cubeYellow: '#dbbc7f',
      cubeGreen: '#a7c080',
      cubeBlue: '#7fbbb3',
      cubeRed: '#e67e80',
      cubeOrange: '#e69875',
    },
  },
  oneDark: {
    name: 'One Dark',
    colors: {
      bg: '#282c34',
      bgSecondary: '#21252b',
      main: '#61afef',
      sub: '#5c6370',
      subAlt: '#3e4451',
      text: '#abb2bf',
      error: '#e06c75',
      accent: '#61afef',
      accentHover: '#528bcc',
      phaseCross: '#c678dd',
      phaseF2L1: '#61afef',
      phaseF2L2: '#56b6c2',
      phaseF2L3: '#7ec8e3',
      phaseF2L4: '#a8d8ea',
      phaseOLL: '#e5c07b',
      phasePLL: '#98c379',
      cubeWhite: '#abb2bf',
      cubeYellow: '#e5c07b',
      cubeGreen: '#98c379',
      cubeBlue: '#61afef',
      cubeRed: '#e06c75',
      cubeOrange: '#d19a66',
    },
  },
}

export const STANDARD_CUBE_COLORS = {
  cubeWhite: '#ffffff',
  cubeYellow: '#ffd500',
  cubeGreen: '#009b48',
  cubeBlue: '#0045ad',
  cubeRed: '#b90000',
  cubeOrange: '#ff5900',
}

export type CubeTheme = 'current' | 'standard' | keyof typeof themes

export function getCubeColors(cubeTheme: CubeTheme, currentTheme: string): Record<string, string> {
  if (cubeTheme === 'standard') {
    return STANDARD_CUBE_COLORS
  }

  const themeToUse = cubeTheme === 'current' ? currentTheme : cubeTheme
  const theme = themes[themeToUse] || themes.kitsune

  return {
    cubeWhite: theme.colors.cubeWhite,
    cubeYellow: theme.colors.cubeYellow,
    cubeGreen: theme.colors.cubeGreen,
    cubeBlue: theme.colors.cubeBlue,
    cubeRed: theme.colors.cubeRed,
    cubeOrange: theme.colors.cubeOrange,
  }
}

export const themeKeys = Object.keys(themes) as (keyof typeof themes)[]

export function applyTheme(themeKey: string): void {
  const theme = themes[themeKey] || themes.kitsune
  const root = document.documentElement

  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--theme-${key}`, value)
  })
}
