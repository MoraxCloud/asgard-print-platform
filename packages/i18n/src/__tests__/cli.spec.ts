import { mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { isCliEntry } from '../cli.js'

const dir = mkdtempSync(join(tmpdir(), 'worm-print-i18n-cli-'))
const real = join(dir, 'entry.js')
const link = join(dir, 'link.js')
writeFileSync(real, '')
symlinkSync(real, link)
// macOS 的 /var 会指向 /private/var，基准按 realpath 归一
const realPath = realpathSync(real)
const moduleUrl = pathToFileURL(realPath).href
afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('CLI 入口判断', () => {
  it('经软链调用时仍识别为入口', () => {
    expect(isCliEntry(link, moduleUrl)).toBe(true)
  })

  it('真实路径识别为入口', () => {
    expect(isCliEntry(real, moduleUrl)).toBe(true)
  })

  it('缺失路径、空 argv 与非入口不误触发', () => {
    expect(isCliEntry(join(dir, 'missing.js'), moduleUrl)).toBe(false)
    expect(isCliEntry(undefined, moduleUrl)).toBe(false)
    expect(isCliEntry(real, pathToFileURL(join(dirname(realPath), 'other.js')).href)).toBe(false)
  })
})
