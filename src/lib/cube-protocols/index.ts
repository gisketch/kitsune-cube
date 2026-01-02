import type { CubeBrand, SmartCubeAdapter } from './types'
import { GanAdapter } from './gan-adapter'
import { MoyuAdapter } from './moyu-adapter'
import { QiyiAdapter } from './qiyi-adapter'
import { GiikerAdapter } from './giiker-adapter'
import { MockAdapter, type MockAdapterOptions } from './mock-adapter'

export function createAdapter(brand: CubeBrand, options?: MockAdapterOptions): SmartCubeAdapter {
  switch (brand) {
    case 'gan':
      return new GanAdapter()
    case 'moyu':
      return new MoyuAdapter()
    case 'qiyi':
      return new QiyiAdapter()
    case 'giiker':
      return new GiikerAdapter()
    case 'mock':
      return new MockAdapter(options)
    default:
      throw new Error(`Unsupported cube brand: ${brand}`)
  }
}

export { GanAdapter } from './gan-adapter'
export { MoyuAdapter } from './moyu-adapter'
export { QiyiAdapter } from './qiyi-adapter'
export { GiikerAdapter } from './giiker-adapter'
export { MockAdapter } from './mock-adapter'
export { BaseAdapter } from './base-adapter'
export * from './types'
