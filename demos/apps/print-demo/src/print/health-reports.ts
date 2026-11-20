import { OFFICIAL_SAMPLES } from './official-samples'

type ReportData = Record<string, unknown>

const OVERRIDES = [
  {
    name: '张明远', no: 'TJ2026111500286', date: '2026-11-15', examDate: '2026-11-12',
    sex: '男', age: '42 岁', package: '精英综合套餐（男）',
  },
  {
    name: '李慧', no: 'TJ2026111500287', date: '2026-11-16', examDate: '2026-11-13',
    sex: '女', age: '38 岁', package: '精英综合套餐（女）',
  },
  {
    name: '王建国', no: 'TJ2026111500288', date: '2026-11-17', examDate: '2026-11-14',
    sex: '男', age: '55 岁', package: '精英综合套餐（男）',
  },
]

function createReport(overrides: (typeof OVERRIDES)[number]): ReportData {
  const data = JSON.parse(JSON.stringify(OFFICIAL_SAMPLES.healthReport.data)) as ReportData
  const report = data.report as ReportData
  Object.assign(report, overrides)
  return data
}

/** 3 份体检报告模拟数据，字段树与官方 health-report 示例一致 */
export const HEALTH_REPORTS: ReportData[] = OVERRIDES.map(createReport)
