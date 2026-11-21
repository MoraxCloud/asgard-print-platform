import { expect, it } from 'vitest'
import { updatePack } from '../update.js'

const base = { 'a.one': '一', 'a.two': '二' }

it('补新键为空串、保留已有译文', () => {
  const r = updatePack({ 'a.one': 'Un' }, base)
  expect(r.next).toEqual({ 'a.one': 'Un', 'a.two': '' })
  expect(r.added).toEqual(['a.two'])
})

it('--prune 删除多余键', () => {
  const r = updatePack({ 'a.one': 'Un', 'old.key': 'x' }, base, { prune: true })
  expect(r.next).toEqual({ 'a.one': 'Un', 'a.two': '' })
  expect(r.removed).toEqual(['old.key'])
})

it('非剪枝模式保留多余键', () => {
  const r = updatePack({ 'a.one': 'Un', 'old.key': 'x' }, base)
  expect(r.next['old.key']).toBe('x')
  expect(r.removed).toEqual([])
})
