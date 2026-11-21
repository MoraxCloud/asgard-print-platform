// 表达式编辑器弹窗：移植 print-canvas/src/components/ExpressionEditor.vue（无框架版）。
// 类名与 Vue 3 轨 逐字一致（样式由 scripts/gen-styles.mjs 从 canvas 派生，只认类名）。
//
// ─── 外部依赖清单（全部已在 core 中真实导出，无臆造）─────────────────────
//   @worm-print-platform/core/designer
//     · evaluateTemplate(text, ctx): string   模板求值（ designer/utils/expression-eval.ts ）
//     · DEFAULT_DEMO_DATA                     预览用示例数据（ designer/utils/demo-data.ts ）
//     · groupFields(fields): FieldGroup[]     业务字段按 fieldKey 首段分组（ designer/utils/field-groups.ts ）
//     · filterGroups(groups, keyword)         分组关键字过滤（ designer/utils/field-groups.ts ）
//     · type PrintBusinessField               宿主业务字段类型（ designer/types.ts ）
//   @worm-print-platform/core
//     · resolveSystemVariables(now?, page?)   系统变量取值，与渲染端同一实现（ render/data-binder.ts ）
//   ../core/h：h() 构造 DOM 描述、render() 落地、clear() 清空容器
//   未使用 iconSvg：canvas 版此处只有 emoji 字形与「×」文本按钮，无 lucide 图标。
//
// ─── 接线示例（属性台内容分组 + 表格单元格两处）────────────────────────
//   // print-designer.ts 内：ShellCtx 增补 expressionTarget 状态即可
//   import { renderExpressionEditor } from './shell/expression-editor'
//   import type { ExpressionEditorTarget } from './shell/expression-editor'
//
//   // 1) 打开：内容分组输入框 dblclick 时 targetPath='options.formatter'
//   private exprTarget: ExpressionEditorTarget | null = null
//   openExpressionEditor(target: ExpressionEditorTarget) { this.exprTarget = target; this.repaint() }
//
//   // 2) 渲染：必须 render 进 shadow root 本身（作为 .designer-container 的兄弟节点），
//   //    不要塞进 .designer-container —— repaint() 会 clear(shell) 把弹窗抹掉。卸载同理用 .remove()。
//   private repaint() {
//     const shell = this.root.querySelector<HTMLElement>('.designer-container')!
//     clear(shell)
//     /* ...既有外壳渲染... */
//     this.root.querySelectorAll('.pd-dialog-overlay').forEach(n => n.remove())
//     if (this.exprTarget) {
//       render(renderExpressionEditor({
//         fields: this.store.fields,
//         // demoData 可省：内部已并入 DEFAULT_DEMO_DATA 与系统变量；需按宿主数据预览时传
//         // { rows: [...明细行], supplier: {...} } 之类
//         onClose: () => { this.exprTarget = null; this.repaint() },
//         onApply: next => {
//           const t = this.exprTarget!
//           if (t.targetPath === 'options.formatter') {
//             this.store.updateElement(t.elementId, {
//               formatter: next.formatter ?? '',
//               ...(next.title !== undefined ? { title: next.title } : {}),
//             })
//           } else if (t.targetPath.startsWith('cell:')) {
//             // 表格单元格：自行按 'cell:<rowId>:<colIndex>' 定位后写 cell.formatter
//           }
//           // 只负责写回；关弹窗由紧随其后的 onClose 统一处理（点确定时内部会依次调用两者）
//         },
//       }, this.exprTarget), this.root)
//     }
//   }
//
// ─── 事件绑定与解绑说明（无常驻 window 监听）────────────────────────
//   所有监听都由 h() 的 on* 通过 addEventListener 挂在弹窗自身子树上：取消/确定/关闭按钮的
//   onClick、遮罩 div 的 onKeydown（Esc 关闭，对齐 Vue 3 轨的 @keydown.esc，只在焦点位于弹窗内时触发）、
//   页签/列表项/搜索框/文本域的事件同理。关闭即由调用方把遮罩节点从 shadow root 移除（见上），
//   节点连同监听一起被 GC，无需手动 removeEventListener。与 Vue 3 轨一致：点遮罩空白处不关闭，
//   只有 Esc / × / 取消 / 确定四条退出路径。
//
// ─── Teleport 改 shadow 内的差异 ───────────────────────────────────
//   Vue 3 轨用 position: fixed 的 .pd-dialog-overlay 覆盖整个视口（Teleport 到 body）。
//   本包只能渲染进 shadow root：.pd-dialog-overlay 的 fixed 定位依旧相对视口，视觉与 Vue 3 轨一致，
//   但 z-index: 2000 只在 <print-designer> 自身的层叠上下文内生效——宿主页面若有更高层叠元素会盖住弹窗；
//   若某个祖先带 transform/filter/contain，fixed 会退化为受该祖先定位。两种情况下把遮罩改为
//   position: absolute 并挂到已 position: relative 的宿主容器内即可（类名保持不变，样式不受影响）。
//   另外 Vue 3 轨的弹窗在组件树里由 v-model 控制显隐，本包改为「调用方决定 DOM 存在与否」。
//   内部状态是闭包对象 state（activeTab/searchText/expression/binding），配一个 repaint(root) 做显式重绘
//   （页签高亮、搜索占位、列表、文本域、预览）；换 target 就重新调用本函数拿新 DOM，无需 update 接口。
import { DEFAULT_DEMO_DATA, copyTextToClipboard, evaluateTemplate, filterGroups, groupFields } from '@worm-print-platform/core/designer'
import type { PrintBusinessField } from '@worm-print-platform/core/designer'
import { t as globalT } from '@worm-print-platform/core/i18n'
import type { Translate } from '@worm-print-platform/core/i18n'

