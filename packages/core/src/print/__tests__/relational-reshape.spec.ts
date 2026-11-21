// 测试数据统一采用「采购收货单」业务场景：主表=采购单，从表=商品明细，按单号关联。
import { describe, it, expect } from 'vitest'
import { reshapeRelationalData } from '../relational-reshape.js'

describe('reshapeRelationalData 关系型数据整形', () => {
  it('基础：一主一从按单号分组', () => {
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [
        { 单号: 'PO001', 供应商: '鑫达五金', 日期: '2026-08-01' },
        { 单号: 'PO002', 供应商: '恒泰机电', 日期: '2026-08-02' },
      ] },
      details: [
        { name: '商品明细', rows: [
          { 单号: 'PO001', 商品名称: '碳钢螺丝', 数量: 100, 金额: 50 },
          { 单号: 'PO001', 商品名称: '不锈钢螺母', 数量: 117, 金额: 87.75 },
          { 单号: 'PO002', 商品名称: '六角螺栓', 数量: 151, 金额: 188.75 },
        ], joinKey: '单号' },
      ],
    })
    expect(r).toHaveLength(2)
    expect(r[0]).toEqual({
      采购单: { 单号: 'PO001', 供应商: '鑫达五金', 日期: '2026-08-01' },
      商品明细: [
        { 单号: 'PO001', 商品名称: '碳钢螺丝', 数量: 100, 金额: 50 },
        { 单号: 'PO001', 商品名称: '不锈钢螺母', 数量: 117, 金额: 87.75 },
      ],
    })
    expect(r[1]).toEqual({
      采购单: { 单号: 'PO002', 供应商: '恒泰机电', 日期: '2026-08-02' },
      商品明细: [{ 单号: 'PO002', 商品名称: '六角螺栓', 数量: 151, 金额: 188.75 }],
    })
  })

  it('异构关联键：主表单号与从表采购单号不同', () => {
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [{ 单号: 'PO001', 供应商: '鑫达五金' }] },
      details: [
        { name: '商品明细', rows: [
          { 采购单号: 'PO001', 商品名称: '碳钢螺丝', 数量: 100 },
          { 采购单号: 'PO002', 商品名称: '六角螺栓', 数量: 151 },
        ], joinKey: '单号', detailKey: '采购单号' },
      ],
    })
    expect(r[0]!.商品明细).toEqual([{ 采购单号: 'PO001', 商品名称: '碳钢螺丝', 数量: 100 }])
  })

  it('多从表：商品明细、费用分摊、收货记录各自独立挂载', () => {
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [{ 单号: 'PO001' }, { 单号: 'PO002' }] },
      details: [
        { name: '商品明细', rows: [
          { 单号: 'PO001', 商品名称: '碳钢螺丝', 数量: 100 },
          { 单号: 'PO001', 商品名称: '不锈钢螺母', 数量: 117 },
          { 单号: 'PO002', 商品名称: '六角螺栓', 数量: 151 },
        ], joinKey: '单号' },
        { name: '费用分摊', rows: [{ 单号: 'PO001', 费用项: '运费', 金额: 30 }], joinKey: '单号' },
        { name: '退货记录', rows: [], joinKey: '单号' },
        { name: '收货记录', rows: [{ 单号: 'PO002', 收货人: '王五', 数量: 151 }], joinKey: '单号' },
      ],
    })
    expect(r[0]).toEqual({
      采购单: { 单号: 'PO001' },
      商品明细: [
        { 单号: 'PO001', 商品名称: '碳钢螺丝', 数量: 100 },
        { 单号: 'PO001', 商品名称: '不锈钢螺母', 数量: 117 },
      ],
      费用分摊: [{ 单号: 'PO001', 费用项: '运费', 金额: 30 }],
      退货记录: [],
      收货记录: [],
    })
    expect(r[1]).toEqual({
      采购单: { 单号: 'PO002' },
      商品明细: [{ 单号: 'PO002', 商品名称: '六角螺栓', 数量: 151 }],
      费用分摊: [],
      退货记录: [],
      收货记录: [{ 单号: 'PO002', 收货人: '王五', 数量: 151 }],
    })
  })

  it('主表为空返回空数组', () => {
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [] },
      details: [{ name: '商品明细', rows: [{ 单号: 'PO001', 商品名称: '碳钢螺丝' }], joinKey: '单号' }],
    })
    expect(r).toEqual([])
  })

  it('从表无匹配单号时该字段为空数组', () => {
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [{ 单号: 'PO001' }] },
      details: [{ name: '商品明细', rows: [{ 单号: 'PO999', 商品名称: '无主单商品' }], joinKey: '单号' }],
    })
    expect(r[0]!.商品明细).toEqual([])
  })

  it('主表行缺单号字段时从表为空数组', () => {
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [{ 供应商: '无单号' }] },
      details: [{ name: '商品明细', rows: [{ 单号: 'PO001', 商品名称: '碳钢螺丝' }], joinKey: '单号' }],
    })
    expect(r[0]!.商品明细).toEqual([])
  })

  it('从表行缺单号字段时不归入任何采购单', () => {
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [{ 单号: 'PO001' }] },
      details: [{ name: '商品明细', rows: [
        { 商品名称: '无单号商品', 数量: 5 },
        { 单号: 'PO001', 商品名称: '碳钢螺丝', 数量: 100 },
      ], joinKey: '单号' }],
    })
    expect(r[0]!.商品明细).toEqual([{ 单号: 'PO001', 商品名称: '碳钢螺丝', 数量: 100 }])
  })

  it('null/undefined 关联值不匹配任何采购单', () => {
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [{ 单号: null }, { 单号: undefined }, { 单号: 'PO001' }] },
      details: [{ name: '商品明细', rows: [
        { 单号: null, 商品名称: '空单号商品' },
        { 单号: 'PO001', 商品名称: '碳钢螺丝' },
      ], joinKey: '单号' }],
    })
    expect(r[0]!.商品明细).toEqual([])
    expect(r[1]!.商品明细).toEqual([])
    expect(r[2]!.商品明细).toEqual([{ 单号: 'PO001', 商品名称: '碳钢螺丝' }])
  })

  it('纯函数：不修改原始输入数据', () => {
    const mainRows = [{ 单号: 'PO001', 供应商: { 名称: '鑫达五金', 评级: 'A' } }]
    const detailRows = [{ 单号: 'PO001', 商品名称: '碳钢螺丝', 金额: 50 }]
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: mainRows },
      details: [{ name: '商品明细', rows: detailRows, joinKey: '单号' }],
    })
    r[0]!.采购单.供应商.评级 = 'D'
    r[0]!.商品明细[0]!.金额 = 999
    expect(mainRows[0]!.供应商.评级).toBe('A')
    expect(detailRows[0]!.金额).toBe(50)
  })

  it('从表与主表同名字段：从表字段放入独立命名空间，不覆盖主表', () => {
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [{ 单号: 'PO001', 供应商: '主表供应商' }] },
      details: [{ name: '商品明细', rows: [{ 单号: 'PO001', 供应商: '从表供应商' }], joinKey: '单号' }],
    })
    expect(r[0]!.采购单.供应商).toBe('主表供应商')
    expect(r[0]!.商品明细[0]!.供应商).toBe('从表供应商')
  })

  it('严格值匹配：字符串与数字不强制转换', () => {
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [{ 单号: 1 }, { 单号: '1' }] },
      details: [{ name: '商品明细', rows: [
        { 单号: 1, 商品名称: '数字单号商品' },
        { 单号: '1', 商品名称: '字符串单号商品' },
      ], joinKey: '单号' }],
    })
    expect(r[0]!.商品明细).toEqual([{ 单号: 1, 商品名称: '数字单号商品' }])
    expect(r[1]!.商品明细).toEqual([{ 单号: '1', 商品名称: '字符串单号商品' }])
  })

  it('重复采购单行各自得到独立明细副本（不共享引用）', () => {
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [{ 单号: 'PO001' }, { 单号: 'PO001' }] },
      details: [{ name: '商品明细', rows: [{ 单号: 'PO001', 商品名称: '碳钢螺丝', 金额: 50 }], joinKey: '单号' }],
    })
    expect(r[0]!.商品明细).toEqual(r[1]!.商品明细)
    r[0]!.商品明细[0]!.金额 = 999
    expect(r[1]!.商品明细[0]!.金额).toBe(50)
  })

  it('无 details 配置时每份只含采购单', () => {
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [{ 单号: 'PO001', 供应商: '鑫达五金' }] },
      details: [],
    })
    expect(r).toEqual([{ 采购单: { 单号: 'PO001', 供应商: '鑫达五金' } }])
  })

  it('单份模式：主表 1 行输出 1 份', () => {
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [{ 单号: 'PO001', 供应商: '鑫达五金' }] },
      details: [{ name: '商品明细', rows: [{ 单号: 'PO001', 商品名称: '碳钢螺丝', 数量: 100 }], joinKey: '单号' }],
    })
    expect(r).toHaveLength(1)
  })
})
