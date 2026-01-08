import { motion } from 'framer-motion'
import { Bluetooth, Box, FlaskConical, Check } from 'lucide-react'

type CubeBrand = {
  name: string
  color: string
  featured: string[]
  moreCount?: number
  experimental?: boolean
  description: string
}

const CUBE_BRANDS: CubeBrand[] = [
  {
    name: 'GAN',
    color: '#22c55e',
    description: 'Full support with gyroscope on most models',
    featured: ['GAN 12 ui FreePlay', 'GAN 356i 3', 'GAN 356i Carry 2'],
    moreCount: 8,
  },
  {
    name: 'MoYu',
    color: '#ef4444',
    experimental: true,
    description: 'Gyroscope support on V10 AI',
    featured: ['WeiLong V10 AI', 'MoYu AI 2023'],
  },
  {
    name: 'QiYi',
    color: '#3b82f6',
    experimental: true,
    description: 'Affordable smart cube connectivity',
    featured: ['QiYi QY-SC-S', 'QiYi AI Smart Cube'],
  },
  {
    name: 'GiiKER',
    color: '#a855f7',
    experimental: true,
    description: 'Classic connected cube support',
    featured: ['GiiKER i3S', 'GiiKER i2'],
    moreCount: 1,
  },
]

export function SupportedCubes() {
  return (
    <section id="cubes" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-12 text-center"
        >
          <div className="mb-4 flex items-center justify-center gap-2">
            <Bluetooth className="h-6 w-6" style={{ color: 'var(--theme-accent)' }} />
            <h2 className="text-3xl font-bold md:text-4xl" style={{ color: 'var(--theme-text)' }}>
              Supported Smart Cubes
            </h2>
          </div>
          <p className="mx-auto max-w-2xl text-lg" style={{ color: 'var(--theme-sub)' }}>
            Connect via Bluetooth for real-time tracking, analysis, and more.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {CUBE_BRANDS.map((brand, index) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative overflow-hidden rounded-2xl p-6"
              style={{
                backgroundColor: 'var(--theme-bg-secondary)',
                border: `1px solid ${brand.color}30`,
              }}
            >
              <div
                className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10"
                style={{ backgroundColor: brand.color }}
              />
              
              <div className="relative">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${brand.color}15`, color: brand.color }}
                    >
                      <Box className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
                          {brand.name}
                        </h3>
                        {brand.experimental && (
                          <span
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase"
                            style={{ backgroundColor: brand.color, color: 'white' }}
                          >
                            <FlaskConical className="h-3 w-3" />
                            Beta
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--theme-sub)' }}>
                        {brand.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {brand.featured.map((cube) => (
                    <div
                      key={cube}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: 'var(--theme-text)' }}
                    >
                      <Check className="h-4 w-4 flex-shrink-0" style={{ color: brand.color }} />
                      <span>{cube}</span>
                    </div>
                  ))}
                  {brand.moreCount && brand.moreCount > 0 && (
                    <p className="pl-6 text-sm" style={{ color: 'var(--theme-sub)' }}>
                      +{brand.moreCount} more model{brand.moreCount > 1 ? 's' : ''} supported
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 rounded-xl p-4 text-center"
          style={{ backgroundColor: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-sub-alt)' }}
        >
          <p className="text-sm" style={{ color: 'var(--theme-sub)' }}>
            <span style={{ color: 'var(--theme-accent)' }}>Beta cubes</span> are community-tested.{' '}
            No smart cube? Use the <span style={{ color: 'var(--theme-text)' }}>manual timer</span> instead.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
