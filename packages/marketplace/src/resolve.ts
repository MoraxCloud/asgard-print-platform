import { MarketError, type MarketIndex, type MarketSource } from './types.js'
import { extractVersion, latestStable, parseSemver } from './semver.js'

const DEFAULT_SCOPE = '@worm-print-platform/plugin-'

/**
 * 解析插件名：完整 npm spec 原样保留；短 id 先查索引映射 npmName，
 * 未登记则按约定 scope 推导。拒绝空白与 `-` 开头，避免命令选项注入。
 */
export function resolvePluginName(name: string, index: MarketIndex): { id: string; npmName: string } {
  const raw = name.trim()
  if (!raw || /[\s\r\n]/.test(raw) || raw.startsWith('-')) {
    throw new MarketError('BAD_PLUGIN_ID', `非法插件名：${name}`)
  }
  const at = raw.lastIndexOf('@')
  const hasVersion = at > 0
  const base = hasVersion ? raw.slice(0, at) : raw
  const suffix = hasVersion ? raw.slice(at) : ''
  const entry = index.plugins.find(p => p.id === base || p.npmName === base)
  if (entry) return { id: entry.id, npmName: `${entry.npmName}${suffix}` }
  if (base.startsWith('@')) {
    return { id: base.split('/').pop()!.replace(/^plugin-/, ''), npmName: raw }
  }
  return { id: base, npmName: `${DEFAULT_SCOPE}${base}${suffix}` }
}

/** 解析版本：指定版本原样校验；未指定取最高非预发布版本（最新稳定版） */
export function resolveVersion(source: MarketSource, versions: readonly string[], requested?: string): string {
  if (requested !== undefined) {
    const version = extractVersion(requested)
    if (!parseSemver(version)) {
      throw new MarketError('VERSION_NOT_FOUND', `VERSION_NOT_FOUND：插件版本「${requested}」不是合法语义化版本`)
    }
    return version
  }
  const stable = latestStable(versions)
  if (!stable) {
    throw new MarketError('VERSION_NOT_FOUND', `VERSION_NOT_FOUND：来源 ${source} 中没有可用的稳定版本`)
  }
  return stable
}

/** 拼装插件 git tag：plugins/<id>/vX.Y.Z */
export function buildGitTag(id: string, version: string): string {
  return `plugins/${id}/v${version}`
}
