import { describe, it, expect, beforeEach } from 'vitest'
import { templateStore, STORAGE_KEY } from '../src/mocks/store'

describe('模板仓储', () => {
  beforeEach(() => templateStore.reset())

  it('使用版本化存储键，使旧空模板数据自动失效', () => {
    expect(STORAGE_KEY).toBe('print-demo:templates:v3')
  })

  it('种子覆盖 5 种类型且每类至少 1 条模板', () => {
    for (const option of templateStore.listTypes()) {
      const page = templateStore.list({ businessType: option.value, size: 100 })
      expect(page.records.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('save/update 写入的 elements 是 JSON 字符串', () => {
    const id = templateStore.save({ name: '新模板', businessType: 'label', elements: JSON.stringify({ pages: [] }) })
    expect(typeof templateStore.getById(id)?.elements).toBe('string')
    templateStore.update({ id, name: '改名', elements: '{"pages":[]}' })
    expect(templateStore.getById(id)?.name).toBe('改名')
  })

  it('remove 逻辑删除后 getById 返回 undefined', () => {
    const id = templateStore.list({ size: 1 }).records[0].id
    templateStore.remove(id)
    expect(templateStore.getById(id)).toBeUndefined()
  })

  it('删除默认模板后把同类型另一条提升为默认', () => {
    const type = 'express'
    const all = templateStore.list({ businessType: type, size: 100 }).records
    const seedDefault = templateStore.getDefault(type)
    expect(seedDefault).toBeDefined()
    if (all.length < 2) {
      templateStore.save({ name: '备用', businessType: type, elements: '{}' })
    }
    templateStore.remove(seedDefault!.id)
    const next = templateStore.getDefault(type)
    expect(next).toBeDefined()
    expect(next?.id).not.toBe(seedDefault!.id)
  })

  it('setDefault 切换默认且 list 支持名称模糊筛选', () => {
    const list = templateStore.list({ businessType: 'receipt', size: 100 }).records
    templateStore.setDefault('receipt', list[1].id)
    expect(templateStore.getDefault('receipt')?.id).toBe(list[1].id)
    expect(templateStore.list({ name: list[0].name.slice(0, 2) }).records.length).toBeGreaterThanOrEqual(1)
  })
})
