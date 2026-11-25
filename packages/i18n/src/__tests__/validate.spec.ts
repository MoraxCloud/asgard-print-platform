import { expect, it } from 'vitest'
import { validatePack } from '../validate.js'

const base = { 'toolbar.save': '保存', 'diagnostic.position': '位置 {pos}' }

it('合法包零错误', () => {
  expect(validatePack({ 'toolbar.save': 'Enregistrer', 'diagnostic.position': 'Position {pos}' }, base)).toEqual([])
})

it('缺键/空值/占位符/多余/嵌套/_meta 都能被识别', () => {
  const issues = validatePack({
    'diagnostic.position': 'Position', 'extra.key': 'x', 'empty.key': '', _meta: { x: 1 }, nested: { a: 'b' },
  }, base)
  expect(issues.some(i => i.level === 'error' && i.key === 'toolbar.save')).toBe(true)
  expect(issues.some(i => i.level === 'error' && i.key === 'empty.key')).toBe(true)
  expect(issues.some(i => i.level === 'error' && i.key === 'diagnostic.position')).toBe(true)
  expect(issues.some(i => i.level === 'warn' && i.key === 'extra.key')).toBe(true)
  expect(issues.some(i => i.level === 'error' && i.key === '_meta')).toBe(true)
  expect(issues.some(i => i.level === 'error' && i.key === 'nested')).toBe(true)
})

it('严格模式把多余键升级为错误', () => {
  expect(validatePack({ ...base, 'extra.key': 'x' }, base, { strict: true })
    .some(i => i.level === 'error' && i.key === 'extra.key')).toBe(true)
})

it('非对象输入报错', () => {
  expect(validatePack([], base)[0]?.level).toBe('error')
  expect(validatePack(null, base)[0]?.level).toBe('error')
})
