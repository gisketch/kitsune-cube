export type ChangeType = 'feature' | 'fix' | 'improvement' | 'breaking'

export interface ChangelogChange {
  type: ChangeType
  text: string
}

export interface ChangelogEntry {
  version: string
  date: string
  title: string
  description?: string
  icon?: 'rocket' | 'sparkles' | 'gift' | 'zap'
  changes: ChangelogChange[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.1.0',
    date: '2026-01-05',
    title: 'First Beta Release! 🦊',
    description: 'The first official beta release of Kitsune Cube with smart cube support for GAN, MoYu, QiYi, and GiiKER cubes.',
    icon: 'rocket',
    changes: [
      { type: 'feature', text: 'Multi-brand smart cube support (GAN, MoYu, QiYi, GiiKER)' },
      { type: 'feature', text: 'Real CFOP recognition vs execution timing' },
      { type: 'feature', text: 'Achievement system with confetti celebrations' },
      { type: 'feature', text: 'Solve replay with move-by-move playback' },
      { type: 'feature', text: 'CFOP phase goals with presets' },
      { type: 'feature', text: 'Offline mode for guest users' },
      { type: 'feature', text: 'Google authentication' },
      { type: 'improvement', text: 'New landing page with feature showcase' },
      { type: 'improvement', text: 'Mobile-optimized layouts' },
    ],
  },
]

export function getLatestEntry(): ChangelogEntry | null {
  return CHANGELOG[0] ?? null
}

export function getLatestVersion(): string {
  return CHANGELOG[0]?.version ?? '0.0.0'
}

export function hasNewChangelog(lastSeenVersion: string | null): boolean {
  if (!lastSeenVersion) return true
  return getLatestVersion() !== lastSeenVersion
}

export function getFeaturedAnnouncement() {
  const latest = getLatestEntry()
  if (!latest) return null

  return {
    id: `${latest.version}-${latest.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    title: latest.title,
    description: latest.description ?? latest.changes[0]?.text ?? '',
    version: latest.version,
    date: latest.date,
    icon: latest.icon ?? 'sparkles',
  }
}
