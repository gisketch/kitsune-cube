import { motion } from 'framer-motion'
import { Check, Clock, Sparkles } from 'lucide-react'

const ROADMAP = [
  {
    phase: 'Phase 1',
    title: 'Core Features',
    status: 'completed',
    items: [
      'Smart cube connectivity (GAN, MoYu, QiYi, GiiKER)',
      'Full solve replays with gyroscope',
      'CFOP phase analysis',
      'Gamification (XP & levels)',
      '50+ tiered achievements',
      '10+ themes',
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Priority Features',
    status: 'in-progress',
    items: [
      'Smarter cube rotation detection',
      'Roux & ZZ method analyzers',
      'csTimer import/export support',
      'More smart cube brand support',
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Community & More',
    status: 'planned',
    items: [
      'Daily & weekly challenges',
      'Friend system & battles',
      'Algorithm trainer',
      'Cross solver',
      'Mobile app (PWA)',
      'Tournaments',
    ],
  },
]

function getStatusStyles(status: string) {
  switch (status) {
    case 'completed':
      return {
        bg: '#22c55e20',
        border: '#22c55e',
        icon: Check,
        label: 'Completed',
      }
    case 'in-progress':
      return {
        bg: 'var(--theme-accent)20',
        border: 'var(--theme-accent)',
        icon: Clock,
        label: 'In Progress',
      }
    default:
      return {
        bg: 'var(--theme-sub-alt)',
        border: 'var(--theme-sub)',
        icon: Sparkles,
        label: 'Planned',
      }
  }
}

export function RoadmapSection() {
  return (
    <section id="roadmap" className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl" style={{ color: 'var(--theme-text)' }}>
            Roadmap
          </h2>
          <p className="mx-auto max-w-2xl text-lg" style={{ color: 'var(--theme-sub)' }}>
            Built by a cuber, for cubers. Here's what's done and what's coming next.
          </p>
        </motion.div>

        <div className="relative">
          <div
            className="absolute left-8 top-0 hidden h-full w-0.5 md:block"
            style={{ backgroundColor: 'var(--theme-sub-alt)' }}
          />

          <div className="space-y-8">
            {ROADMAP.map((phase, index) => {
              const styles = getStatusStyles(phase.status)
              const Icon = styles.icon

              return (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative md:pl-20"
                >
                  <div
                    className="absolute left-5 top-6 hidden h-6 w-6 items-center justify-center rounded-full md:flex"
                    style={{ backgroundColor: styles.border }}
                  >
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>

                  <div
                    className="rounded-xl p-6"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)', border: `1px solid ${styles.border}` }}
                  >
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span
                        className="rounded-full px-3 py-1 text-sm font-medium"
                        style={{ backgroundColor: styles.bg, color: styles.border }}
                      >
                        {phase.phase}
                      </span>
                      <h3 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
                        {phase.title}
                      </h3>
                      <span
                        className="ml-auto rounded-full px-3 py-1 text-xs font-medium"
                        style={{ backgroundColor: styles.bg, color: styles.border }}
                      >
                        {styles.label}
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {phase.items.map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <Check
                            className="h-4 w-4 shrink-0"
                            style={{
                              color: phase.status === 'completed' ? '#22c55e' : 'var(--theme-sub)',
                            }}
                          />
                          <span style={{ color: 'var(--theme-text)' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
