import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { checkParity, parseKeys } from '../../../scripts/gen-locale-keys.mjs'

const readMsg = (name: string) => readFileSync(new URL(`../messages/${name}`, import.meta.url), 'utf8')
const zhSource = () => `${readMsg('zh-CN.ts')}\n${readMsg('shell-zh.ts')}\n${readMsg('expr-zh.ts')}`
const enSource = () => `${readMsg('en-US.ts')}\n${readMsg('shell-en.ts')}\n${readMsg('expr-en.ts')}`

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
  })
})

describe('键名清单', () => {
  it('locale-keys.json 与 zh-CN 包键一致', () => {
    const json = readFileSync(new URL('../locale-keys.json', import.meta.url), 'utf8')
    expect(JSON.parse(json)).toEqual(parseKeys(zhSource()))
  })
})