/** 渲染期 translator：由 opts.t 设置，缺省用全局 t */
let tr: Translate = globalT
import { resolveSystemVariables } from '@worm-print-platform/core'
import { clear, h, render } from './dom.js'
import type { El } from './dom.js'

// 本文件用到 Copy / Check 两个图标；plugin-kit 不依赖 canvas 私有 icons，
// 这里内联这两个 lucide 片段（viewBox 0 0 24 24，stroke currentColor），与 core 清单逐字一致。
const ICON_PATHS: Record<string, string> = {
  Check: '<path d="M20 6 9 17l-5-5" />',
  Copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />',
}
function iconSvg(name: string, size = 16): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name] ?? ''}</svg>`
}

export interface ExpressionEditorTarget {
  /** 元素 id（表格单元格时用于定位） */
  elementId: string
  /** 要写回的目标路径，如 'options.formatter' 或 'cell:<rowId>:<colIndex>' */
  targetPath: string
  /** 当前表达式文本 */
  value: string
  /** 可选：字段绑定模式的初始字段 key */
  binding?: string
}

/** 字段行显示模式：中文名 / key / 两者（默认 both，保持既有行为） */
export type FieldDisplayMode = 'label' | 'key' | 'both'

/** 归一化宿主传入的显示模式：trim + 小写；非法值静默回退 both */
export function normalizeFieldDisplay(v: unknown): FieldDisplayMode {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : ''
  return s === 'label' || s === 'key' || s === 'both' ? s : 'both'
}

export interface ExpressionEditorOptions {
  fields: PrintBusinessField[]
  /** 求值预览用的样例行数据 */
  demoData?: Record<string, any>
  /** 字段行显示模式；缺省 / 非法值按 both（中文名 + key） */
  fieldDisplay?: FieldDisplayMode
  /** 当前 locale 的翻译函数；缺省用全局 t */
  t?: Translate
  /** 关闭弹窗 */
  onClose: () => void
  /** 点确定：把最终表达式回写 */
  onApply: (next: { formatter?: string; binding?: string; title?: string }) => void
}

type TabKey = 'field' | 'variable' | 'function'

/** 与 Vue 3 轨的 .ee-nav-tab 顺序严格一致（重绘时按下标取元素，不额外加属性） */
function getTabs(): { key: TabKey; text: string }[] {
  return [
    { key: 'field', text: tr('expression.tabField') },
    { key: 'variable', text: tr('expression.tabVariable') },
    { key: 'function', text: tr('expression.tabFunction') },
  ]
}

function getPlaceholder(): Record<TabKey, string> {
  return {
    field: tr('expression.placeholderField'),
    variable: tr('expression.placeholderVariable'),
    function: tr('expression.placeholderFunction'),
  }
}

interface FnItem { name: string; label: string; template: string }

function getAggregateFunctions(): FnItem[] {
  return [
    { name: 'SUM', label: tr('expression.fnSum'), template: 'SUM()' },
    { name: 'AVG', label: tr('expression.fnAvg'), template: 'AVG()' },
    { name: 'COUNT', label: tr('expression.fnCount'), template: 'COUNT()' },
    { name: 'MIN', label: tr('expression.fnMin'), template: 'MIN()' },
    { name: 'MAX', label: tr('expression.fnMax'), template: 'MAX()' },
  ]
}
function getMathFunctions(): FnItem[] {
  return [
    { name: 'ADD', label: tr('expression.fnAdd'), template: 'ADD()' },
    { name: 'SUB', label: tr('expression.fnSub'), template: 'SUB()' },
    { name: 'MUL', label: tr('expression.fnMul'), template: 'MUL()' },
    { name: 'DIV', label: tr('expression.fnDiv'), template: 'DIV()' },
    { name: 'ROUND', label: tr('expression.fnRound'), template: 'ROUND()' },
    { name: 'ROUNDUP', label: tr('expression.fnRoundUp'), template: 'ROUNDUP()' },
    { name: 'ROUNDDOWN', label: tr('expression.fnRoundDown'), template: 'ROUNDDOWN()' },
    { name: 'ROUNDBANK', label: tr('expression.fnRoundBank'), template: 'ROUNDBANK()' },
  ]
}
function getFormatFunctions(): FnItem[] {
  return [
    { name: 'MONEY', label: tr('expression.fnMoney'), template: 'MONEY()' },
    { name: 'DATE', label: tr('expression.fnDate'), template: 'DATE()' },
    { name: 'UPPER', label: tr('expression.fnUpper'), template: 'UPPER()' },
    { name: 'IF', label: tr('expression.fnIf'), template: 'IF()' },
  ]
}
function getSystemVariables(): FnItem[] {
  return [
    { name: 'pageIndex', label: tr('expression.varPageIndex'), template: '{pageIndex}' },
    { name: 'totalPages', label: tr('expression.varTotalPages'), template: '{totalPages}' },
    { name: 'printDate', label: tr('expression.varPrintDate'), template: '{printDate}' },
    { name: 'printTime', label: tr('expression.varPrintTime'), template: '{printTime}' },
  ]
}

function getFuncGroups(): { title: string; items: FnItem[] }[] {
  return [
    { title: tr('expression.groupAggregate'), items: getAggregateFunctions() },
    { title: tr('expression.groupMath'), items: getMathFunctions() },
    { title: tr('expression.groupFormat'), items: getFormatFunctions() },
  ]
}

const EMPTY_PREVIEW_KEY = 'expression.previewEmpty'
const NO_VALUE_PREVIEW_KEY = 'expression.previewNoValue'
const ERROR_PREVIEW_KEY = 'expression.previewError'


/** 与 Vue 3 轨的 previewResult 同逻辑：默认示例数据 < 宿主 demoData < 系统变量 */
function previewText(expr: string, demoData?: Record<string, any>): string {
  if (!expr.trim()) return tr(EMPTY_PREVIEW_KEY)
  try {
    const ctx = { ...DEFAULT_DEMO_DATA, ...(demoData ?? {}), ...resolveSystemVariables() }
    const result = evaluateTemplate(expr, ctx)
    if (result === undefined || result === null) return tr(NO_VALUE_PREVIEW_KEY)
    return String(result)
  } catch {
    return tr(ERROR_PREVIEW_KEY)
  }
}

/** 关键字过滤（label / name 小写包含），对齐 Vue 3 轨的 filtered* computed */
function matchKeyword(items: FnItem[], keyword: string): FnItem[] {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return items
  return items.filter(it => it.label.toLowerCase().includes(kw) || it.name.toLowerCase().includes(kw))
}

/** 光标上下文：最近的 { 未闭合 → 在表达式块内；最近的 ( 未闭合 → 在函数参数内 */
function cursorRegion(text: string, caret: number): { insideBlock: boolean; insideParens: boolean } {
  const before = text.substring(0, caret)
  const lastBlockOpen = before.lastIndexOf('{')
  const insideBlock = lastBlockOpen !== -1 && !before.slice(lastBlockOpen + 1).includes('}')
  const lastParenOpen = before.lastIndexOf('(')
  const insideParens = lastParenOpen !== -1 && !before.slice(lastParenOpen + 1).includes(')')
  return { insideBlock, insideParens }
}

/** 字段 key 是否含中文（与 lexer 的 CJK 标识符范围一致），用于决定要不要提示写法 */
const hasChineseKey = (key: string): boolean => /[\u4e00-\u9fff]/.test(key)

/** 中文 key 的正确表达式写法提示（双击插入时即时显示 + 帮助区常驻） */
const chineseKeyHint = (key: string): string =>
  `字段「${key}」含中文，请用 {${key}} 引用（函数参数内写 ${key}）；中文可直接在 {} 中使用，无需 data['...'] 方括号`

/** 单一 {字段} 形式才回写 binding/title（对应 Vue 3 轨 拖字段时 formatter + title 同源） */
function pureFieldBinding(expr: string, fields: PrintBusinessField[]): PrintBusinessField | null {
  const matched = /^\{\s*([^{}]+?)\s*\}$/.exec(expr.trim())
  if (!matched) return null
  const key = matched[1] ?? ''
  return fields.find(f => f.fieldKey === key) ?? null
}

/** 列表项两行信息（标签 + key/模板），三个页签共用同一结构；字段页签可按宿主配置隐藏其中一行 */
function itemInfo(label: string, key: string, display: FieldDisplayMode = 'both'): El {
  if (display === 'label') return h('div', { class: 'ee-field-info' }, [
    h('span', { class: 'ee-item-label', text: label }),
  ])
  if (display === 'key') return h('div', { class: 'ee-field-info' }, [
    h('span', { class: 'ee-item-key is-primary', text: key }),
  ])
  return h('div', { class: 'ee-field-info' }, [
    h('span', { class: 'ee-item-label', text: label }),
    h('span', { class: 'ee-item-key', text: key }),
  ])
}

/** 事件元素的渲染作用域（shadow root 或 document）：重绘只在该子树内查询，不外溢到宿主页面 */
function scope(ev: Event): Document | ShadowRoot {
  return (ev.currentTarget as Element).getRootNode() as Document | ShadowRoot
}

function helpCard(modifier: string, title: string, lines: string[]): El {
  const content: unknown[] = []
  lines.forEach((line, i) => {
    content.push(line)
    if (i < lines.length - 1) content.push(h('br'))
  })
  return h('div', { class: `ee-help-card ${modifier}` }, [
    h('div', { class: 'ee-help-card-title', text: title }),
    h('div', { class: 'ee-help-card-content' }, content),
  ])
}

/** 帮助信息四卡：文案逐字照抄 canvas */
function helpSection(): El {
  return h('div', { class: 'ee-help-section' }, [
    h('div', { class: 'ee-help-title', text: tr('expression.k1') }),
    h('div', { class: 'ee-help-grid' }, [
      helpCard('ee-help-field', tr('expression.k2'), [
        tr('expression.k3'),
        tr('expression.k4'),
        tr('expression.k5'),
        tr('expression.k6'),
        tr('expression.k7'),
        tr('expression.k8'),
        tr('expression.k9'),
      ]),
      helpCard('ee-help-function', tr('expression.k10'), [
        tr('expression.k11'),
        tr('expression.k12'),
        tr('expression.k13'),
        tr('expression.k14'),
        tr('expression.k15'),
        tr('expression.k16'),
      ]),
      helpCard('ee-help-variable', tr('expression.k17'), [
        tr('expression.k18'),
        tr('expression.k19'),
        tr('expression.k20'),
      ]),
      helpCard('ee-help-conditional', tr('expression.k21'), [
        tr('expression.k22'),
        tr('expression.k23'),
        tr('expression.k24'),
        tr('expression.k25'),
        tr('expression.k26'),
      ]),
    ]),
  ])
}

/** 渲染表达式编辑器弹窗的 DOM 描述（内部已含遮罩层，render 进 shadow 根下即可） */
export function renderExpressionEditor(opts: ExpressionEditorOptions, target: ExpressionEditorTarget): El {
  tr = opts.t ?? globalT
  const fieldDisplay = normalizeFieldDisplay(opts.fieldDisplay)
  const state = {
    activeTab: 'field' as TabKey,
    searchText: '',
    expression: target.value || '',
    /** 字段绑定模式标记：仅当调用方给了初始 key，才在确定时回写 binding/title */
    binding: target.binding,
    /** 最近一次复制成功的字段 key：按钮图标 1.2s 内显示对勾（对齐 Vue 3 轨的 copiedKey） */
    copiedFieldKey: '',
    /** 双击插入中文 key 后的格式提示；插入英文字段/手动编辑时清空 */
    keyHint: '',
  }

  const query = <T extends Element>(root: ParentNode, selector: string) => root.querySelector<T>(selector)

  /** 重绘预览区：canvas 里是 computed，这里显式同步 */
  const updatePreview = (root: ParentNode) => {
    const el = query<HTMLElement>(root, '.ee-preview')
    if (!el) return
    const text = previewText(state.expression, opts.demoData)
    el.textContent = text
    el.classList.toggle('ee-preview-error', text === tr(ERROR_PREVIEW_KEY))
  }

  /** 重绘格式提示条：仅双击插入中文 key 时显示正确写法，其余情况隐藏 */
  const updateKeyHint = (root: ParentNode) => {
    const el = query<HTMLElement>(root, '.ee-key-hint')
    if (!el) return
    el.textContent = state.keyHint
    el.style.display = state.keyHint ? '' : 'none'
  }

  const listItems = (): unknown[] => {
    if (state.activeTab === 'variable') {
      return matchKeyword(getSystemVariables(), state.searchText).map(sv => h('div', {
        class: 'ee-list-item',
        onDblclick: (ev: Event) => {
          const { insideParens } = region(ev)
          insert(scope(ev), insideParens ? sv.template.replace(/^\{|\}$/g, '') : sv.template, undefined, '')
        },
      }, [itemInfo(sv.label, sv.template)]))
    }
    if (state.activeTab === 'function') {
      return getFuncGroups().map(group => h('div', { class: 'ee-func-group' }, [
        h('div', { class: 'ee-func-group-title', text: group.title }),
        ...matchKeyword(group.items, state.searchText).map(fn => h('div', {
          class: 'ee-list-item',
          onDblclick: (ev: Event) => {
            const { insideBlock } = region(ev)
            const text = insideBlock ? fn.template : `{${fn.template}}`
            insert(scope(ev), text, text.indexOf('(') + 1, '')
          },
        }, [itemInfo(fn.label, `${fn.name}()`)])),
      ]))
    }
    const groups = filterGroups(groupFields(opts.fields ?? []), state.searchText)
    if (!groups.length) return [h('p', { class: 'pd-empty', text: tr('expression.k27') })]
    const nodes: unknown[] = []
    for (const group of groups) {
      if (group.key) {
        nodes.push(h('div', { class: `ee-field-group${group.isList ? ' is-list' : ''}` }, [
          h('span', { class: 'ee-field-group-icon', text: group.isList ? '📋' : '📁' }),
          h('span', { text: group.label }),
        ]))
      }
      for (const field of group.fields) {
        nodes.push(h('div', {
          class: 'ee-list-item ee-field-item',
          style: { paddingLeft: group.key ? '22px' : '10px' },
          onDblclick: (ev: Event) => {
            const { insideParens } = region(ev)
            // 按住 Ctrl（Mac 为 ⌘）双击：插入字段中文名当静态文本；参数内自动加引号
            // macOS 上 Ctrl+点击会被 Chromium 当作右键（实测不派发 dblclick），故同时认 metaKey
            const mod = ev as MouseEvent
            if (mod.ctrlKey || mod.metaKey) {
              const name = field.fieldLabel || field.fieldKey
              insert(scope(ev), insideParens ? `"${name}"` : name, undefined, '')
              return
            }
            // 中文 key：插入后提示正确写法，避免误用 data['...'] 方括号（平铺上下文取不到值）
            insert(scope(ev), insideParens ? field.fieldKey : `{${field.fieldKey}}`, undefined,
              hasChineseKey(field.fieldKey) ? chineseKeyHint(field.fieldKey) : '')
          },
        }, [
          itemInfo(field.fieldLabel || field.fieldKey, field.fieldKey, fieldDisplay),
          // 字段右侧复制按钮：复制字段中文名（对齐 canvas ExpressionEditor 的 .ee-copy-btn）
          h('button', {
            type: 'button',
            class: `ee-copy-btn${state.copiedFieldKey === field.fieldKey ? ' is-copied' : ''}`,
            // 提示浮层由 print-designer 的 hover-tip 委托承担（容器白名单含 .pd-dialog-overlay）
            'data-tip': state.copiedFieldKey === field.fieldKey ? tr('expression.k28') : `复制字段名「${field.fieldLabel}」`,
            'aria-label': `复制字段名 ${field.fieldLabel}`,
            html: iconSvg(state.copiedFieldKey === field.fieldKey ? 'Check' : 'Copy', 13),
            onClick: (ev: Event) => {
              ev.stopPropagation()
              copyFieldName(ev, field)
            },
            onDblclick: (ev: Event) => ev.stopPropagation(),
          }),
        ]))
      }
    }
    return nodes
  }

  /** 显式重绘：页签高亮 / 搜索框 / 列表 / 文本域 / 预览（Vue 3 轨 的响应式更新在无框架版的等价物） */
  const repaint = (root: ParentNode) => {
    const tabs = Array.from(root.querySelectorAll<HTMLElement>('.ee-nav-tab'))
    tabs.forEach((el, i) => el.classList.toggle('active', getTabs()[i]?.key === state.activeTab))
    const search = query<HTMLInputElement>(root, '.ee-content-search .pd-input')
    if (search) {
      const placeholder = getPlaceholder()[state.activeTab]
      if (search.placeholder !== placeholder) search.placeholder = placeholder
      if (search.value !== state.searchText) search.value = state.searchText
    }
    const ta = query<HTMLTextAreaElement>(root, '.ee-textarea')
    if (ta && ta.value !== state.expression) ta.value = state.expression
    const list = query<HTMLElement>(root, '.ee-content-list')
    if (list) {
      clear(list)
      for (const item of listItems()) render(item as El, list)
    }
    updatePreview(root)
    updateKeyHint(root)
  }

  /** 单击字段右侧复制按钮：复制字段中文名，图标变对勾 1.2s 后复原（整体重绘模型，状态外置在 state） */
  function copyFieldName(ev: Event, field: PrintBusinessField) {
    const root = scope(ev)
    copyTextToClipboard(field.fieldLabel || field.fieldKey).then((ok) => {
      if (!ok) return
      state.copiedFieldKey = field.fieldKey
      repaint(root)
      setTimeout(() => {
        if (state.copiedFieldKey !== field.fieldKey) return
        state.copiedFieldKey = ''
        repaint(root)
      }, 1200)
    })
  }

  /** 光标所在上下文：决定插入时要不要带大括号 */
  const region = (ev: Event) => {
    const ta = query<HTMLTextAreaElement>(scope(ev), '.ee-textarea')
    const caret = ta?.selectionStart ?? state.expression.length
    return cursorRegion(state.expression, caret)
  }

  /** 在光标处插入文本并把光标放到 caretOffset；keyHint 传入时同步格式提示条 */
  const insert = (root: ParentNode, text: string, caretOffset = text.length, keyHint?: string) => {
    if (keyHint !== undefined) state.keyHint = keyHint
    const ta = query<HTMLTextAreaElement>(root, '.ee-textarea')
    if (!ta) {
      state.expression += text
      updatePreview(root)
      updateKeyHint(root)
      return
    }
    const start = ta.selectionStart ?? state.expression.length
    const end = ta.selectionEnd ?? start
    state.expression = state.expression.substring(0, start) + text + state.expression.substring(end)
    const caret = start + caretOffset
    // 先写值再定位光标：给 value 赋值会把光标推到末尾，顺序不能颠倒（Vue 3 轨 用 nextTick 达成同一效果）
    ta.value = state.expression
    ta.focus()
    ta.selectionStart = ta.selectionEnd = caret
    updatePreview(root)
    updateKeyHint(root)
  }

  /** 确定：先回写再关闭（对齐 Vue 3 轨的 emit('update:expression') + visible=false） */
  const onConfirm = () => {
    const formatter = state.expression
    if (state.binding === undefined) {
      opts.onApply({ formatter })
      opts.onClose()
      return
    }
    const field = pureFieldBinding(formatter, opts.fields ?? [])
    opts.onApply(field ? { formatter, binding: field.fieldKey, title: field.fieldLabel } : { formatter })
    opts.onClose()
  }

  const nav = h('div', { class: 'ee-nav' }, [
    h('div', { class: 'ee-nav-title', text: tr('expression.k29') }),
    h('div', { class: 'ee-nav-tabs' }, getTabs().map((tab, i) => h('div', {
      class: `ee-nav-tab${state.activeTab === tab.key ? ' active' : ''}`,
      text: tab.text,
      onClick: (ev: MouseEvent) => {
        state.activeTab = getTabs()[i]!.key
        repaint(scope(ev))
      },
    }))),
  ])

  const content = h('div', { class: 'ee-content' }, [
    h('div', { class: 'ee-content-search' }, [
      h('input', {
        class: 'pd-input',
        placeholder: getPlaceholder()[state.activeTab],
        onInput: (ev: Event) => {
          state.searchText = (ev.target as HTMLInputElement).value
          repaint(scope(ev))
        },
      }),
    ]),
    h('div', { class: 'ee-content-list' }, listItems()),
  ])

  const initialPreview = previewText(state.expression, opts.demoData)

  const editor = h('div', { class: 'ee-editor' }, [
    h('div', { class: 'ee-editor-section' }, [
      h('div', { class: 'ee-editor-title', text: tr('expression.k30') }),
      h('textarea', {
        class: 'ee-textarea',
        rows: 6,
        placeholder: tr('expression.k31'),
        text: state.expression,
        onInput: (ev: Event) => {
          state.expression = (ev.target as HTMLTextAreaElement).value
          state.keyHint = ''
          updatePreview(scope(ev))
          updateKeyHint(scope(ev))
        },
      }),
      h('div', {
        class: 'pd-hint ee-key-hint',
        style: { display: 'none', color: 'var(--pd-accent, #165DFF)' },
        text: '',
      }),
    ]),
    h('div', { class: 'ee-editor-section' }, [
      h('div', { class: 'ee-editor-title', text: tr('expression.k32') }),
      h('div', {
        class: `ee-preview${initialPreview === tr(ERROR_PREVIEW_KEY) ? ' ee-preview-error' : ''}`,
        text: initialPreview,
      }),
    ]),
    helpSection(),
  ])

  return h('div', {
    class: 'pd-dialog-overlay',
    onKeydown: (ev: KeyboardEvent) => { if (ev.key === 'Escape') opts.onClose() },
  }, [
    h('section', {
      class: 'pd-dialog pd-dialog-large',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'expression-editor-title',
    }, [
      h('header', { class: 'pd-dialog-header' }, [
        h('strong', { id: 'expression-editor-title', text: tr('expression.k33') }),
        h('button', { type: 'button', class: 'pd-close', 'aria-label': tr('expression.k34'), text: '×', onClick: () => opts.onClose() }),
      ]),
      h('div', { class: 'expression-editor' }, [nav, content, editor]),
      h('footer', { class: 'pd-dialog-footer' }, [
        h('button', { type: 'button', class: 'pd-button', text: tr('expression.k35'), onClick: () => opts.onClose() }),
        h('button', { type: 'button', class: 'pd-button primary', text: tr('expression.k36'), onClick: () => onConfirm() }),
      ]),
    ]),
  ])
}
