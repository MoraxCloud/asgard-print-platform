// 帮助文档章节：按语言拆分为 zh-CN/ 与 en-US/，id 保持一致，正文各自翻译。
import zhGettingStarted from './zh-CN/getting-started'
import zhFeatures from './zh-CN/features'
import zhAdvancedSettings from './zh-CN/advanced-settings'
import zhShortcuts from './zh-CN/shortcuts'
import zhFaq from './zh-CN/faq'
import zhChangelog from './zh-CN/changelog'
import enGettingStarted from './en-US/getting-started'
import enFeatures from './en-US/features'
import enAdvancedSettings from './en-US/advanced-settings'
import enShortcuts from './en-US/shortcuts'
import enFaq from './en-US/faq'
import enChangelog from './en-US/changelog'
import thGettingStarted from './th-TH/getting-started'
import thFeatures from './th-TH/features'
import thAdvancedSettings from './th-TH/advanced-settings'
import thShortcuts from './th-TH/shortcuts'
import thFaq from './th-TH/faq'
import thChangelog from './th-TH/changelog'

export type HelpSection = {
  id: string
  title: string
  content: string
}

const zhSections: HelpSection[] = [
  zhGettingStarted, zhFeatures, zhAdvancedSettings, zhShortcuts, zhFaq, zhChangelog,
]
const enSections: HelpSection[] = [
  enGettingStarted, enFeatures, enAdvancedSettings, enShortcuts, enFaq, enChangelog,
]
const thSections: HelpSection[] = [
  thGettingStarted, thFeatures, thAdvancedSettings, thShortcuts, thFaq, thChangelog,
]

/** 未指定语言时默认中文；en-* 走英文；th-* 走泰语；其余回退中文 */
export function getHelpSections(locale?: string): HelpSection[] {
  if (locale && /^th([-_]|$)/i.test(locale)) return thSections
  return locale && /^en([-_]|$)/i.test(locale) ? enSections : zhSections
}

/** zh-CN 别名，供旧的直接引用保持兼容 */
export const helpSections: HelpSection[] = zhSections

export type { HelpSection as default }
