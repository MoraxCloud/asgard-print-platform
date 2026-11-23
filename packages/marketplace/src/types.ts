/** 插件安装来源 */
export type MarketSource = 'npm' | 'github' | 'gitee' | 'local'

/** 多语言文本：字符串视为 zh-CN；对象必须含基准语言 zh-CN */
export type LocalizedText = string | ({ 'zh-CN': string } & Record<string, string>)

/** 插件类型：元素插件 / 功能插件 / 导出插件 */
export type PluginType = 'element' | 'functional' | 'export'

/** 索引里的精简版本条目 */
export interface MarketVersionEntry {
  version: string
  publishTimestamp?: number
  source?:
    | { type: 'npm'; name?: string; registry?: string }
    | { type: 'git'; url: string; commit: string; path?: string }
  engines?: { core?: string }
}

/** 索引根级声明：分类 / 标签 / 排序键的 id → 多语言标题 */
export interface MarketMetadataDecl {
  categories?: Record<string, { title: LocalizedText }>
  labels?: Record<string, { title: LocalizedText }>
  sortKeys?: Record<string, { title: LocalizedText; order?: 'asc' | 'desc' }>
}

/** 索引校验问题 */
export interface IndexIssue {
  path: string
  message: string
}

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
  description?: LocalizedText
  homepage?: string
  license?: string
  minCoreVersion?: string
  /** 全局唯一标识，形如 worm-echarts；缺省时读取端回退 id */
  uniqueId?: string
  type?: PluginType
  title?: LocalizedText
  engines?: { core?: string }
  publishTimestamp?: number
  metadata?: {
    category?: string
    labels?: string[]
    sortKeys?: Record<string, number | null>
  }
  versions?: readonly MarketVersionEntry[]
}

export interface MarketIndex {
  schemaVersion: number
  plugins: readonly MarketIndexEntry[]
  format?: string
  title?: LocalizedText
  description?: LocalizedText
  metadata?: MarketMetadataDecl
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
  | 'INVALID_INDEX'
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
