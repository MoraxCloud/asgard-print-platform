// 图表元素的 common 宿主 UI：一份 ElementUI 覆盖十个图表 kind。
// 画布走 echarts SSR（静态 SVG，无实例、无动画、无指针事件）；属性台用原生 DOM
// 重写 ChartPropertyGroup.vue 的字段清单与写回逻辑，写回口径与 Vue 面板逐字一致。
//
// 事件统一用 change（失焦/回车提交）：common 每次 store 变更都会整树重绘，
// 用 input 会让输入框在每次按键后重建、丢焦点。
import { t } from '@worm-print-platform/core/i18n'
import { echartsZhCN } from './i18n/zh-CN.js'
import { echartsEnUS } from './i18n/en-US.js'
import { echartsThTH } from './i18n/th-TH.js'
import type { ElementOptions, RuntimeElement } from '@worm-print-platform/core/designer'
import { defineElementUI, registerElementUI } from '@worm-print-platform/plugin-kit'
import { render } from '@worm-print-platform/plugin-kit/dom'
import { colorPicker } from '@worm-print-platform/plugin-kit/controls'
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
  '.echarts-dropdown-trigger{display:flex;align-items:center;justify-content:space-between;gap:6px;width:100%;height:26px;min-height:26px;padding:3px 6px;border:1px solid var(--pd-border,#d9dde6);border-radius:6px;background:var(--pd-input-bg,#fff);color:inherit;font:inherit;box-sizing:border-box;cursor:pointer;text-align:left}',
  '.echarts-dropdown-trigger:hover{border-color:var(--pd-text-faint,#b4b9c4)}',
  '.echarts-dropdown-trigger[aria-expanded="true"]{border-color:var(--pd-accent,#165dff);box-shadow:0 0 0 2px rgb(22 93 255 / 12%)}',
  '.echarts-dropdown-value{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.echarts-dropdown-arrow{flex:none;color:var(--pd-text-muted,#909399);font-size:10px;transition:transform .14s}',
  '.echarts-dropdown-trigger[aria-expanded="true"] .echarts-dropdown-arrow{transform:rotate(180deg)}',
  '.echarts-dropdown-panel{position:fixed;z-index:1200;max-height:240px;overflow:auto;padding:3px;border:1px solid var(--pd-border,#d9dde6);border-radius:6px;background:var(--pd-input-bg,#fff);box-shadow:0 6px 18px rgb(0 0 0 / 14%);box-sizing:border-box}',
  '.echarts-dropdown-option{padding:5px 8px;border-radius:4px;cursor:pointer;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '.echarts-dropdown-option:hover{background:var(--pd-accent-soft,rgb(22 93 255 / 9%))}',
  '.echarts-dropdown-option.is-active{background:var(--pd-accent-soft,rgb(22 93 255 / 9%));color:var(--pd-accent,#165dff)}',
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

// 语言包在文件底部 installChartCommonUI() 时才注册，模块加载期不能求值 t()；改为渲染时求值
const panelHint = () => t('echarts.panel.hint.dataBinding')

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
  if (def?.seriesType === 'radar') return t('echarts.panel.field.dimension')
  return limit === 1 ? t('echarts.panel.field.value') : t('echarts.panel.field.valueMulti')
}

/** 数据源候选：设计态示例数据里取「数组值」的顶层键 */
function dataSourceCandidates(data?: readonly Record<string, unknown>[]): string[] {
  const first = data?.[0]
  if (!first) return []
  return Object.keys(first).filter(key => Array.isArray(first[key]))
}

/** 行字段候选：取指定数据源数组首行的键，供类目/数值字段下拉；无数据源时取顶层第一个数组 */
function dataRowFields(data: readonly Record<string, unknown>[] | undefined, dataSource: string): string[] {
  const first = data?.[0]
  if (!first) return []
  const key = dataSource && Array.isArray(first[dataSource]) ? dataSource : Object.keys(first).find(k => Array.isArray(first[k]))
  if (!key) return []
  const rows = first[key] as Record<string, unknown>[]
  return rows.length > 0 && typeof rows[0] === 'object' && rows[0] !== null
    ? Object.keys(rows[0])
    : []
}

