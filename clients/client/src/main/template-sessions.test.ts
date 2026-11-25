import { describe, expect, it, vi } from 'vitest'
import type { WebSocket } from 'ws'
import { TemplateSessionRegistry } from './template-sessions.js'

const ORIGIN = 'http://localhost:5173'

function ctx(ws: WebSocket = {} as WebSocket) {
  return { ws, origin: ORIGIN }
}

describe('TemplateSessionRegistry 会话 ID 与创建时间', () => {
  it('接受 6 位小写字母数字 sessionId', async () => {
    const registry = new TemplateSessionRegistry()
    const res = await registry.attach(
      { sessionId: 'a3f9k2', name: '设计器', url: `${ORIGIN}/` },
      ctx(),
    )
    expect(res.sessionId).toBe('a3f9k2')
  })

  it('拒绝旧的 24 位 sessionId', async () => {
    const registry = new TemplateSessionRegistry()
    await expect(registry.attach(
      { sessionId: 'abcdefghijklmnopqrstuvwx', name: '设计器', url: `${ORIGIN}/` },
      ctx(),
    )).rejects.toThrow(/sessionId/)
  })

  it('list 按创建时间倒序并返回 createdAt，同源重连保留首次创建时间', async () => {
    vi.useFakeTimers()
    try {
      const t0 = new Date('2026-01-01T00:00:00Z')
      const t1 = new Date('2026-01-01T00:01:00Z')
      vi.setSystemTime(t0)
      const registry = new TemplateSessionRegistry()
      await registry.attach({ sessionId: 'aaaaaa', name: 'A', url: `${ORIGIN}/a` }, ctx({} as WebSocket))
      vi.setSystemTime(t1)
      await registry.attach({ sessionId: 'bbbbbb', name: 'B', url: `${ORIGIN}/b` }, ctx({} as WebSocket))
      // 同源重连 A：sessions 里仍是 A 的首次创建时间
      vi.setSystemTime(new Date('2026-01-01T00:02:00Z'))
      await registry.attach({ sessionId: 'aaaaaa', name: 'A2', url: `${ORIGIN}/a` }, ctx({} as WebSocket))

      const list = registry.list()
      expect(list.map(s => s.sessionId)).toEqual(['bbbbbb', 'aaaaaa'])
      expect(list[0]!.createdAt).toBe(t1.getTime())
      expect(list[1]!.createdAt).toBe(t0.getTime())
    } finally {
      vi.useRealTimers()
    }
  })
})
