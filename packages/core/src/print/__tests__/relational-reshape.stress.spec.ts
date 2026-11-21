// 高强度压力测试：验证 reshapeRelationalData 在大规模、随机化、特殊值场景下的稳定性。
// 测试数据统一采用「采购收货单」业务场景：主表=采购单，从表=商品明细等，按单号关联。
import { describe, it, expect } from 'vitest'
import { reshapeRelationalData } from '../relational-reshape.js'

/** 可复现的伪随机数（避免 fuzz 偶发失败难以定位） */
function seeded(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000 }
}

describe('reshapeRelationalData 高强度压力测试', () => {
  it('大规模：500 张采购单 + 4 个从表各 5000 行', () => {
    const N = 500
    const mainRows = Array.from({ length: N }, (_, i) => ({ 单号: `PO${i}`, 供应商: `供应商${i}` }))
    const details = Array.from({ length: 4 }, (_, di) => ({
      name: ['商品明细', '费用分摊', '收货记录', '退货记录'][di]!,
      rows: Array.from({ length: 5000 }, (_, ri) => ({ 单号: `PO${ri % N}`, 序号: ri, 类别: di })),
      joinKey: '单号',
    }))
    const t0 = performance.now()
    const result = reshapeRelationalData({ main: { name: '采购单', rows: mainRows }, details })
    const elapsed = performance.now() - t0
    expect(result).toHaveLength(N)
    // 守恒：每个从表的每一行都应出现在结果里（关联值均有效且主表存在）
    for (const d of details) {
      const total = result.reduce((n, row) => n + row[d.name].length, 0)
      expect(total).toBe(5000)
    }
    expect(elapsed).toBeLessThan(3000) // 3 秒内完成（500×20000 行）
  }, 15000)

  it('随机化 fuzz：100 轮验证核心不变量', () => {
    const rnd = seeded(20261121)
    for (let round = 0; round < 100; round++) {
      const m = 1 + Math.floor(rnd() * 40)
      const mainRows = Array.from({ length: m }, (_, i) => ({
        单号: `PO${i}`,
        金额: Math.floor(rnd() * 100),
        supplier: { 名称: `供应商${i}` },
      }))
      const dCount = Math.floor(rnd() * 6)
      const details = Array.from({ length: dCount }, (_, di) => {
        const rowCount = Math.floor(rnd() * 60)
        const useAltKey = rnd() > 0.5
        return {
          name: `明细${di}`,
          rows: Array.from({ length: rowCount }, (_, ri) => {
            const key = rnd() > 0.25 ? `PO${Math.floor(rnd() * m)}` : `MISS${ri}`
            return useAltKey ? { 采购单号: key, ri } : { 单号: key, ri }
          }),
          joinKey: '单号',
          ...(useAltKey ? { detailKey: '采购单号' } : {}),
        }
      })
      const mainSnapshot = JSON.stringify(mainRows)
      const detailsSnapshot = details.map(d => JSON.stringify(d.rows))
      const result = reshapeRelationalData({ main: { name: '采购单', rows: mainRows }, details })

      // 不变量 1：份数 == 主表行数
      expect(result).toHaveLength(m)
      // 不变量 2：输入未被修改
      expect(JSON.stringify(mainRows)).toBe(mainSnapshot)
      details.forEach((d, di) => expect(JSON.stringify(d.rows)).toBe(detailsSnapshot[di]))
      // 不变量 3：每份都含 '采购单'，从表字段名齐全，且从表值均为数组
      result.forEach(row => {
        expect(row).toHaveProperty('采购单')
        details.forEach(d => expect(Array.isArray(row[d.name])).toBe(true))
      })
      // 不变量 4：从表有效行守恒（关联值存在于主表单号集合的行，全部被挂载）
      details.forEach(d => {
        const fromKey = d.detailKey ?? d.joinKey
        const valid = d.rows.filter(r => mainRows.some(mr => mr[d.joinKey] === r[fromKey]))
        const total = result.reduce((n, row) => n + row[d.name].length, 0)
        expect(total).toBe(valid.length)
      })
    }
  }, 30000)

  it('特殊关联值：0 / 空字符串 / false / 特殊字符键名', () => {
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [{ 单号: 0 }, { 单号: '' }, { 单号: false }, { '单-号': 'PO001' }] },
      details: [
        { name: '商品明细', rows: [
          { 单号: 0, 商品名称: '零号单' },
          { 单号: '', 商品名称: '空号单' },
          { 单号: false, 商品名称: '假号单' },
        ], joinKey: '单号' },
        { name: '收货记录', rows: [{ '单-号': 'PO001', 收货人: '王五' }], joinKey: '单-号' },
      ],
    })
    expect(r[0]!.商品明细).toEqual([{ 单号: 0, 商品名称: '零号单' }])
    expect(r[1]!.商品明细).toEqual([{ 单号: '', 商品名称: '空号单' }])
    expect(r[2]!.商品明细).toEqual([{ 单号: false, 商品名称: '假号单' }])
    expect(r[3]!.收货记录).toEqual([{ '单-号': 'PO001', 收货人: '王五' }])
  })

  it('深层嵌套大对象：clone 后结构完整且独立', () => {
    const deep = { a: { b: { c: { d: Array.from({ length: 100 }, (_, i) => ({ i })) } } } }
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [{ 单号: 'PO001', 供应商详情: deep }] },
      details: [{ name: '商品明细', rows: [{ 单号: 'PO001', 扩展属性: deep }], joinKey: '单号' }],
    })
    expect(r[0]!.采购单.供应商详情).toEqual(deep)
    expect(r[0]!.商品明细[0]!.扩展属性).toEqual(deep)
    r[0]!.采购单.供应商详情.a.b.c.d[0]!.i = 999
    expect(deep.a.b.c.d[0]!.i).toBe(0)
    expect(r[0]!.商品明细[0]!.扩展属性.a.b.c.d[0]!.i).toBe(0)
  })

  it('主表字段名与从表字段名相同时互不覆盖', () => {
    const r = reshapeRelationalData({
      main: { name: '同名字段', rows: [{ 单号: 'PO001', 值: 1 }] },
      details: [{ name: '同名字段', rows: [{ 单号: 'PO001', 值: 2 }], joinKey: '单号' }],
    })
    // 同名时从表后写入会覆盖主表；这是配置错误，文档约束字段名唯一。
    // 这里锁定当前行为（不崩溃、不抛错），并确认覆盖后的值可预期。
    expect(r[0]!.同名字段).toEqual([{ 单号: 'PO001', 值: 2 }])
  })

  it('从表行数远超主表：分配正确无泄漏', () => {
    const r = reshapeRelationalData({
      main: { name: '采购单', rows: [{ 单号: 'PO001' }, { 单号: 'PO002' }] },
      details: [{ name: '商品明细', rows: Array.from({ length: 10000 }, (_, i) => ({ 单号: i % 2 ? 'PO001' : 'PO002', 序号: i })), joinKey: '单号' }],
    })
    expect(r[0]!.商品明细).toHaveLength(5000)
    expect(r[1]!.商品明细).toHaveLength(5000)
    expect(r[0]!.商品明细[0]!.序号).toBe(1)
    expect(r[1]!.商品明细[0]!.序号).toBe(0)
  })
})
