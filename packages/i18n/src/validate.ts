export interface Issue {
  level: 'error' | 'warn'
  key?: string
  message: string
}

const PLACEHOLDER = /\{([A-Za-z_][\w]*)\}/g
const placeholders = (s: string) => [...s.matchAll(PLACEHOLDER)].map(m => m[1]).sort()

/** 校验扁平语言包：缺键/空值/占位符不一致为 error，多余键默认 warn（--strict 转 error）。 */
export function validatePack(
  pack: unknown,
  base: Record<string, string>,
  opts: { strict?: boolean } = {},
): Issue[] {
  const issues: Issue[] = []
  if (typeof pack !== 'object' || pack === null || Array.isArray(pack)) {
    return [{ level: 'error', message: '语言包必须是扁平 JSON 对象（键 → 字符串）' }]
  }
  const entries = Object.entries(pack as Record<string, unknown>)
  for (const [key, value] of entries) {
    if (key === '_meta') {
      issues.push({ level: 'error', key, message: '不允许 _meta，语言包必须是纯扁平键' })
      continue
    }
    if (typeof value !== 'string') {
      issues.push({ level: 'error', key, message: '值必须是字符串（不支持嵌套对象）' })
      continue
    }
    if (value.trim() === '') issues.push({ level: 'error', key, message: '译文为空' })
    const expected = placeholders(base[key] ?? '')
    if (expected.length && placeholders(value).join() !== expected.join()) {
      issues.push({ level: 'error', key, message: `占位符不一致：期望 {${expected.join('},{')}}` })
    }
  }
  for (const key of Object.keys(base)) {
    if (!(key in (pack as Record<string, unknown>))) issues.push({ level: 'error', key, message: '缺少键' })
  }
  for (const [key] of entries) {
    if (key !== '_meta' && !(key in base)) {
      issues.push({ level: opts.strict ? 'error' : 'warn', key, message: '多余键' })
    }
  }
  return issues
}
