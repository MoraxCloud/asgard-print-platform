// i18n 引擎：在 i18next 实例上的薄封装，对外 API 与旧实现完全一致。
// 状态（explicit / missing / listeners / 插件命名空间）在本模块维护，
// i18next 负责资源分层与插值解析。
import type { CustomLocaleMessages, Locale, Translate } from './types.js'
import { createI18nInstance, detectLocale, normalizeLocale } from './i18n-instance.js'

export { normalizeLocale } from './i18n-instance.js'

const DEV = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'

const instance = createI18nInstance()

let explicit: string | null = null
const missing = new Set<string>()
const listeners = new Set<(locale: string) => void>()
const registeredPluginIds = new Set<string>()

// i18next 的缺键事件收集；只有 fallback 语言也没有该键时才计入（保持旧语义）
instance.on('missingKey', (_lngs: readonly string[], _ns: string, key: string) => {
  if (DEV) console.warn(`[i18n] missing key: ${key} (locale=${getLocale()})`)
  if (!instance.exists(key, { lng: 'zh-CN' })) missing.add(key)
})

function currentLocale(): string {
  return explicit ?? detectLocale()
}

function notify(locale: string): void {
  for (const listener of [...listeners]) listener(locale)
}

export function getLocale(): Locale {
  return currentLocale()
}

export function setLocale(locale: string | null): void {
  const next = locale === null ? null : normalizeLocale(locale)
  const changed = next !== explicit || next === null
  explicit = next
  const resolved = currentLocale()
  void instance.changeLanguage(resolved)
  // 语言未变时 i18next 不触发 languageChanged：此处主动通知，保持旧语义
  if (changed) notify(resolved)
}

export function resetLocale(): void {
  setLocale(null)
}

/** 把 i18next 的 TFunction 结果归一为 string（i18next 类型可返回 object） */
function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : (value == null ? fallback : String(value))
}

export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const fixed = instance.getFixedT(normalizeLocale(locale), lookupNamespaces())
  const result = params ? fixed(key, params) : fixed(key)
  return asString(result, key)
}

export function t(key: string, params?: Record<string, string | number>): string {
  return translate(currentLocale(), key, params)
}

export function createTranslator(locale: Locale): Translate {
  const fixed = instance.getFixedT(normalizeLocale(locale), lookupNamespaces())
  return (key, params) => asString(params ? fixed(key, params) : fixed(key), key)
}

/**
 * 检索命名空间顺序：user > plugins > core。
 * 旧引擎优先级 user > plugin > 内置，i18next 按 ns 数组顺序命中，
 * 显式传入本列表可保证用户/插件覆盖 core（defaultNS 只查 core 会导致覆盖失效）。
 */
function lookupNamespaces(): string[] {
  return ['user', ...registeredPluginIds, 'core']
}

export function registerLocale(locale: Locale, messages: CustomLocaleMessages): () => void {
  const normalized = normalizeLocale(locale)
  instance.addResourceBundle(normalized, 'user', messages as Record<string, string>, true, true)
  return () => { instance.removeResourceBundle(normalized, 'user') }
}

export function mergeLocale(locale: Locale, messages: CustomLocaleMessages): () => void {
  return registerLocale(locale, messages)
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
  const normalized = normalizeLocale(locale)
  instance.addResourceBundle(normalized, pluginId, messages, true, true)
  registeredPluginIds.add(pluginId)
  return () => {
    instance.removeResourceBundle(normalized, pluginId)
    registeredPluginIds.delete(pluginId)
  }
}

export function subscribe(listener: (locale: string) => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function getMissingKeys(): string[] {
  return [...missing]
}

/** 清空用户层与插件层，保留 core 内置包 */
export function clearLocales(): void {
  for (const locale of ['zh-CN', 'en-US', 'th-TH']) {
    instance.removeResourceBundle(locale, 'user')
    for (const pluginId of registeredPluginIds) instance.removeResourceBundle(locale, pluginId)
  }
  registeredPluginIds.clear()
  missing.clear()
}

/**
 * 导出聚合 resources（i18next services.resourceStore.data 原生结构）。
 * 传 locale 返回该语言的 { namespace: messages }，不传返回全量。
 */
export function getResources(locale?: string): Record<string, any> {
  const data = (instance.services?.resourceStore?.data ?? {}) as Record<string, any>
  if (locale === undefined) return data
  return data[normalizeLocale(locale)] ?? {}
}
