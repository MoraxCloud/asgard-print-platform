import { describe, it, expect } from 'vitest'
import { OFFICIAL_SAMPLES } from '../src/print/official-samples'

describe('官方示例本地副本', () => {
  it('包含 5 个约定示例且映射正确', () => {
    expect(Object.keys(OFFICIAL_SAMPLES)).toEqual(
      ['express', 'label', 'receipt', 'invoice', 'healthReport'],
    )
    expect(OFFICIAL_SAMPLES.express.id).toBe('express-waybill')
    expect(OFFICIAL_SAMPLES.label.id).toBe('weight-label')
    expect(OFFICIAL_SAMPLES.receipt.id).toBe('thermal-receipt')
    expect(OFFICIAL_SAMPLES.invoice.id).toBe('payment-request')
    expect(OFFICIAL_SAMPLES.healthReport.id).toBe('health-report')
  })

  it('每个示例都含版式、字段和数据', () => {
    for (const sample of Object.values(OFFICIAL_SAMPLES)) {
      expect(sample.fields.length).toBeGreaterThan(0)
      expect(Object.keys(sample.data).length).toBeGreaterThan(0)
      expect(JSON.stringify(sample.template).length).toBeGreaterThan(100)
    }
  })

  it('体检报告为多页模板且含图表元素', () => {
    const template = OFFICIAL_SAMPLES.healthReport.template as { pages?: unknown[] }
    expect(template.pages?.length).toBeGreaterThan(0)
    expect(JSON.stringify(template)).toContain('barChart')
    expect(JSON.stringify(template)).toContain('lineChart')
  })
})
