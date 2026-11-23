import type { LocalizedText } from './types.js'

/**
 * 取多语言文本的当前语言值。回退链：精确 locale → 语言前缀 → zh-CN → 空串。
 * 字符串形式视为已是目标文本，原样返回。
 */
export function localize(text: LocalizedText | undefined, locale: string): string {
  if (text === undefined) return ''
  if (typeof text === 'string') return text

  const wanted = locale.trim().toLowerCase()
  if (!wanted) return text['zh-CN'] ?? ''

  if (text[wanted] !== undefined) return text[wanted]

  const prefix = wanted.split('-')[0]
  if (prefix !== wanted && text[prefix] !== undefined) return text[prefix]

  return text['zh-CN'] ?? ''
}
