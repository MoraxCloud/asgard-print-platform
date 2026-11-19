// 数据预览弹窗：局部 DOM 渲染，不触发设计器整树重绘。
// 避让宿主 shadow DOM：弹窗挂在宿主提供的 overlay 容器里，样式随 FieldActionUI.styles 注入。
import type { FieldActionContext } from '@worm-print-platform/plugin-kit'
import { describeDataSource } from './describe.js'
import type { FormRow, OverviewRow, PreviewDescriptor, PreviewTab } from './types.js'

export const PREVIEW_STYLES = `
.dp-overlay{position:absolute;inset:0;z-index:500;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:rgba(15,18,26,.45);pointer-events:auto;font-family:inherit}
.dp-dialog{width:min(880px,94vw);max-height:84vh;display:flex;flex-direction:column;background:var(--pd-panel-bg,#fff);border:1px solid var(--pd-border,#d9dde6);border-radius:10px;box-shadow:0 16px 48px rgba(0,0,0,.26);overflow:hidden;color:var(--pd-text,#303133)}
.dp-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid var(--pd-border,#e8ebf0);font-size:14px;font-weight:600}
.dp-close{flex:none;width:24px;height:24px;padding:0;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--pd-text-muted,#909399);font-size:15px;line-height:1;cursor:pointer}
.dp-close:hover{border-color:var(--pd-border,#d9dde6);color:var(--pd-text,#303133);background:var(--pd-soft-bg,#f5f7fa)}
.dp-tabs{display:flex;gap:4px;padding:8px 12px 0;border-bottom:1px solid var(--pd-border,#e8ebf0);overflow-x:auto}
.dp-tab{flex:none;padding:7px 12px;border:1px solid transparent;border-bottom:2px solid transparent;border-radius:6px 6px 0 0;background:transparent;color:var(--pd-text-muted,#8b909c);font-size:12px;cursor:pointer;white-space:nowrap}
.dp-tab:hover{color:var(--pd-text,#303133)}
.dp-tab.active{color:var(--pd-accent,#165DFF);border-bottom-color:var(--pd-accent,#165DFF);font-weight:600}
.dp-body{flex:1;overflow:auto;padding:12px 16px 16px;font-size:12px}
.dp-body table{border-collapse:collapse;width:100%;font-size:12px}
.dp-body th,.dp-body td{border:1px solid var(--pd-border,#e8ebf0);padding:6px 9px;text-align:left;vertical-align:top;line-height:1.5}
.dp-body thead th{background:var(--pd-soft-bg,#f5f7fa);font-weight:600;white-space:nowrap;position:sticky;top:0}
.dp-body tbody tr:nth-child(even){background:var(--pd-row-alt,#fafbfc)}
.dp-body td:nth-child(2){max-width:520px;word-break:break-all}
.dp-jump{padding:2px 8px;border:1px solid var(--pd-accent,#165DFF);border-radius:4px;background:transparent;color:var(--pd-accent,#165DFF);font-size:11px;cursor:pointer;white-space:nowrap}
.dp-jump:hover{background:var(--pd-accent-soft,rgba(22,93,255,.09))}
.dp-kind{display:inline-block;padding:1px 6px;border-radius:4px;background:var(--pd-soft-bg,#f0f2f5);color:var(--pd-text-muted,#8b909c);font-size:11px}
.dp-scalar{padding:12px;border:1px solid var(--pd-border,#e8ebf0);border-radius:6px;background:var(--pd-soft-bg,#fafbfc);word-break:break-all}
.dp-empty{padding:24px;text-align:center;color:var(--pd-text-muted,#909399)}
`

function esc(value: string): string {
  return value.replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]!))
}

function kindText(kind: string): string {
  return kind === 'array' ? '数组' : kind === 'object' ? '对象' : '标量'
}

function overviewTable(rows: OverviewRow[]): string {
  if (!rows.length) return '<p class="dp-empty">该数据源暂无数据</p>'
  const body = rows.map(row => `<tr>
    <td>${esc(row.label)}</td>
    <td><span class="dp-kind">${kindText(row.kind)}</span></td>
    <td>${esc(row.summary)}</td>
    <td>${row.hasTab ? `<button type="button" class="dp-jump" data-tab="${esc(row.tabKey ?? row.key)}">查看 →</button>` : ''}</td>
  </tr>`).join('')
  return `<table class="dp-overview-table"><thead><tr><th>属性</th><th>类型</th><th>摘要 / 值</th><th></th></tr></thead><tbody>${body}</tbody></table>`
}

