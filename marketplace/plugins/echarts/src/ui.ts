// 图表元素的 common 宿主 UI：一份 ElementUI 覆盖十个图表 kind。
// 画布走 echarts SSR（静态 SVG，无实例、无动画、无指针事件）；属性台用原生 DOM
// 重写 ChartPropertyGroup.vue 的字段清单与写回逻辑，写回口径与 Vue 面板逐字一致。
//
// 事件统一用 change（失焦/回车提交）：common 每次 store 变更都会整树重绘，
// 用 input 会让输入框在每次按键后重建、丢焦点。
import type { ElementOptions, RuntimeElement } from '@worm-print-platform/core/designer'
import { defineElementUI, registerElementUI } from '@worm-print-platform/plugin-kit'
import type {
  ElementUI,
  ElementUICanvasContext,
  ElementUIPropertyContext,
  ElementUIRenderResult,
} from '@worm-print-platform/plugin-kit'
import {
  asObject,
  CHART_KINDS,
  cloneChartOption,
  createDefaultChartOption,
  FUNNEL_PADDING_DEFAULTS,
  getChartKindDefinition,
  getChartPalettes,
  LABEL_POSITIONS,
  LABEL_PRESETS,
  labelFieldsOf,
  normalizeChartOption,
  previewChartOption,
  RADAR_RADIUS_DEFAULT,
  readChartLabel,
  readFunnelPadding,
  readPaletteKey,
  readRadarRadius,
  renderChartToSvg,
  resolveChartPanelFields,
  syncSeriesCount,
  updateChartLabel,
  writeFunnelPadding,
  writeRadarRadius,
} from './kit.js'
import type {
  ChartFieldKey,
  ChartKindDefinition,
  ChartLabelPatch,
  ChartLabelState,
  FunnelPadding,
  LabelFieldKey,
} from './kit.js'

/** 画布容器与 Vue 侧 ChartElement.vue 同形：铺满元素框且不吃指针事件 */
const CANVAS_STYLE = 'width:100%;height:100%;min-width:0;min-height:0;pointer-events:none'

const STYLES = [
  '.echarts-canvas-element{overflow:hidden}',
  '.echarts-field-row{display:flex;gap:6px;align-items:center}',
  '.echarts-field-row>.pd-input{flex:1;min-width:0}',
  '.echarts-field-row>.pd-button{flex:none}',
  '.echarts-label-group{margin-top:8px;border-top:1px solid var(--pd-border,#e5e7eb);padding-top:8px}',
  '.echarts-label-group>summary{display:flex;align-items:center;cursor:pointer;list-style:none;font-size:12px;font-weight:600}',
  '.echarts-label-summary>.pd-field{flex:1;margin:0;font-weight:400}',
  '.echarts-label-sub{font-size:11px;color:var(--pd-text-secondary,#6b7280);margin:8px 0 4px}',
].join('')

/** 与 Vue 设计器轨道 ChartPropertyGroup 同口径的 hasProperties / searchKeywords 同口径 */
const CHART_OPTION_KEYS = [
  'chartOption', 'chartDataSource', 'chartCategoryField', 'chartValueFields', 'chartSeriesField', 'chartBubble',
] as const

const SEARCH_KEYWORDS = [
  '图表', 'echarts', 'option', '配置', '数据源', '类目', '数值', '系列', '柱状', '条形',
  '折线', '面积', '饼', '环形', '散点', '雷达', '漏斗', '仪表', '数据标签', '数值标签', 'label',
] as const

const PANEL_HINT = '数据由模板绑定阶段注入：series/xAxis 的 data 保留 `$data` 占位即可；复杂样式可在模板 JSON 中手写 chartOption。'

let datalistSeq = 0

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function elementType(element: RuntimeElement): string {
  return element.printElementType?.type ?? ''
}

/** 手写的 chartOption 必须是纯对象；数组/标量视为非法 */
function rawChartOption(element: RuntimeElement): Record<string, unknown> | undefined {
  const raw = element.options.chartOption
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : undefined
}

/** 面板快照：与 Vue 面板一致——没有合法 chartOption 时按 kind 取出厂 option */
function panelOption(element: RuntimeElement): Record<string, any> {
  const raw = rawChartOption(element)
  return cloneChartOption(raw ?? createDefaultChartOption(elementType(element))) as Record<string, any>
}

function chartHasProperties(element: RuntimeElement): boolean {
  const options = element?.options
  if (!options || typeof options !== 'object') return false
  const record = options as unknown as Record<string, unknown>
  return CHART_OPTION_KEYS.some(key => record[key] !== undefined)
}

