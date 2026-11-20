import type { PrintBusinessField } from '@worm-print-platform/core/designer'

/** 分组信息（插件自持，不依赖设计器侧的字段树贡献点） */
export interface FieldGroupInfo {
  key: string
  label: string
  isList: boolean
}

/** JSON 值的三种形态：标量 / 对象 / 数组 */
export type ValueKind = 'scalar' | 'object' | 'array'

export interface PreviewColumn { key: string; label: string; fieldKey?: string }
export interface FormRow { key: string; label: string; value: string; fieldKey?: string }

/** 总览汇总表的一行；对象/数组行带 tabKey 可跳转子标签页 */
export interface OverviewRow {
  key: string
  label: string
  /** 字段定义中的完整 fieldKey（如 supplier.name），供展示字段 key 用 */
  fieldKey?: string
  kind: ValueKind
  summary: string
  hasTab: boolean
  tabKey?: string
  value: unknown
}

export interface PreviewTab {
  key: string
  label: string
  fieldKey?: string
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

/** 宿主调用预览的入参：插件只提供触发 API，不决定入口位置 */
export interface DataPreviewOptions {
  /** designData 数组信封，data[0] 即数据根 */
  data?: readonly Record<string, unknown>[]
  /** 业务字段清单，用于列/标签中文名 */
  fields?: readonly PrintBusinessField[]
  /** 从 data[0] 取值的分组 key；不传则预览 data[0] 整体 */
  groupKey?: string
  /** 弹窗标题，缺省取 groupKey 或「数据源」 */
  title?: string
  /** 直接指定数据根，优先于 data + groupKey */
  root?: unknown
  /** 弹窗挂载容器，缺省 document.body */
  container?: HTMLElement
  /** 是否在中文名旁显示字段 key：表单/总览为「中文名 (key)」，表格表头换行显示 key。缺省 false */
  showFieldKey?: boolean
}
