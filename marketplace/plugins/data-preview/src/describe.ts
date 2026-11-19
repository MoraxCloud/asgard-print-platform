// 数据预览的纯解析层：把某个字段分组对应的 JSON 值解析为「总览 + 子标签页」描述。
// 无 UI 依赖、无 DOM，渲染层（ui.ts）只消费这里的描述。
import type { PrintBusinessField } from '@worm-print-platform/core/designer'
import type { FieldGroupInfo } from '@worm-print-platform/plugin-kit'
import type { FormRow, OverviewRow, PreviewColumn, PreviewDescriptor, PreviewTab, ValueKind } from './types.js'

interface LeafMeta { label: string; sortOrder: number }

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function kindOf(v: unknown): ValueKind {
  if (Array.isArray(v)) return 'array'
  if (isRecord(v)) return 'object'
  return 'scalar'
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

/** 取分组前缀下的叶子字段元数据（fieldLabel 与 sortOrder） */
function leafMeta(fields: readonly PrintBusinessField[], groupKey: string): Map<string, LeafMeta> {
  const prefix = `${groupKey}.`
  const map = new Map<string, LeafMeta>()
  for (const f of fields) {
    if (!f.fieldKey.startsWith(prefix)) continue
    const leaf = f.fieldKey.slice(prefix.length)
    if (!leaf || leaf.includes('.')) continue
    map.set(leaf, {
      label: f.fieldLabel || leaf,
      sortOrder: f.sortOrder ?? Number.MAX_SAFE_INTEGER,
    })
  }
  return map
}

function labelOf(key: string, meta: Map<string, LeafMeta>): string {
  return meta.get(key)?.label ?? key
}

function orderOf(key: string, meta: Map<string, LeafMeta>): number {
  return meta.get(key)?.sortOrder ?? Number.MAX_SAFE_INTEGER
}

function sortKeys(keys: string[], meta: Map<string, LeafMeta>): string[] {
  return keys.sort((a, b) => {
    const oa = orderOf(a, meta)
    const ob = orderOf(b, meta)
    if (oa !== ob) return oa - ob
    // 两者都无显式 sortOrder → 保持 JSON 插入顺序（稳定排序）
    if (oa === Number.MAX_SAFE_INTEGER && ob === Number.MAX_SAFE_INTEGER) return 0
    return a.localeCompare(b, 'zh')
  })
}

function makeFormRows(record: Record<string, unknown>, meta: Map<string, LeafMeta>): FormRow[] {
  return sortKeys(Object.keys(record), meta).map(key => ({
    key, label: labelOf(key, meta), value: formatValue(record[key]),
  }))
}

function makeTable(items: readonly unknown[], meta: Map<string, LeafMeta>): { columns: PreviewColumn[]; rows: string[][] } {
  const keys = new Set<string>()
  const records: Array<Record<string, unknown>> = []
  for (const item of items) {
    if (isRecord(item)) {
      records.push(item)
      Object.keys(item).forEach(k => keys.add(k))
    } else if (item !== undefined) {
      keys.add('值')
      records.push({ 值: item })
    }
  }
  const columns = sortKeys([...keys], meta).map(key => ({ key, label: labelOf(key, meta) }))
  const rows = records.map(record => columns.map(col => formatValue(record[col.key])))
  return { columns, rows }
}

function makeTab(key: string, label: string, value: unknown, meta: Map<string, LeafMeta>): PreviewTab {
  if (Array.isArray(value)) {
    const { columns, rows } = makeTable(value, meta)
    return { key, label, kind: 'array', columns, rows }
  }
  if (isRecord(value)) {
    return { key, label, kind: 'object', formRows: makeFormRows(value, meta) }
  }
  return { key, label, kind: 'scalar', formRows: [{ key, label, value: formatValue(value) }] }
}

function tabsFromObject(record: Record<string, unknown>, meta: Map<string, LeafMeta>): PreviewTab[] {
  return sortKeys(Object.keys(record), meta)
    .filter(key => kindOf(record[key]) !== 'scalar')
    .map(key => makeTab(key, labelOf(key, meta), record[key], meta))
}

function tabsFromArray(items: readonly unknown[], meta: Map<string, LeafMeta>): PreviewTab[] {
  const keys = new Set<string>()
  for (const item of items) if (isRecord(item)) Object.keys(item).forEach(k => keys.add(k))
  return sortKeys([...keys], meta)
    .filter(key => items.some(item => isRecord(item) && kindOf(item[key]) !== 'scalar'))
    .map(key => {
      const values = items.flatMap(item => {
        if (!isRecord(item)) return []
        const v = item[key]
        return Array.isArray(v) ? v : [v]
      })
      return makeTab(key, labelOf(key, meta), values, meta)
    })
}

/** 把分组数据解析为预览描述。fields 可缺省，此时以 JSON 键作为标签。 */
export function describeDataSource(
  root: unknown,
  fields: readonly PrintBusinessField[] | undefined,
  group: FieldGroupInfo,
): PreviewDescriptor {
  const meta = leafMeta(fields ?? [], group.key)
  const rootKind = kindOf(root)
  const result: PreviewDescriptor = {
    title: group.label, group, rootKind, overview: [], tabs: [],
  }

  if (rootKind === 'object') {
    const record = root as Record<string, unknown>
    const overview: OverviewRow[] = sortKeys(Object.keys(record), meta).map(key => {
      const value = record[key]
      const kind = kindOf(value)
      const hasTab = kind !== 'scalar'
      return {
        key,
        label: labelOf(key, meta),
        kind,
        summary: kind === 'array'
          ? `${(value as unknown[]).length} 条`
          : kind === 'object'
            ? `${Object.keys(value as Record<string, unknown>).length} 个字段`
            : formatValue(value),
        hasTab,
        tabKey: hasTab ? key : undefined,
        value,
      }
    })
    result.overview = overview
    result.tabs = tabsFromObject(record, meta)
  } else if (rootKind === 'array') {
    result.table = makeTable(root as unknown[], meta)
    result.tabs = tabsFromArray(root as unknown[], meta)
  } else {
    result.scalar = { key: group.key, label: group.label, value: formatValue(root) }
  }

  return result
}
