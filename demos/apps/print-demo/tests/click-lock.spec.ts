import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClickLock } from '../src/views/print/health-report/click-lock'

describe('按钮防重复点击锁', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('锁定期间再次点击无效，3 秒后自动解锁', () => {
    const lock = createClickLock(3000)
    expect(lock.acquire()).toBe(true)
    expect(lock.acquire()).toBe(false)
    expect(lock.locked.value).toBe(true)

    vi.advanceTimersByTime(2999)
    expect(lock.locked.value).toBe(true)

    vi.advanceTimersByTime(1)
    expect(lock.locked.value).toBe(false)
    expect(lock.acquire()).toBe(true)
  })

  it('dispose 后解锁并取消计时器', () => {
    const lock = createClickLock(3000)
    lock.acquire()
    lock.dispose()
    expect(lock.locked.value).toBe(false)
    vi.advanceTimersByTime(3000)
    expect(lock.locked.value).toBe(false)
  })
})
