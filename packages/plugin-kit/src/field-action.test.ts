import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  defineFieldActionUI,
  registerFieldActionUI,
  getFieldActionUIs,
  subscribeFieldActionRegistry,
  clearFieldActionUIs,
} from './field-action'
import type { FieldActionUI } from './field-action'

function action(id: string, overrides: Partial<FieldActionUI> = {}): FieldActionUI {
  return { id, label: `预览 ${id}`, onActivate: () => {}, ...overrides }
}

beforeEach(() => clearFieldActionUIs())

describe('defineFieldActionUI 校验', () => {
  it('id 必须是非空字符串', () => {
    expect(() => defineFieldActionUI(action(''))).toThrow(/id/)
  })

  it('label 必须是非空字符串', () => {
    expect(() => defineFieldActionUI(action('a', { label: '' }))).toThrow(/label/)
  })

  it('onActivate 必须是函数', () => {
    expect(() => defineFieldActionUI(action('a', { onActivate: undefined as never }))).toThrow(/onActivate/)
  })

  it('合法描述符原样返回', () => {
    const a = action('a', { icon: 'eye', styles: '.x{}' })
    expect(defineFieldActionUI(a)).toBe(a)
  })
})

describe('字段动作注册表', () => {
  it('注册后 getFieldActionUIs 可读，按注册顺序', () => {
    registerFieldActionUI(action('a'))
    registerFieldActionUI(action('b'))
    expect(getFieldActionUIs().map(a => a.id)).toEqual(['a', 'b'])
  })

  it('同 id 后注册覆盖前者且序号更新为后注册者', () => {
    registerFieldActionUI(action('a', { label: '旧' }))
    registerFieldActionUI(action('a', { label: '新' }))
    const all = getFieldActionUIs()
    expect(all).toHaveLength(1)
    expect(all[0].label).toBe('新')
  })

  it('注销只删自己这一版，不误删后来覆盖者', () => {
    const oldA = action('a', { label: '旧' })
    const dispose = registerFieldActionUI(oldA)
    registerFieldActionUI(action('a', { label: '新' }))
    dispose()
    expect(getFieldActionUIs().map(a => a.label)).toEqual(['新'])
  })

  it('注销自己且未被覆盖时移除', () => {
    const dispose = registerFieldActionUI(action('a'))
    dispose()
    expect(getFieldActionUIs()).toEqual([])
  })

  it('注册与注销触发订阅，取消订阅后不再触发', () => {
    const listener = vi.fn()
    const unsub = subscribeFieldActionRegistry(listener)
    const dispose = registerFieldActionUI(action('a'))
    expect(listener).toHaveBeenCalledTimes(1)
    dispose()
    expect(listener).toHaveBeenCalledTimes(2)
    unsub()
    registerFieldActionUI(action('b'))
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('clear 清空注册态并通知订阅者', () => {
    const listener = vi.fn()
    subscribeFieldActionRegistry(listener)
    registerFieldActionUI(action('a'))
    clearFieldActionUIs()
    expect(getFieldActionUIs()).toEqual([])
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
