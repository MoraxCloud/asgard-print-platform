// 页面属性补充区段：设计背景 + 拼版打印。
// DOM 类名对齐 Vue 3 轨的 DesignBackgroundConfig.vue / TilingConfig.vue，
// 拼版的校验与布局数字全部走 core 纯函数（TILE_DEFAULTS / validateTiling / computeTileLayout 等）。
import { tr } from './controls.js'
import { getLocale } from '@worm-print-platform/core/i18n'
import { translateConstantLabel } from './label-translation.js'
import { PAPER_PRESETS, isContinuousPaperSize } from '@worm-print-platform/core/designer'
import {
  TILE_DEFAULTS, computeMaxColumns, computeTileLayout, resolveSheetMm, validateTiling,
} from '@worm-print-platform/core'
import type { TilingOptions } from '@worm-print-platform/core'
import { h } from '../core/h'
import type { El } from '../core/h'
import { divider, field, radioGroup, resetButton, stepper } from './controls'
import type { ShellCtx } from './controls'

const SHEET_PRESET_KEYS = Object.keys(PAPER_PRESETS)
  .filter(k => k !== 'CUSTOM' && !PAPER_PRESETS[k]?.continuous)

/** 设计背景：走宿主注入的 uploadDesignBackground（与 Vue 3 轨同契约，未注入时入口禁用） */
function backgroundUpload(ctx: ShellCtx) {
  const label = document.createElement('label')
  label.className = 'pd-button small upload-label'
  const textNode = document.createTextNode(tr(ctx, 'pageExtras.k103'))
  const input = document.createElement('input')
  input.className = 'visually-hidden'
  input.type = 'file'
  input.accept = 'image/*'
  label.append(textNode, input)

  const setDisabled = (disabled: boolean) => {
    label.className = `pd-button small upload-label${disabled ? ' disabled' : ''}`
    input.disabled = disabled
  }

  input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert(tr(ctx, 'pageExtras.k104'))
      input.value = ''
      return
    }
    const upload = ctx.host.uploadDesignBackground
    if (!upload) {
      alert(tr(ctx, 'pageExtras.k105'))
      input.value = ''
      return
    }
    setDisabled(true)
    textNode.textContent = tr(ctx, 'pageExtras.k106')
    try {
      const src = await upload(file)
      if (src) ctx.store.updateTemplateData({ designBackground: { src, rotation: 0 } } as never)
      else alert(tr(ctx, 'pageExtras.k107'))
    } catch (err) {
      alert(err instanceof Error ? err.message : tr(ctx, 'pageExtras.k108'))
    } finally {
      textNode.textContent = tr(ctx, 'pageExtras.k109')
      setDisabled(!ctx.host.uploadDesignBackground)
      input.value = ''
    }
  })
  if (!ctx.host.uploadDesignBackground) setDisabled(true)
  return label
}
export function designBackgroundSection(ctx: ShellCtx) {
  const t = ctx.store.templateData
  const bg = t.designBackground
  const rotation = bg?.rotation ?? 0
  return h('div', { class: 'design-background-config' }, [
    divider(tr(ctx, 'pageExtras.k110')),
    h('p', { class: 'design-background-tip', text: tr(ctx, 'pageExtras.k111') }),
    bg?.src
      ? [
        h('div', { class: 'design-background-path', title: bg.src, text: bg.src }),
        h('div', { class: 'design-background-actions' }, [
          h('button', {
            type: 'button', class: 'pd-button small rotate-btn',
            text: tr(ctx, 'pageExtras.k112', { v0: (rotation + 90) % 360 }),
            onClick: () => ctx.store.updateTemplateData({
              designBackground: { ...bg, rotation: ((rotation + 90) % 360) as 0 | 90 | 180 | 270 },
            }),
          }),
          h('button', {
            type: 'button', class: 'pd-button small remove-btn', text: tr(ctx, 'pageExtras.k113'),
            onClick: () => ctx.store.updateTemplateData({ designBackground: undefined }),
          }),
        ]),
      ]
      : backgroundUpload(ctx),
  ].flat())
}

