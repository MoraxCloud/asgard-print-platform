import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(new URL('../../../../../', import.meta.url).pathname)
const doc = readFileSync(resolve(ROOT, 'docs/guide/06-i18n.md'), 'utf8')

describe('国际化文档', () => {
  it('覆盖关键 API 与配置项', () => {
    for (const token of [
      'registerLocale', 'mergeLocale', 'PluginLocaleMessages',
      'lang', 'messages', 'i18nId', 'documentLang', 'locale-keys.json',
      'worm-print-i18n', 'wormPrint.i18n', 'WORM_PRINT_LOCALE_FILE', 'localePack',
      'constants.borderStyle', 'propertyTips',
    ]) {
      expect(doc).toContain(token)
    }
  })
})
