// 左栏素材台 / 页签栏 / 状态栏：DOM 类名对齐 Vue 3 轨的
// LeftPanel.vue、FieldTreePanel.vue、LayerPanel.vue、PageTabs.vue、StatusBar.vue。
import { tr } from './controls.js'
import { translateConstantLabel } from './label-translation.js'
import { PAPER_PRESETS, copyTextToClipboard, getPaperDimensions, groupFields, isWideMaterialLabel } from '@worm-print-platform/core/designer'
import type { ElementType, PrintBusinessField, RuntimeElement } from '@worm-print-platform/core/designer'
import { h } from '../core/h'
import { iconSvg } from '../core/icons'
import { CANVAS_VERSION } from '../version'
import {
  BUILTIN_ELEMENT_DEFINITIONS, getElementLayerIcon, getMaterialElementDefinitions,
} from '../core/element-definitions'
import type { ShellCtx } from './controls'

/**
 * 元素库：由统一注册表派生的「内置基线快照」，与 Vue 3 轨 LeftPanel.elementTypes 同序同图标。
 * 运行时素材台请用 `getMaterialElementDefinitions()`（含插件动态项与自定义覆盖）。
 */
export const ELEMENT_TYPES: { type: ElementType; label: string; icon: string }[] =
  BUILTIN_ELEMENT_DEFINITIONS.filter(def => def.material)
    .map(def => ({ type: def.type as ElementType, label: def.label, icon: def.icon }))

/** 图标名 → 内联 SVG；本包与 Vue 3 轨两侧对未知名统一回落 Shapes */
function iconMarkup(name: string | undefined, size: number): string {
  return iconSvg(name ?? 'Shapes', size) || iconSvg('Shapes', size)
}

export function renderLeftPanel(ctx: ShellCtx) {
  const st = ctx.state
  if (st.leftCollapsed) {
    return h('div', { class: 'left-panel collapsed' }, [
      h('div', { class: 'left-collapsed' }, [
        collapseBtn('ChevronsRight', tr(ctx, 'panels.k137'), () => { st.leftCollapsed = false; ctx.repaint() }),
        ...([['elements', tr(ctx, 'panels.k138'), 'Table2'], ['fields', tr(ctx, 'panels.k139'), 'ListTree'], ['layers', tr(ctx, 'panels.k140'), 'Layers']] as const).map(([tab, title, icon]) =>
          h('button', {
            type: 'button', class: `lc-btn${st.leftTab === tab ? ' on' : ''}`, title,
            html: iconMarkup(icon, 14),
            onClick: () => { st.leftTab = tab; st.leftCollapsed = false; ctx.repaint() },
          })),
      ]),
    ])
  }

  // Vue 3 轨的三个页签都是 `v-show`（节点常驻、只切 display），这里同构：
  // 只渲染当前页签会让隐藏 DOM 签名与 Vue 3 轨 不一致，也会让页签切换时的首帧布局测量落空
  const tabPane = (tab: string, children: unknown[], extraClass = '') => h('div', {
    class: `pd-tab-pane${extraClass ? ` ${extraClass}` : ''}`, role: 'tabpanel',
    // 滚动记账键：整树重建会换掉 pane 节点，paint 尾部按该键回写 scrollTop（见 print-designer.ts）
    dataset: { pane: `left:${tab}` },
    style: st.leftTab === tab ? '' : { display: 'none' },
  }, children)

  return h('div', { class: 'left-panel' }, [
    h('div', { class: 'left-head' }, [
      h('span', { class: 'left-title', text: tr(ctx, 'panels.k141') }),
      collapseBtn('ChevronsLeft', tr(ctx, 'panels.k142'), () => { st.leftCollapsed = true; ctx.repaint() }),
    ]),
    h('div', { class: 'pd-tabs left-tabs' }, [
      h('div', { class: 'pd-tab-bar', role: 'tablist' }, [
        ...([['elements', tr(ctx, 'panels.k143')], ['fields', tr(ctx, 'panels.k144')], ['layers', tr(ctx, 'panels.k145')]] as const).map(([tab, label]) =>
          h('button', {
            type: 'button', class: `pd-tab${st.leftTab === tab ? ' active' : ''}`,
            text: label,
            onClick: () => { st.leftTab = tab; ctx.repaint() },
          })),
      ]),
      tabPane('elements', elementsPane(ctx), 'material-grid'),
      tabPane('fields', [fieldsPane(ctx)]),
      tabPane('layers', [layersPane(ctx)]),
    ]),
  ])
}