/** 拼版打印：开关 + 目标纸 + 留白 + 间距列数 + 校验与摘要 */
export function tilingSection(ctx: ShellCtx) {
  const store = ctx.store
  const template = store.templateData
  const raw = template.tiling
  const cfg: TilingOptions = {
    ...TILE_DEFAULTS,
    ...(raw ?? {}),
    enabled: raw?.enabled ?? false,
    sheetMargin: { ...TILE_DEFAULTS.sheetMargin, ...(raw?.sheetMargin ?? {}) },
  }
  const labelContinuous = isContinuousPaperSize(template.paperSize)
  const patch = (partial: Partial<TilingOptions>) => store.updateTemplateData({ tiling: { ...cfg, ...partial } })
  /** 落点取 TILE_DEFAULTS。enabled 与 columns 不接：前者常量是 true 而组件把未配置读成 false，
   *  后者开启时按纸面收敛，两处口径不一致就没有可信落点（设计说明第十一节）。 */
  const tileReset = (key: string): El => resetButton({
    target: cfg as Record<string, any>, base: TILE_DEFAULTS as Record<string, any>, propKey: key,
    write: () => patch({ [key]: (TILE_DEFAULTS as Record<string, any>)[key] } as Partial<TilingOptions>),
  })
  const marginReset = (side: 'top' | 'bottom' | 'left' | 'right'): El => resetButton({
    target: cfg.sheetMargin as Record<string, any>, base: TILE_DEFAULTS.sheetMargin as Record<string, any>, propKey: side,
    write: () => patchMargin(side, (TILE_DEFAULTS.sheetMargin as Record<string, any>)[side]),
  })
  const patchMargin = (side: 'top' | 'right' | 'bottom' | 'left', value: number) =>
    patch({ sheetMargin: { ...cfg.sheetMargin, [side]: value ?? 0 } })
  const withTiling = { ...template, tiling: cfg }
  const issues = validateTiling(withTiling as never)
  const columnMax = Math.max(computeMaxColumns(withTiling as never), 1)
  let summary = ''
  if (!issues.length) {
    try {
      const l = computeTileLayout(withTiling as never)
      const s = resolveSheetMm(withTiling as never)
      const name = cfg.sheetPaperSize === 'CUSTOM' ? tr(ctx, 'pageExtras.k114') : (cfg.sheetPaperSize ?? 'A4')
      const dir = cfg.sheetPaperSize === 'CUSTOM' ? '' : (cfg.sheetOrientation === 'landscape' ? tr(ctx, 'pageExtras.k115') : tr(ctx, 'pageExtras.k116'))
      summary = tr(ctx, 'pageExtras.k117', { v0: name, v1: dir, v2: s.width, v3: s.height, v4: l.columns, v5: l.rows, v6: l.perSheet, v7: l.tile.width, v8: l.tile.height })
    } catch { summary = '' }
  }

  return h('div', { class: 'tiling-config', dataset: { test: 'tiling-config' } }, [
    divider(tr(ctx, 'pageExtras.k118')),
    h('p', { class: 'pd-hint', text: tr(ctx, 'pageExtras.k119') }),
    h('div', { class: 'pd-field' }, [
      h('label', { class: 'tiling-switch' }, [
        h('input', {
          type: 'checkbox', checked: cfg.enabled === true, disabled: labelContinuous,
          onChange: (ev: Event) => {
            const next = (ev.target as HTMLInputElement).checked
            // canvas onEnabledChange：打开时写入 TILE_DEFAULTS 并按纸面收敛列数
            // （目标纸很小时默认 2 列直接非法，连保存都会被拦）；关闭时保留其余字段
            if (!next) { patch({ enabled: false }); return }
            patch({ ...TILE_DEFAULTS, columns: Math.min(TILE_DEFAULTS.columns, Math.max(columnMax, 1)) })
          },
        }),
        h('span', { text: tr(ctx, 'pageExtras.k120') }),
      ]),
      labelContinuous ? h('p', { class: 'pd-hint tiling-error', text: tr(ctx, 'pageExtras.k121') }) : '',
    ].filter(Boolean)),
    cfg.enabled && !labelContinuous ? [
      field(tr(ctx, 'pageExtras.k122'), h('select', {
        class: 'pd-select',
        style: { width: '100%' },
        onChange: (ev: Event) => {
          const value = (ev.target as HTMLSelectElement).value
          if (value !== 'CUSTOM') { patch({ sheetPaperSize: value as TilingOptions['sheetPaperSize'] }); return }
          const current = resolveSheetMm(withTiling as never)
          // canvas onSheetPaperChange：切到 CUSTOM 时只在从未填过时补当前解析尺寸，保留用户已填值
          patch({
            sheetPaperSize: 'CUSTOM',
            sheetCustomWidth: cfg.sheetCustomWidth ?? current.width,
            sheetCustomHeight: cfg.sheetCustomHeight ?? current.height,
          })
        },
      }, [
        ...SHEET_PRESET_KEYS.map(key => h('option', {
          value: key, text: translateConstantLabel(PAPER_PRESETS[key]?.label ?? key, ctx.lang ?? getLocale()), selected: (cfg.sheetPaperSize ?? 'A4') === key,
        })),
        h('option', { value: 'CUSTOM', text: tr(ctx, 'pageExtras.k123'), selected: cfg.sheetPaperSize === 'CUSTOM' }),
      ]), undefined, tileReset('sheetPaperSize')),
      cfg.sheetPaperSize === 'CUSTOM'
        ? field(tr(ctx, 'pageExtras.k124'), h('div', { class: 'custom-size-grid' }, [
          stepper({ value: Number(cfg.sheetCustomWidth ?? 0), min: 25, max: 2000, onCommit: v => patch({ sheetCustomWidth: v }) }),
          h('span', { class: 'custom-size-x', text: '×' }),
          stepper({ value: Number(cfg.sheetCustomHeight ?? 0), min: 25, max: 2000, onCommit: v => patch({ sheetCustomHeight: v }) }),
        ]))
        : field(tr(ctx, 'pageExtras.k125'), radioGroup('tiling-ori', [
          { value: 'portrait', label: tr(ctx, 'pageExtras.k126') }, { value: 'landscape', label: tr(ctx, 'pageExtras.k127') },
        ], cfg.sheetOrientation === 'landscape' ? 'landscape' : 'portrait', v => patch({ sheetOrientation: v as TilingOptions['sheetOrientation'] })), undefined, tileReset('sheetOrientation')),
      divider(tr(ctx, 'pageExtras.k128')),
      h('div', { class: 'margin-grid' }, [
        field(tr(ctx, 'pageExtras.k129'), stepper({ value: cfg.sheetMargin.top ?? 0, min: 0, max: 100, onCommit: v => patchMargin('top', v) }), undefined, marginReset('top')),
        field(tr(ctx, 'pageExtras.k130'), stepper({ value: cfg.sheetMargin.bottom ?? 0, min: 0, max: 100, onCommit: v => patchMargin('bottom', v) }), undefined, marginReset('bottom')),
        field(tr(ctx, 'pageExtras.k131'), stepper({ value: cfg.sheetMargin.left ?? 0, min: 0, max: 100, onCommit: v => patchMargin('left', v) }), undefined, marginReset('left')),
        field(tr(ctx, 'pageExtras.k132'), stepper({ value: cfg.sheetMargin.right ?? 0, min: 0, max: 100, onCommit: v => patchMargin('right', v) }), undefined, marginReset('right')),
      ]),
      divider(tr(ctx, 'pageExtras.k133')),
      field(tr(ctx, 'pageExtras.k134'), stepper({ value: cfg.gapX ?? 0, min: 0, max: 50, onCommit: v => patch({ gapX: v ?? 0 }) }), undefined, tileReset('gapX')),
      field(tr(ctx, 'pageExtras.k135'), stepper({ value: cfg.gapY ?? 0, min: 0, max: 50, onCommit: v => patch({ gapY: v ?? 0 }) }), undefined, tileReset('gapY')),
      field(tr(ctx, 'pageExtras.k136'), stepper({ value: cfg.columns ?? 1, min: 1, max: columnMax, onCommit: v => patch({ columns: v || 1 }) })),
      ...issues.map(issue => h('p', { class: 'pd-hint tiling-error', text: issue.message })),
      !issues.length && summary ? h('p', { class: 'pd-hint tiling-summary', text: summary }) : '',
    ] : '',
  ].flat().filter(Boolean) as never)
}
