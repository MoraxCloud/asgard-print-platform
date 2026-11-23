import { parseSemver } from './semver.js'
import type { IndexIssue, LocalizedText, MarketIndex, MarketIndexEntry } from './types.js'

const UNIQUE_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/
const TYPES = new Set(['element', 'functional', 'export'])

function isLocalizedTextObject(value: LocalizedText): value is { 'zh-CN': string } & Record<string, string> {
  return typeof value === 'object' && value !== null
}

/** 校验一份市场索引，返回全部问题；合法索引返回空数组。 */
export function validateIndex(index: MarketIndex): IndexIssue[] {
  const issues: IndexIssue[] = []
  const add = (path: string, message: string): void => { issues.push({ path, message }) }

  if (index.schemaVersion !== 1) add('schemaVersion', `schemaVersion 必须为 1，实际为 ${index.schemaVersion}`)

  const seenIds = new Set<string>()
  const seenUnique = new Set<string>()
  const decl = index.metadata
  const categories = new Set(Object.keys(decl?.categories ?? {}))
  const labels = new Set(Object.keys(decl?.labels ?? {}))
  const sortKeys = new Set(Object.keys(decl?.sortKeys ?? {}))

  const checkLocalized = (value: LocalizedText | undefined, path: string): void => {
    if (value === undefined) return
    if (isLocalizedTextObject(value) && !value['zh-CN']) add(path, '多语言文本必须含 zh-CN')
  }

  index.plugins.forEach((plugin: MarketIndexEntry, i: number) => {
    const base = `plugins[${i}]`
    if (!plugin.id) add(`${base}.id`, 'id 不能为空')
    else if (seenIds.has(plugin.id)) add(`${base}.id`, `id 重复：${plugin.id}`)
    else seenIds.add(plugin.id)

    if (plugin.uniqueId === undefined) {
      // 可选字段缺失兼容旧索引，不报错
    } else if (!plugin.uniqueId) {
      add(`${base}.uniqueId`, 'uniqueId 不能为空')
    } else if (!UNIQUE_ID.test(plugin.uniqueId)) {
      add(`${base}.uniqueId`, `uniqueId 须为「作者代号-插件名」形式：${plugin.uniqueId}`)
    } else if (seenUnique.has(plugin.uniqueId)) {
      add(`${base}.uniqueId`, `uniqueId 重复：${plugin.uniqueId}`)
    } else {
      seenUnique.add(plugin.uniqueId)
    }

    if (plugin.type !== undefined && !TYPES.has(plugin.type)) {
      add(`${base}.type`, `未知类型：${plugin.type}`)
    }

    checkLocalized(plugin.title, `${base}.title`)
    checkLocalized(plugin.description, `${base}.description`)

    const meta = plugin.metadata
    if (meta) {
      if (meta.category !== undefined && !categories.has(meta.category)) {
        add(`${base}.metadata.category`, `未声明的分类：${meta.category}`)
      }
      for (const label of meta.labels ?? []) {
        if (!labels.has(label)) add(`${base}.metadata.labels`, `未声明的标签：${label}`)
      }
      for (const key of Object.keys(meta.sortKeys ?? {})) {
        if (!sortKeys.has(key)) add(`${base}.metadata.sortKeys`, `未声明的排序键：${key}`)
      }
    }

    if (plugin.engines !== undefined) {
      if (!plugin.engines.core) add(`${base}.engines.core`, 'engines.core 不能为空')
    }

    if (plugin.versions !== undefined) {
      if (plugin.versions.length === 0) add(`${base}.versions`, 'versions 不能为空数组')
      plugin.versions.forEach((v, vi) => {
        if (!parseSemver(v.version)) add(`${base}.versions[${vi}].version`, `非法版本号：${v.version}`)
      })
    }
  })

  return issues
}
