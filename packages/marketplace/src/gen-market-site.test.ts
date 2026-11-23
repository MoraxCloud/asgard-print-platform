import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const script = resolve(here, '../scripts/gen-market-site.mjs')

const fakeIndex = {
  schemaVersion: 1,
  title: { 'zh-CN': '测试市场' },
  plugins: [
    {
      id: 'echarts', uniqueId: 'worm-echarts', type: 'element', name: '百度图表',
      title: { 'zh-CN': '百度图表', en: 'ECharts' }, version: '1.0.0',
      npmName: '@worm-print-platform/plugin-echarts', path: 'plugins/echarts',
      entry: 'dist/index.js', kinds: [], exportFormats: [],
    },
    {
      id: 'data-preview', uniqueId: 'worm-data-preview', type: 'functional', name: '预览',
      title: { 'zh-CN': '预览' }, version: '0.1.0',
      npmName: '@worm-print-platform/plugin-data-preview', path: 'plugins/data-preview',
      entry: 'dist/index.js', kinds: [], exportFormats: [],
    },
  ],
}

const generate = (index: unknown): string => {
  const dir = mkdtempSync(join(tmpdir(), 'mp-site-'))
  const input = join(dir, 'index.json')
  const output = join(dir, 'index.html')
  writeFileSync(input, JSON.stringify(index), 'utf8')
  execFileSync(process.execPath, [script, '--input', input, '--output', output])
  return readFileSync(output, 'utf8')
}

describe('gen-market-site 静态目录页生成器', () => {
  it('生成单文件 HTML，含 doctype 与两个插件', () => {
    const html = generate(fakeIndex)
    expect(html).toMatch(/<!doctype html>/i)
    expect(html).toContain('worm-echarts')
    expect(html).toContain('worm-data-preview')
  })

  it('内嵌数据经过转义，不产生可执行 script 标签', () => {
    const evil: any = structuredClone(fakeIndex)
    evil.plugins[0].title = '<script>alert(1)</script>'
    const html = generate(evil)
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('\\u003cscript>')
  })

  it('包含筛选与搜索控件标记', () => {
    const html = generate(fakeIndex)
    expect(html).toContain('data-market-filter')
    expect(html).toContain('data-market-search')
  })
})
