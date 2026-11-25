// 文案与顺序对照 demos/live-show/intents.mjs 的 LOOP_STEPS，直播侧改动时人工同步。
export const INTRO_SLIDE_MS = 1400

export const VOICE_LINES = [
  { key: 'intro', text: '欢迎来到打印模板设计器。接下来依次展示快递面单、价签拼版和资产标签。' },
  { key: 'express', text: '已为你加载快递电子面单。画布、字段和出纸效果都来自真实模板。' },
  { key: 'preview', text: '现在打开真实出纸预览。这里只展示纸张，不会连接实体打印机。' },
  { key: 'tiling', text: '可以。价签打印会把三十二枚标签拼到一张 A4 纸上，我现在打开真实预览。' },
  { key: 'asset', text: '已为你加载资产/设备标签。画布、字段和出纸效果都来自真实模板。' },
]

export const AUTO_SHOW_STEPS = [
  { id: 'intro', kind: 'intro', label: '开场', hold: 4200, text: VOICE_LINES[0].text, voice: 'intro', sampleIds: ['express-waybill', 'price-label', 'asset-tag'] },
  { id: 'express-waybill', kind: 'load-sample', label: '快递电子面单', hold: 2200, text: VOICE_LINES[1].text, voice: 'express', sampleId: 'express-waybill' },
  { id: 'express-preview', kind: 'preview', label: '面单预览', hold: 3500, text: VOICE_LINES[2].text, voice: 'preview' },
  { id: 'price-tiling', kind: 'tiling', label: '价签拼版', hold: 5000, text: VOICE_LINES[3].text, voice: 'tiling', sampleId: 'price-label' },
  { id: 'asset-tag', kind: 'load-sample', label: '资产标签', hold: 2200, text: VOICE_LINES[4].text, voice: 'asset', sampleId: 'asset-tag' },
  { id: 'asset-preview', kind: 'preview', label: '资产标签预览', hold: 3500, text: VOICE_LINES[2].text, voice: 'preview' },
]
