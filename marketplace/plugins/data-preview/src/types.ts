import type { FieldGroupInfo } from '@worm-print-platform/plugin-kit'

/** JSON 值的三种形态：标量 / 对象 / 数组 */
export type ValueKind = 'scalar' | 'object' | 'array'

export interface PreviewColumn { key: string; label: string }
export interface FormRow { key: string; label: string; value: string }

/** 总览汇总表的一行；对象/数组行带 tabKey 可跳转子标签页 */
export interface OverviewRow {
  key: string
  label: string
  kind: ValueKind
  summary: string
  hasTab: boolean
  tabKey?: string
  value: unknown
}

export interface PreviewTab {
  key: string
  label: string
  kind: ValueKind
  formRows?: FormRow[]
  columns?: PreviewColumn[]
  rows?: string[][]
}

export interface PreviewDescriptor {
  title: string
  group: FieldGroupInfo
  rootKind: ValueKind
  overview: OverviewRow[]
  tabs: PreviewTab[]
  /** 根为数组时，总览即该表格 */
  table?: { columns: PreviewColumn[]; rows: string[][] }
  /** 根为标量时的单行 */
  scalar?: FormRow
}