function collapseBtn(icon: string, title: string, onClick: () => void) {
  return h('button', { type: 'button', class: 'collapse-btn', title, html: iconMarkup(icon, 14), onClick })
}

/** 内置元素类型的 label 翻译键（label 在模块加载时由 trG 冻结为中文，渲染时必须按 locale 重取） */
const ELEMENT_LABEL_KEYS: Record<string, string> = {
  text: 'elementDefinitions.k553', barcode: 'elementDefinitions.k554', qrcode: 'elementDefinitions.k555',
  image: 'elementDefinitions.k556', table: 'elementDefinitions.k557', longText: 'elementDefinitions.k558',
  flowList: 'elementDefinitions.k559', hline: 'elementDefinitions.k560', vline: 'elementDefinitions.k561',
  rect: 'elementDefinitions.k562', oval: 'elementDefinitions.k563', pageNumber: 'elementDefinitions.k564',
  // 图表插件十类（键在 echarts 插件语言包，注册后按全局 locale 解析）
  barChart: 'echarts.kinds.k84', barHChart: 'echarts.kinds.k86', lineChart: 'echarts.kinds.k88',
  areaChart: 'echarts.kinds.k90', pieChart: 'echarts.kinds.k92', doughnutChart: 'echarts.kinds.k94',
  scatterChart: 'echarts.kinds.k96', radarChart: 'echarts.kinds.k98', funnelChart: 'echarts.kinds.k100',
  gaugeChart: 'echarts.kinds.k102',
}

/** 素材台分组标题的英文映射（group 来自 core 插件描述符，中文常量） */
// 插件元素分组标题 → 语言包 key（group 来自插件描述符，按英文 type 识别避免中文字面量）
const MATERIAL_GROUP_BY_TYPE: Record<string, string> = { barChart: 'elementGroup.chart' }

function materialCard(type: string, label: string, icon: string, translatedLabel?: string) {
  return h('div', {
    // 与 Vue 3 轨 LeftPanel 同构：标签文本较长的素材在两列栅格下独占整行
    class: `material-card${isWideMaterialLabel(translatedLabel ?? label) ? ' material-card--wide' : ''}`,
    draggable: true,
    dataset: { test: `material-${type}` },
    onDragstart: (ev: Event) => {
      const dt = (ev as DragEvent).dataTransfer
      dt?.setData('elementType', type)
      // 宽效果集，理由同 canvas LeftPanel：收窄会让 macOS 的 ⌘ 重算落到允许集外被会话拒绝
      if (dt) dt.effectAllowed = 'all'
    },
  }, [
    h('span', { class: 'material-icon', 'data-icon': icon, html: iconMarkup(icon, 14) }),
    h('span', { class: 'material-label', text: translatedLabel ?? label }),
  ])
}

/** 素材台：统一注册表（内置 + 自定义覆盖 + 插件项）按注册顺序出卡，group 出分组标题 */
function elementsPane(ctx: ShellCtx): unknown[] {
  const cards: unknown[] = []
  let prevGroup: string | undefined
  for (const item of getMaterialElementDefinitions()) {
    const group = (item as { group?: string }).group
    // 与 Vue 3 轨 LeftPanel 的 groupStart 同判据：首个同组项前渲染分组标题
    if (group && group !== prevGroup) {
      const groupKey = MATERIAL_GROUP_BY_TYPE[item.type]
      cards.push(h('div', { class: 'material-group-title', text: groupKey ? tr(ctx, groupKey) : group }))
    }
    if (group) prevGroup = group
    // 内置类型与图表插件都按 type → 语言包 key 取译文（key 映射见 ELEMENT_LABEL_KEYS）
    // 插件语言包未注册时 t(key) 会返回 key 本身，此时回退到定义自带的 label，避免素材台显示裸 key
    const labelKey = ELEMENT_LABEL_KEYS[item.type]
    const candidate = labelKey ? tr(ctx, labelKey) : undefined
    const translated = candidate && candidate !== labelKey ? candidate : undefined
    cards.push(materialCard(item.type, item.label, item.icon, translated))
  }
  return [h('div', { class: 'panel-title', text: tr(ctx, 'panels.k146') }), ...cards]
}

