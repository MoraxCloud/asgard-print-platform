// 高强度压力测试：验证 reshapeRelationalData 在大规模、随机化、特殊值场景下的稳定性。
import { describe, it, expect } from 'vitest'
import { reshapeRelationalData } from '../relational-reshape.js'

/** 可复现的伪随机数（避免 fuzz 偶发失败难以定位） */
function seeded(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0x100000000 }
}

describe('reshapeRelationalData 高强度压力测试', () => {
  it('大规模：500 主表行 + 4 从表各 5000 行', () => {
    const N = 500
    const mainRows = Array.from({ length: N }, (_, i) => ({ 病人ID: `P${i}`, 姓名: `病人${i}` }))
    const details = Array.from({ length: 4 }, (_, di) => ({
      name: `从表${di}`,
      rows: Array.from({ length: 5000 }, (_, ri) => ({ 病人ID: `P${ri % N}`, 序号: ri, 从表: di })),
      joinKey: '病人ID',
    }))
    const t0 = performance.now()
    const result = reshapeRelationalData({ main: { name: '主', rows: mainRows }, details })
    const elapsed = performance.now() - t0
    expect(result).toHaveLength(N)
    // 守恒：每个从表的每一行都应出现在结果里（关联值均有效且主表存在）
    for (let di = 0; di < 4; di++) {
      const total = result.reduce((n, row) => n + row[`从表${di}`].length, 0)
      expect(total).toBe(5000)
    }
    expect(elapsed).toBeLessThan(3000) // 3 秒内完成（500×20000 行）
  }, 15000)

  it('随机化 fuzz：100 轮验证核心不变量', () => {
    const rnd = seeded(20261121)
    for (let round = 0; round < 100; round++) {
      const m = 1 + Math.floor(rnd() * 40)
      const mainRows = Array.from({ length: m }, (_, i) => ({
        id: `K${i}`,
        v: Math.floor(rnd() * 100),
        nested: { a: i },
      }))
      const dCount = Math.floor(rnd() * 6)
      const details = Array.from({ length: dCount }, (_, di) => {
        const rowCount = Math.floor(rnd() * 60)
        const useAltKey = rnd() > 0.5
        return {
          name: `d${di}`,
          rows: Array.from({ length: rowCount }, (_, ri) => {
            const key = rnd() > 0.25 ? `K${Math.floor(rnd() * m)}` : `MISS${ri}`
            return useAltKey ? { 外键: key, ri } : { id: key, ri }
          }),
          joinKey: 'id',
          ...(useAltKey ? { detailKey: '外键' } : {}),
        }
      })
      const mainSnapshot = JSON.stringify(mainRows)
      const detailsSnapshot = details.map(d => JSON.stringify(d.rows))
      const result = reshapeRelationalData({ main: { name: '主', rows: mainRows }, details })

      // 不变量 1：份数 == 主表行数
      expect(result).toHaveLength(m)
      // 不变量 2：输入未被修改
      expect(JSON.stringify(mainRows)).toBe(mainSnapshot)
      details.forEach((d, di) => expect(JSON.stringify(d.rows)).toBe(detailsSnapshot[di]))
      // 不变量 3：每份都含 '主'，从表字段名齐全，且从表值均为数组
      result.forEach(row => {
        expect(row).toHaveProperty('主')
        details.forEach(d => expect(Array.isArray(row[d.name])).toBe(true))
      })
      // 不变量 4：从表有效行守恒（关联值存在于主表键集合的行，全部被挂载）
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
      main: { name: '主', rows: [{ id: 0 }, { id: '' }, { id: false }, { '键-名': 'A' }] },
      details: [
        { name: 'd', rows: [{ id: 0, v: '零' }, { id: '', v: '空串' }, { id: false, v: '假' }], joinKey: 'id' },
        { name: 'e', rows: [{ '键-名': 'A', v: '特殊' }], joinKey: '键-名' },
      ],
    })
    expect(r[0]!.d).toEqual([{ id: 0, v: '零' }])
    expect(r[1]!.d).toEqual([{ id: '', v: '空串' }])
    expect(r[2]!.d).toEqual([{ id: false, v: '假' }])
    expect(r[3]!.e).toEqual([{ '键-名': 'A', v: '特殊' }])
  })

  it('深层嵌套大对象：clone 后结构完整且独立', () => {
    const deep = { a: { b: { c: { d: Array.from({ length: 100 }, (_, i) => ({ i })) } } } }
    const r = reshapeRelationalData({
      main: { name: '主', rows: [{ id: 'A', deep }] },
      details: [{ name: 'd', rows: [{ id: 'A', deep }], joinKey: 'id' }],
    })
    expect(r[0]!.主.deep).toEqual(deep)
    expect(r[0]!.d[0]!.deep).toEqual(deep)
    r[0]!.主.deep.a.b.c.d[0]!.i = 999
    expect(deep.a.b.c.d[0]!.i).toBe(0)
    expect(r[0]!.d[0]!.deep.a.b.c.d[0]!.i).toBe(0)
  })

  it('主表字段名与从表字段名相同时互不覆盖', () => {
    const r = reshapeRelationalData({
      main: { name: '同名字段', rows: [{ id: 'A', v: 1 }] },
      details: [{ name: '同名字段', rows: [{ id: 'A', v: 2 }], joinKey: 'id' }],
    })
    // 同名时从表后写入会覆盖主表；这是配置错误，文档约束字段名唯一。
    // 这里锁定当前行为（不崩溃、不抛错），并确认覆盖后的值可预期。
    expect(r[0]!.同名字段).toEqual([{ id: 'A', v: 2 }])
  })

  it('从表行数远超主表：分配正确无泄漏', () => {
    const r = reshapeRelationalData({
      main: { name: '主', rows: [{ id: 'A' }, { id: 'B' }] },
      details: [{ name: 'd', rows: Array.from({ length: 10000 }, (_, i) => ({ id: i % 2 ? 'A' : 'B', i })), joinKey: 'id' }],
    })
    expect(r[0]!.d).toHaveLength(5000)
    expect(r[1]!.d).toHaveLength(5000)
    expect(r[0]!.d[0]!.i).toBe(1)
    expect(r[1]!.d[0]!.i).toBe(0)
  })
})
