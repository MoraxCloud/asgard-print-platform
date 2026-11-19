// 字段树动作贡献点：插件在字段分组节点上挂自定义操作（如「查看数据源」）。
// 注册表语义与 registry.ts 对齐：Symbol.for 全局键、同 id 后注册覆盖、订阅与注销幂等。
import type { PrintBusinessField } from '@worm-print-platform/core/designer'

/** 字段树分组信息（与 core 的 groupFields 产出同形） */
export interface FieldGroupInfo {
  key: string
  label: string
  isList: boolean
}

/** 动作激活上下文：宿主把当前分组、数据、字段与 overlay 容器交给插件 */
export interface FieldActionContext {
  group: FieldGroupInfo
  /** designData 数组信封，data[0] 即数据根 */
  data?: readonly Record<string, unknown>[]
  /** 宿主业务字段清单 */
  fields?: readonly PrintBusinessField[]
  /** 弹窗挂载容器（设计器 shadow root 内的 overlay 宿主） */
  container: HTMLElement
}

/** 一份字段树动作；onActivate 可返回 dispose，宿主在卸载时调用 */
export interface FieldActionUI {
  readonly id: string
  readonly label: string
  readonly icon?: string
  /** 宿主注入自身样式作用域 */
  readonly styles?: string
  onActivate(ctx: FieldActionContext): void | (() => void)
}

const REGISTRY_KEY = Symbol.for('worm-print-platform.field-action-registry.v1')

interface Entry {
  ui: FieldActionUI
  seq: number
}

interface RegistryState {
  entries: Map<string, Entry>
  listeners: Set<() => void>
  nextSeq: number
}

type GlobalHost = { [key: symbol]: RegistryState | undefined }
const host = globalThis as unknown as GlobalHost

function state(): RegistryState {
  const existing = host[REGISTRY_KEY]
  if (existing) return existing
  const created: RegistryState = { entries: new Map(), listeners: new Set(), nextSeq: 0 }
  host[REGISTRY_KEY] = created
  return created
}

function notify(): void {
  for (const listener of [...state().listeners]) {
    try {
      listener()
    } catch {
      // 单个宿主的刷新失败不应打断其它宿主或注册动作本身
    }
  }
}

function assertFieldActionUI(ui: FieldActionUI): void {
  if (!ui || typeof ui !== 'object') throw new Error('registerFieldActionUI: 需要 FieldActionUI 对象')
  if (!ui.id || typeof ui.id !== 'string') throw new Error('registerFieldActionUI: id 必须是非空字符串')
  if (!ui.label || typeof ui.label !== 'string') throw new Error('registerFieldActionUI: label 必须是非空字符串')
  if (typeof ui.onActivate !== 'function') throw new Error('registerFieldActionUI: onActivate 必须是函数')
}

/** 描述符恒等函数：给插件作者提供类型检查与可读性，不做隐式注册 */
export function defineFieldActionUI(ui: FieldActionUI): FieldActionUI {
  assertFieldActionUI(ui)
  return ui
}

/** 注册动作（同 id 后注册覆盖）；返回注销句柄，只注销自己这一版 */
export function registerFieldActionUI(ui: FieldActionUI): () => void {
  assertFieldActionUI(ui)
  const s = state()
  const seq = s.nextSeq++
  s.entries.set(ui.id, { ui, seq })
  notify()
  return () => {
    const current = s.entries.get(ui.id)
    if (current?.ui !== ui) return
    s.entries.delete(ui.id)
    notify()
  }
}

/** 当前注册的所有动作（后注册覆盖、按注册顺序） */
export function getFieldActionUIs(): FieldActionUI[] {
  const entries = [...state().entries.entries()]
  entries.sort((a, b) => a[1].seq - b[1].seq)
  return entries.map(([, entry]) => entry.ui)
}

/** 订阅注册态变化；返回取消订阅句柄 */
export function subscribeFieldActionRegistry(listener: () => void): () => void {
  state().listeners.add(listener)
  return () => { state().listeners.delete(listener) }
}

/** 清空注册态（仅供单测与宿主热重载使用） */
export function clearFieldActionUIs(): void {
  const s = state()
  s.entries.clear()
  notify()
}
