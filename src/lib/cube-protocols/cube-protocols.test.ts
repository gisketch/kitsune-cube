import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createAdapter,
  CUBE_BRANDS,
  getBrandInfo,
  isBrandSupported,
  type CubeBrand,
} from './index'
import { MockAdapter } from './mock-adapter'

describe('Cube Protocol Types', () => {
  describe('CUBE_BRANDS', () => {
    it('should have all expected brands', () => {
      const brandIds = CUBE_BRANDS.map((b) => b.brand)
      expect(brandIds).toContain('gan')
      expect(brandIds).toContain('moyu')
      expect(brandIds).toContain('qiyi')
      expect(brandIds).toContain('giiker')
      expect(brandIds).toContain('mock')
    })

    it('should mark only GAN as non-experimental', () => {
      const ganBrand = CUBE_BRANDS.find((b) => b.brand === 'gan')
      expect(ganBrand?.experimental).toBe(false)

      const experimentalBrands = CUBE_BRANDS.filter((b) => b.brand !== 'gan')
      experimentalBrands.forEach((brand) => {
        expect(brand.experimental).toBe(true)
      })
    })

    it('should have gyroscope support info', () => {
      const ganBrand = CUBE_BRANDS.find((b) => b.brand === 'gan')
      expect(ganBrand?.hasGyro).toBe(true)

      const moyuBrand = CUBE_BRANDS.find((b) => b.brand === 'moyu')
      expect(moyuBrand?.hasGyro).toBe(true)

      const qiyiBrand = CUBE_BRANDS.find((b) => b.brand === 'qiyi')
      expect(qiyiBrand?.hasGyro).toBe(false)

      const giikerBrand = CUBE_BRANDS.find((b) => b.brand === 'giiker')
      expect(giikerBrand?.hasGyro).toBe(false)
    })
  })

  describe('getBrandInfo', () => {
    it('should return correct info for known brands', () => {
      const ganInfo = getBrandInfo('gan')
      expect(ganInfo.displayName).toBe('GAN')
      expect(ganInfo.experimental).toBe(false)

      const moyuInfo = getBrandInfo('moyu')
      expect(moyuInfo.displayName).toBe('MoYu')
      expect(moyuInfo.experimental).toBe(true)
    })

    it('should throw for unknown brands', () => {
      expect(() => getBrandInfo('unknown' as CubeBrand)).toThrow('Unknown cube brand')
    })
  })

  describe('isBrandSupported', () => {
    it('should return true for supported brands', () => {
      expect(isBrandSupported('gan')).toBe(true)
      expect(isBrandSupported('moyu')).toBe(true)
      expect(isBrandSupported('qiyi')).toBe(true)
      expect(isBrandSupported('giiker')).toBe(true)
      expect(isBrandSupported('mock')).toBe(true)
    })

    it('should return false for unsupported brands', () => {
      expect(isBrandSupported('unknown')).toBe(false)
      expect(isBrandSupported('')).toBe(false)
    })
  })
})

describe('Adapter Factory', () => {
  describe('createAdapter', () => {
    it('should create MockAdapter for mock brand', () => {
      const adapter = createAdapter('mock')
      expect(adapter).toBeInstanceOf(MockAdapter)
      expect(adapter.brand).toBe('mock')
    })

    it('should throw for unsupported brands', () => {
      expect(() => createAdapter('unknown' as CubeBrand)).toThrow('Unsupported cube brand')
    })
  })
})

