import { execSync } from 'child_process'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function getGitInfo() {
  try {
    const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim()
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
    const commitDate = execSync('git log -1 --format=%cd --date=short', { encoding: 'utf-8' }).trim()
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()

    return {
      commitCount: parseInt(commitCount, 10),
      commitHash,
      commitDate,
      branch,
    }
  } catch {
    console.warn('Git not available, using defaults')
    return {
      commitCount: 0,
      commitHash: 'unknown',
      commitDate: new Date().toISOString().split('T')[0],
      branch: 'main',
    }
  }
}

function generateVersion(commitCount: number): string {
  const major = 0
  const minor = Math.floor(commitCount / 100)
  const patch = commitCount % 100
  return `${major}.${minor}.${patch}`
}

const gitInfo = getGitInfo()
const version = generateVersion(gitInfo.commitCount)

const versionInfo = {
  version,
  commitCount: gitInfo.commitCount,
  commitHash: gitInfo.commitHash,
  commitDate: gitInfo.commitDate,
  branch: gitInfo.branch,
  buildDate: new Date().toISOString().split('T')[0],
  stage: 'beta',
}

const outputPath = join(__dirname, '..', 'src', 'lib', 'version.json')
writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2))

console.log(`✅ Version generated: v${version}-${versionInfo.stage}`)
console.log(`   Commit: ${gitInfo.commitHash} (${gitInfo.commitDate})`)
console.log(`   Total commits: ${gitInfo.commitCount}`)
