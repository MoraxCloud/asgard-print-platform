import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { MarketIndex } from './types.js'

const here = dirname(fileURLToPath(import.meta.url))
const indexPath = resolve(here, '../../../marketplace/marketplace.json')
const index = JSON.parse(readFileSync(indexPath, 'utf8')) as MarketIndex

describe('marketplace.json 权威索引数据', () => {
  it('每条插件都有 worm- 前缀的唯一标识', () => {
    for (const plugin of index.plugins) {
      expect(plugin.uniqueId).toMatch(/^worm-/)
    }
  })

  it('每条插件的类型为 element 或 functional', () => {
    for (const plugin of index.plugins) {
      expect(['element', 'functional']).toContain(plugin.type)
    }
  })

  it('每条插件的标题都含基准语言 zh-CN', () => {
    for (const plugin of index.plugins) {
      expect(typeof plugin.title === 'string' ? plugin.title : plugin.title?.['zh-CN']).toBeTruthy()
    }
  })

  it('存量 id 保持不变', () => {
    expect(index.plugins.map(p => p.id)).toEqual(['echarts', 'data-preview'])
  })
})
