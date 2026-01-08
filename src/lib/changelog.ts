export type ChangeType = 'feature' | 'fix' | 'improvement' | 'breaking'

export interface ChangelogChange {
  type: ChangeType
  text: string
  contributor?: string
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
    version: '0.1.8',
    date: '2026-01-08',
    title: 'Share Your Solves 🔗',
    description: 'Share your solves with beautiful custom embeds and short URLs!',
    icon: 'rocket',
    changes: [
      { type: 'feature', text: 'Short solve URLs - share links are now 8 characters (e.g., /s/a7Bc3xYz)' },
      { type: 'feature', text: 'Custom OG embeds - shared solves show time, scramble, and user info on Discord/Twitter' },
      { type: 'improvement', text: 'Share button now copies the short URL to clipboard' },
    ],
  },
  {
    version: '0.1.7',
    date: '2026-01-08',
    title: 'Goals & Favorites ⭐',
    description: 'Set goals based on your actual averages, favorite your best solves, and find them faster!',
    icon: 'sparkles',
    changes: [
      { type: 'feature', text: 'Dynamic goals - set targets based on your ao5, ao12, ao50, or ao100' },
      { type: 'feature', text: 'Favorite solves - star up to 25 of your best solves to find them easily' },
      { type: 'feature', text: 'Sort solves by time - quickly find your fastest or slowest solves' },
      { type: 'feature', text: 'Page size setting - choose how many solves to show per page' },
      { type: 'improvement', text: 'Favorites and personal bests are now highlighted in your solve list' },
    ],
  },
  {
    version: '0.1.6',
    date: '2026-01-08',
    title: 'Faster Loading ⚡',
    description: 'Major performance improvements! The app now loads instantly with cached data.',
    icon: 'zap',
    changes: [
      { type: 'improvement', text: 'App loads much faster with offline caching' },
      { type: 'improvement', text: 'Your level and stats now appear instantly on startup' },
      { type: 'improvement', text: 'Scrambles generate instantly after first load' },
      { type: 'fix', text: 'Personal Bests now shows only one entry per user (true PB ranking)' },
      { type: 'feature', text: 'Leaderboard tabs now show category descriptions' },
    ],
  },
  {
    version: '0.1.5',
    date: '2026-01-08',
    title: 'Smart Cube Fixes 🧊',
    icon: 'zap',
    changes: [
      { type: 'fix', text: 'MoYu V10 AI now has gyroscope support enabled', contributor: 'chribot' },
      { type: 'fix', text: 'MoYu adapter sends REQUEST_GYRO_ENABLE on connect', contributor: 'chribot' },
      { type: 'fix', text: 'Selecting GAN now only connects to GAN cubes (rejects MoYu/QiYi)' },
      { type: 'fix', text: 'Selecting QiYi now rejects MoYu cubes to prevent gyro being disabled' },
      { type: 'improvement', text: 'Cube picker shows confirmed vs untested status per model' },
      { type: 'improvement', text: 'Model-specific gyro notes (e.g., Carry 2 has no gyro hardware)' },
    ],
  },
  {
    version: '0.1.4',
    date: '2026-01-06',
    title: 'Move Counting & Copy 📋',
    icon: 'zap',
    changes: [
      { type: 'feature', text: 'Copy modal with solution and scramble options' },
      { type: 'feature', text: 'Move consolidation: D D now counts as D2 (1 move)' },
      { type: 'improvement', text: 'TPS uses raw move count for accurate calculation' },
      { type: 'improvement', text: 'Leaderboard icon updated to bar chart' },
      { type: 'improvement', text: 'About and Changelog modals now mobile-friendly' },
      { type: 'improvement', text: 'Smaller replay text on mobile for better readability' },
    ],
  },
  {
    version: '0.1.3',
    date: '2026-01-06',
    title: 'UI Polish ✨',
    icon: 'sparkles',
    changes: [
      { type: 'improvement', text: 'Achievement notifications now show unlock progress' },
      { type: 'improvement', text: 'Mobile CFOP breakdown displays all 4 F2L slots individually' },
    ],
  },
  {
    version: '0.1.2',
    date: '2026-01-06',
    title: 'Community Bug Fixes 🐛',
    icon: 'gift',
    changes: [
      { type: 'fix', text: 'Scramble notation overflow on smaller screens', contributor: 'DeathAlchemy' },
      { type: 'fix', text: 'Repeat scramble button routing to website instead of app', contributor: 'DeathAlchemy' },
      { type: 'fix', text: 'Streak Starter achievement not unlocking properly', contributor: 'DeathAlchemy' },
      { type: 'fix', text: 'GitHub repository links pointing to wrong URLs', contributor: 'bellalMohamed' },
    ],
  },
  {
    version: '0.1.1',
    date: '2026-01-05',
    title: 'Improved Release Workflow',
    icon: 'zap',
    changes: [
      { type: 'improvement', text: 'New semantic versioning system with release scripts' },
      { type: 'improvement', text: 'Changelog validation before releases' },
      { type: 'improvement', text: 'Streamlined deploy workflow with Netlify integration' },
    ],
  },
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
