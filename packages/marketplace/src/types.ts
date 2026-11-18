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
}

export interface PluginsManifest {
  schemaVersion: number
  plugins: Record<string, ManifestEntry>
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
