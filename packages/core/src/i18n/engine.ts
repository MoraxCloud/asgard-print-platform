// i18n 引擎：在 i18next 实例上的薄封装，对外 API 与旧实现完全一致。
// 状态（explicit / missing / listeners / 插件命名空间）在本模块维护，
// i18next 负责资源分层与插值解析。
import { createInstance } from 'i18next'
import type { i18n as I18nInstance } from 'i18next'
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

/**
 * 每个 messages 对象对应一个独立 i18next 实例，只承载 user 命名空间。
 * 用 WeakMap 避免实例常驻内存；同一对象反复注入只更新该实例的资源，不碰全局。
 */
const scopeInstances = new WeakMap<CustomLocaleMessages, I18nInstance>()

function scopedInstance(messages: CustomLocaleMessages): I18nInstance {
  let scoped = scopeInstances.get(messages)
  if (!scoped) {
    scoped = createInstance()
    scoped.init({
      resources: {}, lng: 'zh-CN', fallbackLng: false, ns: ['user'], defaultNS: 'user',
      keySeparator: false, nsSeparator: false,
      interpolation: { prefix: '{', suffix: '}', escapeValue: false },
      returnNull: false, returnEmptyString: false,
    })
    scopeInstances.set(messages, scoped)
  }
  return scoped
}

/**
 * 绑定 locale 的取词器。传入 messages 时为其创建实例级作用域：
 * 用户包命中优先，缺键/空串/插值缺失回退全局引擎（含内置三语与插件层）。
 */
export function createTranslator(locale: Locale, messages?: CustomLocaleMessages): Translate {
  const normalized = normalizeLocale(locale)
  const globalFixed = instance.getFixedT(normalized, lookupNamespaces())
  if (!messages) return (key, params) => asString(params ? globalFixed(key, params) : globalFixed(key), key)

  const scoped = scopedInstance(messages)
  scoped.addResourceBundle(normalized, 'user', messages as Record<string, string>, true, true)
  const fixed = scoped.getFixedT(normalized, 'user')
  return (key, params) => {
    const local = asString(params ? fixed(key, params) : fixed(key), '')
    // 空串按缺失处理（returnEmptyString:false 下 i18next 返回 key，这里用空串兜底判定）
    if (local !== '' && local !== key) return local
    return asString(params ? globalFixed(key, params) : globalFixed(key), key)
  }
}

/**
 * 检索命名空间顺序：user > 插件 > constants > propertyTips > core。
 * i18next 按 ns 数组顺序命中，显式传入本列表可保证用户/插件覆盖内置包
 * （defaultNS 只查 core 会导致覆盖失效）。
 */
function lookupNamespaces(): string[] {
  return ['user', ...registeredPluginIds, 'constants', 'propertyTips', 'core']
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
  // 遍历实际已加载的所有 locale（含自定义 locale），避免硬编码内置三语种漏清理
  const data = instance.services?.resourceStore?.data as Record<string, unknown> | undefined
  const locales = data ? Object.keys(data) : ['zh-CN', 'en-US', 'th-TH']
  for (const locale of locales) {
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
