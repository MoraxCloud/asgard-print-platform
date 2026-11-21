import type { LocalePackage } from './types.js'

/**
 * 以基准语言（默认 zh-CN）合并各包资源为扁平骨架。
 * 排序：core → constants → propertyTips → 插件 id 字母序，同组内按键字母序。
 */
export function buildTemplate(pkgs: LocalePackage[], base = 'zh-CN'): Record<string, string> {
  const rows: Array<{ ns: string; id: string; key: string; value: string }> = []
  for (const pkg of pkgs) {
    const locales = pkg.locales.get(base)
    if (!locales) throw new Error(`缺少基准语言 ${base}：${pkg.id}（${pkg.origin}）`)
    for (const [ns, messages] of Object.entries(locales)) {
      for (const [key, value] of Object.entries(messages)) rows.push({ ns, id: pkg.id, key, value })
    }
  }
  const rank = (ns: string) => ns === 'core' ? 0 : ns === 'constants' ? 1 : ns === 'propertyTips' ? 2 : 3
  rows.sort((a, b) => rank(a.ns) - rank(b.ns)
    || (a.ns === b.ns && rank(a.ns) === 3 ? a.id.localeCompare(b.id) : 0)
    || a.key.localeCompare(b.key))
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}
