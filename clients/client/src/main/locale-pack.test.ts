import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadLocalePack, resolveLocalePackPath } from './locale-pack.js'

describe('resolveLocalePackPath', () => {
  it('显式绝对路径优先，其次相对 userData，最后 app 内置 out/locales', () => {
    expect(resolveLocalePackPath({ locale: 'fr-FR', localePack: '/abs/fr.json', userDataDir: '/u', appDir: '/a' })).toBe('/abs/fr.json')
    expect(resolveLocalePackPath({ locale: 'fr-FR', localePack: 'sub/fr.json', userDataDir: '/u', appDir: '/a' })).toBe('/u/sub/fr.json')
    expect(resolveLocalePackPath({ locale: 'fr-FR', localePack: '', userDataDir: '/u', appDir: '/a' })).toBe(null)
  })

  it('无显式配置时，存在 app 内置语言包则返回其路径', () => {
    const dir = mkdtempSync(join(tmpdir(), 'client-locale-'))
    mkdirSync(join(dir, 'out/locales'), { recursive: true })
    writeFileSync(join(dir, 'out/locales/fr-FR.json'), '{}')
    expect(resolveLocalePackPath({ locale: 'fr-FR', localePack: '', userDataDir: '/u', appDir: dir }))
      .toBe(join(dir, 'out/locales/fr-FR.json'))
  })
})

describe('loadLocalePack', () => {
  it('合法文件返回 null，非法返回错误信息', () => {
    const dir = mkdtempSync(join(tmpdir(), 'client-i18n-'))
    const file = join(dir, 'fr-FR.json')
    writeFileSync(file, JSON.stringify({ 'toolbar.save': 'Enregistrer' }))
    expect(loadLocalePack(file, 'fr-FR')).toBe(null)
    writeFileSync(file, '{"a":1}')
    expect(loadLocalePack(file, 'fr-FR')).not.toBe(null)
    expect(loadLocalePack(join(dir, 'missing.json'), 'fr-FR')).not.toBe(null)
  })
})
