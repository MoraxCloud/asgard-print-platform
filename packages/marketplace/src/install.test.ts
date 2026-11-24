import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
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

/** 带语言资源的插件仓库：plugin.json + package.json(wormPrint.i18n) + dist/i18n/<locale>.json */
function makeRepoWithI18n(root: string, locales: string[] = ['zh-CN']) {
  const repo = makeRepo(root)
  const dir = join(repo, 'plugins/echarts')
  mkdirSync(join(dir, 'dist/i18n'), { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify({
    name: '@worm-print-platform/plugin-echarts',
    wormPrint: { id: 'echarts', i18n: { dir: 'dist/i18n', base: 'zh-CN' } },
  }))
  for (const locale of locales) {
    writeFileSync(join(dir, 'dist/i18n', `${locale}.json`), JSON.stringify({ echarts: { 'echarts.panel.chart': locale } }))
  }
  return repo
}

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

  it('force 升级只保留新版本白名单文件', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-install-'))
    const repo = makeRepo(cwd)
    await installPlugin({ name: 'echarts', source: 'local', repo, cwd, index: indexOf(repo) })
    const target = join(cwd, '.worm-print/plugins/echarts')
    writeFileSync(join(target, 'obsolete.js'), 'export const obsolete = true\n')

    const index = indexOf(repo)
    index.plugins[0].version = '2.0.0'
    writeFileSync(join(repo, 'marketplace.json'), JSON.stringify(index))
    const pluginPath = join(repo, 'plugins/echarts/plugin.json')
    const plugin = JSON.parse(readFileSync(pluginPath, 'utf8'))
    plugin.version = '2.0.0'
    writeFileSync(pluginPath, JSON.stringify(plugin))

    await installPlugin({ name: 'echarts', source: 'local', repo, cwd, force: true, index })
    expect(existsSync(join(target, 'obsolete.js'))).toBe(false)
    expect(readManifest('.worm-print/plugins', cwd).plugins.echarts.version).toBe('2.0.0')
  })

  it('force 复制失败时保留旧插件与语言资源', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-install-'))
    const repo = makeRepoWithI18n(cwd)
    await installPlugin({ name: 'echarts', source: 'local', repo, cwd, index: indexOf(repo) })
    const target = join(cwd, '.worm-print/plugins/echarts')
    const oldEntry = readFileSync(join(target, 'dist/index.js'), 'utf8')
    const oldLocale = readFileSync(join(cwd, '.worm-print/i18n/echarts/zh-CN.json'), 'utf8')

    const index = indexOf(repo)
    index.plugins[0].version = '2.0.0'
    writeFileSync(join(repo, 'marketplace.json'), JSON.stringify(index))
    const pluginPath = join(repo, 'plugins/echarts/plugin.json')
    const plugin = JSON.parse(readFileSync(pluginPath, 'utf8'))
    plugin.version = '2.0.0'
    plugin.files = ['dist', 'plugin.json']
    writeFileSync(pluginPath, JSON.stringify(plugin))
    writeFileSync(join(repo, 'plugins/echarts/dist/index.js'), 'export const ok = "v2"\n')
    const blocked = join(repo, 'plugins/echarts/dist/blocked.js')
    writeFileSync(blocked, 'export const blocked = true\n')
    chmodSync(blocked, 0)

    try {
      await expect(installPlugin({
        name: 'echarts', source: 'local', repo, cwd, force: true, index,
      })).rejects.toThrow()
    } finally {
      chmodSync(blocked, 0o644)
    }
    expect(readFileSync(join(target, 'dist/index.js'), 'utf8')).toBe(oldEntry)
    expect(readFileSync(join(cwd, '.worm-print/i18n/echarts/zh-CN.json'), 'utf8')).toBe(oldLocale)
    expect(readManifest('.worm-print/plugins', cwd).plugins.echarts.version).toBe('1.0.0')
  })

  it('force 语言资源校验失败时尚未切换插件目录', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-install-'))
    const repo = makeRepoWithI18n(cwd)
    await installPlugin({ name: 'echarts', source: 'local', repo, cwd, index: indexOf(repo) })
    const target = join(cwd, '.worm-print/plugins/echarts')
    const oldEntry = readFileSync(join(target, 'dist/index.js'), 'utf8')

    const index = indexOf(repo)
    index.plugins[0].version = '2.0.0'
    writeFileSync(join(repo, 'marketplace.json'), JSON.stringify(index))
    const pluginPath = join(repo, 'plugins/echarts/plugin.json')
    const plugin = JSON.parse(readFileSync(pluginPath, 'utf8'))
    plugin.version = '2.0.0'
    writeFileSync(pluginPath, JSON.stringify(plugin))
    writeFileSync(join(repo, 'plugins/echarts/dist/index.js'), 'export const ok = "v2"\n')
    rmSync(join(repo, 'plugins/echarts/dist/i18n'), { recursive: true, force: true })

    await expect(installPlugin({
      name: 'echarts', source: 'local', repo, cwd, force: true, index,
    })).rejects.toMatchObject({ code: 'INVALID_PLUGIN' })
    expect(readFileSync(join(target, 'dist/index.js'), 'utf8')).toBe(oldEntry)
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
    expect(result.source).toBe('gitee')
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

  it('git 源用 tag 名而非完整 ref 作为 --branch', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-install-'))
    const repo = makeRepo(cwd)
    const calls: string[][] = []
    const gitExecutor: GitExecutor = async (args) => {
      calls.push(args)
      if (args[0] === 'ls-remote') {
        return { stdout: `abc\trefs/tags/plugins/echarts/v1.0.0\n`, stderr: '' }
      }
      if (args[0] === 'clone') {
        const target = args[args.length - 1]
        mkdirSync(join(target, 'marketplace/plugins/echarts/dist'), { recursive: true })
        cpSync(join(repo, 'marketplace.json'), join(target, 'marketplace/marketplace.json'))
        cpSync(join(repo, 'plugins/echarts/plugin.json'), join(target, 'marketplace/plugins/echarts/plugin.json'))
        cpSync(join(repo, 'plugins/echarts/dist/index.js'), join(target, 'marketplace/plugins/echarts/dist/index.js'))
      }
      return { stdout: '', stderr: '' }
    }
    const result = await installPlugin({
      name: 'echarts', source: 'github', repo: 'https://github.com/x/y.git',
      cwd, index: indexOf(repo), gitExecutor,
    })
    const cloneArgs = calls.find(args => args[0] === 'clone')!
    expect(cloneArgs[cloneArgs.indexOf('--branch') + 1]).toBe('plugins/echarts/v1.0.0')
    const sparseArgs = calls.find(args => args[0] === 'sparse-checkout')!
    expect(sparseArgs).toContain('--no-cone')
    expect(sparseArgs).toContain('marketplace/plugins/echarts')
    expect(result.version).toBe('1.0.0')
  })

  it('git 源无 tag 时回退默认分支并标记非稳定', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-install-'))
    const repo = makeRepo(cwd)
    const gitExecutor: GitExecutor = async (args) => {
      if (args[0] === 'ls-remote') return { stdout: '', stderr: '' }
      if (args[0] === 'clone') {
        expect(args).not.toContain('--branch')
        const target = args[args.length - 1]
        mkdirSync(join(target, 'marketplace/plugins/echarts/dist'), { recursive: true })
        cpSync(join(repo, 'plugins/echarts/plugin.json'), join(target, 'marketplace/plugins/echarts/plugin.json'))
        cpSync(join(repo, 'plugins/echarts/dist/index.js'), join(target, 'marketplace/plugins/echarts/dist/index.js'))
      }
      return { stdout: '', stderr: '' }
    }
    const result = await installPlugin({
      name: 'echarts', source: 'github', repo: 'https://github.com/x/y.git',
      cwd, index: indexOf(repo), gitExecutor,
    })
    expect(result.stable).toBe(false)
    expect(result.version).toBe('1.0.0')
    expect(readManifest('.worm-print/plugins', cwd).plugins.echarts.stable).toBe(false)
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

describe('插件语言资源同步', () => {
  it('安装同步语言资源到 .worm-print/i18n/<id> 并写入清单', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-i18n-'))
    const repo = makeRepoWithI18n(cwd)
    await installPlugin({ name: 'echarts', source: 'local', repo, cwd, force: true, index: indexOf(repo) })
    expect(existsSync(join(cwd, '.worm-print/i18n/echarts/zh-CN.json'))).toBe(true)
    expect(readManifest('.worm-print/plugins', cwd).plugins.echarts.i18n?.locales).toEqual(['zh-CN'])
  })

  it('卸载清理语言资源目录', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-i18n-'))
    const repo = makeRepoWithI18n(cwd)
    await installPlugin({ name: 'echarts', source: 'local', repo, cwd, index: indexOf(repo) })
    await removePlugin({ name: 'echarts', cwd })
    expect(existsSync(join(cwd, '.worm-print/i18n/echarts'))).toBe(false)
  })

  it('升级重写语言目录，不残留已删除语言', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-i18n-'))
    const repo = makeRepoWithI18n(cwd, ['zh-CN', 'en-US'])
    await installPlugin({ name: 'echarts', source: 'local', repo, cwd, index: indexOf(repo) })
    expect(existsSync(join(cwd, '.worm-print/i18n/echarts/en-US.json'))).toBe(true)
    // 源仓库删掉 en-US，强制升级后只剩 zh-CN
    const { unlinkSync } = await import('node:fs')
    unlinkSync(join(repo, 'plugins/echarts/dist/i18n/en-US.json'))
    await installPlugin({ name: 'echarts', source: 'local', repo, cwd, force: true, index: indexOf(repo) })
    expect(existsSync(join(cwd, '.worm-print/i18n/echarts/en-US.json'))).toBe(false)
    expect(readManifest('.worm-print/plugins', cwd).plugins.echarts.i18n?.locales).toEqual(['zh-CN'])
  })

  it('force 升级取消 i18n 声明时清理旧语言目录', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-i18n-'))
    const repo = makeRepoWithI18n(cwd)
    await installPlugin({ name: 'echarts', source: 'local', repo, cwd, index: indexOf(repo) })

    const index = indexOf(repo)
    index.plugins[0].version = '2.0.0'
    writeFileSync(join(repo, 'marketplace.json'), JSON.stringify(index))
    const pluginPath = join(repo, 'plugins/echarts/plugin.json')
    const plugin = JSON.parse(readFileSync(pluginPath, 'utf8'))
    plugin.version = '2.0.0'
    writeFileSync(pluginPath, JSON.stringify(plugin))
    const pkgPath = join(repo, 'plugins/echarts/package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    delete pkg.wormPrint.i18n
    writeFileSync(pkgPath, JSON.stringify(pkg))

    await installPlugin({ name: 'echarts', source: 'local', repo, cwd, force: true, index })
    expect(existsSync(join(cwd, '.worm-print/i18n/echarts'))).toBe(false)
    expect(readManifest('.worm-print/plugins', cwd).plugins.echarts.i18n).toBeUndefined()
  })

  it('force 清单写入失败时回滚已切换的插件与语言目录', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-install-'))
    const repo = makeRepoWithI18n(cwd)
    await installPlugin({ name: 'echarts', source: 'local', repo, cwd, index: indexOf(repo) })
    const target = join(cwd, '.worm-print/plugins/echarts')
    const oldEntry = readFileSync(join(target, 'dist/index.js'), 'utf8')
    const oldLocale = readFileSync(join(cwd, '.worm-print/i18n/echarts/zh-CN.json'), 'utf8')
    const oldManifest = readFileSync(join(cwd, '.worm-print/plugins.json'), 'utf8')

    const index = indexOf(repo)
    index.plugins[0].version = '2.0.0'
    writeFileSync(join(repo, 'marketplace.json'), JSON.stringify(index))
    const pluginPath = join(repo, 'plugins/echarts/plugin.json')
    const plugin = JSON.parse(readFileSync(pluginPath, 'utf8'))
    plugin.version = '2.0.0'
    writeFileSync(pluginPath, JSON.stringify(plugin))
    writeFileSync(join(repo, 'plugins/echarts/dist/index.js'), 'export const ok = "v2"\n')
    writeFileSync(join(repo, 'plugins/echarts/dist/i18n/zh-CN.json'), JSON.stringify({ echarts: { 'echarts.panel.chart': 'v2' } }))

    chmodSync(join(cwd, '.worm-print'), 0o555)
    try {
      await expect(installPlugin({
        name: 'echarts', source: 'local', repo, cwd, force: true, index,
      })).rejects.toThrow()
    } finally {
      chmodSync(join(cwd, '.worm-print'), 0o755)
    }
    expect(readFileSync(join(target, 'dist/index.js'), 'utf8')).toBe(oldEntry)
    expect(readFileSync(join(cwd, '.worm-print/i18n/echarts/zh-CN.json'), 'utf8')).toBe(oldLocale)
    expect(readFileSync(join(cwd, '.worm-print/plugins.json'), 'utf8')).toBe(oldManifest)
    expect(readdirSync(join(cwd, '.worm-print/plugins')).filter(name => /^\.echarts\.(tmp|old)-/.test(name))).toEqual([])
    expect(readdirSync(join(cwd, '.worm-print/i18n')).filter(name => /^\.echarts\.(tmp|old)-/.test(name))).toEqual([])
  })

  it('插件未声明 i18n 时不写语言目录也不写清单字段', async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'mp-i18n-'))
    const repo = makeRepo(cwd)
    await installPlugin({ name: 'echarts', source: 'local', repo, cwd, index: indexOf(repo) })
    expect(existsSync(join(cwd, '.worm-print/i18n/echarts'))).toBe(false)
    expect(readManifest('.worm-print/plugins', cwd).plugins.echarts.i18n).toBeUndefined()
  })
})
