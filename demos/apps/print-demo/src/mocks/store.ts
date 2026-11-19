import type { PrintBusinessField } from '@worm-print-platform/canvas/vue3'
import type { PageResult } from '@/api/types'
import type { PrintTemplate, PrintTemplateSaveParam, PrintTemplateTypeOption } from '@/types/print'
import { TEMPLATE_TYPE_OPTIONS, TEMPLATE_TYPE_PROFILES } from '@/print/registry'

export const STORAGE_KEY = 'print-demo:templates:v3'

interface StoredTemplate extends PrintTemplate {
  deleted?: boolean
  deletedTime?: string
}

export interface TemplateStore {
  list(params: { name?: string; businessType?: string; current?: number; size?: number }): PageResult<PrintTemplate>
  getById(id: string): PrintTemplate | undefined
  save(param: PrintTemplateSaveParam): string
  update(param: PrintTemplateSaveParam): void
  remove(id: string): void
  setDefault(businessType: string, id: string): void
  getDefault(businessType: string): PrintTemplate | undefined
  listTypes(): PrintTemplateTypeOption[]
  listFields(businessType: string): PrintBusinessField[]
  reset(): void
}

function now(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

function nextId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function seed(): StoredTemplate[] {
  const rows: StoredTemplate[] = []
  const stamp = now()
  for (const option of TEMPLATE_TYPE_OPTIONS) {
    const profile = TEMPLATE_TYPE_PROFILES[option.value]
    const elements = JSON.stringify(profile.createTemplate())
    rows.push({
      id: nextId(),
      name: `${option.label}·标准版`,
      businessType: option.value,
      elements,
      remark: `用于${option.label}的常规业务场景`,
      isDefault: true,
      createTime: stamp,
      updateTime: stamp,
    })
    rows.push({
      id: nextId(),
      name: `${option.label}·特殊场景版`,
      businessType: option.value,
      elements,
      remark: `用于${option.label}的特殊业务场景`,
      isDefault: false,
      createTime: stamp,
      updateTime: stamp,
    })
  }
  return rows
}

let templates: StoredTemplate[] = []

function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

function load(): void {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      templates = JSON.parse(raw) as StoredTemplate[]
      return
    } catch {
      // 数据损坏时重建种子
    }
  }
  templates = seed()
  persist()
}

function active(): StoredTemplate[] {
  return templates.filter(t => !t.deleted)
}

function toPublic(row: StoredTemplate): PrintTemplate {
  const { deleted: _deleted, deletedTime: _deletedTime, ...rest } = row
  return rest
}

load()

export const templateStore: TemplateStore = {
  reset() {
    templates = seed()
    persist()
  },

  list(params) {
    const keyword = params.name?.trim() ?? ''
    const matched = active().filter(
      t => (!params.businessType || t.businessType === params.businessType)
        && (!keyword || t.name.includes(keyword)),
    )
    const current = params.current ?? 1
    const size = params.size ?? 10
    const start = (current - 1) * size
    return {
      records: matched.slice(start, start + size).map(toPublic),
      totalRow: matched.length,
      size,
      current,
      pages: Math.ceil(matched.length / size),
    }
  },

  getById(id) {
    const row = active().find(t => t.id === id)
    return row ? toPublic(row) : undefined
  },

  save(param) {
    const id = nextId()
    const stamp = now()
    const hasDefault = active().some(t => t.businessType === param.businessType && t.isDefault)
    templates.push({
      id,
      name: param.name ?? '未命名模板',
      businessType: param.businessType ?? '',
      elements: param.elements,
      paperConfig: param.paperConfig,
      remark: param.remark ?? '',
      isDefault: !hasDefault,
      createTime: stamp,
      updateTime: stamp,
    })
    persist()
    return id
  },

  update(param) {
    if (!param.id) return
    const row = templates.find(t => t.id === param.id && !t.deleted)
    if (!row) return
    if (param.name !== undefined) row.name = param.name
    if (param.businessType !== undefined) row.businessType = param.businessType
    if (param.elements !== undefined) row.elements = param.elements
    if (param.remark !== undefined) row.remark = param.remark
    if (param.paperConfig !== undefined) row.paperConfig = param.paperConfig
    row.updateTime = now()
    persist()
  },

  remove(id) {
    const row = templates.find(t => t.id === id && !t.deleted)
    if (!row) return
    const wasDefault = row.isDefault
    row.deleted = true
    row.deletedTime = now()
    row.isDefault = false
    if (wasDefault) {
      const replacement = active().find(t => t.businessType === row.businessType)
      if (replacement) replacement.isDefault = true
    }
    persist()
  },

  setDefault(businessType, id) {
    for (const row of active()) {
      if (row.businessType === businessType) row.isDefault = row.id === id
    }
    persist()
  },

  getDefault(businessType) {
    const row = active().find(t => t.businessType === businessType && t.isDefault)
    return row ? toPublic(row) : undefined
  },

  listTypes() {
    return TEMPLATE_TYPE_OPTIONS
  },

  listFields(businessType) {
    return TEMPLATE_TYPE_PROFILES[businessType]?.fields ?? []
  },
}
