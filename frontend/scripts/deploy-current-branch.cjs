const { execSync } = require('node:child_process')
const path = require('node:path')

const scriptsDir = __dirname
const frontendDir = path.resolve(scriptsDir, '..')

function getCurrentBranch() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: frontendDir,
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

try {
  execSync('npx gh-pages -d dist -b gh-pages', {
    cwd: frontendDir,
    stdio: 'inherit',
  })
} catch (error) {
  process.exit(error.status ?? 1)
}
