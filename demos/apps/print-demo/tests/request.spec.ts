import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

import { ElMessage } from 'element-plus'
import { post } from '../src/api/request'

const server = setupServer(
  http.post('*/api/sys/print/_test_http_error', () =>
    HttpResponse.json({ ret: false, msg: '后端异常' }, { status: 404 }),
  ),
  http.post('*/api/sys/print/_test_business_error', () =>
    HttpResponse.json({ ret: false, msg: '业务失败' }, { status: 200 }),
  ),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())

describe('post() 错误提示', () => {
  it('HTTP 错误（如 404）时给出用户提示并抛出', async () => {
    await expect(post('/sys/print/_test_http_error')).rejects.toThrow()
    expect(ElMessage.error).toHaveBeenCalled()
  })

  it('业务 ret=false 时给出用户提示', async () => {
    await expect(post('/sys/print/_test_business_error')).rejects.toThrow('业务失败')
    expect(ElMessage.error).toHaveBeenCalledWith('业务失败')
  })
})
