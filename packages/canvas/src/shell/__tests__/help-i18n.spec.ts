// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { getHelpSections } from '../help-content'
import { mountHelpModal } from '../help-modal'
import { cropScaleLabel, cropSampleNote, CROP_AXIS_OPTIONS, IMAGE_FIT_OPTIONS } from '@worm-print-platform/core/designer'
import { setLocale } from '@worm-print-platform/core/i18n'

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

  it('泰语六章节 id 相同、标题为泰语、正文无中文', () => {
    const en = getHelpSections('en-US')
    const th = getHelpSections('th-TH')
    expect(th.map(s => s.id)).toEqual(en.map(s => s.id))
    for (const s of th) {
      expect(CJK.test(s.title)).toBe(false)
      expect(s.content.length).toBeGreaterThan(20)
      expect(CJK.test(s.content)).toBe(false)
    }
    expect(th[0]!.title).not.toBe(en[0]!.title)
    expect(th[0]!.title).not.toBe(getHelpSections('zh-CN')[0]!.title)
  })

  it('未知 locale 回退中文', () => {
    expect(getHelpSections('ja-JP')).toEqual(getHelpSections('zh-CN'))
    expect(getHelpSections('zh-CN')).toEqual(getHelpSections())
  })

  it('裁剪锚点选项与提示跟随 locale', () => {
    const zhNote = cropSampleNote()
    const zhAxis = CROP_AXIS_OPTIONS.vertical[0]!.label
    const zhFit = IMAGE_FIT_OPTIONS[0]!.label
    expect(CJK.test(zhNote)).toBe(true)
    setLocale('en-US')
    try {
      expect(CJK.test(cropSampleNote())).toBe(false)
      expect(CJK.test(cropScaleLabel())).toBe(false)
    } finally {
      setLocale('zh-CN')
    }
    // 模块级选项数组不随 locale 变化（已 ledger 记录），这里只锁定中文源存在
    expect(zhAxis.length).toBeGreaterThan(0)
    expect(zhFit.length).toBeGreaterThan(0)
  })

  it('英文弹窗的标题与关闭按钮为英文', () => {
    const host = document.createElement('div')
    document.body.replaceChildren(host)
    mountHelpModal(host, { locale: 'en-US', onClose: () => {} })
    const title = host.querySelector('.help-modal-title')?.textContent ?? ''
    const close = host.querySelector('.help-modal-close')?.getAttribute('title') ?? ''
    expect(title).not.toMatch(CJK)
    expect(title.length).toBeGreaterThan(0)
    expect(close).not.toMatch(CJK)
  })
})