function fieldsPane(ctx: ShellCtx) {
  const st = ctx.state
  const mode = st.fieldDisplay ?? 'both'
  const groups = groupFields(ctx.store.fields as PrintBusinessField[])
  const keyword = (st.fieldSearch ?? '').trim().toLowerCase()
  const matched = keyword
    ? groups.map(g => ({ ...g, fields: g.fields.filter(f =>
      `${f.fieldLabel}${f.fieldKey}`.toLowerCase().includes(keyword)) }))
      .filter(g => g.fields.length)
    : groups
  return h('div', { class: 'field-tree-panel' }, [
    h('div', { class: 'panel-title', text: tr(ctx, 'panels.k147') }),
    h('input', {
      class: 'pd-input search-input', type: 'search', placeholder: tr(ctx, 'panels.k148'),
      'aria-label': tr(ctx, 'panels.k149'), value: st.fieldSearch ?? '',
      onInput: (ev: Event) => { st.fieldSearch = (ev.target as HTMLInputElement).value },
      onChange: () => ctx.repaint(),
    }),
    h('div', { class: 'tree-container' }, matched.flatMap(group => {
      const collapsed = st.collapsedGroups.has(group.key) && !keyword
      const header = group.key ? h('div', {
        class: `field-group-header${group.isList ? ' is-list' : ''}`,
        onClick: () => {
          collapsed ? st.collapsedGroups.delete(group.key) : st.collapsedGroups.add(group.key)
          ctx.repaint()
        },
      }, [
        h('span', { class: 'expand-icon', text: collapsed ? '▶' : '▼' }),
        h('span', { class: 'node-icon', text: group.isList ? '📋' : '📁' }),
        h('span', { class: 'group-label', text: group.label, 'data-tip': group.label }),
      ]) : ''
      const rows = collapsed ? [] : group.fields.map(field => h('div', {
        class: 'field-row',
        draggable: true,
        'data-tip': tr(ctx, 'panels.k150', { v0: field.fieldLabel, v1: field.fieldKey }),
        style: { paddingLeft: `${group.key ? 22 : 8}px` },
        onDragstart: (ev: Event) => {
          const dt = (ev as DragEvent).dataTransfer
          dt?.setData('fieldKey', field.fieldKey)
          // 与 Vue 3 轨 FieldTreePanel 同口径：宽效果集，macOS 的 ⌘ 重算不能被会话拒绝
          if (dt) dt.effectAllowed = 'all'
        },
        // 单击复制字段中文名（对齐 canvas FieldTreePanel 的 onCopyField，Gitee #IKRIZM）
        onClick: () => {
          copyTextToClipboard(field.fieldLabel || field.fieldKey).then((ok) => {
            if (!ok) return
            st.copiedFieldKey = field.fieldKey
            ctx.repaint()
            setTimeout(() => {
              if (st.copiedFieldKey !== field.fieldKey) return
              st.copiedFieldKey = ''
              ctx.repaint()
            }, 1200)
          })
        },
      }, [
        h('span', { class: 'node-icon', text: '📄' }),
        h('span', { class: 'node-meta' }, [
          mode !== 'key' ? h('span', { class: 'node-label', text: field.fieldLabel || field.fieldKey }) : '',
          mode !== 'label' ? h('span', {
            class: `node-key${mode === 'key' ? ' is-primary' : ''}`,
            text: mode === 'key' ? field.fieldKey : `(${field.fieldKey})`,
          }) : '',
        ].filter(Boolean) as never),
        st.copiedFieldKey === field.fieldKey ? h('span', { class: 'copy-hint', text: tr(ctx, 'panels.k151') }) : '',
      ].filter(Boolean)))
      return [header, h('div', {}, rows.filter(Boolean))].filter(Boolean)
    })),
    matched.length === 0 ? h('p', { class: 'pd-empty', text: tr(ctx, 'panels.k152') }) : '',
  ].filter(Boolean))
}

