// 格式工具栏区段：DOM 对齐 Vue 3 轨的 FormatToolbar.vue
// （.format-toolbar > .ft-group > .ft-btn / .ft-font>.font-select>input.font-select-input+ul.font-select-list
//   （候选项 li.font-select-option.is-active/.is-muted，见 shell/font-select.ts）/ .ft-size /
//  .ft-color-btn>.ft-glyph / .ft-align-panel>.ft-align-row>.ft-cell-btn / .ft-border-panel>.ft-border-grid /
//  .ft-style-row / .ft-border-style-row>.ft-edge-label / .ft-line-width）。
// 逻辑全部走 core/format.ts（从 useFormatToolbar + useFormatPainter 移植），本文件只负责呈现与派发。
import { tr } from './controls.js'
import { h } from '../core/h'
import { iconSvg } from '../core/icons'
import type { VerticalAlign } from '@worm-print-platform/core/designer'
import { colorTrigger, dropdown, field, stepper } from './controls'
import type { ShellCtx } from './controls'
import { renderFontSelect } from './font-select'
import { MIXED } from '../core/format'
import type { FormatToolbar } from '../core/format'

type FormatCtx = ShellCtx & { format: FormatToolbar }

const LINE_STYLES = [
  { key: 'solid', labelKey: 'formatBar.k54', preview: '1.5px solid currentColor' },
  { key: 'dashed', labelKey: 'formatBar.k55', preview: '1.5px dashed currentColor' },
  { key: 'dotted', labelKey: 'formatBar.k56', preview: '1.5px dotted currentColor' },
  { key: 'double', labelKey: 'formatBar.k57', preview: '3px double currentColor' },
]

const ALIGN_ICON: Record<string, string> = {
  left: 'TextAlignStart', center: 'TextAlignCenter', right: 'TextAlignEnd', justify: 'TextAlignJustify',
}

/** 边框格子按钮：内联 18×18 示意 SVG，与 Vue 3 轨 逐格同形 */
function borderCell(test: string, tip: string, shape: string, onClick: () => void, opts: { on?: boolean; disabled?: boolean } = {}) {
  return h('button', {
    type: 'button',
    class: `ft-cell-btn${opts.on ? ' on' : ''}`,
    dataset: { test, tip },
    disabled: !!opts.disabled,
    onClick,
    html: `<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">${shape}</svg>`,
  })
}

const RECT_FAINT = '<rect class="g-faint" x="2.5" y="2.5" width="13" height="13" />'
const RECT_SOLID = '<rect class="g-solid" x="2.5" y="2.5" width="13" height="13" fill="none" />'

