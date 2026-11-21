import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { checkParity, parseKeys, readJsonKeys } from '../../../scripts/gen-locale-keys.mjs'

const readMsg = (name: string) => readFileSync(new URL(`../messages/${name}`, import.meta.url), 'utf8')
const zhSource = () => `${readMsg('zh-CN.ts')}\n${readMsg('shell-zh.ts')}\n${readMsg('expr-zh.ts')}`
const enSource = () => `${readMsg('en-US.ts')}\n${readMsg('shell-en.ts')}\n${readMsg('expr-en.ts')}`
const thSource = () => `${readMsg('th-TH.ts')}\n${readMsg('shell-th.ts')}\n${readMsg('expr-th.ts')}`

describe('parseKeys', () => {
  it('从语言包源文件提取顶层键', () => {
    const source = "const zh = {\n  'toolbar.save': '保存',\n  'toolbar.preview': '预览',\n}"
    expect(parseKeys(source)).toEqual(['toolbar.save', 'toolbar.preview'])
  })
})

describe('checkParity', () => {
  it('报告 en 缺失的键', () => {
    const zh = "const zh = {\n  'a': '甲',\n  'b': '乙',\n}"
    const en = "const en = {\n  'a': 'A',\n}"
    expect(checkParity(zh, en)).toEqual({ missing: ['b'], extra: [] })
  })

  it('报告 en 多出的键', () => {
    const zh = "const zh = {\n  'a': '甲',\n}"
    const en = "const en = {\n  'a': 'A',\n  'b': 'B',\n}"
    expect(checkParity(zh, en)).toEqual({ missing: [], extra: ['b'] })
  })

  it('真实语言包键齐全', () => {
    expect(checkParity(zhSource(), enSource())).toEqual({ missing: [], extra: [] })
    expect(checkParity(zhSource(), thSource())).toEqual({ missing: [], extra: [] })
  })
})

describe('泰语包（AI 直译）', () => {
  it('thTH 已导出且值非空、与英文不同', async () => {
    const { thTH } = await import('../index.js')
    expect(typeof thTH['toolbar.save']).toBe('string')
    expect(thTH['toolbar.save']!.length).toBeGreaterThan(0)
    expect(thTH['toolbar.save']).not.toBe('Save')
  })

  it('占位符与英文包逐键一致', () => {
    const placeholders = (s: string) => (s.match(/\{[a-zA-Z0-9_]+\}/g) ?? []).sort().join(',')
    const enKeys = parseKeys(enSource())
    for (const key of enKeys) {
      const enMatch = enSource().match(new RegExp(`^\\s{2}'${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*["'](.*)["'],?$`, 'm'))
      const thMatch = thSource().match(new RegExp(`^\\s{2}'${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*["'](.*)["'],?$`, 'm'))
      if (!enMatch || !thMatch) continue
      expect(placeholders(thMatch[1]!), key).toBe(placeholders(enMatch[1]!))
    }
  })
})

describe('键名清单', () => {
  it('locale-keys.json 含 core + constants + propertyTips 三语资源键', () => {
    const json = readFileSync(new URL('../locale-keys.json', import.meta.url), 'utf8')
    const expected = [
      ...parseKeys(zhSource()),
      ...readJsonKeys('zh-CN', 'constants'),
      ...readJsonKeys('zh-CN', 'propertyTips'),
    ]
    expect(JSON.parse(json)).toEqual([...new Set(expected)].sort())
  })

  it('constants / propertyTips 三语键集合一致', () => {
    for (const ns of ['constants', 'propertyTips']) {
      const base = [...readJsonKeys('zh-CN', ns)].sort()
      for (const locale of ['en-US', 'th-TH']) {
        expect([...readJsonKeys(locale, ns)].sort()).toEqual(base)
      }
    }
  })
})
