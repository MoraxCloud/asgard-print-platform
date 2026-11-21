// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { readA, writeA } from './spike-bundle-a.js'
import { readB } from './spike-bundle-b.js'

describe('跨 bundle 注册表与环境探测', () => {
  it('两个独立模块通过 Symbol.for 拿到同一份状态', () => {
    writeA('x')
    expect(readB()).toBe(readA())
    expect(readB()).toEqual(['x'])
  })

  it('记录 locale 探测的环境前提', () => {
    const hasNavigator = typeof navigator !== 'undefined'
    const language = hasNavigator ? (navigator as { language?: string }).language : undefined
    expect(language === undefined || typeof language === 'string').toBe(true)
    console.log(`[spike] navigator=${hasNavigator}, language=${language ?? '<none>'}`)
  })
})
