import { afterEach, describe, expect, it } from 'vitest'
import { tokenize } from '../../lexer.js'
import { toUpperCaseAmount } from '../../functions/format.js'
import { canMergeReason } from '../../designer/utils/table-matrix.js'
import { CROP_SAMPLE_NOTE, cropSampleNote } from '../../designer/utils/crop-anchor.js'
import { normalizeTemplate } from '../../print/multi-template.js'
import { TILE_DEFAULTS, validateTiling } from '../../print/tiling.js'
import { resetLocale, setLocale } from '../index.js'

afterEach(() => resetLocale())

const continuousTemplate = {
  paperSize: 'CONTINUOUS',
  orientation: 'portrait',
  customWidth: 50,
  customHeight: 30,
  tiling: TILE_DEFAULTS,
} as never

const RECT_ONE = { r1: 0, c1: 0, r2: 0, c2: 0 } as never

describe('默认中文逐字不变', () => {
  it('拼版校验、表格校验、模板校验、词法错误保持原文', () => {
    expect(validateTiling(continuousTemplate)[0]!.message).toBe(
      '连续纸不支持拼版打印，请将模板纸张改为固定纸张或关闭拼版',
    )
    expect(canMergeReason([], RECT_ONE)).toBe('至少选择 2 个单元格')
    expect(() => normalizeTemplate({ version: 1, pages: [] } as never)).toThrow('多页面模板至少需要一页')
    expect(() => tokenize('"abc')).toThrow('字符串未闭合')
    expect(CROP_SAMPLE_NOTE).toBe('图片还没设置，上面按内置示例图演示取位；换上真图后档位与可挪量按真图重算')
  })

  it('人民币大写不受 locale 影响', () => {
    expect(toUpperCaseAmount(1234.56)).toBe('壹仟贰佰叁拾肆元伍角陆分')
    setLocale('en-US')
    expect(toUpperCaseAmount(1234.56)).toBe('壹仟贰佰叁拾肆元伍角陆分')
  })
})

describe('英文译文', () => {
  it('拼版与表格校验切英文', () => {
    setLocale('en-US')
    expect(validateTiling(continuousTemplate)[0]!.message).toBe(
      'Continuous paper does not support tiling; use fixed paper or disable tiling',
    )
    expect(canMergeReason([], RECT_ONE)).toBe('Select at least 2 cells')
    expect(() => tokenize('"abc')).toThrow('Unterminated string')
  })

  it('带参数的页面标签用英文模板与 locale 数字', () => {
    setLocale('en-US')
    const cover = {
      name: '封面',
      paperSize: 'CONTINUOUS',
      orientation: 'portrait',
      customWidth: 50,
      customHeight: 30,
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      elements: [],
    }
    const normal = {
      paperSize: 'A4',
      orientation: 'portrait',
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      elements: [],
    }
    // 页面名属于模板数据（Q2 排除），不随界面语言翻译
    expect(() => normalizeTemplate({ version: 1, pages: [cover, normal] } as never)).toThrow(
      'Multi-page templates do not support continuous paper (Page 1 "封面")',
    )
  })

  it('crop 提示改为函数并跟随 locale', () => {
    expect(cropSampleNote()).toBe(CROP_SAMPLE_NOTE)
    setLocale('en-US')
    expect(cropSampleNote()).toBe(
      'No image set; the built-in sample shows positioning. Ranges are recalculated with a real image.',
    )
  })
})
