import { describe, expect, it } from 'vitest'
import { getResources } from '../index.js'

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
})
