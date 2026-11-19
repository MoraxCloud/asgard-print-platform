import { execFile } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { readManifest, removeManifestEntry, upsertManifestEntry } from './manifest.js'
import { buildGitTag, resolvePluginName, resolveVersion } from './resolve.js'
import { resolveGitSource } from './repo.js'
import {
  MarketError,
  type CommandResult,
  type GitExecutor,
  type InstallOptions,
  type InstallResult,
  type MarketSource,
  type NpmExecutor,
  type RemoveOptions,
} from './types.js'

const execFileAsync = promisify(execFile)

export const defaultNpmExecutor: NpmExecutor = async (args, cwd) => {
  try {
    const { stdout, stderr } = await execFileAsync('npm', args, { cwd, timeout: 120000 })
    return { stdout, stderr }
  } catch (err) {
    throw new MarketError('NPM_FAILED', err instanceof Error ? err.message : String(err))
  }
}

export const defaultGitExecutor: GitExecutor = async (args, cwd) => {
  try {
    const { stdout, stderr } = await execFileAsync('git', args, {
      cwd,
      timeout: 120000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    })
    return { stdout, stderr }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const code = /ENOENT/i.test(message) ? 'GIT_MISSING' : 'CLONE_FAILED'
    throw new MarketError(code, message)
  }
}

interface PluginMeta {
  id: string
  version: string
  entry: string
  kinds: readonly string[]
  exportFormats: readonly string[]
  files?: readonly string[]
}

interface Fetched {
  version: string
  sourceDir: string
  meta: PluginMeta
  /** git 无 tag 回退主干时为 false，其余来源为 true */
  stable?: boolean
  cleanup?: () => void
}

/** 确定性错误：auto 模式遇到这些错误不换源 */
const DETERMINISTIC = new Set([
  'BAD_ARGUMENT', 'BAD_PLUGIN_ID', 'BAD_REPO', 'NOT_FOUND',
  'VERSION_NOT_FOUND', 'INVALID_PLUGIN', 'ALREADY_EXISTS',
])

function absPath(p: string, cwd: string): string {
  return isAbsolute(p) ? p : resolve(cwd, p)
}

function normalizeMeta(raw: any): PluginMeta {
  const kinds = (raw?.kinds ?? []).map((k: any) => (typeof k === 'string' ? k : k?.type))
  return {
    id: raw?.id,
    version: raw?.version,
    entry: raw?.entry ?? 'dist/index.js',
    kinds,
    exportFormats: raw?.exportFormats ?? [],
    files: raw?.files,
  }
}

function readPluginJson(dir: string): PluginMeta {
  const path = join(dir, 'plugin.json')
  if (!existsSync(path)) {
    throw new MarketError('INVALID_PLUGIN', `插件目录缺少 plugin.json：${dir}`)
  }
  return normalizeMeta(JSON.parse(readFileSync(path, 'utf8')))
}

/** 本地目录（--repo 指向含 marketplace.json 的目录） */
async function fetchLocal(
  options: InstallOptions,
  id: string,
  cwd: string,
): Promise<Fetched> {
  const repo = options.repo
  if (!repo) throw new MarketError('BAD_REPO', 'local 源必须通过 --repo 指定本地目录')
  const sourceDir = absPath(repo, cwd)
  if (!existsSync(join(sourceDir, 'marketplace.json'))) {
    throw new MarketError('NOT_FOUND', `目录不是有效的市场仓库：${repo}`)
  }
  const entry = options.index.plugins.find(p => p.id === id)
  if (!entry) throw new MarketError('NOT_FOUND', `索引中不存在插件：${id}`)
  const dir = join(sourceDir, entry.path)
  const meta = readPluginJson(dir)
  const version = options.version ?? entry.version
  return { version, sourceDir: dir, meta }
}

/** npm 源：查版本 → npm install → 读包内 wormPrint 元数据 */
async function fetchNpm(
  options: InstallOptions,
  id: string,
  npmName: string,
  cwd: string,
  npmExecutor: NpmExecutor,
): Promise<Fetched> {
  const view = await npmExecutor(['view', npmName, 'versions', '--json'], cwd)
  let versions: string[] = []
  try {
    versions = JSON.parse(view.stdout || '[]') as string[]
  } catch {
    throw new MarketError('NPM_FAILED', `解析 npm versions 输出失败：${npmName}`)
  }
  const version = resolveVersion('npm', versions, options.version)
  await npmExecutor(['install', `${npmName}@${version}`, '--no-audit', '--no-fund'], cwd)
  const pkgDir = join(cwd, 'node_modules', npmName)
  const pkgPath = join(pkgDir, 'package.json')
  if (!existsSync(pkgPath)) {
    throw new MarketError('INVALID_PLUGIN', `npm 包缺少 package.json：${npmName}`)
  }
  const raw = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const meta = normalizeMeta(raw.wormPrint)
  if (!meta.id) throw new MarketError('INVALID_PLUGIN', `npm 包缺少 wormPrint 元数据：${npmName}`)
  return { version, sourceDir: pkgDir, meta }
}

