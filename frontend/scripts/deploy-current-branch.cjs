const { execSync, spawnSync } = require('node:child_process')
const path = require('node:path')

const frontendDir = __dirname
const repoRoot = path.resolve(frontendDir, '..')

function getCurrentBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim()

    if (!branch || branch === 'HEAD') {
      throw new Error('Unable to determine the current git branch.')
    }

    return branch
  } catch (error) {
    console.error('Unable to determine the current git branch.')
    process.exit(1)
  }
}

const branch = getCurrentBranch()
console.log(`Deploying frontend build from branch: ${branch}`)

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['gh-pages', '-d', 'dist', '-b', 'gh-pages'],
  {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: false,
  },
)

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
