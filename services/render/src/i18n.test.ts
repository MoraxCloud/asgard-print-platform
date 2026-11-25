import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { resetLocale, setLocale } from '@worm-print-platform/core/i18n'
import { normalizePrintData, MAX_BATCH_COPIES } from '@worm-print-platform/core'
import { loadLocalePack } from './locale-pack.js'

afterEach(() => resetLocale())

describe('打印数据校验诊断的 locale', () => {
  it('默认中文逐字不变', () => {
    expect(() => normalizePrintData([])).toThrow('批量打印数据必须是非空对象数组')
    expect(() => normalizePrintData(new Array(MAX_BATCH_COPIES + 1).fill({}))).toThrow(
      `批量打印最多支持 ${MAX_BATCH_COPIES} 份，当前 ${MAX_BATCH_COPIES + 1} 份`,
    )
  })

  it('切英文后诊断英文化', () => {
    setLocale('en-US')
    expect(() => normalizePrintData([])).toThrow('Batch print data must be a non-empty array of objects')
    expect(() => normalizePrintData(new Array(MAX_BATCH_COPIES + 1).fill({}))).toThrow(/at most/)
  })

  it('加载合法语言包后诊断变法语', () => {
    const dir = mkdtempSync(join(tmpdir(), 'render-i18n-'))
    const file = join(dir, 'fr-FR.json')
    writeFileSync(file, JSON.stringify({ 'service.printData.emptyArray': 'Les données sont vides' }))
    setLocale('fr-FR')
    expect(loadLocalePack(file, 'fr-FR')).toBe(true)
    expect(() => normalizePrintData([])).toThrow('Les données sont vides')
  })

  it('非法文件 warn 且返回 false，不抛错', () => {
    expect(loadLocalePack('/definitely/missing.json', 'fr-FR')).toBe(false)
  })
})
