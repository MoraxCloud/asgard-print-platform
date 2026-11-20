import type { CustomLocaleMessages, Locale, Translate } from './types.js'
import { enUS } from './messages/en-US.js'
import { zhCN } from './messages/zh-CN.js'

const REGISTRY_KEY = Symbol.for('worm-print-platform.i18n.v1')

const ORDER_USER = 0
const ORDER_PLUGIN = 1
const ORDER_EN = 2
const ORDER_ZH = 3

interface State {
  explicit: string | null
  layers: Map<string, Map<number, Record<string, string>>>
  listeners: Set<(locale: string) => void>
  missing: Set<string>
}

type Host = { [key: symbol]: State | undefined }
const host = globalThis as unknown as Host

function state(): State {
  const existing = host[REGISTRY_KEY]
  if (existing) return existing
  const created: State = {
    explicit: null,
    layers: new Map(),
    listeners: new Set(),
    missing: new Set(),
  }
  addLayer(created, 'en-US', ORDER_EN, enUS as Record<string, string>)
  addLayer(created, 'zh-CN', ORDER_ZH, zhCN as Record<string, string>)
  host[REGISTRY_KEY] = created
  return created
}

const DEV = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'

function addLayer(s: State, locale: string, order: number, messages: Record<string, string>): () => void {
  const key = normalizeLocale(locale)
  let byOrder = s.layers.get(key)
  if (!byOrder) {
    byOrder = new Map()
    s.layers.set(key, byOrder)
  }
  let dict = byOrder.get(order)
  if (!dict) {
    dict = {}
    byOrder.set(order, dict)
  }
  const added = Object.keys(messages)
  for (const name of added) dict[name] = messages[name]
  return () => {
    for (const name of added) delete dict![name]
  }
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (
    name in params ? String(params[name]) : whole
  ))
}

export function normalizeLocale(input: unknown): Locale {
  if (typeof input !== 'string') return 'zh-CN'
  const value = input.trim()
  if (!value) return 'zh-CN'
  if (/^en([-_]|$)/i.test(value)) return 'en-US'
  return value
}

export function getLocale(): Locale {
  const s = state()
  if (s.explicit) return s.explicit
  if (typeof navigator !== 'undefined' && typeof (navigator as { language?: string }).language === 'string') {
    return normalizeLocale((navigator as { language: string }).language)
  }
  return 'zh-CN'
}

function notify(locale: string): void {
  for (const listener of [...state().listeners]) listener(locale)
}

export function setLocale(locale: string | null): void {
  const s = state()
  s.explicit = locale === null ? null : normalizeLocale(locale)
  // 重置为 null 也要通知：跟随全局的实例需要按探测到的 locale 重新取词
  notify(getLocale())
}

export function resetLocale(): void {
  state().explicit = null
  notify(getLocale())
}

export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const s = state()
  const normalized = normalizeLocale(locale)
  const byOrder = s.layers.get(normalized)
  if (byOrder) {
    for (const order of [ORDER_USER, ORDER_PLUGIN, ORDER_EN, ORDER_ZH]) {
      const dict = byOrder.get(order)
      if (dict && key in dict) return interpolate(dict[key], params)
    }
  }
  if (DEV) {
    s.missing.add(key)
    console.warn(`[i18n] missing key: ${key} (locale=${normalized})`)
  }
  const zh = s.layers.get('zh-CN')?.get(ORDER_ZH)
  if (zh && key in zh) return interpolate(zh[key], params)
  return key
}

export function t(key: string, params?: Record<string, string | number>): string {
  return translate(getLocale(), key, params)
}

export function createTranslator(locale: Locale): Translate {
  return (key, params) => translate(locale, key, params)
}

export function registerLocale(locale: Locale, messages: CustomLocaleMessages): () => void {
  return addLayer(state(), locale, ORDER_USER, messages as Record<string, string>)
}

export function mergeLocale(locale: Locale, messages: CustomLocaleMessages): () => void {
  return addLayer(state(), locale, ORDER_USER, messages as Record<string, string>)
}

export function registerPluginMessages(
  locale: Locale,
  pluginId: string,
  messages: Record<string, string>,
): () => void {
  const prefix = `${pluginId}.`
  for (const key of Object.keys(messages)) {
    if (!key.startsWith(prefix)) {
      throw new Error(`registerPluginMessages: 语言包键必须以 "${prefix}" 开头，收到 "${key}"`)
    }
  }
  return addLayer(state(), locale, ORDER_PLUGIN, messages)
}

export function subscribe(listener: (locale: string) => void): () => void {
  const s = state()
  s.listeners.add(listener)
  return () => { s.listeners.delete(listener) }
}

export function getMissingKeys(): string[] {
  return [...state().missing]
}

/** 仅供测试与热重载：清空用户层与插件层，保留内置包 */
export function clearLocales(): void {
  const s = state()
  for (const byOrder of s.layers.values()) {
    byOrder.delete(ORDER_USER)
    byOrder.delete(ORDER_PLUGIN)
  }
  s.missing.clear()
}
