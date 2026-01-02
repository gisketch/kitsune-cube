import { VERSION } from './version'

export type ChangeType = 'feature' | 'fix' | 'improvement' | 'breaking'

export interface ChangelogChange {
  type: ChangeType
  text: string
}

export interface ChangelogEntry {
  version: string
  date: string
  title: string
  changes: ChangelogChange[]
}

export interface FeaturedAnnouncement {
  id: string
  title: string
  description: string
  version: string
  date: string
  icon?: 'rocket' | 'sparkles' | 'gift' | 'zap'
}

export const FEATURED_ANNOUNCEMENT: FeaturedAnnouncement | null = {
  id: 'multi-brand-v1',
  title: 'Multi-Brand Smart Cube Support! 🎮',
  description: 'Connect MoYu, QiYi, and GiiKER smart cubes (experimental). GAN cubes fully supported with gyroscope for solve replays.',
  version: VERSION.version,
  date: VERSION.commitDate,
  icon: 'sparkles',
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: '0.0.44',
    date: '2026-01-03',
    title: 'Multi-Brand Smart Cube Support',
    changes: [
      { type: 'feature', text: 'Added MoYu, QiYi, and GiiKER smart cube support (Beta)' },
      { type: 'feature', text: 'New brand picker modal with tooltip showing supported models' },
      { type: 'improvement', text: 'Redesigned landing page cube support section' },
    ],
  },
  {
    version: '0.0.42',
    date: '2026-01-03',
    title: 'Changelog & Timer Redesign',
    changes: [
      { type: 'feature', text: 'Added changelog notification system with bell icon' },
      { type: 'feature', text: 'New detailed timer layout mode' },
      { type: 'improvement', text: 'Added Open Graph image for social sharing' },
    ],
  },
  {
    version: '0.0.41',
    date: '2026-01-03',
    title: 'Website Launch',
    changes: [
      { type: 'feature', text: 'New landing page with feature showcase' },
      { type: 'improvement', text: 'Polished account and leaderboard pages' },
      { type: 'improvement', text: 'Added FAQ page and SEO improvements' },
    ],
  },
  {
    version: '0.0.38',
    date: '2026-01-02',
    title: 'Account & Goals',
    changes: [
      { type: 'feature', text: 'Remember MAC address per account for auto-reconnect' },
      { type: 'feature', text: 'Delete solve confirmation modal' },
      { type: 'improvement', text: 'Hide goals UI when viewing others\' solves' },
      { type: 'improvement', text: 'Polished achievements and account pages' },
    ],
  },
  {
    version: '0.0.32',
    date: '2026-01-01',
    title: 'Leaderboards & Notifications',
    changes: [
      { type: 'feature', text: 'Achievement unlock notifications with confetti' },
      { type: 'feature', text: 'CFOP phase goals with presets' },
      { type: 'feature', text: 'Move/timer tabs on mobile solve results' },
      { type: 'fix', text: 'Fixed leaderboard display names and rankings' },
      { type: 'improvement', text: 'New Kitsune Cube logo' },
    ],
  },
  {
    version: '0.0.24',
    date: '2026-01-01',
    title: 'Offline Mode & Mobile',
    changes: [
      { type: 'feature', text: 'Offline mode for guest users' },
      { type: 'feature', text: 'Authentication with Google sign-in' },
      { type: 'improvement', text: 'Mobile-optimized layouts and gestures' },
      { type: 'fix', text: 'Various bug fixes and stability improvements' },
    ],
  },
  {
    version: '0.0.15',
    date: '2025-12-31',
    title: 'Gyroscope & Replay',
    changes: [
      { type: 'feature', text: 'Solve replay with move-by-move playback' },
      { type: 'feature', text: 'Gyroscope controls for 3D cube rotation' },
      { type: 'fix', text: 'Fixed gyro calibration and drift issues' },
    ],
  },
  {
    version: '0.0.8',
    date: '2025-12-29',
    title: 'Smart Cube Connection',
    changes: [
      { type: 'feature', text: 'GAN smart cube Bluetooth connection' },
      { type: 'feature', text: 'Real-time cube state visualization' },
      { type: 'feature', text: 'Automatic scramble detection' },
      { type: 'improvement', text: 'Improved 3D cube model rendering' },
    ],
  },
  {
    version: '0.0.1',
    date: '2025-12-29',
    title: 'Initial Release',
    changes: [
      { type: 'feature', text: 'Manual timer with keyboard controls' },
      { type: 'feature', text: 'Scramble generation' },
      { type: 'feature', text: 'Solve history and statistics' },
      { type: 'feature', text: 'Multiple color themes including Catppuccin and Rosé Pine' },
    ],
  },
]

export function getLatestVersion(): string {
  return CHANGELOG_ENTRIES[0]?.version || VERSION.version
}

export function hasNewChangelog(lastSeenVersion: string | null): boolean {
  if (!lastSeenVersion) return true
  const latestVersion = getLatestVersion()
  return latestVersion !== lastSeenVersion
}