/** 归一后写回：只改自己掌管的键，option 里未知的自定义字段由 normalize 原样保留 */
function commitOption(
  ctx: ElementUIPropertyContext,
  type: string,
  next: Record<string, unknown>,
  patch: Partial<ElementOptions> = {},
): void {
  ctx.update({ chartOption: normalizeChartOption(type, next), ...patch })
}

function readValueFields(element: RuntimeElement): string[] {
  const raw = element.options.chartValueFields
  return Array.isArray(raw) ? raw.map(String) : []
}

/** 单值类型（饼/环/漏斗/仪表盘）只留一个数值字段；散点最多两个（第二个给气泡） */
function maxValueFields(def: ChartKindDefinition | undefined): number {
  switch (def?.seriesType) {
    case 'pie':
    case 'funnel':
    case 'gauge':
      return 1
    case 'scatter':
      return 2
    default:
      return 8
  }
}

function valueFieldsLabel(def: ChartKindDefinition | undefined, limit: number): string {
  if (def?.seriesType === 'radar') return '维度字段（每个字段一个维度）'
  return limit === 1 ? '数值字段' : '数值字段（多值多系列）'
}

/** 数据源候选：设计态示例数据里取「数组值」的顶层键 */
function dataSourceCandidates(data?: readonly Record<string, unknown>[]): string[] {
  const first = data?.[0]
  if (!first) return []
  return Object.keys(first).filter(key => Array.isArray(first[key]))
}

