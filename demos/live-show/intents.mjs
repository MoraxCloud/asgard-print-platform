export const LOOP_STEPS = [
  { kind: 'video', label: '模板视频', narration: '先播放一段无字幕模板视频，快速展示面单、价签拼版和资产标签。' },
  { command: '看看快递面单', label: '面单模板', hold: 2200 },
  { command: '预览出纸', label: '面单预览', hold: 3500 },
  { command: '标签可以打印到一张纸上吗', label: '标签拼版', hold: 5000 },
  { command: '加载资产/设备标签', label: '资产标签', hold: 2200 },
  { command: '预览出纸', label: '资产标签预览', hold: 3500 },
]

export const SAMPLES = [
  { id: 'express-waybill', name: '快递电子面单', group: '单据' },
  { id: 'price-label', name: '价签打印', group: '标签' },
  { id: 'asset-tag', name: '资产/设备标签', group: '标签' },
  { id: 'thermal-receipt', name: '零售小票', group: '小票' },
  { id: 'sales-outbound', name: '销售出库单', group: '单据' },
  { id: 'purchase-receipt', name: '采购收货单', group: '单据' },
]

export const ACTION_LABELS = {
  help: '功能介绍',
  'load-sample': '加载模板',
  'edit-text': '修改文字',
  'bind-field': '绑定字段',
  align: '调整对齐',
  paper: '调整纸型',
  preview: '出纸预览',
  tiling: '拼版演示',
  undo: '撤销修改',
  'start-demo': '连续演示',
  stop: '停止演示',
}

export const DEMO_SEQUENCE = [
  { action: 'load-sample', args: { sampleId: 'express-waybill' } },
  { action: 'edit-text', args: { text: ' Worm Print 直播演示' } },
  { action: 'bind-field' },
  { action: 'align', args: { align: 'center' } },
  { action: 'preview' },
  { action: 'load-sample', args: { sampleId: 'price-label' } },
  { action: 'preview' },
]

const clean = (value, max = 80) => String(value ?? '')
  .replace(/[\u0000-\u001f\u007f]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max)

const make = (action, narration, args = {}) => ({ action, narration, args })

function sampleIntent(sampleId) {
  const sample = SAMPLES.find(item => item.id === sampleId)
  return make('load-sample', `已为你加载${sample.name}。画布、字段和出纸效果都来自真实模板。`, { sampleId })
}

export function parseIntent(raw) {
  const text = clean(raw)
  if (!text) return null

  if (/^(停止|暂停|别演了|停止演示|暂停演示)$/.test(text)) {
    return make('stop', '已停止自动演示，当前步骤结束后不再继续。')
  }
  if (/开始演示|自动演示|完整演示|来个全套|连续演示/.test(text)) {
    return make('start-demo', '连续演示开始：先做面单，再展示价签拼版。')
  }
  if (/能做什么|有哪些功能|怎么玩|帮助|指令|演示什么/.test(text)) {
    return make('help', '你可以让我做面单、价签、资产标签或小票，也可以改文字、绑定字段、调整纸型并打开出纸预览。')
  }
  if (/一张纸|同一张|拼版|满屏|多个标签|标签.{0,8}纸/.test(text)) {
    return make('tiling', '可以。价签打印会把三十二枚标签拼到一张 A4 纸上，我现在打开真实预览。')
  }
  if (/撤销|恢复/.test(text)) {
    return make('undo', '正在撤销上一步修改。')
  }
  if (/预览|出纸|看看效果|效果怎么样|打印预览|打印出来|帮我打印|^打印$/.test(text)) {
    return make('preview', '现在打开真实出纸预览。彩排模式只展示纸张，不会连接实体打印机。')
  }

  const size = text.match(/(\d{1,3})\s*[x×*]\s*(\d{1,3})/i)
    ?? text.match(/宽\s*(\d{1,3}).{0,8}高\s*(\d{1,3})/)
  if (size && /纸|尺寸|宽|高|大小/.test(text)) {
    const width = Number(size[1])
    const height = Number(size[2])
    if (width >= 20 && width <= 300 && height >= 20 && height <= 300) {
      return make('paper', `纸张已调整为宽${width}毫米、高${height}毫米，设计画面会立即跟随。`, { width, height })
    }
    return make('help', '彩排支持的纸张宽高范围是二十到三百毫米，请重新告诉我尺寸。')
  }

  if (/居中/.test(text)) return make('align', '选中的文字已经水平居中。', { align: 'center' })
  if (/左对齐/.test(text)) return make('align', '选中的文字已经左对齐。', { align: 'left' })
  if (/右对齐/.test(text)) return make('align', '选中的文字已经右对齐。', { align: 'right' })

  if (/绑定|字段/.test(text) && !/自定义/.test(text)) {
    return make('bind-field', '已把选中文字绑定到当前模板的真实业务字段，预览时会自动填入数据。')
  }

  const edited = text.match(/(?:文字|文本|标题|内容).{0,10}?(?:改成|换成|设置为)\s*["“]?(.+?)["”]?$/)
    ?? text.match(/(?:改成|换成|设置为)\s*["“]?(.+?)["”]?$/)
  if (edited && /文字|文本|标题|内容|改成|换成|设置为/.test(text)) {
    const value = clean(edited[1], 60)
    if (value) return make('edit-text', `文字已改成：${value}`, { text: value })
  }

  if (/面单|快递|运单/.test(text)) return sampleIntent('express-waybill')
  if (/价签|价格标签|标签/.test(text) && !/资产|设备/.test(text)) return sampleIntent('price-label')
  if (/资产|设备标签/.test(text)) return sampleIntent('asset-tag')
  if (/小票|收银|热敏/.test(text)) return sampleIntent('thermal-receipt')
  if (/出库|销售单/.test(text)) return sampleIntent('sales-outbound')
  if (/收货|采购单/.test(text)) return sampleIntent('purchase-receipt')

  if (/你好|您好|嗨|hello|hi/i.test(text)) {
    return make('help', '你好，我是本地直播彩排助手。发一条“看看价签”，我就开始演示。')
  }

  return make('help', '这条指令我还没有对应动作。可以试试：做面单、改文字、绑定字段、居中、调整纸型或预览出纸。')
}
