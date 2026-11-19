// 数据标签读写：面板与手写 chartOption 编辑同一份 series[].label（仪表盘为 series[].detail）。
// 只做纯数据变换，不碰 DOM；UI 层负责控件与提交。
import { getChartKindDefinition } from './kinds.js'
import type { ChartSeriesType } from './kinds.js'
import { cloneChartOption } from './option-utils.js'

export type LabelFieldKey =
  | 'formatter' | 'overflow' | 'position' | 'distance' | 'rotate'
  | 'offsetX' | 'offsetY' | 'fontSize' | 'fontWeight' | 'color'
  | 'backgroundColor' | 'borderColor' | 'borderWidth' | 'borderRadius' | 'padding'
  | 'labelLine.show' | 'labelLine.length' | 'labelLine.length2' | 'labelLine.smooth'

export interface ChartLabelState {
  show: boolean
  formatter?: string
  overflow?: string
  position?: string
  distance?: number
  rotate?: number
  offsetX?: number
  offsetY?: number
  fontSize?: number
  fontWeight?: string
  color?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  labelLine: { show?: boolean; length?: number; length2?: number; smooth?: boolean }
}

export interface ChartLabelPatch extends Partial<Omit<ChartLabelState, 'labelLine'>> {
  /** 总开关：true 写默认集（只补缺失键），false 只写 show:false */
  enabled?: boolean
  labelLine?: { show?: boolean; length?: number | null; length2?: number | null; smooth?: boolean }
}

/** formatter 预设：底层仍是 ECharts 字符串模板，选中即写入 formatter */
export const LABEL_PRESETS: readonly { key: string; label: string; formatter: string }[] = [
  { key: 'value', label: '数值', formatter: '{c}' },
  { key: 'name-value', label: '名称: 数值', formatter: '{b}: {c}' },
  { key: 'name', label: '名称', formatter: '{b}' },
  { key: 'percent', label: '百分比', formatter: '{d}%' },
]

/** 标签位置候选：按 seriesType 给，ECharts 对不适用项会忽略，面板只做引导 */
export const LABEL_POSITIONS: Readonly<Record<ChartSeriesType, readonly { value: string; label: string }[]>> = {
  bar: [
    { value: 'top', label: '顶部' },
    { value: 'inside', label: '内部' },
    { value: 'insideTop', label: '内部顶端' },
    { value: 'bottom', label: '底部' },
    { value: 'insideBottom', label: '内部底端' },
    { value: 'right', label: '右侧' },
    { value: 'left', label: '左侧' },
    { value: 'middle', label: '居中' },
  ],
  line: [
    { value: 'top', label: '顶部' },
    { value: 'bottom', label: '底部' },
    { value: 'inside', label: '内部' },
    { value: 'left', label: '左侧' },
    { value: 'right', label: '右侧' },
  ],
  pie: [
    { value: 'outside', label: '外侧' },
    { value: 'inside', label: '内部' },
    { value: 'center', label: '中心' },
  ],
  scatter: [
    { value: 'top', label: '顶部' },
    { value: 'bottom', label: '底部' },
    { value: 'left', label: '左侧' },
    { value: 'right', label: '右侧' },
    { value: 'inside', label: '内部' },
  ],
  radar: [
    { value: 'top', label: '顶部' },
    { value: 'bottom', label: '底部' },
    { value: 'left', label: '左侧' },
    { value: 'right', label: '右侧' },
    { value: 'inside', label: '内部' },
  ],
  funnel: [
    { value: 'outer', label: '外侧' },
    { value: 'inner', label: '内部' },
    { value: 'left', label: '左侧' },
    { value: 'right', label: '右侧' },
    { value: 'top', label: '顶部' },
    { value: 'bottom', label: '底部' },
  ],
  gauge: [],
}

/** ECharts 原生默认可见的标签（未写 label.show 时的真实观感） */
const NATIVE_SHOW: Record<ChartSeriesType, boolean> = {
  bar: false,
  line: false,
  pie: true,
  scatter: false,
  radar: false,
  funnel: true,
  gauge: true,
}

/** 总开关打开时写入的默认集：只补缺失键，已有值优先 */
const ENABLE_DEFAULTS: Record<ChartSeriesType, Partial<ChartLabelState>> = {
  bar: { position: 'top', fontSize: 12 },
  line: { position: 'top', fontSize: 12 },
  pie: { position: 'outside', overflow: 'none', fontSize: 11 },
  scatter: { position: 'top', fontSize: 11 },
  radar: { position: 'top', fontSize: 10 },
  funnel: { position: 'outer', fontSize: 11 },
  gauge: { fontSize: 14 },
}

/** 单类图表的默认集覆盖（条形图标签贴在柱子右侧） */
const TYPE_DEFAULTS: Record<string, Partial<ChartLabelState>> = {
  barHChart: { position: 'right', fontSize: 12 },
}