function seriesList(option: Record<string, any>): Record<string, any>[] {
  return Array.isArray(option.series) ? (option.series as Record<string, any>[]) : []
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** 数值字段增删/改名：series 数量对齐后按字段名回填 series[].name（与 Vue 面板一致） */
function syncValueFields(ctx: ElementUIPropertyContext, type: string, nextFields: string[]): void {
  const next = syncSeriesCount(panelOption(ctx.element), nextFields.length, type)
  const series = Array.isArray(next.series) ? (next.series as Record<string, any>[]) : []
  series.forEach((item, index) => {
    const name = nextFields[index]?.trim()
    if (name) item.name = name
  })
  commitOption(ctx, type, next, { chartValueFields: nextFields })
}

function renderCanvas(ctx: ElementUICanvasContext): ElementUIRenderResult {
  const element = ctx.element
  const type = elementType(element)
  const options = element.options
  const widthMm = Number(options.width) || 0
  const heightMm = Number(options.height) || 0
  try {
    // 预览按 kind 生成合法示例形态再归一，避免雷达/散点等没有绑定数据时空白
    const preview = previewChartOption(type, rawChartOption(element) ?? createDefaultChartOption(type))
    const option = normalizeChartOption(type, preview)
    if (!option || typeof option !== 'object' || Array.isArray(option)) throw new Error('图表 option 非法：需要对象')
    const fontFamily = typeof options.fontFamily === 'string' && options.fontFamily ? options.fontFamily : undefined
    const svg = renderChartToSvg({ key: element.id, type, option, widthMm, heightMm, fontFamily })
    return `<div class="echarts-canvas-element" style="${CANVAS_STYLE}">${svg}</div>`
  } catch {
    const title = typeof options.title === 'string' && options.title.trim()
      ? options.title
      : getChartKindDefinition(type)?.label ?? '图表'
    return `<div class="echarts-canvas-element" style="${CANVAS_STYLE}">${escapeHtml(title)}</div>`
  }
}

interface TextInputInit {
  value: string
  placeholder?: string
  type?: string
  min?: number
  max?: number
  title?: string
  list?: string
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function field(labelText: string): HTMLDivElement {
  const wrap = el('div', 'pd-field')
  wrap.appendChild(el('span', 'pd-label', labelText))
  return wrap
}

function textInput(init: TextInputInit, onCommit: (value: string) => void): HTMLInputElement {
  const input = el('input', 'pd-input')
  if (init.type) input.type = init.type
  if (init.placeholder) input.placeholder = init.placeholder
  if (init.min !== undefined) input.min = String(init.min)
  if (init.max !== undefined) input.max = String(init.max)
  if (init.title) input.title = init.title
  if (init.list) input.setAttribute('list', init.list)
  input.value = init.value
  input.addEventListener('change', () => onCommit(input.value))
  return input
}

function checkboxField(labelText: string, checked: boolean, onCommit: (checked: boolean) => void): HTMLDivElement {
  const wrap = field(labelText)
  wrap.style.cssText = 'flex-direction:row;align-items:center;justify-content:space-between'
  const input = el('input', 'pd-switch')
  input.type = 'checkbox'
  input.checked = checked
  input.addEventListener('change', () => onCommit(input.checked))
  wrap.appendChild(input)
  return wrap
}

function selectInput(
  options: readonly { value: string; label: string }[],
  value: string,
  onCommit: (value: string) => void,
): HTMLSelectElement {
  const select = el('select', 'pd-select')
  for (const item of options) {
    const optionEl = el('option')
    optionEl.value = item.value
    optionEl.textContent = item.label
    select.appendChild(optionEl)
  }
  select.value = value
  select.addEventListener('change', () => onCommit(select.value))
  return select
}

const OVERFLOW_OPTIONS = [
  { value: '', label: '默认' },
  { value: 'none', label: '不处理（显示完整）' },
  { value: 'truncate', label: '截断' },
  { value: 'break', label: '换行' },
] as const

const FONT_WEIGHT_OPTIONS = [
  { value: '', label: '默认' },
  { value: 'normal', label: '常规' },
  { value: 'bold', label: '加粗' },
] as const

const STYLE_FIELD_LABELS: Partial<Record<LabelFieldKey, string>> = {
  distance: '距离',
  rotate: '旋转（度）',
  fontSize: '字号',
  fontWeight: '字重',
  color: '文字颜色',
  backgroundColor: '背景色',
  borderColor: '边框色',
  borderWidth: '边框宽度',
  borderRadius: '圆角',
  padding: '内边距',
}

/** 数据标签分组：一个可折叠 details，内部按「内容 / 位置 / 样式 / 引导线」分块 */
function renderLabelGroup(ctx: ElementUIPropertyContext, type: string): HTMLDetailsElement {
  const element = ctx.element
  const def = getChartKindDefinition(type)
  const fields = labelFieldsOf(type)
  const has = (key: LabelFieldKey): boolean => fields.includes(key)
  const state = readChartLabel(panelOption(element), type)

  const commit = (patch: ChartLabelPatch): void => {
    commitOption(ctx, type, updateChartLabel(panelOption(element), type, patch))
  }
  const commitNumber = (key: LabelFieldKey, raw: string): void => {
    if (raw.trim() === '') return commit({ [key]: null } as ChartLabelPatch)
    const value = Number(raw)
    if (!Number.isFinite(value)) return
    commit({ [key]: value } as ChartLabelPatch)
  }
  const commitLineNumber = (key: 'length' | 'length2', raw: string): void => {
    if (raw.trim() === '') return commit({ labelLine: { [key]: null } })
    const value = Number(raw)
    if (!Number.isFinite(value)) return
    commit({ labelLine: { [key]: value } })
  }
  const numberField = (key: LabelFieldKey, value: number | undefined): HTMLDivElement => {
    const wrap = field(STYLE_FIELD_LABELS[key] ?? key)
    wrap.appendChild(
      textInput({ value: value === undefined ? '' : String(value), type: 'number' }, raw => commitNumber(key, raw)),
    )
    return wrap
  }
  const colorField = (key: LabelFieldKey, value: string | undefined): HTMLDivElement => {
    const wrap = field(STYLE_FIELD_LABELS[key] ?? key)
    wrap.appendChild(
      textInput({ value: value ?? '', placeholder: '#333333，留空不设置' }, raw => commit({ [key]: raw } as ChartLabelPatch)),
    )
    return wrap
  }

  const group = el('details', 'echarts-label-group') as HTMLDetailsElement
  group.open = state.show
  // 总开关必须放在 summary 里：关闭标签时 details 折叠，若开关在内容区用户就再也点不到它
  const summary = el('summary', 'echarts-label-summary')
  const toggle = checkboxField('显示数据标签', state.show, checked => commit({ enabled: checked }))
  // 点击开关本身不应连带折叠 details
  toggle.querySelector('input')?.addEventListener('click', event => event.stopPropagation())
  summary.appendChild(toggle)
  group.appendChild(summary)

  if (has('formatter') || has('overflow')) {
    group.appendChild(el('div', 'echarts-label-sub', '内容'))
    if (has('formatter')) {
      const wrap = field('数据标签内容')
      wrap.appendChild(
        selectInput(
          [{ value: '', label: '自定义 / 默认' }, ...LABEL_PRESETS.map(preset => ({ value: preset.formatter, label: preset.label }))],
          state.formatter ?? '',
          value => commit({ formatter: value }),
        ),
      )
      wrap.appendChild(
        textInput({ value: state.formatter ?? '', placeholder: '如 {b}: {c}' }, value => commit({ formatter: value })),
      )
      group.appendChild(wrap)
    }
    if (has('overflow')) {
      const wrap = field('溢出处理')
      wrap.appendChild(selectInput(OVERFLOW_OPTIONS, state.overflow ?? '', value => commit({ overflow: value })))
      group.appendChild(wrap)
    }
  }

  if (has('position') || has('distance') || has('rotate') || has('offsetX')) {
    group.appendChild(el('div', 'echarts-label-sub', '位置'))
    if (has('position')) {
      const wrap = field('标签位置')
      const positions = def ? LABEL_POSITIONS[def.seriesType] ?? [] : []
      wrap.appendChild(
        selectInput([{ value: '', label: '默认' }, ...positions], state.position ?? '', value => commit({ position: value })),
      )
      group.appendChild(wrap)
    }
    if (has('distance')) group.appendChild(numberField('distance', state.distance))
    if (has('rotate')) group.appendChild(numberField('rotate', state.rotate))
    if (has('offsetX') || has('offsetY')) {
      const wrap = field('偏移 X / Y')
      const row = el('div', 'echarts-field-row')
      row.appendChild(
        textInput({ value: state.offsetX === undefined ? '' : String(state.offsetX), type: 'number' }, raw => commitNumber('offsetX', raw)),
      )
      row.appendChild(
        textInput({ value: state.offsetY === undefined ? '' : String(state.offsetY), type: 'number' }, raw => commitNumber('offsetY', raw)),
      )
      wrap.appendChild(row)
      group.appendChild(wrap)
    }
  }

  const styleKeys: LabelFieldKey[] = ['fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderColor', 'borderWidth', 'borderRadius', 'padding']
  if (styleKeys.some(has)) {
    group.appendChild(el('div', 'echarts-label-sub', '样式'))
    if (has('fontSize')) group.appendChild(numberField('fontSize', state.fontSize))
    if (has('fontWeight')) {
      const wrap = field('字重')
      wrap.appendChild(selectInput(FONT_WEIGHT_OPTIONS, state.fontWeight ?? '', value => commit({ fontWeight: value })))
      group.appendChild(wrap)
    }
    for (const key of ['color', 'backgroundColor', 'borderColor'] as const) {
      if (has(key)) group.appendChild(colorField(key, state[key]))
    }
    for (const key of ['borderWidth', 'borderRadius', 'padding'] as const) {
      if (has(key)) group.appendChild(numberField(key, state[key]))
    }
  }

  if (has('labelLine.show')) {
    group.appendChild(el('div', 'echarts-label-sub', '引导线'))
    group.appendChild(
      checkboxField('显示引导线', state.labelLine.show === true, checked => commit({ labelLine: { show: checked } })),
    )
    if (has('labelLine.length')) {
      const wrap = field('引导线长度')
      wrap.appendChild(
        textInput(
          { value: state.labelLine.length === undefined ? '' : String(state.labelLine.length), type: 'number' },
          raw => commitLineNumber('length', raw),
        ),
      )
      group.appendChild(wrap)
    }
    if (has('labelLine.length2')) {
      const wrap = field('第二段长度')
      wrap.appendChild(
        textInput(
          { value: state.labelLine.length2 === undefined ? '' : String(state.labelLine.length2), type: 'number' },
          raw => commitLineNumber('length2', raw),
        ),
      )
      group.appendChild(wrap)
    }
    if (has('labelLine.smooth')) {
      group.appendChild(
        checkboxField('平滑引导线', state.labelLine.smooth === true, checked => commit({ labelLine: { smooth: checked } })),
      )
    }
  }

  return group
}

function renderProperty(ctx: ElementUIPropertyContext): ElementUIRenderResult {
  const element = ctx.element
  const type = elementType(element)
  const def = getChartKindDefinition(type)
  const fields = resolveChartPanelFields(type)
  const has = (key: ChartFieldKey): boolean => fields.includes(key)
  const options = element.options
  const widthMm = Number(options.width) || 0
  const heightMm = Number(options.height) || 0
  const limit = maxValueFields(def)
  const palettes = getChartPalettes()

  const root = el('div', 'echarts-property')
  const form = el('form', 'pd-form')
  form.addEventListener('submit', event => event.preventDefault())
  root.appendChild(form)

  if (has('dataSource')) {
    const wrap = field('数据源')
    const candidates = dataSourceCandidates(ctx.data)
    let datalist: HTMLDataListElement | undefined
    if (candidates.length > 0) {
      datalist = el('datalist')
      datalist.id = `echarts-ds-${++datalistSeq}`
      for (const key of candidates) {
        const optionEl = el('option')
        optionEl.value = key
        datalist.appendChild(optionEl)
      }
    }
    wrap.appendChild(
      textInput(
        {
          value: String(options.chartDataSource ?? ''),
          placeholder: '数据集路径（留空取顶层第一个数组）',
          list: datalist?.id,
        },
        value => commitOption(ctx, type, panelOption(element), { chartDataSource: value }),
      ),
    )
    if (datalist) wrap.appendChild(datalist)
    form.appendChild(wrap)
  }

  if (has('categoryField')) {
    const wrap = field('类目字段')
    wrap.appendChild(
      textInput(
        { value: String(options.chartCategoryField ?? ''), placeholder: '如 name' },
        value => commitOption(ctx, type, panelOption(element), { chartCategoryField: value }),
      ),
    )
    form.appendChild(wrap)
  }

  if (has('valueFields')) {
    const wrap = field(valueFieldsLabel(def, limit))
    const fieldsNow = readValueFields(element)
    fieldsNow.forEach((value, index) => {
      const row = el('div', 'echarts-field-row')
      row.appendChild(
        textInput(
          { value, placeholder: '如 value' },
          next => {
            const list = readValueFields(element)
            list[index] = next
            syncValueFields(ctx, type, list)
          },
        ),
      )
      if (fieldsNow.length > 1) {
        const remove = el('button', 'pd-button small', '−')
        remove.type = 'button'
        remove.title = '删除该字段'
        remove.addEventListener('click', () => syncValueFields(ctx, type, readValueFields(element).filter((_, i) => i !== index)))
        row.appendChild(remove)
      }
      wrap.appendChild(row)
    })
    if (fieldsNow.length < limit) {
      const add = el('button', 'pd-button small', '+ 添加字段')
      add.type = 'button'
      add.addEventListener('click', () => syncValueFields(ctx, type, [...readValueFields(element), '']))
      wrap.appendChild(add)
    }
    form.appendChild(wrap)
  }

  if (has('seriesField')) {
    const wrap = field('系列拆分字段')
    wrap.appendChild(
      textInput(
        { value: String(options.chartSeriesField ?? ''), placeholder: '可选，如 region（按值拆成多系列）' },
        value => commitOption(ctx, type, panelOption(element), { chartSeriesField: value }),
      ),
    )
    form.appendChild(wrap)
  }

  if (has('bubble')) {
    form.appendChild(
      checkboxField('气泡大小', options.chartBubble === true, checked => {
        commitOption(ctx, type, panelOption(element), { chartBubble: checked })
      }),
    )
  }

  if (has('title')) {
    const wrap = field('图表标题')
    wrap.appendChild(
      textInput(
        { value: String(asObject(panelOption(element).title).text ?? ''), placeholder: '留空不显示标题' },
        value => {
          const next = panelOption(element)
          next.title = { ...asObject(next.title), text: value }
          commitOption(ctx, type, next)
        },
      ),
    )
    form.appendChild(wrap)
  }

  if (has('legend')) {
    const show = asObject(panelOption(element).legend).show !== false
    form.appendChild(
      checkboxField('显示图例', show, checked => {
        const next = panelOption(element)
        next.legend = { ...asObject(next.legend), show: checked }
        commitOption(ctx, type, next)
      }),
    )
  }

  if (has('palette')) {
    const wrap = field('配色')
    const select = el('select', 'pd-select')
    for (const palette of palettes) {
      const optionEl = el('option')
      optionEl.value = palette.key
      optionEl.textContent = palette.label
      select.appendChild(optionEl)
    }
    select.value = readPaletteKey(panelOption(element), palettes)
    select.addEventListener('change', () => {
      const palette = palettes.find(item => item.key === select.value) ?? palettes[0]!
      const next = panelOption(element)
      next.color = [...palette.colors]
      commitOption(ctx, type, next)
    })
    wrap.appendChild(select)
    form.appendChild(wrap)
  }

  if (has('label')) {
    form.appendChild(renderLabelGroup(ctx, type))
  }

  if (has('stack')) {
    const series = seriesList(panelOption(element))
    const stacked = series.some(item => item.stack !== undefined && item.stack !== null && item.stack !== '')
    form.appendChild(
      checkboxField('堆叠显示', stacked, checked => {
        const next = panelOption(element)
        for (const item of seriesList(next)) {
          if (checked) item.stack = 'total'
          else delete item.stack
        }
        commitOption(ctx, type, next)
      }),
    )
  }

  if (has('innerRadius')) {
    const wrap = field('内径（%）')
    const radius = seriesList(panelOption(element))[0]?.radius
    const inner = Array.isArray(radius) ? Number(String(radius[0] ?? '40%').replace('%', '')) || 40 : 40
    wrap.appendChild(
      textInput({ value: String(inner), type: 'number', min: 0, max: 90 }, value => {
        const next = panelOption(element)
        const series = seriesList(next)
        if (series[0]) series[0].radius = [`${clamp(Number(value) || 0, 0, 90)}%`, '70%']
        commitOption(ctx, type, next)
      }),
    )
    form.appendChild(wrap)
  }

  if (has('padding')) {
    const wrap = field('内边距 上/右/下/左 (%)')
    const padding = readFunnelPadding(panelOption(element), widthMm, heightMm)
    const row = el('div', 'echarts-field-row')
    const sides: { side: keyof FunnelPadding; title: string }[] = [
      { side: 'top', title: '上边距' },
      { side: 'right', title: '右边距（留外置标签）' },
      { side: 'bottom', title: '下边距' },
      { side: 'left', title: '左边距' },
    ]
    for (const { side, title } of sides) {
      row.appendChild(
        textInput({ value: String(padding[side]), type: 'number', min: 0, max: 60, title }, value => {
          const raw = Number(value)
          const next = Number.isFinite(raw) ? clamp(raw, 0, 60) : FUNNEL_PADDING_DEFAULTS[side]
          const option = panelOption(element)
          const current = readFunnelPadding(option, widthMm, heightMm)
          commitOption(ctx, type, writeFunnelPadding(option, { ...current, [side]: next }))
        }),
      )
    }
    wrap.appendChild(row)
    form.appendChild(wrap)
  }

  if (has('radius')) {
    const wrap = field('半径（%）')
    wrap.appendChild(
      textInput(
        { value: String(readRadarRadius(panelOption(element), widthMm, heightMm)), type: 'number', min: 20, max: 100 },
        value => {
          const raw = Number(value)
          const next = Number.isFinite(raw) ? clamp(raw, 20, 100) : RADAR_RADIUS_DEFAULT
          commitOption(ctx, type, writeRadarRadius(panelOption(element), next))
        },
      ),
    )
    form.appendChild(wrap)
  }

  if (has('gaugeRange')) {
    const wrap = field('最小 / 最大值')
    const series = seriesList(panelOption(element))
    const row = el('div', 'echarts-field-row')
    row.appendChild(
      textInput({ value: String(Number(series[0]?.min ?? 0)), type: 'number' }, value => {
        const next = panelOption(element)
        const list = seriesList(next)
        if (list[0]) list[0].min = Number(value) || 0
        commitOption(ctx, type, next)
      }),
    )
    row.appendChild(
      textInput({ value: String(Number(series[0]?.max ?? 100)), type: 'number' }, value => {
        const next = panelOption(element)
        const list = seriesList(next)
        if (list[0]) list[0].max = Number(value) || 100
        commitOption(ctx, type, next)
      }),
    )
    wrap.appendChild(row)
    form.appendChild(wrap)
  }

  form.appendChild(el('p', 'pd-hint', PANEL_HINT))
  return root
}

export const CHART_ELEMENT_UI: ElementUI = defineElementUI({
  types: CHART_KINDS,
  renderCanvas,
  renderProperty,
  hasProperties: chartHasProperties,
  group: '图表',
  searchKeywords: SEARCH_KEYWORDS,
  styles: STYLES,
})

let disposeHandle: (() => void) | undefined

/** 注册图表 common UI（幂等：重复调用只保留一份注册，不累积） */
export function installChartCommonUI(): () => void {
  disposeHandle?.()
  disposeHandle = registerElementUI(CHART_ELEMENT_UI)
  return disposeHandle
}

/** 注销（幂等：未注册时调用无副作用） */
export function uninstallChartCommonUI(): void {
  disposeHandle?.()
  disposeHandle = undefined
}

// import 即注册：宿主 import 包入口即可在 common 设计器看到十类图表
installChartCommonUI()
