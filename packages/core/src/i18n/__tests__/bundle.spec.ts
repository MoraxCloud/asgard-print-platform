import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getResources } from '../index.js'

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))

describe('i18next resources 聚合导出（getResources）', () => {
  it('getResources() 含 zh-CN / en-US / th-TH 三个顶层 locale', () => {
    const resources = getResources()
    expect(Object.keys(resources).sort()).toEqual(['en-US', 'th-TH', 'zh-CN'])
  })

  it('getResources("th-TH") 含 core namespace 且 toolbar.save 为泰语', () => {
    const th = getResources('th-TH')
    expect(th).toHaveProperty('core')
    expect(th.core['toolbar.save']).toBe('บันทึก')
    expect(th.core['toolbar.save']).not.toBe('Save')
  })

  it('每个 locale 的 core namespace 键数量一致', () => {
    const resources = getResources()
    const counts = Object.values(resources).map((ns: any) => Object.keys(ns.core ?? {}).length)
    expect(new Set(counts).size).toBe(1)
  })

  it('泰语资源无中文字符与 mojibake 乱码残留', () => {
    const read = (p: string) => readFileSync(resolve(MODULE_DIR, p), 'utf8')
    const files = [
      '../messages/th-TH.ts', '../messages/shell-th.ts', '../messages/expr-th.ts',
      '../../../../canvas/src/shell/label-translation.ts',
      '../../../../canvas/src/shell/property-tip-translation.ts',
      '../../../../../marketplace/plugins/echarts/src/i18n/th-TH.ts',
    ]
    const helpDir = resolve(MODULE_DIR, '../../../../canvas/src/shell/help-content/th-TH')
    for (const f of readdirSync(helpDir).filter(n => n.endsWith('.ts'))) {
      files.push(`../../../../canvas/src/shell/help-content/th-TH/${f}`)

    }
    const isMappingTable = (r: string) => /label-translation|property-tip-translation/.test(r)
    for (const rel of files) {
      let src = read(rel)
      // 剥离注释（块注释 + 行注释）
      src = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      // 映射表的键是中文源文本，移除所有 '键': 形式，仅留冒号右侧的译文值
      const code = isMappingTable(rel) ? src.replace(/'[^']*'\s*:\s*/g, '') : src
      expect(code, rel).not.toMatch(/[\u4e00-\u9fff]/)
      expect(code, rel).not.toMatch(/à¸/) // UTF-8 泰语被当 Latin-1 解码的典型乱码
    }
  })
})
