// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { resetLocale, setLocale } from '@worm-print-platform/core/i18n'
import { WATERMARK_DENSITY_PRESETS } from '@worm-print-platform/core'
import { BORDER_LINE_STYLES, PAPER_PRESETS, t } from '@worm-print-platform/core/designer'
import { getHelpSections } from '../help-content/index.js'

afterEach(() => resetLocale())

it('常量 labelKey 在英文下取到英文', () => {
  setLocale('en-US')
  expect(t(PAPER_PRESETS.DOT_FULL!.labelKey)).toBe('Full sheet 241×279.4mm')
  expect(t(BORDER_LINE_STYLES[1]!.labelKey)).toBe('Solid')
  expect(t(WATERMARK_DENSITY_PRESETS.dense!.labelKey)).toBe('Dense')
})

it('自定义语言帮助正文回退中文', () => {
  expect(getHelpSections('fr-FR')[0]!.content).toMatch(/[\u4e00-\u9fff]/)
})
