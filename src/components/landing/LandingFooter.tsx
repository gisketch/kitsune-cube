import { Heart, Github, MessageCircle, Coffee } from 'lucide-react'
import { getVersionString } from '@/lib/version'
import { Link } from 'react-router-dom'

const FOOTER_LINKS = {
  product: [
    { name: 'Timer', href: '/app' },
    { name: 'Leaderboard', href: '/app/leaderboard' },
    { name: 'Achievements', href: '/app/achievements' },
    { name: 'FAQ', href: '/app/faq' },
  ],
  resources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'Changelog', href: '/changelog' },
    { name: 'Roadmap', href: '#roadmap' },
    { name: 'Feedback', href: 'https://discord.gg/XPQr4wpQVg', external: true },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
}

const SOCIAL_LINKS = [
  { name: 'GitHub', icon: Github, href: 'https://github.com/gisketch/kitsune-cube' },
  { name: 'Discord', icon: MessageCircle, href: 'https://discord.gg/XPQr4wpQVg' },
  { name: 'Ko-fi', icon: Coffee, href: 'https://ko-fi.com/kitsunecube' },
]

export function LandingFooter() {
  const version = getVersionString()

  return (
    <footer style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">🦊</span>
              <span className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
                Kitsune Cube
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: 'var(--theme-sub-alt)', color: 'var(--theme-sub)' }}
              >
                {version}
              </span>
            </div>
            <p className="mb-6 max-w-xs text-sm" style={{ color: 'var(--theme-sub)' }}>
              The gamified smart cube timer. Built by a cuber, for cubers. Track, analyze, and
              compete.
            </p>
            <div className="flex items-center gap-4">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-2 transition-colors hover:bg-white/10"
                  style={{ color: 'var(--theme-sub)' }}
                  aria-label={link.name}
                >
                  <link.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold" style={{ color: 'var(--theme-text)' }}>
              Product
            </h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm transition-colors hover:opacity-80"
                    style={{ color: 'var(--theme-sub)' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold" style={{ color: 'var(--theme-text)' }}>
              Resources
            </h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.resources.map((link) => (
                <li key={link.name}>
                  {'external' in link && link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm transition-colors hover:opacity-80"
                      style={{ color: 'var(--theme-sub)' }}
                    >
                      {link.name}
                    </a>
                  ) : link.href.startsWith('#') ? (
                    <a
                      href={link.href}
                      className="text-sm transition-colors hover:opacity-80"
                      style={{ color: 'var(--theme-sub)' }}
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-sm transition-colors hover:opacity-80"
                      style={{ color: 'var(--theme-sub)' }}
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold" style={{ color: 'var(--theme-text)' }}>
              Legal
            </h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm transition-colors hover:opacity-80"
                    style={{ color: 'var(--theme-sub)' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row"
          style={{ borderColor: 'var(--theme-sub-alt)' }}
        >
          <p className="text-sm" style={{ color: 'var(--theme-sub)' }}>
            © {new Date().getFullYear()} Kitsune Cube. All rights reserved.
          </p>
          <p
            className="flex items-center gap-1 text-sm"
            style={{ color: 'var(--theme-sub)' }}
          >
            Made with <Heart className="h-4 w-4 mx-1" style={{ color: 'var(--theme-accent)' }} /> by gisketch
          </p>
        </div>
      </div>
    </footer>
  )
}
