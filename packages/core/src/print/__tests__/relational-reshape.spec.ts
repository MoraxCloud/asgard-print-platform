import { describe, it, expect } from 'vitest'
import { reshapeRelationalData } from '../relational-reshape.js'

describe('reshapeRelationalData 关系型数据整形', () => {
  it('基础：一主一从按关联键分组', () => {
    const r = reshapeRelationalData({
      main: { name: '病人信息', rows: [{ 病人ID: 'P1', 姓名: '张三' }, { 病人ID: 'P2', 姓名: '李四' }] },
      details: [
        { name: '申请单', rows: [
          { 病人ID: 'P1', 项目: '血常规' }, { 病人ID: 'P1', 项目: '生化' }, { 病人ID: 'P2', 项目: '心电图' },
        ], joinKey: '病人ID' },
      ],
    })
    expect(r).toHaveLength(2)
    expect(r[0]).toEqual({ 病人信息: { 病人ID: 'P1', 姓名: '张三' }, 申请单: [{ 病人ID: 'P1', 项目: '血常规' }, { 病人ID: 'P1', 项目: '生化' }] })
    expect(r[1]).toEqual({ 病人信息: { 病人ID: 'P2', 姓名: '李四' }, 申请单: [{ 病人ID: 'P2', 项目: '心电图' }] })
  })

  it('异构关联键：主表键与从表键不同', () => {
    const r = reshapeRelationalData({
      main: { name: '病人', rows: [{ 病人ID: 'P1', 姓名: '张三' }] },
      details: [
        { name: '检验', rows: [{ 患者编号: 'P1', 指标: '白细胞' }, { 患者编号: 'P2', 指标: '血糖' }], joinKey: '病人ID', detailKey: '患者编号' },
      ],
    })
    expect(r[0]!.检验).toEqual([{ 患者编号: 'P1', 指标: '白细胞' }])
  })

  it('多从表：四个从表各自独立挂载', () => {
    const r = reshapeRelationalData({
      main: { name: '主', rows: [{ id: 'A' }, { id: 'B' }] },
      details: [
        { name: 'd1', rows: [{ id: 'A', v: 1 }, { id: 'A', v: 2 }, { id: 'B', v: 3 }], joinKey: 'id' },
        { name: 'd2', rows: [{ id: 'A', v: 'x' }], joinKey: 'id' },
        { name: 'd3', rows: [], joinKey: 'id' },
        { name: 'd4', rows: [{ id: 'B', v: 9 }], joinKey: 'id' },
      ],
    })
    expect(r[0]).toEqual({ 主: { id: 'A' }, d1: [{ id: 'A', v: 1 }, { id: 'A', v: 2 }], d2: [{ id: 'A', v: 'x' }], d3: [], d4: [] })
    expect(r[1]).toEqual({ 主: { id: 'B' }, d1: [{ id: 'B', v: 3 }], d2: [], d3: [], d4: [{ id: 'B', v: 9 }] })
  })

  it('主表为空返回空数组', () => {
    const r = reshapeRelationalData({
      main: { name: '主', rows: [] },
      details: [{ name: 'd', rows: [{ id: 'A' }], joinKey: 'id' }],
    })
    expect(r).toEqual([])
  })

  it('从表无匹配值时该字段为空数组', () => {
    const r = reshapeRelationalData({
      main: { name: '主', rows: [{ id: 'A' }] },
      details: [{ name: 'd', rows: [{ id: 'Z' }], joinKey: 'id' }],
    })
    expect(r[0]!.d).toEqual([])
  })

  it('主表行缺关联键字段时从表为空数组', () => {
    const r = reshapeRelationalData({
      main: { name: '主', rows: [{ 姓名: '无ID' }] },
      details: [{ name: 'd', rows: [{ id: 'A' }], joinKey: 'id' }],
    })
    expect(r[0]!.d).toEqual([])
  })

  it('从表行缺关联键字段时不归入任何主表', () => {
    const r = reshapeRelationalData({
      main: { name: '主', rows: [{ id: 'A' }] },
      details: [{ name: 'd', rows: [{ v: 1 }, { id: 'A', v: 2 }], joinKey: 'id' }],
    })
    expect(r[0]!.d).toEqual([{ id: 'A', v: 2 }])
  })

  it('null/undefined 关联值不匹配任何主表', () => {
    const r = reshapeRelationalData({
      main: { name: '主', rows: [{ id: null }, { id: undefined }, { id: 'A' }] },
      details: [{ name: 'd', rows: [{ id: null, v: 1 }, { id: 'A', v: 2 }], joinKey: 'id' }],
    })
    expect(r[0]!.d).toEqual([])
    expect(r[1]!.d).toEqual([])
    expect(r[2]!.d).toEqual([{ id: 'A', v: 2 }])
  })

  it('纯函数：不修改原始输入数据', () => {
    const mainRows = [{ id: 'A', nested: { x: 1 } }]
    const detailRows = [{ id: 'A', v: 1 }]
    const r = reshapeRelationalData({
      main: { name: '主', rows: mainRows },
      details: [{ name: 'd', rows: detailRows, joinKey: 'id' }],
    })
    r[0]!.主.nested.x = 999
    r[0]!.d[0]!.v = 999
    expect(mainRows[0]!.nested.x).toBe(1)
    expect(detailRows[0]!.v).toBe(1)
  })

  it('从表与主表同名字段：从表字段放入独立命名空间，不覆盖主表', () => {
    const r = reshapeRelationalData({
      main: { name: '主', rows: [{ id: 'A', 姓名: '主表张三' }] },
      details: [{ name: 'd', rows: [{ id: 'A', 姓名: '从表张三' }], joinKey: 'id' }],
    })
    expect(r[0]!.主.姓名).toBe('主表张三')
    expect(r[0]!.d[0]!.姓名).toBe('从表张三')
  })

  it('严格值匹配：字符串与数字不强制转换', () => {
    const r = reshapeRelationalData({
      main: { name: '主', rows: [{ id: 1 }, { id: '1' }] },
      details: [{ name: 'd', rows: [{ id: 1, v: 'num' }, { id: '1', v: 'str' }], joinKey: 'id' }],
    })
    expect(r[0]!.d).toEqual([{ id: 1, v: 'num' }])
    expect(r[1]!.d).toEqual([{ id: '1', v: 'str' }])
  })

  it('重复主表行各自得到独立从表副本（不共享引用）', () => {
    const r = reshapeRelationalData({
      main: { name: '主', rows: [{ id: 'A' }, { id: 'A' }] },
      details: [{ name: 'd', rows: [{ id: 'A', v: 1 }], joinKey: 'id' }],
    })
    expect(r[0]!.d).toEqual(r[1]!.d)
    r[0]!.d[0]!.v = 999
    expect(r[1]!.d[0]!.v).toBe(1)
  })

  it('无 details 配置时每份只含主表', () => {
    const r = reshapeRelationalData({
      main: { name: '主', rows: [{ id: 'A' }] },
      details: [],
    })
    expect(r).toEqual([{ 主: { id: 'A' } }])
  })

  it('单份模式：主表 1 行输出 1 份', () => {
    const r = reshapeRelationalData({
      main: { name: '病人', rows: [{ 病人ID: 'P1', 姓名: '张三' }] },
      details: [{ name: '申请单', rows: [{ 病人ID: 'P1', 项目: '血常规' }], joinKey: '病人ID' }],
    })
    expect(r).toHaveLength(1)
  })
})
