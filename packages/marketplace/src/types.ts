/** 插件安装来源 */
export type MarketSource = 'npm' | 'github' | 'gitee' | 'local'

/** marketplace.json 中的一条插件索引 */
export interface MarketIndexEntry {
  id: string
  name: string
  version: string
  npmName: string
  path: string
  entry: string
  kinds: readonly string[]
  exportFormats: readonly string[]
  description?: string
  homepage?: string
  license?: string
  minCoreVersion?: string
}

export interface MarketIndex {
  schemaVersion: number
  plugins: readonly MarketIndexEntry[]
}

/** 插件目录内 plugin.json */
export interface PluginJsonEntry {
  id: string
  version: string
  name: string
  npmName: string
  entry: string
  kinds: readonly { type: string; label: string }[] | readonly string[]
  exportFormats: readonly string[]
  peerDeps?: Record<string, string>
  files?: readonly string[]
}

/** npm 包 package.json 中的 wormPrint 元数据 */
export interface WormPrintMeta {
  id: string
  version: string
  entry: string
  kinds: readonly string[]
  exportFormats: readonly string[]
  peerDeps?: Record<string, string>
  i18n?: { dir: string; base?: string }
}

/** 宿主清单 .worm-print/plugins.json 中的一条 */
export interface ManifestEntry {
  version: string
  entry: string
  kinds: readonly string[]
  exportFormats: readonly string[]
  npmName: string
  source: { mode: MarketSource; repo?: string; tag?: string; path?: string }
  stable: boolean
  installedAt: string
  /** 已同步的语言资源信息；旧安装没有该字段，需提示重装 */
  i18n?: { base: string; locales: string[] }
}

export interface PluginsManifest {
  schemaVersion: number
  plugins: Record<string, ManifestEntry>
}

/** 规范化后的 git 仓库源 */
export interface RepoSource {
  url: string
  raw: string
  host: 'github' | 'gitee' | 'other'
  hostName: string
}

/** 子进程执行结果（npm / git），可注入以便离线测试 */
export interface CommandResult {
  stdout: string
  stderr: string
}

export type NpmExecutor = (args: string[], cwd?: string) => Promise<CommandResult>
export type GitExecutor = (args: string[], cwd?: string) => Promise<CommandResult>

export interface InstallOptions {
  /** 插件名或完整 npm spec */
  name: string
  /** 指定版本；缺省取最新稳定版 */
  version?: string
  /** 安装来源；auto 按 npm → gitee → github 回退 */
  source: MarketSource | 'auto'
  /** 目标插件根目录，默认 .worm-print/plugins */
  dir?: string
  /** 本地仓库目录（local 源）或自定义 git 仓库地址 */
  repo?: string
  force?: boolean
  cwd?: string
  index: MarketIndex
  npmExecutor?: NpmExecutor
  gitExecutor?: GitExecutor
}

export interface InstallResult {
  id: string
  version: string
  target: string
  source: MarketSource
  stable: boolean
  created: boolean
}

export interface RemoveOptions {
  name: string
  dir?: string
  repo?: string
  cwd?: string
  npmExecutor?: NpmExecutor
}

export type MarketErrorCode =
  | 'BAD_ARGUMENT'
  | 'BAD_PLUGIN_ID'
  | 'BAD_REPO'
  | 'ALREADY_EXISTS'
  | 'NOT_FOUND'
  | 'VERSION_NOT_FOUND'
  | 'INVALID_PLUGIN'
  | 'NPM_FAILED'
  | 'CLONE_FAILED'
  | 'GIT_MISSING'

/** 带稳定错误码的领域错误，CLI 据此映射退出码 */
export class MarketError extends Error {
  constructor(
    public readonly code: MarketErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'MarketError'
  }
}
