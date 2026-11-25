import { describe, expect, it } from 'vitest'
import { buildSessionBasicInfoPrompt } from './mcp-config'
import type { McpState } from '../preload/preload.api.js'

const session: McpState['sessions'][number] = {
  sessionId: 'a3f9k2',
  name: '设计器页面',
  url: 'http://localhost:5173/print-demo/',
  templateName: '快递面单模板',
  createdAt: Date.now(),
  lastActiveAt: Date.now(),
}

describe('buildSessionBasicInfoPrompt', () => {
  it('包含会话 ID、模板名称、设计器地址与 worm-print-platform mcp 工具指引', () => {
    const prompt = buildSessionBasicInfoPrompt(session)
    expect(prompt).toContain(session.sessionId)
    expect(prompt).toContain('快递面单模板')
    expect(prompt).toContain(session.url)
    expect(prompt).toContain('worm-print-platform mcp')
    expect(prompt).toContain('print_get_open_template')
  })

  it('不包含 MCP 服务地址与 Bearer token', () => {
    const prompt = buildSessionBasicInfoPrompt(session)
    expect(prompt).not.toContain('/mcp')
    expect(prompt).not.toContain('Bearer')
  })

  it('模板名称缺失时回退为页面名称', () => {
    const prompt = buildSessionBasicInfoPrompt({ ...session, templateName: undefined })
    expect(prompt).toContain('设计器页面')
  })
})
