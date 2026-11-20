import { existsSync, realpathSync } from 'node:fs'
import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const dependencyDirectory = fileURLToPath(new URL('../node_modules', import.meta.url))

try {
  if (!existsSync(new URL('../node_modules/next/package.json', import.meta.url))) throw new Error('Missing Next.js installation')
  if (relative(dependencyDirectory, realpathSync(dependencyDirectory)) !== '') {
    console.error('This app is using a linked node_modules directory. Install its own locked dependencies with npm ci before starting development.')
    process.exitCode = 1
  }
} catch {
  console.error('Dependencies are missing. Run npm ci before starting development.')
  process.exitCode = 1
}
