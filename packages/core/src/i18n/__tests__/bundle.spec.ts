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
      '../locales/constants-th-TH.json', '../locales/propertyTips-th-TH.json',
      '../../../../../marketplace/plugins/echarts/src/i18n/th-TH.ts',
    ]
    const helpDir = resolve(MODULE_DIR, '../../../../canvas/src/shell/help-content/th-TH')
    for (const f of readdirSync(helpDir).filter(n => n.endsWith('.ts'))) {
      files.push(`../../../../canvas/src/shell/help-content/th-TH/${f}`)
    }
    for (const rel of files) {
      let src = read(rel)
      // 剥离 TS 注释；JSON 资源无注释，键均为语义键
      src = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      expect(src, rel).not.toMatch(/[\u4e00-\u9fff]/)
      expect(src, rel).not.toMatch(/à¸/) // UTF-8 泰语被当 Latin-1 解码的典型乱码
    }
  })
})
