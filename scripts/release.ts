import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as readline from 'readline'
import { getLatestVersion } from '../src/lib/changelog'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

type ReleaseType = 'minor' | 'patch'

function readPackageJson() {
  const pkgPath = join(rootDir, 'package.json')
  return JSON.parse(readFileSync(pkgPath, 'utf-8'))
}

function writePackageJson(pkg: Record<string, unknown>) {
  const pkgPath = join(rootDir, 'package.json')
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

function bumpVersion(currentVersion: string, type: ReleaseType): string {
  const [major, minor, patch] = currentVersion.split('.').map(Number)

  if (type === 'minor') {
    return `${major}.${minor + 1}.0`
  }
  return `${major}.${minor}.${patch + 1}`
}

function exec(cmd: string, silent = false) {
  if (!silent) console.log(`  $ ${cmd}`)
  return execSync(cmd, { cwd: rootDir, encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' })
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function confirmDeploy(): Promise<boolean> {
  const answer = await prompt('\n🚀 Deploy to Netlify? (y/N): ')
  return answer.toLowerCase() === 'y'
}

function hasUncommittedChanges(): boolean {
  const status = execSync('git status --porcelain', { cwd: rootDir, encoding: 'utf-8' })
  return status.trim().length > 0
}

function validateChangelog(newVersion: string): boolean {
  const changelogVersion = getLatestVersion()
  return changelogVersion === newVersion
}

async function release(type: ReleaseType) {
  console.log('\n🦊 Kitsune Cube Release\n')

  const pkg = readPackageJson()
  const currentVersion = pkg.version
  const newVersion = bumpVersion(currentVersion, type)

  console.log(`📦 Current version: ${currentVersion}`)
  console.log(`📦 New version:     ${newVersion} (${type})\n`)

  if (!validateChangelog(newVersion)) {
    const changelogVersion = getLatestVersion()
    console.log('❌ Changelog not updated!\n')
    console.log(`   Expected version in changelog: ${newVersion}`)
    console.log(`   Found version in changelog:    ${changelogVersion}\n`)
    console.log('Please update src/lib/changelog.ts first:\n')
    console.log(`   1. Add a new entry at the top of CHANGELOG array`)
    console.log(`   2. Set version to "${newVersion}"`)
    console.log(`   3. Add your changes, then run this command again\n`)
    process.exit(1)
  }

  console.log('✅ Changelog validated\n')

  if (hasUncommittedChanges()) {
    console.log('📝 Staging changelog changes...')
    exec('git add src/lib/changelog.ts')
  }

  const confirm = await prompt(`Proceed with release v${newVersion}? (y/N): `)
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Release cancelled.\n')
    process.exit(0)
  }

  console.log('\n📝 Updating package.json...')
  pkg.version = newVersion
  writePackageJson(pkg)

  console.log('📝 Generating version.json...')
  exec('npx tsx scripts/generate-version.ts', true)

  console.log('📝 Creating git commit...')
  exec('git add package.json src/lib/version.json src/lib/changelog.ts')
  exec(`git commit -m "release: v${newVersion}"`)

  console.log('🏷️  Creating git tag...')
  exec(`git tag -a v${newVersion} -m "Release v${newVersion}"`)

  console.log('📤 Pushing to origin...')
  exec('git push')
  exec('git push --tags')

  if (await confirmDeploy()) {
    console.log('\n🚀 Building and deploying to Netlify...')
    exec('npm run build')
    exec('npx netlify deploy --prod --dir=dist')
    console.log('\n✅ Deployed to Netlify!')
  }

  console.log(`\n✅ Released v${newVersion}!\n`)
}

const args = process.argv.slice(2)
const type = args[0] as ReleaseType

if (!type || !['minor', 'patch'].includes(type)) {
  console.log('\n🦊 Kitsune Cube Release\n')
  console.log('Usage: npm run release:minor   # New features (0.1.0 → 0.2.0)')
  console.log('       npm run release:patch   # Bug fixes (0.1.0 → 0.1.1)\n')
  console.log('Workflow:')
  console.log('  1. Update src/lib/changelog.ts with the NEW version')
  console.log('  2. Run npm run release:minor (or release:patch)')
  console.log('  3. Script validates changelog, bumps package.json, commits, tags, pushes')
  console.log('  4. Optionally deploy to Netlify\n')
  process.exit(1)
}

release(type)
