import { motion } from 'framer-motion'
import { Github, MessageCircle, Coffee } from 'lucide-react'

const SOCIAL_LINKS = [
  {
    name: 'Discord',
    icon: MessageCircle,
    href: 'https://discord.gg/XPQr4wpQVg',
    description: 'Join the community',
    color: '#5865F2',
  },
  {
    name: 'GitHub',
    icon: Github,
    href: 'https://github.com/gisketch/kitsune-cube',
    description: 'Star the project',
    color: '#ffffff',
  },
  {
    name: 'Ko-fi',
    icon: Coffee,
    href: 'https://ko-fi.com/kitsunecube',
    description: 'Support development',
    color: '#FF5E5B',
  },
]

export function CommunitySection() {
  return (
    <section
      id="community"
      className="px-6 py-20"
      style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
    >
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl" style={{ color: 'var(--theme-text)' }}>
            Join the Community
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-lg" style={{ color: 'var(--theme-sub)' }}>
            Connect with cubers, share your solves, and help shape the future of Kitsune Cube.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-3">
          {SOCIAL_LINKS.map((link, index) => (
            <motion.a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              className="group rounded-xl p-6 transition-all hover:scale-[1.02]"
              style={{ backgroundColor: 'var(--theme-bg)', border: '1px solid var(--theme-sub-alt)' }}
            >
              <div
                className="mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${link.color}20` }}
              >
                <link.icon className="h-7 w-7" style={{ color: link.color }} />
              </div>
              <h3 className="mb-1 text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
                {link.name}
              </h3>
              <p className="text-sm" style={{ color: 'var(--theme-sub)' }}>
                {link.description}
              </p>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