describe('MockAdapter', () => {
  let adapter: MockAdapter

  beforeEach(() => {
    adapter = new MockAdapter()
  })

  afterEach(async () => {
    await adapter.disconnect()
    adapter.destroy()
  })

  it('should have correct brand and capabilities', () => {
    expect(adapter.brand).toBe('mock')
    expect(adapter.isExperimental).toBe(true)
    expect(adapter.capabilities.gyroscope).toBe(true)
    expect(adapter.capabilities.battery).toBe(true)
  })

  it('should connect successfully', async () => {
    expect(adapter.isConnected).toBe(false)

    await adapter.connect()

    expect(adapter.isConnected).toBe(true)
    expect(adapter.deviceName).toBe('Mock Cube (Development)')
  })

  it('should emit events when connected', async () => {
    const events: any[] = []
    adapter.events$.subscribe((event) => events.push(event))

    await adapter.connect()

    expect(events.some((e) => e.type === 'battery')).toBe(true)
    expect(events.some((e) => e.type === 'facelets')).toBe(true)
  })

  it('should emit move when simulateMove is called', async () => {
    const moves: string[] = []
    adapter.events$.subscribe((event) => {
      if (event.type === 'move') {
        moves.push(event.move)
      }
    })

    await adapter.connect()
    adapter.simulateMove('R')
    adapter.simulateMove("U'")

    expect(moves).toContain('R')
    expect(moves).toContain("U'")
  })

  it('should disconnect properly', async () => {
    await adapter.connect()
    expect(adapter.isConnected).toBe(true)

    await adapter.disconnect()
    expect(adapter.isConnected).toBe(false)
    expect(adapter.deviceName).toBeNull()
  })

  it('should emit gyro events when simulateGyro is enabled', async () => {
    const gyroAdapter = new MockAdapter({ simulateGyro: true })
    const gyroEvents: any[] = []

    gyroAdapter.events$.subscribe((event) => {
      if (event.type === 'gyro') {
        gyroEvents.push(event)
      }
    })

    await gyroAdapter.connect()

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(gyroEvents.length).toBeGreaterThan(0)
    expect(gyroEvents[0].quaternion).toHaveProperty('x')
    expect(gyroEvents[0].quaternion).toHaveProperty('y')
    expect(gyroEvents[0].quaternion).toHaveProperty('z')
    expect(gyroEvents[0].quaternion).toHaveProperty('w')

    await gyroAdapter.disconnect()
    gyroAdapter.destroy()
  })
})

describe('GAN Adapter Configuration', () => {
  it('should create GAN adapter with correct defaults', async () => {
    const { GanAdapter } = await import('./gan-adapter')
    const adapter = new GanAdapter()

    expect(adapter.brand).toBe('gan')
    expect(adapter.isExperimental).toBe(false)
    expect(adapter.capabilities.gyroscope).toBe(true)
    expect(adapter.capabilities.battery).toBe(true)
    expect(adapter.capabilities.facelets).toBe(true)
  })
})

describe('MoYu Adapter Configuration', () => {
  it('should create MoYu adapter with correct defaults', async () => {
    const { MoyuAdapter } = await import('./moyu-adapter')
    const adapter = new MoyuAdapter()

    expect(adapter.brand).toBe('moyu')
    expect(adapter.isExperimental).toBe(true)
    expect(adapter.capabilities.gyroscope).toBe(true)
    expect(adapter.capabilities.battery).toBe(true)
  })
})

describe('QiYi Adapter Configuration', () => {
  it('should create QiYi adapter with correct defaults', async () => {
    const { QiyiAdapter } = await import('./qiyi-adapter')
    const adapter = new QiyiAdapter()

    expect(adapter.brand).toBe('qiyi')
    expect(adapter.isExperimental).toBe(true)
    expect(adapter.capabilities.gyroscope).toBe(false)
    expect(adapter.capabilities.battery).toBe(true)
  })
})

describe('GiiKER Adapter Configuration', () => {
  it('should create GiiKER adapter with correct defaults', async () => {
    const { GiikerAdapter } = await import('./giiker-adapter')
    const adapter = new GiikerAdapter()

    expect(adapter.brand).toBe('giiker')
    expect(adapter.isExperimental).toBe(true)
    expect(adapter.capabilities.gyroscope).toBe(false)
    expect(adapter.capabilities.battery).toBe(false)
  })
})