function dataTable(columns: PreviewTab['columns'], rows: PreviewTab['rows']): string {
  if (!columns?.length) return '<p class="dp-empty">该数据源暂无数据</p>'
  const head = columns.map(c => `<th>${esc(c.label)}</th>`).join('')
  const body = (rows ?? []).map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')
  return `<table class="dp-data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

function formTable(rows: FormRow[] | undefined): string {
  if (!rows?.length) return '<p class="dp-empty">该数据源暂无数据</p>'
  const body = rows.map(row => `<tr><td>${esc(row.label)}</td><td>${esc(row.value)}</td></tr>`).join('')
  return `<table class="dp-form-table"><thead><tr><th>字段</th><th>值</th></tr></thead><tbody>${body}</tbody></table>`
}

function bodyHtml(desc: PreviewDescriptor, active: string): string {
  if (active !== '__overview') {
    const tab = desc.tabs.find(t => t.key === active)
    if (tab) {
      return tab.kind === 'array' ? dataTable(tab.columns, tab.rows) : formTable(tab.formRows)
    }
  }
  if (desc.rootKind === 'array') return dataTable(desc.table?.columns, desc.table?.rows)
  if (desc.rootKind === 'scalar') {
    return desc.scalar ? `<div class="dp-scalar"><strong>${esc(desc.scalar.label)}：</strong>${esc(desc.scalar.value)}</div>` : '<p class="dp-empty">该数据源暂无数据</p>'
  }
  return overviewTable(desc.overview)
}

/** 挂载预览弹窗；返回 dispose（幂等，可多次调用） */
export function mountPreview(ctx: FieldActionContext): () => void {
  const envelope = ctx.data?.[0]
  const root = envelope && typeof envelope === 'object' && !Array.isArray(envelope)
    ? (envelope as Record<string, unknown>)[ctx.group.key]
    : undefined
  const desc = describeDataSource(root, ctx.fields, ctx.group)

  const overlay = document.createElement('div')
  overlay.className = 'dp-overlay'
  overlay.innerHTML = `
    <div class="dp-dialog" role="dialog" aria-label="数据源预览">
      <div class="dp-head">
        <span class="dp-title">数据源预览 · ${esc(desc.title)}</span>
        <button type="button" class="dp-close" aria-label="关闭">✕</button>
      </div>
      <div class="dp-tabs"></div>
      <div class="dp-body"></div>
    </div>`

  const tabBar = overlay.querySelector<HTMLElement>('.dp-tabs')!
  const body = overlay.querySelector<HTMLElement>('.dp-body')!
  let active = '__overview'
  let disposed = false

  function paint() {
    const tabs = [{ key: '__overview', label: '总览' }].concat(
      desc.tabs.map(t => ({ key: t.key, label: t.label })),
    )
    tabBar.innerHTML = tabs.map(t =>
      `<button type="button" class="dp-tab${t.key === active ? ' active' : ''}" data-tab="${esc(t.key)}">${esc(t.label)}</button>`,
    ).join('')
    body.innerHTML = bodyHtml(desc, active)
  }

  function onClick(ev: Event) {
    const target = ev.target as HTMLElement
    if (target.classList.contains('dp-overlay')) { cleanup(); return }
    if (target.closest('.dp-close')) { cleanup(); return }
    const trigger = target.closest<HTMLElement>('.dp-tab, .dp-jump')
    const key = trigger?.dataset.tab
    if (key) { active = key; paint() }
  }

  function onKey(ev: KeyboardEvent) {
    if (ev.key === 'Escape') cleanup()
  }

  function cleanup() {
    if (disposed) return
    disposed = true
    overlay.removeEventListener('click', onClick)
    document.removeEventListener('keydown', onKey)
    ctx.container.replaceChildren()
  }

  paint()
  overlay.addEventListener('click', onClick)
  document.addEventListener('keydown', onKey)
  ctx.container.appendChild(overlay)
  return cleanup
}
