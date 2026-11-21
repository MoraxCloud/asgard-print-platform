import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { discover } from '../discover.js'

function writeJson(path: string, value: unknown) {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, JSON.stringify(value))
}

it('优先读统一目录，再补 node_modules，同 id 统一目录优先', () => {
  const root = mkdtempSync(join(tmpdir(), 'wpi18n-'))
  writeJson(join(root, '.worm-print/i18n/echarts/zh-CN.json'), { echarts: { 'echarts.a': '统一目录' } })
  writeJson(join(root, 'node_modules/@worm-print-platform/core/package.json'), {
    name: '@worm-print-platform/core',
    wormPrint: { id: 'core', i18n: { dir: 'dist/i18n', base: 'zh-CN' } },
  })
  writeJson(join(root, 'node_modules/@worm-print-platform/core/dist/i18n/zh-CN.json'), { core: { 'toolbar.save': '保存' } })
  const pkgs = discover(root)
  expect(pkgs.map(p => p.id).sort()).toEqual(['core', 'echarts'])
  expect(pkgs.find(p => p.id === 'echarts')!.locales.get('zh-CN')!.echarts['echarts.a']).toBe('统一目录')
  expect(pkgs.find(p => p.id === 'core')!.locales.get('zh-CN')!.core['toolbar.save']).toBe('保存')
})

it('旧安装的插件清单无 i18n 字段时提示重装，不阻断发现', () => {
  const root = mkdtempSync(join(tmpdir(), 'wpi18n-stale-'))
  writeJson(join(root, '.worm-print/plugins.json'), {
    schemaVersion: 1,
    plugins: { old: { version: '1.0.0' } },
  })
  writeJson(join(root, '.worm-print/i18n/good/zh-CN.json'), { good: { 'good.a': '甲' } })
  const warnings: string[] = []
  const pkgs = discover(root, msg => warnings.push(msg))
  expect(pkgs.map(p => p.id)).toEqual(['good'])
  expect(warnings.some(w => w.includes('old') && w.includes('重新安装'))).toBe(true)
})
