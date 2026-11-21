// i18next 实例工厂：core 的 i18n 引擎（engine.ts）在此实例上做薄封装，
// 对外仍暴露原有 API。此文件只负责「实例 + 兼容配置 + 内置资源」。
import { createInstance } from 'i18next'
import type { i18n as I18nInstance } from 'i18next'
import { zhCN } from './messages/zh-CN.js'
import { enUS } from './messages/en-US.js'

export type { I18nInstance }

/** 与旧引擎一致的语言归一：en* → en-US，th* → th-TH，其余原样，空值回退 zh-CN */
export function normalizeLocale(input: unknown): string {
  if (typeof input !== 'string') return 'zh-CN'
  const value = input.trim()
  if (!value) return 'zh-CN'
  if (/^en([-_]|$)/i.test(value)) return 'en-US'
  if (/^th([-_]|$)/i.test(value)) return 'th-TH'
  return value
}

/** 探测系统语言，异常回退 zh-CN */
export function detectLocale(): string {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
      return normalizeLocale(navigator.language)
    }
  } catch { /* SSR / 受限环境忽略 */ }
  return 'zh-CN'
}

/**
 * 创建 i18next 实例。
 * - 内联三语种内置资源（th-TH 由 engine 的 thTH 占位/真实包注入，见 createI18nInstance 参数）
 * - 关闭 key/ns 分隔符与 HTML 转义、改用 {name} 插值、initImmediate:false 保证同步可用
 */
export function createI18nInstance(thTH: Record<string, string> = {}): I18nInstance {
  const instance = createInstance()
  instance.init({
    resources: {
      'zh-CN': { core: zhCN },
      'en-US': { core: enUS },
      // Task 3 前用英文占位；Task 3 起传入真实 thTH 包
      'th-TH': { core: Object.keys(thTH).length ? thTH : enUS },
    },
    lng: detectLocale(),
    fallbackLng: 'zh-CN',
    ns: ['core'],
    defaultNS: 'core',
    keySeparator: false,
    nsSeparator: false,
    interpolation: { prefix: '{', suffix: '}', escapeValue: false },
    returnNull: false,
    returnEmptyString: false,
    saveMissing: true,
    missingKeyHandler: () => { /* 缺键由 engine 的 missingKey 事件收集 */ },
  })
  return instance
}
