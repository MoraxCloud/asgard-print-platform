/** 插件安装来源 */
type MarketSource = 'npm' | 'github' | 'gitee' | 'local';
/** marketplace.json 中的一条插件索引 */
interface MarketIndexEntry {
    id: string;
    name: string;
    version: string;
    npmName: string;
    path: string;
    entry: string;
    kinds: readonly string[];
    exportFormats: readonly string[];
    description?: string;
    homepage?: string;
    license?: string;
    minCoreVersion?: string;
}
interface MarketIndex {
    schemaVersion: number;
    plugins: readonly MarketIndexEntry[];
}
/** 插件目录内 plugin.json */
interface PluginJsonEntry {
    id: string;
    version: string;
    name: string;
    npmName: string;
    entry: string;
    kinds: readonly {
        type: string;
        label: string;
    }[] | readonly string[];
    exportFormats: readonly string[];
    peerDeps?: Record<string, string>;
    files?: readonly string[];
}
/** npm 包 package.json 中的 wormPrint 元数据 */
interface WormPrintMeta {
    id: string;
    version: string;
    entry: string;
    kinds: readonly string[];
    exportFormats: readonly string[];
    peerDeps?: Record<string, string>;
}
/** 宿主清单 .worm-print/plugins.json 中的一条 */
interface ManifestEntry {
    version: string;
    entry: string;
    kinds: readonly string[];
    exportFormats: readonly string[];
    npmName: string;
    source: {
        mode: MarketSource;
        repo?: string;
        tag?: string;
        path?: string;
    };
    stable: boolean;
    installedAt: string;
}
interface PluginsManifest {
    schemaVersion: number;
    plugins: Record<string, ManifestEntry>;
}
/** 规范化后的 git 仓库源 */
interface RepoSource {
    url: string;
    raw: string;
    host: 'github' | 'gitee' | 'other';
    hostName: string;
}
/** 子进程执行结果（npm / git），可注入以便离线测试 */
interface CommandResult {
    stdout: string;
    stderr: string;
}
type NpmExecutor = (args: string[], cwd?: string) => Promise<CommandResult>;
type GitExecutor = (args: string[], cwd?: string) => Promise<CommandResult>;
interface InstallOptions {
    /** 插件名或完整 npm spec */
    name: string;
    /** 指定版本；缺省取最新稳定版 */
    version?: string;
    /** 安装来源；auto 按 npm → github → gitee 回退 */
    source: MarketSource | 'auto';
    /** 目标插件根目录，默认 .worm-print/plugins */
    dir?: string;
    /** 本地仓库目录（local 源）或自定义 git 仓库地址 */
    repo?: string;
    force?: boolean;
    cwd?: string;
    index: MarketIndex;
    npmExecutor?: NpmExecutor;
    gitExecutor?: GitExecutor;
}
interface InstallResult {
    id: string;
    version: string;
    target: string;
    source: MarketSource;
    stable: boolean;
    created: boolean;
}
interface RemoveOptions {
    name: string;
    dir?: string;
    repo?: string;
    cwd?: string;
    npmExecutor?: NpmExecutor;
}
type MarketErrorCode = 'BAD_ARGUMENT' | 'BAD_PLUGIN_ID' | 'BAD_REPO' | 'ALREADY_EXISTS' | 'NOT_FOUND' | 'VERSION_NOT_FOUND' | 'INVALID_PLUGIN' | 'NPM_FAILED' | 'CLONE_FAILED' | 'GIT_MISSING';
/** 带稳定错误码的领域错误，CLI 据此映射退出码 */
declare class MarketError extends Error {
    readonly code: MarketErrorCode;
    constructor(code: MarketErrorCode, message: string);
}

declare const defaultNpmExecutor: NpmExecutor;
declare const defaultGitExecutor: GitExecutor;
declare function installPlugin(options: InstallOptions): Promise<InstallResult>;
declare function removePlugin(options: RemoveOptions): Promise<void>;

export { type CommandResult as C, type GitExecutor as G, type InstallOptions as I, type MarketIndex as M, type NpmExecutor as N, type PluginsManifest as P, type RepoSource as R, type WormPrintMeta as W, type MarketSource as a, type ManifestEntry as b, type InstallResult as c, MarketError as d, type MarketErrorCode as e, type MarketIndexEntry as f, type PluginJsonEntry as g, type RemoveOptions as h, installPlugin as i, defaultGitExecutor as j, defaultNpmExecutor as k, removePlugin as r };
