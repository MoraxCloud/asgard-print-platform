import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createTranslator,
  formatDate,
  formatNumber,
  getLocale,
  getMissingKeys,
  mergeLocale,
  normalizeLocale,
  registerLocale,
  registerPluginMessages,
  resetLocale,
  setLocale,
  subscribe,
  t,
  clearLocales,
} from '../index.js'

afterEach(() => {
  clearLocales()
  resetLocale()
  vi.restoreAllMocks()
})

describe('normalizeLocale', () => {
  it('把 en 系列归一为 en-US，其余保留，空值回退 zh-CN', () => {
    expect(normalizeLocale('en')).toBe('en-US')
    expect(normalizeLocale('en-GB')).toBe('en-US')
    expect(normalizeLocale('th')).toBe('th-TH')
    expect(normalizeLocale('th-TH')).toBe('th-TH')
    expect(normalizeLocale('ja-JP')).toBe('ja-JP')
    expect(normalizeLocale(undefined)).toBe('zh-CN')
    expect(normalizeLocale('')).toBe('zh-CN')
    expect(normalizeLocale(123)).toBe('zh-CN')
  })
})

describe('locale 状态', () => {
  it('setLocale 设置显式 locale，resetLocale 回退 navigator.language', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP')
    setLocale('en-US')
    expect(getLocale()).toBe('en-US')
    resetLocale()
    expect(getLocale()).toBe('ja-JP')
  })
})

describe('内置语言包与插值', () => {
  it('默认中文、切英文、按参数插值', () => {
    expect(t('toolbar.save')).toBe('保存')
    setLocale('en-US')
    expect(t('toolbar.save')).toBe('Save')
    expect(t('toolbar.preview')).toBe('Preview')
    registerLocale('en-US', { 'diagnostic.position': 'position {pos}' })
    expect(t('diagnostic.position', { pos: 3 })).toBe('position 3')
  })

  it('切到泰语后 t() 返回泰语译文（内置包真实接入）', () => {
    setLocale('th-TH')
    expect(t('toolbar.save')).toBe('บันทึก')
    expect(t('toolbar.preview')).not.toBe('Preview')
  })

  it('含 HTML 的文案不被转义', () => {
    setLocale('en-US')
    const result = t('toolbarOverflow.k488', { v0: '<svg/>', v1: '' })
    expect(result).toContain('<svg/>')
    expect(result).not.toContain('&lt;')
  })
})

describe('分层回退与覆盖', () => {
  it('用户层压过插件层，内置层兜底', () => {
    setLocale('en-US')
    registerLocale('en-US', { 'toolbar.save': 'Custom' })
    registerPluginMessages('en-US', 'echarts', { 'echarts.kind.bar': 'Bar' })
    expect(t('toolbar.save')).toBe('Custom')
    expect(t('echarts.kind.bar')).toBe('Bar')
    expect(t('toolbar.preview')).toBe('Preview')
  })

  it('mergeLocale 覆盖同键', () => {
    setLocale('en-US')
    registerLocale('en-US', { 'toolbar.save': 'First' })
    mergeLocale('en-US', { 'toolbar.save': 'Second' })
    expect(t('toolbar.save')).toBe('Second')
  })

  it('插件键前缀非法时抛错', () => {
    expect(() => registerPluginMessages('en-US', 'echarts', { 'other.key': 'x' })).toThrow(/echarts\./)
  })

  it('clearLocales 清除自定义 locale 注入的用户层', () => {
    registerLocale('fr-FR', { 'toolbar.save': 'Sauvegarder' })
    setLocale('fr-FR')
    expect(t('toolbar.save')).toBe('Sauvegarder')
    clearLocales()
    expect(t('toolbar.save')).not.toBe('Sauvegarder')
  })

  it('clearLocales 后插件 key 不再命中，但 core 内置译文保留', () => {
    setLocale('en-US')
    registerPluginMessages('en-US', 'echarts', { 'echarts.kind.bar': 'Bar' })
    expect(t('echarts.kind.bar')).toBe('Bar')
    clearLocales()
    expect(t('echarts.kind.bar')).toBe('echarts.kind.bar')
    expect(t('toolbar.save')).toBe('Save')
  })
})

describe('缺键诊断与订阅', () => {
  it('记录缺键', () => {
    t('nonexistent.key')
    expect(getMissingKeys()).toContain('nonexistent.key')
  })

  it('setLocale 通知订阅者，注销后不再通知', () => {
    const listener = vi.fn()
    const off = subscribe(listener)
    setLocale('en-US')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith('en-US')
    off()
    setLocale('zh-CN')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('resetLocale 在回退探测 locale 时也通知订阅者', () => {
    const listener = vi.fn()
    const off = subscribe(listener)
    setLocale('en-US')
    expect(listener).toHaveBeenCalledTimes(1)
    resetLocale()
    expect(listener).toHaveBeenCalledTimes(2)
    off()
  })

  it('createTranslator 绑定 locale 不受全局切换影响', () => {
    const en = createTranslator('en-US')
    setLocale('zh-CN')
    expect(en('toolbar.save')).toBe('Save')
    expect(t('toolbar.save')).toBe('保存')
  })

  it('scoped translator 优先 messages，缺键回退全局', () => {
    resetLocale()
    setLocale('zh-CN')
    const tr = createTranslator('fr-FR', { 'toolbar.save': 'Enregistrer' })
    expect(tr('toolbar.save')).toBe('Enregistrer')
    expect(tr('toolbar.preview')).toBe('预览')
  })

  it('不同 messages 的 translator 互不影响', () => {
    const a = createTranslator('fr-FR', { 'toolbar.save': 'A' })
    const b = createTranslator('fr-FR', { 'toolbar.save': 'B' })
    expect(a('toolbar.save')).toBe('A')
    expect(b('toolbar.save')).toBe('B')
  })

  it('空串译文回退全局中文，且不污染全局 user 层', () => {
    resetLocale()
    setLocale('zh-CN')
    const tr = createTranslator('fr-FR', { 'toolbar.save': '' })
    expect(tr('toolbar.save')).toBe('保存')
    expect(t('toolbar.save')).toBe('保存')
  })
})

describe('locale 感知格式化', () => {
  it('formatNumber 按 locale 分组', () => {
    expect(formatNumber(12345.6, 'en-US')).toBe('12,345.6')
    expect(formatNumber(12345.6, 'de-DE')).toBe('12.345,6')
  })

  it('formatDate 两 locale 输出不同', () => {
    const date = new Date('2024-01-02T00:00:00Z')
    expect(formatDate(date, 'en-US')).not.toBe(formatDate(date, 'de-DE'))
  })
})
