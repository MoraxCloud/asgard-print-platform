import { describe, it, expect } from 'vitest'
import { TEMPLATE_TYPE_OPTIONS, TEMPLATE_TYPE_PROFILES } from '../src/print/registry'
import { OFFICIAL_SAMPLES } from '../src/print/official-samples'

describe('模板类型注册表', () => {
  it('恰好 5 个通用类型，不含业务域值', () => {
    expect(TEMPLATE_TYPE_OPTIONS.map(o => o.value)).toEqual(
      ['express', 'label', 'receipt', 'invoice', 'healthReport'],
    )
    expect(TEMPLATE_TYPE_OPTIONS.some(o => /dispatch|waybill|orderInfo|tms|wms/.test(o.value))).toBe(false)
  })

  it('字段与示例数据直接来自官方示例', () => {
    for (const profile of Object.values(TEMPLATE_TYPE_PROFILES)) {
      const official = OFFICIAL_SAMPLES[profile.value]
      expect(profile.fields).toEqual(official.fields)
      expect(profile.sampleData).toEqual(official.data)
    }
  })

  it('初始模板来自官方示例，单页/多页均非空', () => {
    for (const profile of Object.values(TEMPLATE_TYPE_PROFILES)) {
      const template = profile.createTemplate() as { elements?: unknown[]; pages?: unknown[] }
      expect(template.pages?.length ?? template.elements?.length ?? 0).toBeGreaterThan(0)
      expect(JSON.stringify(template)).toBe(JSON.stringify(OFFICIAL_SAMPLES[profile.value].template))
    }
  })

  it('createTemplate 返回深拷贝，实例之间互不影响', () => {
    const first = TEMPLATE_TYPE_PROFILES.express.createTemplate() as { elements: Array<{ options: { left: number } }> }
    const second = TEMPLATE_TYPE_PROFILES.express.createTemplate() as typeof first
    expect(first).not.toBe(second)
    const originalLeft = first.elements[0].options.left
    first.elements[0].options.left = 999
    expect(second.elements[0].options.left).toBe(originalLeft)
  })

  it('官方字段中有 list 的类型，其示例数据存在同名数组', () => {
    for (const profile of Object.values(TEMPLATE_TYPE_PROFILES)) {
      for (const listField of profile.fields.filter(f => f.fieldType === 'list')) {
        expect(Array.isArray(profile.sampleData[listField.fieldKey])).toBe(true)
      }
    }
  })

  it('体检报告模板含 echarts 图表元素', () => {
    const json = JSON.stringify(TEMPLATE_TYPE_PROFILES.healthReport.createTemplate())
    expect(json).toContain('barChart')
    expect(json).toContain('lineChart')
  })

  it('只有体检报告使用图表元素', () => {
    for (const [type, profile] of Object.entries(TEMPLATE_TYPE_PROFILES)) {
      const json = JSON.stringify(profile.createTemplate())
      const hasChart = json.includes('barChart') || json.includes('lineChart')
      expect(hasChart).toBe(type === 'healthReport')
    }
  })

  it('表格版式的 dataSource 指向示例数据中的数组字段', () => {
    for (const profile of Object.values(TEMPLATE_TYPE_PROFILES)) {
      const json = JSON.stringify(profile.createTemplate())
      const matches = json.match(/"dataSource":"([^"]+)"/g) ?? []
      for (const item of matches) {
        const key = item.replace(/"dataSource":"/, '').replace(/"$/, '')
        if (!Array.isArray(profile.sampleData[key])) {
          expect.fail(`${profile.value} 的 dataSource ${key} 在示例数据中不是数组`)
        }
      }
    }
  })
})