export function renderFormatBar(ctx: FormatCtx) {
  const f = ctx.format
  // 单元格选区变化时把边框三行回填为该格真实规格；用户草稿在 key 不变时保留
  f.syncBorderDraft()
  const values = f.values
  const fontDisabled = !f.fontEditable
  const decoDisabled = fontDisabled || f.context === 'cells'
  const borderDisabled = f.context === 'none'
  const isCells = f.context === 'cells'
  // Vue 3 轨口径：非刷取态下，无选中 / 单元格上下文 / 多选都禁用（capturable 只保证「恰好一个元素」）
  const painterDisabled = !f.painterActive
    && (f.context === 'none' || f.context === 'cells' || !f.painterCapturable)
  const painterTip = f.painterActive ? tr(ctx, 'formatBar.k58')
    : f.context === 'cells' ? tr(ctx, 'formatBar.k59')
      : f.context === 'none' ? tr(ctx, 'formatBar.k60')
        : !f.painterCapturable ? tr(ctx, 'formatBar.k61')
          : tr(ctx, 'formatBar.k62')
  const fontTipBase = (base: string) => fontDisabled ? tr(ctx, 'formatBar.k63', { v0: base }) : base

  const borderPanel = [
    h('div', { class: 'ft-border-panel', dataset: { test: 'border-panel' } }, [
      h('div', { class: 'ft-border-grid' }, [
        borderCell('preset-none', tr(ctx, 'formatBar.k64'), `${RECT_FAINT}<line class="g-solid" x1="4" y1="14" x2="14" y2="4" />`, () => f.applyBorderPreset('none')),
        borderCell('preset-all', tr(ctx, 'formatBar.k65'), `${RECT_SOLID}<line class="g-solid" x1="9" y1="3" x2="9" y2="15" /><line class="g-solid" x1="3" y1="9" x2="15" y2="9" />`, () => f.applyBorderPreset('all')),
        borderCell('preset-outer', tr(ctx, 'formatBar.k66'), RECT_SOLID, () => f.applyBorderPreset('outer')),
        borderCell('preset-inner', isCells ? tr(ctx, 'formatBar.k67') : tr(ctx, 'formatBar.k68'),
          `${RECT_FAINT}<line class="g-solid" x1="9" y1="3" x2="9" y2="15" /><line class="g-solid" x1="3" y1="9" x2="15" y2="9" />`,
          () => f.applyBorderPreset('inner'), { disabled: !isCells }),
        borderCell('edge-top', tr(ctx, 'formatBar.k69'), `${RECT_FAINT}<line class="g-solid" x1="2" y1="3" x2="16" y2="3" />`, () => f.applyEdge('top'), { on: f.edgeOn('top') }),
        borderCell('edge-bottom', tr(ctx, 'formatBar.k70'), `${RECT_FAINT}<line class="g-solid" x1="2" y1="15" x2="16" y2="15" />`, () => f.applyEdge('bottom'), { on: f.edgeOn('bottom') }),
        borderCell('edge-left', tr(ctx, 'formatBar.k71'), `${RECT_FAINT}<line class="g-solid" x1="3" y1="2" x2="3" y2="16" />`, () => f.applyEdge('left'), { on: f.edgeOn('left') }),
        borderCell('edge-right', tr(ctx, 'formatBar.k72'), `${RECT_FAINT}<line class="g-solid" x1="15" y1="2" x2="15" y2="16" />`, () => f.applyEdge('right'), { on: f.edgeOn('right') }),
      ]),
      h('div', { class: 'ft-style-row' }, LINE_STYLES.map(s => h('button', {
        type: 'button',
        class: `ft-style-btn${f.borderStyle === s.key ? ' on' : ''}`,
        dataset: {
          test: `style-${s.key}`,
          tip: f.borderStyle === s.key ? tr(ctx, 'formatBar.k73', { v0: tr(ctx, s.labelKey) }) : tr(ctx, s.labelKey),
        },
        // 线型/粗细/颜色只暂存为「待应用规格」，点击预设或单边才落盘（与 Vue 3 轨口径一致）；再点已选中＝取消
        onClick: () => { f.toggleBorderStyle(s.key as 'solid' | 'dashed' | 'dotted' | 'double'); ctx.repaint() },
      }, [h('span', { class: 'ft-style-line', style: { borderTop: s.preview } })]))),
      h('div', { class: 'ft-border-style-row' }, [
        h('span', { class: 'ft-edge-label', text: tr(ctx, 'formatBar.k74') }),
        h('div', { class: 'ft-line-width' }, [stepper({
          value: f.borderWidth, min: 0.25, max: 5, step: 0.25,
          placeholder: f.borderMixed.width ? tr(ctx, 'formatBar.k75') : undefined,
          onCommit: v => { f.setBorderWidth(v); ctx.repaint() },
        })]),
      ]),
      h('div', { class: 'ft-border-style-row' }, [
        h('span', { class: 'ft-edge-label', text: tr(ctx, 'formatBar.k76') }),
        colorTrigger(f.borderColor, v => { f.setBorderColor(v); ctx.repaint() }, tr(ctx, 'formatBar.k77')),
      ]),
      f.borderMixedAny
        ? h('p', { class: 'pd-hint', text: tr(ctx, 'formatBar.k78') })
        : '',
    ].filter(Boolean)),
  ]

  const alignPanel = [
    h('div', { class: 'ft-align-panel', dataset: { test: 'align-panel' } }, [
      h('div', { class: 'ft-align-row' }, [
        ['left', tr(ctx, 'formatBar.k79'), 'TextAlignStart'], ['center', tr(ctx, 'formatBar.k80'), 'TextAlignCenter'], ['right', tr(ctx, 'formatBar.k81'), 'TextAlignEnd'], ['justify', tr(ctx, 'formatBar.k82'), 'TextAlignJustify'],
      ].map(([v, tip, icon]) => h('button', {
        type: 'button',
        class: `ft-cell-btn${values.textAlign === v ? ' on' : ''}`,
        dataset: { test: `align-${v}`, tip },
        disabled: fontDisabled,
        onClick: () => f.applyStyle({ textAlign: v as never }),
        html: iconSvg(icon),
      }))),
      h('div', { class: 'ft-align-row' }, [
        ['top', tr(ctx, 'formatBar.k83'), 'ArrowUpToLine'], ['middle', tr(ctx, 'formatBar.k84'), 'ChevronsUpDown'], ['bottom', tr(ctx, 'formatBar.k85'), 'ArrowDownToLine'],
      ].map(([v, tip, icon]) => h('button', {
        type: 'button',
        class: `ft-cell-btn${values.verticalAlign === v ? ' on' : ''}`,
        dataset: { test: `valign-${v}`, tip },
        disabled: fontDisabled,
        onClick: () => f.applyStyle({ verticalAlign: v as VerticalAlign }),
        html: iconSvg(icon),
      }))),
    ]),
  ]

  return h('div', { class: 'format-toolbar' }, [
    h('div', { class: 'tb-ou ft-group', dataset: { unit: 'painter' } }, [
      h('button', {
        type: 'button',
        class: `ft-btn${f.painterActive ? ' on' : ''}`,
        dataset: { test: 'format-painter', tip: painterTip },
        disabled: painterDisabled,
        // canvas：刷取中再点为退出；双击序列 click→click→dblclick，末次直接锁定捕获
        onClick: () => {
          if (f.painterActive) f.cancelPainter()
          else f.pickPainterSource(false)
          ctx.repaint()
        },
        onDblclick: () => { f.pickPainterSource(true); ctx.repaint() },
        html: iconSvg('Paintbrush'),
      }),
    ]),
    h('div', { class: 'tb-ou ft-group', dataset: { unit: 'font' } }, [
      h('div', { class: 'ft-font' }, [renderFontSelect({
        id: 'ft-font',
        state: ctx.state,
        fonts: ctx.host.fonts,
        // canvas：混选时输入框留空、占位显示「混合」
        value: typeof values.fontFamily === 'string' ? values.fontFamily : undefined,
        placeholder: values.fontFamily === MIXED ? tr(ctx, 'formatBar.k86') : tr(ctx, 'formatBar.k87'),
        disabled: fontDisabled,
        onChange: v => f.applyStyle({ fontFamily: v }),
      })]),
      h('div', { class: 'ft-size', dataset: { test: 'font-size' } }, [
        stepper({
          value: typeof values.fontSize === 'number' ? values.fontSize : undefined,
          min: 5, max: 72,
          disabled: fontDisabled,
          placeholder: values.fontSize === MIXED ? tr(ctx, 'formatBar.k88') : tr(ctx, 'formatBar.k89'),
          onCommit: v => f.applyStyle({ fontSize: v }),
        }),
      ]),
    ]),
    h('div', { class: 'tb-ou ft-group', dataset: { unit: 'style' } }, [
      ...([
        ['bold', 'Bold', tr(ctx, 'formatBar.k90'), () => f.toggleBold()],
        ['underline', 'Underline', tr(ctx, 'formatBar.k91'), () => f.toggleUnderline()],
        ['strike', 'Strikethrough', tr(ctx, 'formatBar.k92'), () => f.toggleStrike()],
      ] as const).map(([test, icon, base, run]) => h('button', {
        type: 'button',
        class: `ft-btn${values[test] === true ? ' on' : ''}`,
        dataset: { test, tip: fontTipBase(base) },
        disabled: test === 'bold' ? fontDisabled : decoDisabled,
        onClick: run,
        html: iconSvg(icon),
      })),
    ]),
    h('div', { class: 'tb-ou ft-group', dataset: { unit: 'color' } }, [
      h('span', {
        class: `ft-color-btn${fontDisabled ? ' dim' : ''}`,
        title: tr(ctx, 'formatBar.k93', { v0: fontDisabled ? tr(ctx, 'formatBar.fontDisabledHint') : '' }),
      }, [colorTrigger(typeof values.color === 'string' ? values.color : undefined, v => f.applyStyle({ color: v })), h('span', { class: 'ft-glyph', text: 'A' })]),
      h('span', { class: `ft-color-btn${borderDisabled ? ' dim' : ''}`, title: tr(ctx, 'formatBar.k94') }, [
        colorTrigger(typeof values.backgroundColor === 'string' ? values.backgroundColor : undefined, v => f.applyStyle({ backgroundColor: v })),
        h('span', { class: 'ft-glyph', html: iconSvg('PaintBucket', 14) }),
      ]),
    ]),
    h('div', { class: 'tb-ou ft-group', dataset: { unit: 'align' } }, [
      dropdown(ctx, 'align', {
        icon: ALIGN_ICON[String(values.textAlign)] ?? 'TextAlignStart',
        text: tr(ctx, 'formatBar.k95'),
        textClass: 'ft-btn-text',
        tip: fontDisabled ? tr(ctx, 'formatBar.k96') : tr(ctx, 'formatBar.k97'),
        disabled: fontDisabled,
        testId: 'align-dd',
      }, alignPanel),
    ]),
    h('div', { class: 'tb-ou ft-group', dataset: { unit: 'border' } }, [
      dropdown(ctx, 'border', {
        icon: 'Grid3x3',
        text: tr(ctx, 'formatBar.k98'),
        textClass: 'ft-btn-text',
        tip: borderDisabled ? tr(ctx, 'formatBar.k99') : tr(ctx, 'formatBar.k100'),
        disabled: borderDisabled,
        testId: 'border',
      }, borderPanel),
    ]),
  ])
}

/** 供状态栏/属性面板复用的排版行（保持与 Vue 3 轨同类名） */
export { field as formatField }
