import { describe, it, expect } from 'vitest'
import { HEALTH_REPORTS } from '../src/print/health-reports'
import { OFFICIAL_SAMPLES } from '../src/print/official-samples'

describe('体检报告模拟数据', () => {
  it('恰好 3 份，姓名与编号各不相同', () => {
    expect(HEALTH_REPORTS).toHaveLength(3)
    const names = HEALTH_REPORTS.map(r => (r.report as Record<string, unknown>).name)
    const nos = HEALTH_REPORTS.map(r => (r.report as Record<string, unknown>).no)
    expect(new Set(names).size).toBe(3)
    expect(new Set(nos).size).toBe(3)
  })

  it('姓名、性别与套餐相互匹配', () => {
    const reports = HEALTH_REPORTS.map(r => r.report as Record<string, unknown>)
    expect(reports.map(r => r.sex)).toEqual(['男', '女', '男'])
    expect(String(reports[1].package)).toContain('女')
    expect(String(reports[0].package)).toContain('男')
  })

  it('每份都保留官方示例的全部顶层字段', () => {
    const officialKeys = Object.keys(OFFICIAL_SAMPLES.healthReport.data).sort()
    for (const report of HEALTH_REPORTS) {
      expect(Object.keys(report).sort()).toEqual(officialKeys)
    }
  })
})
