// 数据预览的纯解析层：把某个字段分组对应的 JSON 值解析为「总览 + 子标签页」描述。
// 无 UI 依赖、无 DOM，渲染层（ui.ts）只消费这里的描述。
import type { PrintBusinessField } from '@worm-print-platform/core/designer'
import type { FieldGroupInfo, FormRow, OverviewRow, PreviewColumn, PreviewDescriptor, PreviewTab, ValueKind } from './types.js'

interface LeafMeta { label: string; sortOrder: number }

/** 未在 fields 中定义时的常用键中文兜底（fields 的 fieldLabel 始终优先） */
const COMMON_LABELS: Readonly<Record<string, string>> = {
  id: '编号', no: '编号', code: '编码', name: '名称', title: '标题', type: '类型',
  date: '日期', time: '时间', year: '年份', phone: '电话', mobile: '手机',
  address: '地址', org: '机构', company: '公司', dept: '科室', user: '用户',
  doctor: '医生', sex: '性别', age: '年龄', item: '项目', result: '结果',
  unit: '单位', ref: '参考区间', flag: '异常标记', seq: '序号', desc: '说明',
  advice: '建议', remark: '备注', spec: '规格', qty: '数量', price: '单价',
  amount: '金额', total: '合计', value: '值', status: '状态', url: '链接',
  logo: '标志图', image: '图片',
}

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

/**
 * 构建字段标签映射。三条来源按优先级叠加：
 * 1. 所有字段的「最后一段」（如 supplier.name → name），作为兜底；
 * 2. 当前分组前缀下的精确叶子（groupKey='supplier' 时 name → 供应商名称）；
 * 3. 容器字段原样 key（supplier → 供应商信息），供总览行与子 tab 使用。
 */
function leafMeta(fields: readonly PrintBusinessField[], groupKey: string): Map<string, LeafMeta> {
  const map = new Map<string, LeafMeta>()
  const prefix = groupKey ? `${groupKey}.` : ''
  const put = (key: string, label: string, order: number) => {
    if (key) map.set(key, { label: label || key, sortOrder: order })
  }

  for (const f of fields) {
    const leaf = f.fieldKey.includes('.') ? f.fieldKey.slice(f.fieldKey.lastIndexOf('.') + 1) : f.fieldKey
    const order = f.sortOrder ?? Number.MAX_SAFE_INTEGER
    if (!map.has(leaf)) put(leaf, f.fieldLabel, order)
  }
  for (const f of fields) {
    const order = f.sortOrder ?? Number.MAX_SAFE_INTEGER
    if (prefix && f.fieldKey.startsWith(prefix)) {
      const rest = f.fieldKey.slice(prefix.length)
      const leaf = rest.includes('.') ? rest.slice(rest.lastIndexOf('.') + 1) : rest
      put(leaf, f.fieldLabel, order)
    } else if (!f.fieldKey.includes('.')) {
      put(f.fieldKey, f.fieldLabel, order)
    }
  }
  return map
}

function labelOf(key: string, meta: Map<string, LeafMeta>): string {
  return meta.get(key)?.label ?? COMMON_LABELS[key] ?? key
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

function makeTab(
  key: string,
  label: string,
  value: unknown,
  meta: Map<string, LeafMeta>,
): PreviewTab {
  if (Array.isArray(value)) {
    const { columns, rows } = makeTable(value, meta)
    return { key, label, kind: 'array', columns, rows }
  }
  if (isRecord(value)) {
    return { key, label, kind: 'object', formRows: makeFormRows(value, meta) }
  }
  return { key, label, kind: 'scalar', formRows: [{ key, label, value: formatValue(value) }] }
}

/** 子 tab 用子属性名作为分组前缀重建映射，使 supplier.name 在「供应商信息」tab 下显示「供应商名称」 */
function childMeta(fields: readonly PrintBusinessField[], key: string): Map<string, LeafMeta> {
  return leafMeta(fields, key)
}

function tabsFromObject(
  record: Record<string, unknown>,
  meta: Map<string, LeafMeta>,
  fields: readonly PrintBusinessField[],
): PreviewTab[] {
  return sortKeys(Object.keys(record), meta)
    .filter(key => kindOf(record[key]) !== 'scalar')
    .map(key => makeTab(key, labelOf(key, meta), record[key], childMeta(fields, key)))
}

function tabsFromArray(
  items: readonly unknown[],
  meta: Map<string, LeafMeta>,
  fields: readonly PrintBusinessField[],
): PreviewTab[] {
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
      return makeTab(key, labelOf(key, meta), values, childMeta(fields, key))
    })
}

/** 把分组数据解析为预览描述。fields 可缺省，此时以 JSON 键与常用键词典推断标签。 */
export function describeDataSource(
  root: unknown,
  fields: readonly PrintBusinessField[] | undefined,
  group: FieldGroupInfo,
): PreviewDescriptor {
  const list = fields ?? []
  const meta = leafMeta(list, group.key)
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
    result.tabs = tabsFromObject(record, meta, list)
  } else if (rootKind === 'array') {
    result.table = makeTable(root as unknown[], meta)
    result.tabs = tabsFromArray(root as unknown[], meta, list)
  } else {
    result.scalar = { key: group.key, label: group.label, value: formatValue(root) }
  }

  return result
}
