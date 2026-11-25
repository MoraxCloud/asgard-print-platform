import test from 'node:test'
import assert from 'node:assert/strict'
import { parseIntent } from './intents.mjs'

test('模板别名映射到真实示例', () => {
  assert.equal(parseIntent('看看快递面单').args.sampleId, 'express-waybill')
  assert.equal(parseIntent('做一个价签').args.sampleId, 'price-label')
  assert.equal(parseIntent('演示资产标签').args.sampleId, 'asset-tag')
  assert.equal(parseIntent('看看小票').args.sampleId, 'thermal-receipt')
  assert.equal(parseIntent('加载价签打印').action, 'load-sample')
  assert.equal(parseIntent('加载价签打印').args.sampleId, 'price-label')
})

test('改文字指令保留观众输入并限长', () => {
  const result = parseIntent('把标题改成“ Worm Print 直播演示 ”')
  assert.equal(result.action, 'edit-text')
  assert.equal(result.args.text, 'Worm Print 直播演示')
  assert.equal(parseIntent(`改成${'长'.repeat(100)}`).args.text.length, 60)
})

test('纸型指令解析两种常见说法', () => {
  assert.deepEqual(parseIntent('纸张改成 100x150').args, { width: 100, height: 150 })
  assert.deepEqual(parseIntent('宽40高30').args, { width: 40, height: 30 })
  assert.equal(parseIntent('纸张改成 10x500').action, 'help')
})

test('打印指令只进入出纸预览动作', () => {
  assert.equal(parseIntent('帮我打印').action, 'preview')
  assert.match(parseIntent('帮我打印').narration, /不会连接实体打印机/)
  assert.equal(parseIntent('标签可以打印到一张纸上吗').action, 'tiling')
})

test('连续演示和停止指令可识别', () => {
  assert.equal(parseIntent('开始演示').action, 'start-demo')
  assert.equal(parseIntent('暂停演示').action, 'stop')
})

test('未知指令安全回退到功能介绍', () => {
  const result = parseIntent('<script>alert(1)</script>')
  assert.equal(result.action, 'help')
  assert.equal(result.args.text, undefined)
  assert.equal(parseIntent('   '), null)
})
