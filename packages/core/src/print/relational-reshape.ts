// 关系型数据整形：把「主表 + 多个从表（外键关联）」转换为打印契约所需的
// 文档型数据（对象数组，每个元素 = 一份），供 normalizePrintData / bindData 直接消费。
//
// 设计要点：
// - 纯函数：输入不被修改，输出各份之间、从表行与主表行之间不共享引用（深拷贝）。
// - 严格键值匹配：Map 以原始值作键，字符串 '1' 与数字 1 不混用。
// - null / undefined 关联值不参与匹配（既不作为分组键，也不匹配任何主表行）。
// - 从表数量任意：逻辑遍历 details 数组，与主/从表字段数无关。

export interface RelationalMain {
  /** 该主表字段在每份输出里挂载的字段名（如 '病人信息'） */
  name: string
  /** 主表行（每行 = 一份） */
  rows: Record<string, any>[]
}

export interface RelationalDetail {
  /** 该从表字段在每份输出里挂载的字段名（如 '申请单信息'） */
  name: string
  /** 从表行 */
  rows: Record<string, any>[]
  /** 主表上的关联键（如 '病人ID'） */
  joinKey: string
  /** 从表上的关联键；缺省与 joinKey 相同（主表键≠从表键时用，如 '患者编号'） */
  detailKey?: string
}

export interface RelationalReshapeInput {
  main: RelationalMain
  details: readonly RelationalDetail[]
}

/** 深拷贝：优先 structuredClone，环境不支持时回落 JSON（模板数据均为可序列化纯 JSON） */
function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}

/** 关联值是否有效：null / undefined 不参与匹配 */
function validKey(v: unknown): boolean {
  return v !== null && v !== undefined
}

export function reshapeRelationalData(input: RelationalReshapeInput): Record<string, any>[] {
  const { main, details } = input
  const mainRows = Array.isArray(main.rows) ? main.rows : []
  if (mainRows.length === 0) return []

  // 预分组：每个从表按「从表关联键」聚合，Map 以原始值作键（严格匹配）
  const groups = details.map(d => {
    const fromKey = d.detailKey ?? d.joinKey
    const map = new Map<unknown, Record<string, any>[]>()
    for (const row of d.rows ?? []) {
      const fk = row?.[fromKey]
      if (!validKey(fk)) continue // 从表行缺关联键：不归入任何组
      const bucket = map.get(fk)
      if (bucket) bucket.push(clone(row))
      else map.set(fk, [clone(row)])
    }
    return { detail: d, map }
  })

  return mainRows.map(mainRow => {
    const out: Record<string, any> = { [main.name]: clone(mainRow) }
    // 每个 detail 用各自的 joinKey 从主表行取值
    for (const g of groups) {
      const mainVal = mainRow?.[g.detail.joinKey]
      const bucket = validKey(mainVal) ? (g.map.get(mainVal) ?? []) : []
      out[g.detail.name] = clone(bucket) // 每份独立副本，避免主表多行共享同一从表数组
    }
    return out
  })
}
