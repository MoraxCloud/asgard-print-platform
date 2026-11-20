import type { LocaleMessages } from '../types.js'

// 内置英文语言包。允许残缺，缺键回退中文源文本。
export const enUS: Partial<LocaleMessages> = {
  'toolbar.save': 'Save',
  'toolbar.preview': 'Preview',
  'diagnostic.expressionUnexpectedEnd': 'Unexpected end of expression',
}
