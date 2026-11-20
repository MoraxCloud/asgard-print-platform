// 顶部工具栏：DOM 类名逐一对齐 print-Vue 3 轨的 DesignerToolbar.vue
// （.designer-toolbar / .tb-group / .tb-mark / .tb-title / .tb-btn.tb-icon / .tb-zoom /
//  .tb-spacer / .tb-menu / .tb-menu-label / .tb-menu-grid / .tb-menu-row / .btn-primary|secondary）。
import { tr } from './controls.js'
import { h } from '../core/h'
import { dropdown, tbIconBtn } from './controls'
import { renderMoreGroup } from './toolbar-overflow'
import type { ShellCtx } from './controls'

export function renderToolbar(ctx: ShellCtx, formatSection: unknown) {
  const s = ctx.store
  const hasSelection = s.selectedIds.size > 0
  const hasMulti = s.selectedIds.size > 1
  const el = s.selectedElement
  const clipboardDisabled = !hasSelection

  // Vue 3 轨的标题恒为「编辑模板/新建模板」，不跟随模板名（模板名只在页签与导出里出现）
  const title = ctx.isEdit ? tr(ctx, 'toolbar.k489') : tr(ctx, 'toolbar.k490')

  const arrangePanel = [
    h('div', { class: 'tb-menu', dataset: { test: 'arrange-panel' } }, [
      h('div', { class: 'tb-menu-label', text: tr(ctx, 'toolbar.k491') }),
      h('div', { class: 'tb-menu-grid' }, [
        tbIconBtn(ctx, 'AlignStartVertical', 'align', { arg: 'left', tip: tr(ctx, 'toolbar.k492'), disabled: !hasMulti }),
        tbIconBtn(ctx, 'AlignEndVertical', 'align', { arg: 'right', tip: tr(ctx, 'toolbar.k493'), disabled: !hasMulti }),
        tbIconBtn(ctx, 'AlignStartHorizontal', 'align', { arg: 'top', tip: tr(ctx, 'toolbar.k494'), disabled: !hasMulti }),
        tbIconBtn(ctx, 'AlignEndHorizontal', 'align', { arg: 'bottom', tip: tr(ctx, 'toolbar.k495'), disabled: !hasMulti }),
        tbIconBtn(ctx, 'AlignCenterVertical', 'align', { arg: 'vertical', tip: tr(ctx, 'toolbar.k496'), disabled: !hasMulti }),
        tbIconBtn(ctx, 'AlignCenterHorizontal', 'align', { arg: 'horizontal', tip: tr(ctx, 'toolbar.k497'), disabled: !hasMulti }),
        tbIconBtn(ctx, 'AlignHorizontalSpaceBetween', 'align', { arg: 'distributeHor', tip: tr(ctx, 'toolbar.k498'), disabled: !hasMulti }),
        tbIconBtn(ctx, 'AlignVerticalSpaceBetween', 'align', { arg: 'distributeVer', tip: tr(ctx, 'toolbar.k499'), disabled: !hasMulti }),
      ]),
      h('div', { class: 'tb-menu-label', text: tr(ctx, 'toolbar.k500') }),
      h('div', { class: 'tb-menu-grid' }, [
        tbIconBtn(ctx, 'ArrowUpToLine', 'move-layer', { arg: 'top', tip: tr(ctx, 'toolbar.k501'), disabled: !hasSelection }),
        tbIconBtn(ctx, 'ArrowUp', 'move-layer', { arg: 'up', tip: tr(ctx, 'toolbar.k502'), disabled: !hasSelection }),
        tbIconBtn(ctx, 'ArrowDown', 'move-layer', { arg: 'down', tip: tr(ctx, 'toolbar.k503'), disabled: !hasSelection }),
        tbIconBtn(ctx, 'ArrowDownToLine', 'move-layer', { arg: 'bottom', tip: tr(ctx, 'toolbar.k504'), disabled: !hasSelection }),
      ]),
      h('div', { class: 'tb-menu-label', text: tr(ctx, 'toolbar.k505') }),
      h('div', { class: 'tb-menu-grid' }, [
        tbIconBtn(ctx, 'Group', 'group', { tip: tr(ctx, 'toolbar.k506'), disabled: !hasMulti }),
        tbIconBtn(ctx, 'Ungroup', 'ungroup', { tip: tr(ctx, 'toolbar.k507'), disabled: !(el as { options?: { groupId?: string } })?.options?.groupId }),
      ]),
    ]),
  ]

  const viewPanel = [
    h('div', { class: 'tb-menu tb-menu-rows', dataset: { test: 'view-panel' } }, [
      menuRow(tr(ctx, 'toolbar.k508'), s.showRuler, 'toggle-ruler', tr(ctx, 'toolbar.k509')),
      menuRow(tr(ctx, 'toolbar.k510'), s.showGrid, 'toggle-grid', tr(ctx, 'toolbar.k511')),
      menuRow(tr(ctx, 'toolbar.k512'), s.showTableGhostBorder, 'toggle-table-ghost-border', tr(ctx, 'toolbar.k513')),
      menuRow(tr(ctx, 'toolbar.k514'), s.snapToGrid, 'toggle-snap', tr(ctx, 'toolbar.k515')),
    ]),
  ]

  function menuRow(label: string, on: boolean, action: string, tip: string) {
    return h('button', {
      type: 'button',
      class: `tb-btn tb-menu-row${on ? ' on' : ''}`,
      dataset: { tip },
      onClick: () => ctx.fire(action),
    }, [h('span', { class: 'dot' }), label])
  }

  return h('div', { class: 'designer-toolbar' }, [
    h('div', { class: 'tb-group tb-brand' }, [
      h('span', {
        class: 'tb-mark',
        'aria-hidden': 'true',
        html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2.5" /><line x1="8.5" y1="8.5" x2="15.5" y2="8.5" /><line x1="8.5" y1="12.5" x2="15.5" y2="12.5" /><line x1="8.5" y1="16.5" x2="12.5" y2="16.5" /></svg>',
      }),
      h('div', { class: 'tb-title' }, [
        h('span', { class: 'tb-title-name', text: title }),
        h('span', { class: 'tb-title-sub', text: tr(ctx, 'toolbar.k516') }),
      ]),
    ]),
    h('div', { class: 'tb-group' }, [
      tbIconBtn(ctx, 'Undo2', 'undo', { tip: tr(ctx, 'toolbar.k517'), disabled: !s.canUndo }),
      tbIconBtn(ctx, 'Redo2', 'redo', { tip: tr(ctx, 'toolbar.k518'), disabled: !s.canRedo }),
    ]),
    formatSection,
    h('div', { class: 'tb-ou tb-group', dataset: { unit: 'arrange-view' } }, [
      dropdown(ctx, 'arrange', { icon: 'Layers', text: tr(ctx, 'toolbar.k519'), tip: tr(ctx, 'toolbar.k520'), testId: 'arrange-dd' }, arrangePanel),
      dropdown(ctx, 'view', { icon: 'Eye', text: tr(ctx, 'toolbar.k521'), tip: tr(ctx, 'toolbar.k522'), testId: 'view-dd' }, viewPanel),
    ]),
    h('div', { class: 'tb-ou tb-group', dataset: { unit: 'zoom' } }, [
      tbIconBtn(ctx, 'Maximize', 'fit-window', { tip: tr(ctx, 'toolbar.k523') }),
      tbIconBtn(ctx, 'ZoomOut', 'zoom', { arg: -10, tip: tr(ctx, 'toolbar.k524') }),
      h('span', { class: 'tb-zoom', text: `${s.scale}%` }),
      tbIconBtn(ctx, 'ZoomIn', 'zoom', { arg: 10, tip: tr(ctx, 'toolbar.k525') }),
    ]),
    h('div', { class: 'tb-ou tb-group', dataset: { unit: 'clipboard' } }, [
      tbIconBtn(ctx, 'Copy', 'copy', {
        tip: clipboardDisabled ? tr(ctx, 'toolbar.k526') : tr(ctx, 'toolbar.k527'),
        disabled: clipboardDisabled, test: 'copy',
      }),
      tbIconBtn(ctx, 'ClipboardPaste', 'paste', {
        tip: clipboardDisabled ? tr(ctx, 'toolbar.k528')
          : !s.hasClipboard ? tr(ctx, 'toolbar.k529') : tr(ctx, 'toolbar.k530'),
        disabled: clipboardDisabled || !s.hasClipboard, test: 'paste',
      }),
      tbIconBtn(ctx, 'Trash2', 'delete', {
        tip: clipboardDisabled ? tr(ctx, 'toolbar.k531') : tr(ctx, 'toolbar.k532'),
        disabled: clipboardDisabled, danger: true, test: 'delete',
      }),
    ]),
    renderMoreGroup(ctx),
    h('div', { class: 'tb-spacer' }),
    ctx.showHelp ? h('div', { class: 'tb-group' }, [
      h('button', {
        type: 'button', class: 'help-button', title: tr(ctx, 'toolbar.k533'),
        onClick: () => ctx.fire('help'),
      }, [h('span', { class: 'help-icon', text: '?' })]),
    ]) : '',
    (() => {
      const actions = [
        ctx.showPreview !== false ? h('button', {
          type: 'button', class: 'btn-secondary', dataset: { tip: tr(ctx, 'toolbar.k534') },
          text: tr(ctx, 'toolbar.k535'), onClick: () => ctx.fire('preview'),
        }) : '',
        ctx.showSave !== false ? h('button', {
          type: 'button', class: 'btn-primary', dataset: { tip: tr(ctx, 'toolbar.k536') },
          text: tr(ctx, 'toolbar.k537'), onClick: () => ctx.fire('save'),
        }) : '',
      ].filter(Boolean)
      return actions.length ? h('div', { class: 'tb-group' }, actions) : ''
    })(),
  ].filter(Boolean) as never)
}