/** GitHub / Gitee 源：ls-remote 取 tag → 稀疏检出 → 读 plugin.json。repo 为本地目录时直读文件系统 */
async function fetchGit(
  options: InstallOptions,
  id: string,
  source: 'github' | 'gitee',
  cwd: string,
  gitExecutor: GitExecutor,
): Promise<Fetched> {
  if (options.repo && existsSync(absPath(options.repo, cwd))) {
    return fetchLocal(options, id, cwd)
  }
  const repoSource = resolveGitSource(source, options.repo)
  const refs = await gitExecutor(['ls-remote', '--tags', '--refs', repoSource.url], cwd)
  const tags = refs.stdout
    .split('\n')
    .map(line => line.split('\t')[1] ?? '')
    .filter(ref => ref.includes(`/plugins/${id}/v`))
  // 无 tag 且未指定版本：回退默认分支 HEAD，版本以 plugin.json 为准并标记非稳定
  const fromHead = tags.length === 0 && options.version === undefined
  const version = fromHead ? undefined : resolveVersion(source, tags, options.version)
  const tag = version ? buildGitTag(id, version) : undefined
  const tmp = mkdtempSync(join(tmpdir(), `mp-git-${id}-`))
  const cleanup = () => rmSync(tmp, { recursive: true, force: true })
  try {
    await gitExecutor([
      'clone', '--depth', '1', '--filter=blob:none', '--sparse',
      ...(tag ? ['--branch', tag.replace(/^refs\/tags\//, '')] : []),
      repoSource.url, tmp,
    ], cwd)
    const entryPath = options.index.plugins.find(p => p.id === id)?.path ?? `plugins/${id}`
    await gitExecutor([
      'sparse-checkout', 'set', '--no-cone',
      'marketplace/marketplace.json', `marketplace/${entryPath}`,
    ], tmp)
    const sourceDir = join(tmp, 'marketplace', entryPath)
    const meta = readPluginJson(sourceDir)
    return { version: version ?? meta.version, sourceDir, meta, stable: !fromHead, cleanup }
  } catch (err) {
    cleanup()
    throw err
  }
}

function copyFiles(sourceDir: string, target: string, meta: PluginMeta): void {
  const candidates = meta.files?.length ? meta.files : ['dist', 'plugin.json']
  for (const file of candidates) {
    const src = join(sourceDir, file)
    if (existsSync(src)) cpSync(src, join(target, file), { recursive: true })
  }
}

export async function installPlugin(options: InstallOptions): Promise<InstallResult> {
  const cwd = options.cwd ?? process.cwd()
  const dir = options.dir ?? '.worm-print/plugins'
  const { id, npmName } = resolvePluginName(options.name, options.index)
  const target = absPath(join(dir, id), cwd)
  if (existsSync(target) && !options.force) {
    throw new MarketError('ALREADY_EXISTS', `插件已存在：${id}（使用 --force 覆盖）`)
  }
  const npmExecutor = options.npmExecutor ?? defaultNpmExecutor
  const gitExecutor = options.gitExecutor ?? defaultGitExecutor
  const sources: MarketSource[] = options.source === 'auto'
    ? ['npm', 'github', 'gitee']
    : [options.source]

  let lastError: unknown
  for (const source of sources) {
    let fetched: Fetched | undefined
    try {
      if (source === 'local') fetched = await fetchLocal(options, id, cwd)
      else if (source === 'npm') fetched = await fetchNpm(options, id, npmName, cwd, npmExecutor)
      else fetched = await fetchGit(options, id, source, cwd, gitExecutor)

      if (fetched.meta.id !== id) {
        throw new MarketError('INVALID_PLUGIN', `插件 id 不一致：期望 ${id}，实际 ${fetched.meta.id}`)
      }
      if (fetched.meta.version !== fetched.version) {
        throw new MarketError('INVALID_PLUGIN', `插件版本不一致：期望 ${fetched.version}，实际 ${fetched.meta.version}`)
      }
      if (!existsSync(join(fetched.sourceDir, fetched.meta.entry))) {
        throw new MarketError('INVALID_PLUGIN', `插件入口文件不存在：${fetched.meta.entry}`)
      }

      mkdirSync(target, { recursive: true })
      copyFiles(fetched.sourceDir, target, fetched.meta)
      upsertManifestEntry(dir, id, {
        version: fetched.version,
        entry: fetched.meta.entry,
        kinds: fetched.meta.kinds,
        exportFormats: fetched.meta.exportFormats,
        npmName,
        source: source === 'local'
          ? { mode: source, path: options.repo }
          : source === 'npm'
            ? { mode: source }
            : {
              mode: source,
              repo: options.repo ?? undefined,
              tag: fetched.stable === false ? undefined : buildGitTag(id, fetched.version),
            },
        stable: fetched.stable !== false,
        installedAt: new Date().toISOString(),
      }, cwd)
      return {
        id, version: fetched.version, target, source,
        stable: fetched.stable !== false, created: true,
      }
    } catch (err) {
      if (err instanceof MarketError && DETERMINISTIC.has(err.code)) throw err
      lastError = err
    } finally {
      fetched?.cleanup?.()
    }
  }
  throw lastError ?? new MarketError('NOT_FOUND', `未能从任何来源安装插件：${id}`)
}

export async function removePlugin(options: RemoveOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd()
  const dir = options.dir ?? '.worm-print/plugins'
  const { id } = resolvePluginName(options.name, { schemaVersion: 1, plugins: [] })
  const manifestPlugins = readManifest(dir, cwd).plugins
  const entry = manifestPlugins[id]
  if (!entry) return
  if (entry.source.mode === 'npm') {
    try {
      await (options.npmExecutor ?? defaultNpmExecutor)(['uninstall', entry.npmName], cwd)
    } catch {
      // 卸载失败不阻断本地文件与清单清理
    }
  }
  rmSync(absPath(join(dir, id), cwd), { recursive: true, force: true })
  removeManifestEntry(dir, id, cwd)
}
