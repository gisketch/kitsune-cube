import versionData from './version.json'

export interface VersionInfo {
  version: string
  commitCount: number
  commitHash: string
  commitDate: string
  branch: string
  buildDate: string
  stage: 'alpha' | 'beta' | 'rc' | 'stable'
}

export const VERSION: VersionInfo = versionData as VersionInfo

export function getVersionString(): string {
  return `v${VERSION.version}-${VERSION.stage}`
}

export function getFullVersionString(): string {
  return `v${VERSION.version}-${VERSION.stage} (${VERSION.commitHash})`
}

export function getVersionWithDate(): string {
  return `v${VERSION.version}-${VERSION.stage} • ${VERSION.commitDate}`
}
