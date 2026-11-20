// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { getHelpSections } from '../help-content'

const CJK = /[\u4e00-\u9fff]/

describe('帮助文档按语言拆分', () => {
  it('中文六章节 id 与标题', () => {
    const sections = getHelpSections('zh-CN')
    expect(sections.map(s => s.id)).toEqual([
      'getting-started', 'features', 'advanced-settings', 'shortcuts', 'faq', 'changelog',
    ])
    expect(sections.map(s => s.title)).toEqual(['快速入门', '功能说明', '高级设置', '快捷键', '常见问题', '更新记录'])
  })

  it('英文六章节 id 相同、标题英文、正文无中文', () => {
    const zh = getHelpSections('zh-CN')
    const en = getHelpSections('en-US')
    expect(en.map(s => s.id)).toEqual(zh.map(s => s.id))
    for (const s of en) {
      expect(CJK.test(s.title)).toBe(false)
      expect(s.content.length).toBeGreaterThan(20)
      expect(CJK.test(s.content)).toBe(false)
    }
  })

  it('未知 locale 回退中文', () => {
    expect(getHelpSections('ja-JP')).toEqual(getHelpSections('zh-CN'))
    expect(getHelpSections('zh-CN')).toEqual(getHelpSections())
  })
})
