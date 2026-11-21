// 模拟 bundle A：与 bundle B 各自持有一份 Symbol.for 状态引用
const S = Symbol.for('worm-print-platform.spike')
type State = { values: string[] }
const host = globalThis as unknown as Record<symbol, State | undefined>
host[S] ??= { values: [] }

export function writeA(value: string): void {
  host[S]!.values.push(value)
}

export function readA(): string[] {
  return host[S]!.values
}
