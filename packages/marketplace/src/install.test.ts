import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { installPlugin, removePlugin } from './install.js'
import { readManifest } from './manifest.js'
import { MarketError, type GitExecutor, type MarketIndex, type NpmExecutor } from './types.js'

function makeRepo(root: string, pluginVersion = '1.0.0') {
  const repo = join(root, 'marketplace')
  mkdirSync(join(repo, 'plugins/echarts/dist'), { recursive: true })
  const npmName = '@worm-print-platform/plugin-echarts'
  writeFileSync(join(repo, 'marketplace.json'), JSON.stringify({
    schemaVersion: 1,
    plugins: [{ id: 'echarts', name: '百度图表', version: '1.0.0', npmName,
      path: 'plugins/echarts', entry: 'dist/index.js', kinds: [], exportFormats: [] }],
  }))
  writeFileSync(join(repo, 'plugins/echarts/plugin.json'), JSON.stringify({
    id: 'echarts', version: pluginVersion, name: '百度图表', npmName,
    entry: 'dist/index.js', kinds: [], exportFormats: [],
  }))
  writeFileSync(join(repo, 'plugins/echarts/dist/index.js'), 'export const ok = true\n')
  return repo
}

const indexOf = (repo: string): MarketIndex =>
  JSON.parse(readFileSync(join(repo, 'marketplace.json'), 'utf8'))

const okExec = async () => ({ stdout: '', stderr: '' })

describe('三源安装引擎', () => {
  it('local 源安装：落盘并写清单', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-install-'))
    const repo = makeRepo(cwd)
    const result = await installPlugin({
      name: 'echarts', source: 'local', repo, cwd, index: indexOf(repo),
    })
    expect(result.id).toBe('echarts')
    expect(result.version).toBe('1.0.0')
    expect(existsSync(join(cwd, '.worm-print/plugins/echarts/dist/index.js'))).toBe(true)
    expect(readManifest('.worm-print/plugins', cwd).plugins.echarts.version).toBe('1.0.0')
  })

  it('索引与 plugin.json 版本不一致报 INVALID_PLUGIN', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-install-'))
    const repo = makeRepo(cwd, '9.9.9')
    await expect(installPlugin({
      name: 'echarts', source: 'local', repo, cwd, index: indexOf(repo),
    })).rejects.toMatchObject({ code: 'INVALID_PLUGIN' })
  })

  it('auto 源首个来源网络失败时回退到下一源', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-install-'))
    const repo = makeRepo(cwd)
    const npmFail: NpmExecutor = async () => { throw new MarketError('NPM_FAILED', 'registry down') }
    const result = await installPlugin({
      name: 'echarts', source: 'auto', repo, cwd, index: indexOf(repo), npmExecutor: npmFail,
    })
    expect(result.source).toBe('github')
  })

  it('确定性错误不换源', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-install-'))
    const repo = makeRepo(cwd)
    const pkgDir = join(cwd, 'node_modules/@worm-print-platform/plugin-echarts')
    mkdirSync(pkgDir, { recursive: true })
    writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({
      name: '@worm-print-platform/plugin-echarts',
      wormPrint: { id: 'echarts', version: '9.9.9', entry: 'dist/index.js', kinds: [], exportFormats: [] },
    }))
    const npmVersions: NpmExecutor = async (args) => ({
      stdout: args[0] === 'view' ? '["1.0.0"]' : '', stderr: '',
    })
    const gitMustNotRun: GitExecutor = async () => { throw new Error('不应回退到 git 源') }
    await expect(installPlugin({
      name: 'echarts', source: 'auto', repo, cwd, index: indexOf(repo),
      npmExecutor: npmVersions, gitExecutor: gitMustNotRun,
    })).rejects.toMatchObject({ code: 'INVALID_PLUGIN' })
  })

  it('remove 清理目录与清单条目', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-install-'))
    const repo = makeRepo(cwd)
    await installPlugin({ name: 'echarts', source: 'local', repo, cwd, index: indexOf(repo) })
    await removePlugin({ name: 'echarts', cwd })
    expect(existsSync(join(cwd, '.worm-print/plugins/echarts'))).toBe(false)
    expect(readManifest('.worm-print/plugins', cwd).plugins.echarts).toBeUndefined()
  })
})