/** 图层名：自定义 title 优先；否则按元素类型取当前实例语言的译文（definitions 的 label 在模块加载时已冻结） */
function layerLabel(layer: RuntimeElement, ctx: ShellCtx): string {
  if (layer.options.title) return layer.options.title
  const key = ELEMENT_LABEL_KEYS[layer.printElementType.type]
  return key ? tr(ctx, key) : (layer.printElementType.title || layer.printElementType.type)
}

function layersPane(ctx: ShellCtx) {
  const s = ctx.store
  const layers = [...(s.elements as RuntimeElement[])].sort((a, b) => (b.options.zIndex ?? 0) - (a.options.zIndex ?? 0))
  const selected = s.elements.filter(e => s.selectedIds.has(e.id))
  const canGroup = selected.length >= 2
  const canUngroup = selected.some(e => !!(e.options as { groupId?: string }).groupId)
  const zoneTag = (el: RuntimeElement) => el.zone === 'header' ? tr(ctx, 'panels.k153') : el.zone === 'footer' ? tr(ctx, 'panels.k154') : ''
  return h('div', { class: 'layer-panel' }, [
    h('div', { class: 'panel-title', text: tr(ctx, 'panels.k155') }),
    ...layers.map(layer => {
      // 统一注册表：内置 / 自定义覆盖 / core 插件项共用同一条解析路径，未注册回落 Shapes
      const icon = getElementLayerIcon(layer.printElementType.type)
      return h('div', {
        class: `layer-item${s.selectedIds.has(layer.id) ? ' active' : ''}`,
        onClick: (ev: Event) => s.selectElement(layer.id, (ev as MouseEvent).ctrlKey || (ev as MouseEvent).metaKey),
      }, [
        h('span', { class: 'layer-icon', 'data-icon': icon ?? 'Shapes', html: iconMarkup(icon, 12) }),
        h('span', { class: 'layer-name', text: layerLabel(layer, ctx) }),
        zoneTag(layer) ? h('span', { class: 'layer-zone', text: zoneTag(layer) }) : '',
        h('span', { class: 'layer-zindex', text: `z:${layer.options.zIndex ?? 0}` }),
      ].filter(Boolean))
    }),
    layers.length ? h('div', { class: 'layer-actions' }, [
      ...([['top', tr(ctx, 'panels.k156'), 'ArrowUpToLine'], ['up', tr(ctx, 'panels.k157'), 'ArrowUp'], ['down', tr(ctx, 'panels.k158'), 'ArrowDown'], ['bottom', tr(ctx, 'panels.k159'), 'ArrowDownToLine']] as const).map(([dir, title, icon]) =>
        h('button', {
          type: 'button', class: 'pd-button small', title,
          html: iconSvg(icon, 14),
          onClick: () => ctx.fire('move-layer', dir),
        })),
    ]) : '',
    (canGroup || canUngroup) ? h('div', { class: 'layer-actions' }, [
      canGroup ? h('button', {
        type: 'button', class: 'pd-button small', title: tr(ctx, 'panels.k160'),
        html: iconSvg('Group', 14), onClick: () => ctx.fire('group'),
      }) : '',
      canUngroup ? h('button', {
        type: 'button', class: 'pd-button small', title: tr(ctx, 'panels.k161'),
        html: iconSvg('Ungroup', 14), onClick: () => ctx.fire('ungroup'),
      }) : '',
    ].filter(Boolean)) : '',
  ].filter(Boolean))
}

