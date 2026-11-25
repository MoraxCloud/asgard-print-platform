import { M as MarketIndex, a as MarketSource, R as RepoSource, d as PluginsManifest, e as ManifestEntry, L as LocalizedText, I as IndexIssue } from './install-GAO58ijj.js';
export { C as CommandResult, G as GitExecutor, f as InstallOptions, g as InstallResult, h as MarketError, j as MarketErrorCode, b as MarketIndexEntry, c as MarketMetadataDecl, k as MarketVersionEntry, N as NpmExecutor, l as PluginJsonEntry, P as PluginType, m as RemoveOptions, W as WormPrintMeta, n as defaultGitExecutor, o as defaultNpmExecutor, i as installPlugin, r as removePlugin } from './install-GAO58ijj.js';

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

/**
 * 取多语言文本的当前语言值。回退链：精确 locale → 语言前缀 → zh-CN → 空串。
 * 字符串形式视为已是目标文本，原样返回。
 */
declare function localize(text: LocalizedText | undefined, locale: string): string;

/** 校验一份市场索引，返回全部问题；合法索引返回空数组。 */
declare function validateIndex(index: MarketIndex): IndexIssue[];

declare const BUNDLED_CATALOG: MarketIndex;

export { BUNDLED_CATALOG, DEFAULT_GITEE_REPO, DEFAULT_GITHUB_REPO, IndexIssue, LocalizedText, ManifestEntry, MarketIndex, MarketSource, type ParsedSemver, PluginsManifest, RepoSource, buildGitTag, compareStable, extractVersion, isStableVersion, latestStable, localize, manifestPath, parseRepoUrl, parseSemver, readManifest, removeManifestEntry, resolveGitSource, resolvePluginName, resolveVersion, upsertManifestEntry, validateIndex, writeManifest };
