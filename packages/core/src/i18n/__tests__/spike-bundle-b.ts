// 模拟 bundle B：独立模块，但与 bundle A 共享同一 Symbol.for 状态
const S = Symbol.for('worm-print-platform.spike')
type State = { values: string[] }
const host = globalThis as unknown as Record<symbol, State | undefined>
host[S] ??= { values: [] }

export function readB(): string[] {
  return host[S]!.values
}
