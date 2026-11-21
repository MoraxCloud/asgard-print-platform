import { M as MarketIndex, a as MarketSource, R as RepoSource, P as PluginsManifest, b as ManifestEntry } from './install-_nzKFo4K.js';
export { C as CommandResult, G as GitExecutor, I as InstallOptions, c as InstallResult, d as MarketError, e as MarketErrorCode, f as MarketIndexEntry, N as NpmExecutor, g as PluginJsonEntry, h as RemoveOptions, W as WormPrintMeta, j as defaultGitExecutor, k as defaultNpmExecutor, i as installPlugin, r as removePlugin } from './install-_nzKFo4K.js';

interface ParsedSemver {
    major: number;
    minor: number;
    patch: number;
    prerelease: string;
}
declare function parseSemver(raw: string): ParsedSemver | null;
/** 从 git tag ref / 版本号中抽取纯版本号：refs/tags/plugins/x/v1.2.3 → 1.2.3 */
declare function extractVersion(raw: string): string;
declare function isStableVersion(raw: string): boolean;
declare function compareStable(a: string, b: string): number;
/** 取最高非预发布版本；全是预发布或无法解析时返回 null */
declare function latestStable(versions: readonly string[]): string | null;

/**
 * 解析插件名：完整 npm spec 原样保留；短 id 先查索引映射 npmName，
 * 未登记则按约定 scope 推导。拒绝空白与 `-` 开头，避免命令选项注入。
 */
declare function resolvePluginName(name: string, index: MarketIndex): {
    id: string;
    npmName: string;
};
/** 解析版本：指定版本原样校验；未指定取最高非预发布版本（最新稳定版） */
declare function resolveVersion(source: MarketSource, versions: readonly string[], requested?: string): string;
/** 拼装插件 git tag：plugins/<id>/vX.Y.Z */
declare function buildGitTag(id: string, version: string): string;

/** 默认主源与备用源，与 packages/skills 保持一致（同一本仓的两处托管） */
declare const DEFAULT_GITHUB_REPO = "https://github.com/worm-longliu/worm-print-platform.git";
declare const DEFAULT_GITEE_REPO = "https://gitee.com/liulong_oschina/worm-print-platform.git";
/** 解析并规范化仓库地址；拒绝空白与 `-` 开头，避免被 git 当作选项 */
declare function parseRepoUrl(raw: string): RepoSource;
/** 按来源取仓库地址；显式 repo 优先 */
declare function resolveGitSource(source: 'github' | 'gitee', repo?: string): RepoSource;

/** 插件根目录为 <dir>，清单固定在其上一级 plugins.json */
declare function manifestPath(dir: string, cwd?: string): string;
declare function readManifest(dir: string, cwd?: string): PluginsManifest;
declare function writeManifest(dir: string, manifest: PluginsManifest, cwd?: string): void;
declare function upsertManifestEntry(dir: string, id: string, entry: ManifestEntry, cwd?: string): void;
declare function removeManifestEntry(dir: string, id: string, cwd?: string): void;

declare const BUNDLED_CATALOG: MarketIndex;

export { BUNDLED_CATALOG, DEFAULT_GITEE_REPO, DEFAULT_GITHUB_REPO, ManifestEntry, MarketIndex, MarketSource, type ParsedSemver, PluginsManifest, RepoSource, buildGitTag, compareStable, extractVersion, isStableVersion, latestStable, manifestPath, parseRepoUrl, parseSemver, readManifest, removeManifestEntry, resolveGitSource, resolvePluginName, resolveVersion, upsertManifestEntry, writeManifest };
