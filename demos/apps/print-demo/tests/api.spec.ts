import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '../src/mocks/handlers'
import { pageTemplate, listTypes, renderData, saveTemplate } from '../src/api/modules/print'

const server = setupServer(...handlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

describe('同形 API', () => {
  it('分页查询返回 PageResult 契约', async () => {
    const res = await pageTemplate({ current: 1, size: 10 })
    expect(res.ret).toBe(true)
    expect(Array.isArray(res.data.records)).toBe(true)
    expect(typeof res.data.totalRow).toBe('number')
  })

  it('类型字典返回 5 项', async () => {
    expect((await listTypes()).data).toHaveLength(5)
  })

  it('保存返回新 id', async () => {
    expect((await saveTemplate({ name: 'T', businessType: 'label', elements: '{}' })).data).toBeTruthy()
  })

  it('渲染数据返回已解析的 templateJson 对象', async () => {
    const list = await pageTemplate({ businessType: 'healthReport', size: 10 })
    const res = await renderData({ templateId: list.data.records[0].id, businessType: 'healthReport' })
    expect(typeof res.data.templateJson).toBe('object')
    expect(Array.isArray(res.data.printData)).toBe(true)
  })
})