export function renderPageTabs(ctx: ShellCtx) {
  const s = ctx.store
  const st = ctx.state
  const multi = s.pages.length > 1
  const activeName = s.pages[s.activePageIndex]?.name || tr(ctx, 'panels.k162', { v0: s.activePageIndex + 1 })
  const tiling = s.tilingEnabled
  return h('div', { class: 'page-tabs' }, [
    h('div', { class: 'page-tabs-list' }, s.pages.map((p, i) => {
      if (st.renamingPage === i) {
        return h('input', {
          class: 'page-tab-rename',
          dataset: { test: 'page-rename-input' },
          value: st.renameText ?? '',
          onInput: (ev: Event) => { st.renameText = (ev.target as HTMLInputElement).value },
          onBlur: () => commitRename(),
          onKeydown: (ev: Event) => {
            const k = ev as KeyboardEvent
            if (k.key === 'Enter') { commitRename(); return }
            if (k.key === 'Escape') { st.renamingPage = null; ctx.repaint() }
          },
        })
      }
      return h('button', {
        type: 'button',
        class: `page-tab${i === s.activePageIndex ? ' active' : ''}`,
        dataset: { tip: p.name ? tr(ctx, 'panels.k163', { v0: p.name }) : tr(ctx, 'panels.k164') },
        text: p.name || tr(ctx, 'panels.k165', { v0: i + 1 }),
        onClick: () => s.switchPage(i),
        onDblclick: () => { st.renamingPage = i; st.renameText = p.name ?? ''; ctx.repaint() },
      })
    })),
    h('div', { class: 'page-tabs-actions' }, [
      h('button', {
        type: 'button', dataset: { test: 'add-page', tip: tiling ? tr(ctx, 'panels.k166') : tr(ctx, 'panels.k167') },
        disabled: tiling, text: '＋', onClick: () => ctx.fire('add-page'),
      }),
      h('button', {
        type: 'button', dataset: { test: 'duplicate-page', tip: tiling ? tr(ctx, 'panels.k168') : tr(ctx, 'panels.k169', { v0: activeName }) },
        disabled: tiling, text: '⧉', onClick: () => ctx.fire('duplicate-page'),
      }),
      h('button', {
        type: 'button', dataset: { test: 'delete-page', tip: multi ? tr(ctx, 'panels.k170', { v0: activeName }) : tr(ctx, 'panels.k171') },
        disabled: !multi, text: '✕', onClick: () => ctx.fire('delete-page'),
      }),
      h('button', {
        type: 'button', dataset: { test: 'move-left', tip: tr(ctx, 'panels.k172', { v0: activeName }) },
        disabled: s.activePageIndex <= 0, text: '←', onClick: () => ctx.fire('move-page', -1),
      }),
      h('button', {
        type: 'button', dataset: { test: 'move-right', tip: tr(ctx, 'panels.k173', { v0: activeName }) },
        disabled: s.activePageIndex >= s.pages.length - 1, text: '→', onClick: () => ctx.fire('move-page', 1),
      }),
    ]),
  ])

  function commitRename() {
    const name = (st.renameText ?? '').trim()
    if (st.renamingPage !== null && name) s.renamePage(st.renamingPage, name)
    st.renamingPage = null
    ctx.repaint()
  }
}

export function renderStatusBar(ctx: ShellCtx) {
  const s = ctx.store
  const t = s.templateData
  // 与 Vue 3 轨的 paperLabel 同口径：预设名（含尺寸）+ 方向 + 实际长宽 + 出纸旋转提示
  const dim = getPaperDimensions(t)
  const orient = t.orientation === 'landscape' ? tr(ctx, 'panels.k174') : tr(ctx, 'panels.k175')
  const name = translateConstantLabel(PAPER_PRESETS[t.paperSize]?.label ?? t.paperSize, ctx.lang ?? 'zh-CN')
  const rot = t.outputRotation
  const paper = `${name} ${orient} ${Math.round(dim.width)}×${Math.round(dim.height)}mm${rot ? tr(ctx, 'panels.paperRotated', { rot }) : ''}`
  return h('div', { class: 'status-bar' }, [
    // Vue 3 轨的坐标位是 v-if，无坐标时不占位：这里用 display 同步隐藏
    h('span', { class: 'status-item coord', dataset: { coord: '' }, style: { display: 'none' } }),
    h('span', { class: 'status-item', text: tr(ctx, 'panels.k176', { v0: s.scale }) }),
    h('span', {
      class: 'status-item',
      text: tr(ctx, 'panels.statusElements', {
        count: s.elements.length,
        selected: s.selectedIds.size ? tr(ctx, 'panels.statusSelected', { n: s.selectedIds.size }) : '',
      }),
    }),
    h('span', { class: 'status-item status-version', text: `v${CANVAS_VERSION}` }),
    h('span', { class: 'status-item status-paper', text: paper }),
  ])
}
