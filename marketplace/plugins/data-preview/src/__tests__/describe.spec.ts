import { describe, it, expect } from 'vitest'
import type { PrintBusinessField } from '@worm-print-platform/core/designer'
import type { FieldGroupInfo } from '@worm-print-platform/plugin-kit'
import { describeDataSource } from '../describe'

const group: FieldGroupInfo = { key: '系统信息', label: '系统信息', isList: false }
const listGroup: FieldGroupInfo = { key: '费用明细', label: '费用明细', isList: true }

const fields: PrintBusinessField[] = [
  { fieldKey: '系统信息', fieldLabel: '系统信息', fieldType: 'string', sortOrder: 1 },
  { fieldKey: '系统信息.机构编号', fieldLabel: '机构编号', fieldType: 'string', sortOrder: 2 },
  { fieldKey: '系统信息.患者', fieldLabel: '患者对象', fieldType: 'string', sortOrder: 3 },
  { fieldKey: '系统信息.费用', fieldLabel: '费用数组', fieldType: 'list', sortOrder: 4 },
  { fieldKey: '费用明细', fieldLabel: '费用明细', fieldType: 'list', sortOrder: 5 },
  { fieldKey: '费用明细.名称', fieldLabel: '项目名称', fieldType: 'string', sortOrder: 6 },
  { fieldKey: '费用明细.金额', fieldLabel: '金额', fieldType: 'number', sortOrder: 7 },
  { fieldKey: '费用明细.明细', fieldLabel: '子明细', fieldType: 'list', sortOrder: 8 },
]

describe('describeDataSource 对象根', () => {
  const root = { 机构编号: 'H1', 患者: { 姓名: '张三' }, 费用: [{ 金额: 2 }, { 金额: 3 }] }

  it('总览行用字段中文名，对象/数组行标记 hasTab', () => {
    const d = describeDataSource(root, fields, group)
    expect(d.rootKind).toBe('object')
    expect(d.overview.map(r => r.label)).toEqual(['机构编号', '患者对象', '费用数组'])
    expect(d.overview[0].hasTab).toBe(false)
    expect(d.overview[1].hasTab).toBe(true)
    expect(d.overview[2].hasTab).toBe(true)
    expect(d.overview[1].summary).toBe('1 个字段')
    expect(d.overview[2].summary).toBe('2 条')
  })

  it('按 sortOrder 排序生成子 tab', () => {
    const d = describeDataSource(root, fields, group)
    expect(d.tabs.map(t => t.key)).toEqual(['患者', '费用'])
    expect(d.tabs[0].label).toBe('患者对象')
    expect(d.tabs[0].kind).toBe('object')
    expect(d.tabs[0].formRows).toEqual([{ key: '姓名', label: '姓名', value: '张三' }])
    expect(d.tabs[1].kind).toBe('array')
    expect(d.tabs[1].rows).toEqual([['2'], ['3']])
  })

  it('无 fields 时以 JSON 键推断标签与顺序', () => {
    const d = describeDataSource(root, [], group)
    expect(d.overview.map(r => r.label)).toEqual(['机构编号', '患者', '费用'])
    expect(d.tabs.map(t => t.key)).toEqual(['患者', '费用'])
  })
})

describe('describeDataSource 数组根', () => {
  const root = [
    { 名称: 'A', 金额: 2, 明细: [{ 项: 'x' }] },
    { 名称: 'B', 金额: 3, 明细: [{ 项: 'y' }] },
  ]

  it('总览即表格，列取字段中文名，行按列取值', () => {
    const d = describeDataSource(root, fields, listGroup)
    expect(d.rootKind).toBe('array')
    expect(d.table?.columns.map(c => c.label)).toEqual(['项目名称', '金额', '子明细'])
    expect(d.table?.rows).toEqual([['A', '2', '[{"项":"x"}]'], ['B', '3', '[{"项":"y"}]']])
  })

  it('元素内的数组列生成子 tab', () => {
    const d = describeDataSource(root, fields, listGroup)
    expect(d.tabs.map(t => t.key)).toEqual(['明细'])
    expect(d.tabs[0].kind).toBe('array')
    expect(d.tabs[0].rows).toEqual([['x'], ['y']])
  })

  it('第一版不分页：全部行一次给出', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ 名称: `N${i}`, 金额: i }))
    const d = describeDataSource(many, fields, listGroup)
    expect(d.table?.rows).toHaveLength(20)
  })
})

describe('describeDataSource 标量根与空值', () => {
  it('标量根产出单行', () => {
    const d = describeDataSource('H20190101', fields, group)
    expect(d.rootKind).toBe('scalar')
    expect(d.scalar).toEqual({ key: '系统信息', label: '系统信息', value: 'H20190101' })
  })

  it('空根产出空总览不抛错', () => {
    const d = describeDataSource(undefined, fields, group)
    expect(d.rootKind).toBe('scalar')
    expect(d.overview).toEqual([])
    expect(d.scalar).toEqual({ key: '系统信息', label: '系统信息', value: '—' })
  })
})
