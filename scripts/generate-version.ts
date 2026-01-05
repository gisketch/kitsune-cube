import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function getPackageVersion(): string {
  const pkgPath = join(__dirname, '..', 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
  return pkg.version
}

function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
    const commitDate = execSync('git log -1 --format=%cd --date=short', { encoding: 'utf-8' }).trim()
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()

    return { commitHash, commitDate, branch }
  } catch {
    console.warn('Git not available, using defaults')
    return {
      commitHash: 'unknown',
      commitDate: new Date().toISOString().split('T')[0],
      branch: 'main',
    }
  }
}

const version = getPackageVersion()
const gitInfo = getGitInfo()

const versionInfo = {
  version,
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
