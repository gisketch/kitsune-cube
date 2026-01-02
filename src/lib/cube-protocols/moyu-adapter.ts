import { GanAdapter } from './gan-adapter'

export class MoyuAdapter extends GanAdapter {
  constructor() {
    super({
      brand: 'moyu',
      hasGyroscope: false,
    })
  }
}
