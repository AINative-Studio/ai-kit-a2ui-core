/**
 * Monorepo Configuration Tests
 *
 * Tests to validate pnpm workspace setup, package structure, and configuration
 *
 * @group integration
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { parse as parseYAML } from 'yaml'

const ROOT_DIR = join(__dirname, '..')
const PACKAGES_DIR = join(ROOT_DIR, 'packages')
const EXAMPLES_DIR = join(ROOT_DIR, 'examples')

describe('Monorepo Configuration', () => {
  describe('pnpm-workspace.yaml', () => {
    it('should exist in root directory', () => {
      const workspaceFile = join(ROOT_DIR, 'pnpm-workspace.yaml')
      expect(existsSync(workspaceFile)).toBe(true)
    })

    it('should define packages and examples directories', () => {
      const workspaceFile = join(ROOT_DIR, 'pnpm-workspace.yaml')
      const content = readFileSync(workspaceFile, 'utf-8')
      const config = parseYAML(content)

      expect(config.packages).toBeDefined()
      expect(config.packages).toContain('packages/*')
      expect(config.packages).toContain('examples/*')
    })
  })

  describe('Root package.json', () => {
    it('should have correct monorepo configuration', () => {
      const packageJson = JSON.parse(
        readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8')
      )

      expect(packageJson.name).toBe('@ainative/ai-kit-a2ui-core')
      expect(packageJson.packageManager).toMatch(/^pnpm@10/)
      expect(packageJson.engines).toBeDefined()
      expect(packageJson.engines.pnpm).toBe('>=10.0.0')
    })

    it('should have workspace-aware scripts', () => {
      const packageJson = JSON.parse(
        readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8')
      )

      const requiredScripts = [
        'build',
        'test',
        'lint',
        'type-check',
        'changeset',
        'changeset:version',
        'changeset:publish',
      ]

      requiredScripts.forEach((script) => {
        expect(packageJson.scripts[script]).toBeDefined()
        expect(packageJson.scripts[script]).not.toBe('')
      })
    })

    it('should have Changesets CLI installed', () => {
      const packageJson = JSON.parse(
        readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8')
      )

      expect(packageJson.devDependencies['@changesets/cli']).toBeDefined()
      expect(packageJson.devDependencies['@changesets/cli']).toMatch(/^\^2\./)
    })
  })

  describe('Changesets Configuration', () => {
    it('should have .changeset directory', () => {
      const changesetDir = join(ROOT_DIR, '.changeset')
      expect(existsSync(changesetDir)).toBe(true)
    })

    it('should have config.json with correct settings', () => {
      const configFile = join(ROOT_DIR, '.changeset', 'config.json')
      expect(existsSync(configFile)).toBe(true)

      const config = JSON.parse(readFileSync(configFile, 'utf-8'))

      expect(config.baseBranch).toBe('main')
      expect(config.access).toBe('public')
      expect(config.commit).toBe(false)
      expect(config.updateInternalDependencies).toBe('patch')
    })

    it('should ignore example packages', () => {
      const configFile = join(ROOT_DIR, '.changeset', 'config.json')
      const config = JSON.parse(readFileSync(configFile, 'utf-8'))

      expect(config.ignore).toBeDefined()
      expect(Array.isArray(config.ignore)).toBe(true)
      expect(config.ignore.length).toBeGreaterThan(0)
    })
  })

  describe('Directory Structure', () => {
    it('should have packages directory', () => {
      expect(existsSync(PACKAGES_DIR)).toBe(true)
      expect(statSync(PACKAGES_DIR).isDirectory()).toBe(true)
    })

    it('should have examples directory', () => {
      expect(existsSync(EXAMPLES_DIR)).toBe(true)
      expect(statSync(EXAMPLES_DIR).isDirectory()).toBe(true)
    })

    it('should have at least one package', () => {
      const packages = readdirSync(PACKAGES_DIR).filter((name) => {
        const packagePath = join(PACKAGES_DIR, name)
        return statSync(packagePath).isDirectory() && name !== '.gitkeep'
      })

      expect(packages.length).toBeGreaterThan(0)
    })
  })

  describe('Package Structure', () => {
    it('each package should have package.json', () => {
      const packages = readdirSync(PACKAGES_DIR).filter((name) => {
        const packagePath = join(PACKAGES_DIR, name)
        return statSync(packagePath).isDirectory() && name !== '.gitkeep'
      })

      packages.forEach((pkg) => {
        const packageJsonPath = join(PACKAGES_DIR, pkg, 'package.json')
        expect(existsSync(packageJsonPath)).toBe(true)
      })
    })

    it('packages should use workspace protocol for internal dependencies', () => {
      const packages = readdirSync(PACKAGES_DIR).filter((name) => {
        const packagePath = join(PACKAGES_DIR, name)
        return statSync(packagePath).isDirectory() && name !== '.gitkeep'
      })

      packages.forEach((pkg) => {
        const packageJsonPath = join(PACKAGES_DIR, pkg, 'package.json')
        if (!existsSync(packageJsonPath)) return

        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
        const deps = packageJson.dependencies || {}

        Object.entries(deps).forEach(([name, version]) => {
          if (name.startsWith('@ainative/')) {
            expect(version).toMatch(/^workspace:/)
          }
        })
      })
    })

    it('packages should have required scripts', () => {
      const packages = readdirSync(PACKAGES_DIR).filter((name) => {
        const packagePath = join(PACKAGES_DIR, name)
        return statSync(packagePath).isDirectory() && name !== '.gitkeep'
      })

      const requiredScripts = ['build', 'test', 'type-check']

      packages.forEach((pkg) => {
        const packageJsonPath = join(PACKAGES_DIR, pkg, 'package.json')
        if (!existsSync(packageJsonPath)) return

        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
        const scripts = packageJson.scripts || {}

        requiredScripts.forEach((script) => {
          expect(scripts[script]).toBeDefined()
        })
      })
    })
  })

  describe('GitHub Actions Workflows', () => {
    it('should have CI workflow', () => {
      const ciWorkflow = join(ROOT_DIR, '.github', 'workflows', 'ci.yml')
      expect(existsSync(ciWorkflow)).toBe(true)
    })

    it('CI workflow should use pnpm action', () => {
      const ciWorkflow = join(ROOT_DIR, '.github', 'workflows', 'ci.yml')
      const content = readFileSync(ciWorkflow, 'utf-8')

      expect(content).toContain('pnpm/action-setup')
      expect(content).toContain('version: 10')
    })

    it('should have release workflow', () => {
      const releaseWorkflow = join(ROOT_DIR, '.github', 'workflows', 'release.yml')
      expect(existsSync(releaseWorkflow)).toBe(true)
    })

    it('release workflow should use changesets action', () => {
      const releaseWorkflow = join(ROOT_DIR, '.github', 'workflows', 'release.yml')
      const content = readFileSync(releaseWorkflow, 'utf-8')

      expect(content).toContain('changesets/action')
      expect(content).toContain('changeset:publish')
      expect(content).toContain('changeset:version')
    })
  })

  describe('NPM Configuration', () => {
    it('should have .npmrc file', () => {
      const npmrcFile = join(ROOT_DIR, '.npmrc')
      expect(existsSync(npmrcFile)).toBe(true)
    })

    it('.npmrc should have pnpm workspace settings', () => {
      const npmrcFile = join(ROOT_DIR, '.npmrc')
      const content = readFileSync(npmrcFile, 'utf-8')

      expect(content).toContain('link-workspace-packages=true')
      expect(content).toContain('prefer-workspace-packages=true')
    })
  })
})

describe('Workspace Functionality', () => {
  describe('Package Manager', () => {
    it('should have pnpm-lock.yaml', () => {
      const lockFile = join(ROOT_DIR, 'pnpm-lock.yaml')
      expect(existsSync(lockFile)).toBe(true)
    })

    it('should not have npm lock files', () => {
      const npmLock = join(ROOT_DIR, 'package-lock.json')
      const yarnLock = join(ROOT_DIR, 'yarn.lock')

      // Only fail if they exist and contain actual content
      if (existsSync(npmLock)) {
        const content = readFileSync(npmLock, 'utf-8')
        expect(content.length).toBe(0)
      }
      expect(existsSync(yarnLock)).toBe(false)
    })
  })

  describe('TypeScript Configuration', () => {
    it('root should have tsconfig.json', () => {
      const tsconfigPath = join(ROOT_DIR, 'tsconfig.json')
      expect(existsSync(tsconfigPath)).toBe(true)
    })

    it('tsconfig should be in strict mode', () => {
      const tsconfigPath = join(ROOT_DIR, 'tsconfig.json')
      const content = readFileSync(tsconfigPath, 'utf-8')

      // Remove comments from JSON before parsing
      const jsonContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
      const tsconfig = JSON.parse(jsonContent)

      expect(tsconfig.compilerOptions.strict).toBe(true)
    })
  })
})