const FIELDS_BY_SERIES: Record<ChartSeriesType, readonly LabelFieldKey[]> = {
  bar: [
    'formatter', 'overflow', 'position', 'rotate', 'offsetX', 'offsetY',
    'fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderColor', 'borderWidth', 'borderRadius', 'padding',
  ],
  line: [
    'formatter', 'overflow', 'position', 'rotate', 'offsetX', 'offsetY',
    'fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderColor', 'borderWidth', 'borderRadius', 'padding',
  ],
  pie: [
    'formatter', 'overflow', 'position', 'distance', 'offsetX', 'offsetY',
    'fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderColor', 'borderWidth', 'borderRadius', 'padding',
    'labelLine.show', 'labelLine.length', 'labelLine.length2', 'labelLine.smooth',
  ],
  scatter: [
    'formatter', 'overflow', 'position', 'distance', 'rotate', 'offsetX', 'offsetY',
    'fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderColor', 'borderWidth', 'borderRadius', 'padding',
  ],
  radar: ['formatter', 'fontSize', 'fontWeight', 'color'],
  funnel: [
    'formatter', 'overflow', 'position', 'distance',
    'fontSize', 'fontWeight', 'color',
    'labelLine.show', 'labelLine.length', 'labelLine.smooth',
  ],
  gauge: ['formatter', 'fontSize', 'fontWeight', 'color', 'offsetX', 'offsetY'],
}

/** 值字段（不含 show / labelLine），用于读取与写回 */
const VALUE_KEYS = [
  'formatter', 'overflow', 'position', 'distance', 'rotate', 'offsetX', 'offsetY',
  'fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderColor', 'borderWidth', 'borderRadius', 'padding',
] as const

function seriesOf(option: Record<string, unknown> | undefined): Record<string, any>[] {
  const series = option?.series
  return Array.isArray(series) ? (series as Record<string, any>[]) : []
}

function asRecord(node: unknown): Record<string, any> {
  return node && typeof node === 'object' && !Array.isArray(node) ? { ...(node as Record<string, any>) } : {}
}

/** 仪表盘的数值文本走 series[].detail，其余走 series[].label */
export function labelTargetOf(type: string): 'label' | 'detail' {
  return getChartKindDefinition(type)?.seriesType === 'gauge' ? 'detail' : 'label'
}

export function labelFieldsOf(type: string): readonly LabelFieldKey[] {
  const def = getChartKindDefinition(type)
  return def ? FIELDS_BY_SERIES[def.seriesType] : []
}

export function readChartLabel(option: Record<string, unknown> | undefined, type: string): ChartLabelState {
  const def = getChartKindDefinition(type)
  const series = seriesOf(option)
  const target = asRecord(series[0]?.[labelTargetOf(type)])
  const state: ChartLabelState = {
    show: typeof target.show === 'boolean' ? target.show : def ? NATIVE_SHOW[def.seriesType] : false,
    // labelLine 在 ECharts 里是 series 顶层键（与 label 平级），不是 label 的子键
    labelLine: asRecord(series[0]?.labelLine),
  }
  for (const key of VALUE_KEYS) {
    const value = target[key]
    if (typeof value === 'string' || typeof value === 'number') (state as unknown as Record<string, unknown>)[key] = value
  }
  return state
}

function defaultSetOf(type: string): Partial<ChartLabelState> {
  const def = getChartKindDefinition(type)
  if (!def) return {}
  return { ...ENABLE_DEFAULTS[def.seriesType], ...TYPE_DEFAULTS[type] }
}

/** 写入空值语义：null / undefined / 空字符串都删除该键 */
function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

export function updateChartLabel(
  option: Record<string, unknown> | undefined,
  type: string,
  patch: ChartLabelPatch,
): Record<string, unknown> {
  const next = cloneChartOption(option ?? {}) as Record<string, any>
  const series = Array.isArray(next.series) ? (next.series as Record<string, any>[]) : []
  const def = getChartKindDefinition(type)
  if (!def || series.length === 0) return next

  const targetKey = labelTargetOf(type)
  const { enabled, labelLine, ...values } = patch

  for (const item of series) {
    if (!item || typeof item !== 'object') continue
    const current = asRecord(item[targetKey])
    if (enabled === true) {
      // 默认集只补缺失键：已有 formatter / 颜色 / 字号优先
      Object.assign(current, { ...defaultSetOf(type), ...current, show: true })
    } else if (enabled === false) {
      current.show = false
    }
    for (const [key, value] of Object.entries(values)) {
      if (isEmpty(value)) delete current[key]
      else current[key] = value
    }
    if (labelLine) {
      const line = asRecord(item.labelLine)
      for (const [key, value] of Object.entries(labelLine)) {
        if (isEmpty(value)) delete line[key]
        else line[key] = value
      }
      item.labelLine = line
    }
    item[targetKey] = current
  }
  return next
}
