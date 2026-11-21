import { expect, it } from 'vitest'
import { buildTemplate } from '../template.js'

it('按 core → constants → propertyTips → 插件排序', () => {
  const keys = Object.keys(buildTemplate([
    { id: 'echarts', base: 'zh-CN', origin: 'x', locales: new Map([['zh-CN', { echarts: { 'echarts.z': 'z' } }]]) },
    { id: 'core', base: 'zh-CN', origin: 'x', locales: new Map([['zh-CN', {
      core: { 'toolbar.save': '保存' }, constants: { 'constants.b': 'b' }, propertyTips: { 'propertyTips.a': 'a' },
    }]]) },
  ]))
  expect(keys).toEqual(['toolbar.save', 'constants.b', 'propertyTips.a', 'echarts.z'])
})