/** 字段键→中文名映射；业务字段清单 ctx.fields 里声明过的键可显示「中文名 (键)」 */
type FieldLabelMap = ReadonlyMap<string, string>
function fieldLabelMap(fields: readonly { fieldKey: string; fieldLabel?: string }[] | undefined): FieldLabelMap {
  const map = new Map<string, string>()
  for (const field of fields ?? []) {
    if (field.fieldKey && field.fieldLabel) map.set(field.fieldKey, field.fieldLabel)
  }
  return map
}

/** 选项展示文案：有中文名则「中文名（键）」，否则仅键 */
function optionLabel(value: string, labels: FieldLabelMap, fallbackSuffix?: string): string {
  if (!value) return fallbackSuffix ?? t('echarts.panel.default')
  const name = labels.get(value)
  const base = name ? `${name}（${value}）` : value
  return fallbackSuffix ? `${base}${fallbackSuffix}` : base
}

/** 构造下拉选项：候选 + 当前值（若不在候选里，动态补一项以保留已有模板的值） */
function dropdownOptions(
  candidates: readonly string[],
  current: string,
  labels: FieldLabelMap = new Map(),
): { value: string; label: string }[] {
  const opts = candidates.map(value => ({ value, label: optionLabel(value, labels) }))
  if (current && !candidates.includes(current)) opts.unshift({ value: current, label: optionLabel(current, labels, t('echarts.panel.current')) })
  if (!current) opts.unshift({ value: '', label: t('echarts.panel.defaultFirstArray') })
  return opts
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
    if (!option || typeof option !== 'object' || Array.isArray(option)) throw new Error(t('echarts.panel.error.invalidOption'))
    const fontFamily = typeof options.fontFamily === 'string' && options.fontFamily ? options.fontFamily : undefined
    const svg = renderChartToSvg({ key: element.id, type, option, widthMm, heightMm, fontFamily })
    return `<div class="echarts-canvas-element" style="${CANVAS_STYLE}">${svg}</div>`
  } catch {
    const title = typeof options.title === 'string' && options.title.trim()
      ? options.title
      : getChartKindDefinition(type)?.label ?? t('echarts.panel.chartFallback')
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

// 当前打开的自定义下拉（同一时刻只开一个，切换字段自动收起上一个）
let activeDropdown: { close: () => void } | null = null

function composedPathOf(ev: Event): EventTarget[] {
  const composed = typeof (ev as { composedPath?: () => EventTarget[] }).composedPath === 'function'
    ? (ev as { composedPath: () => EventTarget[] }).composedPath()
    : []
  return composed.length ? composed : [ev.target as EventTarget]
}

/**
 * 自定义下拉：原生 <select> 的弹窗方向由浏览器按可用空间决定，属性面板里会向上弹、遮挡上方字段。
 * 这里用「触发钮 + fixed 面板」保证选项固定在选择框正下方展开；面板挂在触发钮所在 root（shadow 或 body），
 * 与颜色选择器同一手法，避开 .pd-form 的 overflow 裁剪。外点 / Esc / 滚动 / resize 均收起。
 */
function dropdownSelect(
  options: readonly { value: string; label: string }[],
  value: string,
  onCommit: (value: string) => void,
): HTMLElement {
  const current = options.find(item => item.value === value) ?? { value, label: value || t('echarts.panel.optionDefault') }
  const trigger = el('button', 'echarts-dropdown-trigger')
  trigger.type = 'button'
  trigger.setAttribute('aria-haspopup', 'listbox')
  trigger.setAttribute('aria-expanded', 'false')
  const valueEl = el('span', 'echarts-dropdown-value', current.label)
  const arrow = el('span', 'echarts-dropdown-arrow', '▾')
  trigger.appendChild(valueEl)
  trigger.appendChild(arrow)

  let panel: HTMLElement | null = null
  let off: Array<() => void> = []

  const close = () => {
    off.forEach(fn => fn())
    off = []
    panel?.remove()
    panel = null
    trigger.setAttribute('aria-expanded', 'false')
    if (activeDropdown?.close === close) activeDropdown = null
  }

  const open = () => {
    activeDropdown?.close()
    const root = trigger.getRootNode() as ShadowRoot | Document
    const mount: Element | ShadowRoot = root instanceof ShadowRoot ? root : document.body
    panel = el('div', 'echarts-dropdown-panel')
    panel.setAttribute('role', 'listbox')
    for (const item of options) {
      const optionEl = el('div', `echarts-dropdown-option${item.value === value ? ' is-active' : ''}`, item.label)
      optionEl.setAttribute('role', 'option')
      optionEl.setAttribute('aria-selected', item.value === value ? 'true' : 'false')
      optionEl.addEventListener('click', ev => {
        ev.stopPropagation()
        close()
        onCommit(item.value)
      })
      panel.appendChild(optionEl)
    }
    mount.appendChild(panel)
    // 定位在触发钮正下方：fixed 相对视口，shadow 内亦如此（祖先无 transform）
    const rect = trigger.getBoundingClientRect()
    panel.style.left = `${rect.left}px`
    panel.style.top = `${rect.bottom + 4}px`
    panel.style.minWidth = `${rect.width}px`
    trigger.setAttribute('aria-expanded', 'true')
    activeDropdown = { close }

    const onPointerDown = (ev: Event) => {
      const path = composedPathOf(ev)
      if (path.includes(trigger) || path.includes(panel!)) return
      close()
    }
    const onKeydown = (ev: Event) => { if ((ev as KeyboardEvent).key === 'Escape') close() }
    const onScroll = () => close()
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeydown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    root.addEventListener('scroll', onScroll, true)
    off.push(
      () => document.removeEventListener('pointerdown', onPointerDown, true),
      () => document.removeEventListener('keydown', onKeydown),
      () => window.removeEventListener('scroll', onScroll, true),
      () => window.removeEventListener('resize', onScroll),
      () => root.removeEventListener('scroll', onScroll, true),
    )
  }

  trigger.addEventListener('click', ev => {
    ev.stopPropagation()
    if (panel) close()
    else open()
  })
  return trigger
}

const OVERFLOW_OPTIONS = [
  { value: '', label: t('echarts.panel.overflow.default') },
  { value: 'none', label: t('echarts.panel.overflow.none') },
  { value: 'truncate', label: t('echarts.panel.overflow.truncate') },
  { value: 'break', label: t('echarts.panel.overflow.break') },
] as const

const FONT_WEIGHT_OPTIONS = [
  { value: '', label: t('echarts.panel.fontWeight.default') },
  { value: 'normal', label: t('echarts.panel.fontWeight.normal') },
  { value: 'bold', label: t('echarts.panel.fontWeight.bold') },
] as const

const STYLE_FIELD_LABELS: Partial<Record<LabelFieldKey, string>> = {
  distance: t('echarts.panel.label.distance'),
  rotate: t('echarts.panel.label.rotate'),
  fontSize: t('echarts.panel.label.fontSize'),
  fontWeight: t('echarts.panel.label.fontWeight'),
  color: t('echarts.panel.label.color'),
  backgroundColor: t('echarts.panel.label.backgroundColor'),
  borderColor: t('echarts.panel.label.borderColor'),
  borderWidth: t('echarts.panel.label.borderWidth'),
  borderRadius: t('echarts.panel.label.borderRadius'),
  padding: t('echarts.panel.label.padding'),
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
    const holder = el('span')
    render(colorPicker({
      value: value ?? '',
      title: STYLE_FIELD_LABELS[key] ?? key,
      onChange: next => commit({ [key]: next ?? '' } as ChartLabelPatch),
    }), holder)
    wrap.appendChild(holder)
    return wrap
  }

  const group = el('details', 'echarts-label-group') as HTMLDetailsElement
  group.open = state.show
  // 总开关必须放在 summary 里：关闭标签时 details 折叠，若开关在内容区用户就再也点不到它
  const summary = el('summary', 'echarts-label-summary')
  const toggle = checkboxField(t('echarts.panel.label.show'), state.show, checked => commit({ enabled: checked }))
  // 点击开关本身不应连带折叠 details
  toggle.querySelector('input')?.addEventListener('click', event => event.stopPropagation())
  summary.appendChild(toggle)
  group.appendChild(summary)

  if (has('formatter') || has('overflow')) {
    group.appendChild(el('div', 'echarts-label-sub', t('echarts.panel.label.content')))
    if (has('formatter')) {
      const wrap = field(t('echarts.panel.label.formatterTitle'))
      wrap.appendChild(
        selectInput(
          [{ value: '', label: t('echarts.panel.label.formatterCustom') }, ...LABEL_PRESETS.map(preset => ({ value: preset.formatter, label: t(preset.labelKey) }))],
          state.formatter ?? '',
          value => commit({ formatter: value }),
        ),
      )
      wrap.appendChild(
        textInput({ value: state.formatter ?? '', placeholder: t('echarts.panel.label.formatterPlaceholder') }, value => commit({ formatter: value })),
      )
      group.appendChild(wrap)
    }
    if (has('overflow')) {
      const wrap = field(t('echarts.panel.label.overflow'))
      wrap.appendChild(selectInput(OVERFLOW_OPTIONS, state.overflow ?? '', value => commit({ overflow: value })))
      group.appendChild(wrap)
    }
  }

  if (has('position') || has('distance') || has('rotate') || has('offset')) {
    group.appendChild(el('div', 'echarts-label-sub', t('echarts.panel.label.position')))
    if (has('position')) {
      const wrap = field(t('echarts.panel.label.positionTitle'))
      const positions = def ? LABEL_POSITIONS[def.seriesType] ?? [] : []
      wrap.appendChild(
        selectInput([{ value: '', label: t('echarts.panel.label.positionDefault') }, ...positions.map(p => ({ value: p.value, label: t(p.labelKey) }))], state.position ?? '', value => commit({ position: value })),
      )
      group.appendChild(wrap)
    }
    if (has('distance')) group.appendChild(numberField('distance', state.distance))
    if (has('rotate')) group.appendChild(numberField('rotate', state.rotate))
    if (has('offset')) {
      const wrap = field(t('echarts.panel.label.offset'))
      const row = el('div', 'echarts-field-row')
      const current: [number, number] = state.offset ?? [0, 0]
      // ECharts 只认 offset: [x, y]；从两个输入框实时取值整对写回，空输入按 0 处理
      const inputX = textInput({ value: String(current[0] ?? 0), type: 'number' }, () => commitOffset())
      const inputY = textInput({ value: String(current[1] ?? 0), type: 'number' }, () => commitOffset())
      function commitOffset(): void {
        const parse = (input: HTMLInputElement, fallback: number): number => {
          const text = input.value.trim()
          if (text === '') return 0
          const value = Number(text)
          return Number.isFinite(value) ? value : fallback
        }
        commit({ offset: [parse(inputX, current[0] ?? 0), parse(inputY, current[1] ?? 0)] })
      }
      row.appendChild(inputX)
      row.appendChild(inputY)
      wrap.appendChild(row)
      group.appendChild(wrap)
    }
  }

  const styleKeys: LabelFieldKey[] = ['fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderColor', 'borderWidth', 'borderRadius', 'padding']
  if (styleKeys.some(has)) {
    group.appendChild(el('div', 'echarts-label-sub', t('echarts.panel.label.style')))
    if (has('fontSize')) group.appendChild(numberField('fontSize', state.fontSize))
    if (has('fontWeight')) {
      const wrap = field(t('echarts.panel.labelLine.fontWeight'))
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
    group.appendChild(el('div', 'echarts-label-sub', t('echarts.panel.labelLine')))
    group.appendChild(
      checkboxField(t('echarts.panel.labelLine.show'), state.labelLine.show === true, checked => commit({ labelLine: { show: checked } })),
    )
    if (has('labelLine.length')) {
      const wrap = field(t('echarts.panel.labelLine.length'))
      wrap.appendChild(
        textInput(
          { value: state.labelLine.length === undefined ? '' : String(state.labelLine.length), type: 'number' },
          raw => commitLineNumber('length', raw),
        ),
      )
      group.appendChild(wrap)
    }
    if (has('labelLine.length2')) {
      const wrap = field(t('echarts.panel.labelLine.length2'))
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
        checkboxField(t('echarts.panel.labelLine.smooth'), state.labelLine.smooth === true, checked => commit({ labelLine: { smooth: checked } })),
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
  // 业务字段清单：fieldKey → fieldLabel，用于下拉展示「中文名（键）」
  const fieldLabels = fieldLabelMap(ctx.fields)

  const root = el('div', 'echarts-property')
  const form = el('form', 'pd-form')
  form.addEventListener('submit', event => event.preventDefault())
  root.appendChild(form)

  if (has('dataSource')) {
    const wrap = field(t('echarts.panel.dataSourceTitle'))
    const current = String(options.chartDataSource ?? '')
    wrap.appendChild(
      dropdownSelect(
        dropdownOptions(dataSourceCandidates(ctx.data), current, fieldLabels),
        current,
        value => commitOption(ctx, type, panelOption(element), { chartDataSource: value }),
      ),
    )
    form.appendChild(wrap)
  }

  if (has('categoryField')) {
    const wrap = field(t('echarts.panel.categoryField'))
    const current = String(options.chartCategoryField ?? '')
    wrap.appendChild(
      dropdownSelect(
        dropdownOptions(dataRowFields(ctx.data, String(options.chartDataSource ?? '')), current, fieldLabels),
        current,
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
        dropdownSelect(
          dropdownOptions(dataRowFields(ctx.data, String(options.chartDataSource ?? '')), value, fieldLabels),
          value,
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
        remove.title = t('echarts.panel.removeField')
        remove.addEventListener('click', () => syncValueFields(ctx, type, readValueFields(element).filter((_, i) => i !== index)))
        row.appendChild(remove)
      }
      wrap.appendChild(row)
    })
    if (fieldsNow.length < limit) {
      const add = el('button', 'pd-button small', t('echarts.panel.addField'))
      add.type = 'button'
      add.addEventListener('click', () => syncValueFields(ctx, type, [...readValueFields(element), '']))
      wrap.appendChild(add)
    }
    form.appendChild(wrap)
  }

  if (has('seriesField')) {
    const wrap = field(t('echarts.panel.seriesField'))
    wrap.appendChild(
      textInput(
        { value: String(options.chartSeriesField ?? ''), placeholder: t('echarts.panel.seriesFieldHint') },
        value => commitOption(ctx, type, panelOption(element), { chartSeriesField: value }),
      ),
    )
    form.appendChild(wrap)
  }

  if (has('bubble')) {
    form.appendChild(
      checkboxField(t('echarts.panel.bubbleSize'), options.chartBubble === true, checked => {
        commitOption(ctx, type, panelOption(element), { chartBubble: checked })
      }),
    )
  }

  if (has('title')) {
    const wrap = field(t('echarts.panel.title'))
    wrap.appendChild(
      textInput(
        { value: String(asObject(panelOption(element).title).text ?? ''), placeholder: t('echarts.panel.titleHint') },
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
      checkboxField(t('echarts.panel.legend'), show, checked => {
        const next = panelOption(element)
        next.legend = { ...asObject(next.legend), show: checked }
        commitOption(ctx, type, next)
      }),
    )
  }

  if (has('palette')) {
    const wrap = field(t('echarts.panel.palette'))
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
      checkboxField(t('echarts.panel.stack'), stacked, checked => {
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
    const wrap = field(t('echarts.panel.innerRadius'))
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
    const wrap = field(t('echarts.panel.paddingTRBL'))
    const padding = readFunnelPadding(panelOption(element), widthMm, heightMm)
    const row = el('div', 'echarts-field-row')
    const sides: { side: keyof FunnelPadding; title: string }[] = [
      { side: 'top', title: t('echarts.panel.paddingTop') },
      { side: 'right', title: t('echarts.panel.paddingRight') },
      { side: 'bottom', title: t('echarts.panel.paddingBottom') },
      { side: 'left', title: t('echarts.panel.paddingLeft') },
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
    const wrap = field(t('echarts.panel.radius'))
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
    const wrap = field(t('echarts.panel.minMax'))
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

  form.appendChild(el('p', 'pd-hint', panelHint()))
  return root
}

export const CHART_ELEMENT_UI: ElementUI = defineElementUI({
  types: CHART_KINDS,
  renderCanvas,
  renderProperty,
  hasProperties: chartHasProperties,
  group: t('echarts.panel.group'),
  searchKeywords: SEARCH_KEYWORDS,
  styles: STYLES,
  i18nId: 'echarts',
  locales: { 'zh-CN': echartsZhCN, 'en-US': echartsEnUS, 'th-TH': echartsThTH },
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
