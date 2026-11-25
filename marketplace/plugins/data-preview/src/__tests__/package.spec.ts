import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { installPlugin } from '../../../../../packages/marketplace/src/install.js'
import type { MarketIndex } from '../../../../../packages/marketplace/src/types.js'

const root = fileURLToPath(new URL('../../../../../', import.meta.url))
const repo = join(root, 'marketplace')
const index = JSON.parse(readFileSync(join(repo, 'marketplace.json'), 'utf8')) as MarketIndex
const plugin = JSON.parse(readFileSync(join(repo, 'plugins/data-preview/plugin.json'), 'utf8'))
const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('data-preview 市场安装闭包', () => {
  it('白名单覆盖完整 dist', () => {
    expect(plugin.files).toContain('dist')
  })

  it('local 市场安装后入口与相对依赖可直接导入', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'data-preview-market-'))
    tempDirs.push(cwd)
    const result = await installPlugin({
      name: 'data-preview', source: 'local', repo, cwd, index,
    })
    for (const file of ['index.js', 'ui.js', 'describe.js', 'types.js']) {
      expect(existsSync(join(result.target, 'dist', file)), file).toBe(true)
    }
    const entryUrl = pathToFileURL(join(result.target, plugin.entry))
    const mod = await import(entryUrl.href)
    expect(typeof mod.openDataPreview).toBe('function')
    expect(typeof mod.describeDataSource).toBe('function')
  })
})
