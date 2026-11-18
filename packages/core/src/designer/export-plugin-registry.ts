// 导出插件注册表（与元素插件并列的第二契约）
// 主体只提供机制：插件作者用 defineExportPlugin 声明能力，import 时 registerExportPlugin 生效。
// 状态挂在 globalThis 上，用 Symbol.for 做键，避免宿主与插件各带一份副本时注册表漂移。
import type { TemplateData } from '../render/types.js'

/** 渲染后的一页：HTML 与纸型尺寸由主体统一提供，其余信息由渲染管线透传 */
export interface RenderedPage {
  html: string
  widthMm?: number
  heightMm?: number
  [key: string]: unknown
}

/** 导出插件的输入：当前渲染结果 + 模板 + 打印数据 */
export interface ExportInput {
  pages: readonly RenderedPage[]
  template: TemplateData
  printData: Record<string, unknown>
}

/** 导出插件的输出：浏览器侧生成的文件 */
export interface ExportResult {
  filename: string
  blob: Blob
}

export interface PrintExportPlugin {
  /** 插件唯一标识，写入模板 plugins 清单 */
  id: string
  /** 语义化版本，用于 strict 校验与版本锁定 */
  version: string
  /** 支持的导出格式，如 ['xlsx'] / ['docx'] */
  formats: readonly string[]
  /** 浏览器侧导出：输入渲染结果，输出文件 blob */
  export(input: ExportInput, options?: Record<string, unknown>): Promise<ExportResult>
}

const REGISTRY_KEY = Symbol.for('worm-print-platform.export-plugin-registry.v1')

interface RegistryState {
  plugins: Map<string, PrintExportPlugin>
  formats: Map<string, PrintExportPlugin>
}

type GlobalHost = { [key: symbol]: RegistryState | undefined }
const host = globalThis as unknown as GlobalHost

function state(): RegistryState {
  const existing = host[REGISTRY_KEY]
  if (existing) return existing
  const created: RegistryState = { plugins: new Map(), formats: new Map() }
  host[REGISTRY_KEY] = created
  return created
}

function assertPlugin(plugin: PrintExportPlugin): void {
  if (!plugin?.id || typeof plugin.id !== 'string') {
    throw new Error('defineExportPlugin: id 必须是非空字符串')
  }
  if (!plugin.version || typeof plugin.version !== 'string') {
    throw new Error('defineExportPlugin: version 必须是非空字符串')
  }
  if (!Array.isArray(plugin.formats) || plugin.formats.length === 0) {
    throw new Error('defineExportPlugin: formats 必须是非空数组')
  }
  for (const format of plugin.formats) {
    if (!format || typeof format !== 'string') {
      throw new Error('defineExportPlugin: formats[] 必须是非空字符串')
    }
  }
  if (typeof plugin.export !== 'function') {
    throw new Error('defineExportPlugin: export 必须是函数')
  }
}

/** 描述符恒等函数：给插件作者提供类型检查，不做隐式注册 */
export function defineExportPlugin(plugin: PrintExportPlugin): PrintExportPlugin {
  assertPlugin(plugin)
  return plugin
}

/** 注册插件，返回注销句柄；同 id 后注册覆盖旧描述符 */
export function registerExportPlugin(plugin: PrintExportPlugin): () => void {
  assertPlugin(plugin)
  const s = state()
  const previous = s.plugins.get(plugin.id)
  if (previous) {
    for (const format of previous.formats) {
      if (s.formats.get(format) === previous) s.formats.delete(format)
    }
  }
  s.plugins.set(plugin.id, plugin)
  for (const format of plugin.formats) s.formats.set(format, plugin)
  return () => {
    if (s.plugins.get(plugin.id) !== plugin) return
    s.plugins.delete(plugin.id)
    for (const format of plugin.formats) {
      if (s.formats.get(format) === plugin) s.formats.delete(format)
    }
  }
}

export function getExportPluginById(id: string): PrintExportPlugin | undefined {
  return state().plugins.get(id)
}

export function getExportPluginByFormat(format: string): PrintExportPlugin | undefined {
  return state().formats.get(format)
}

export function getExportPlugins(): readonly PrintExportPlugin[] {
  return [...state().plugins.values()]
}

export function clearExportPlugins(): void {
  const s = state()
  s.plugins.clear()
  s.formats.clear()
}
