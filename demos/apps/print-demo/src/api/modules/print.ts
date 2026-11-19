import type { PrintBusinessField } from '@worm-print-platform/canvas/vue3'
import { post } from '../request'
import type { ApiResult, PageParam, PageResult } from '../types'
import type { PrintTemplate, PrintTemplateSaveParam, PrintTemplateTypeOption } from '@/types/print'

export interface PrintTemplateParams extends PageParam {
  name?: string
  businessType?: string
}

export interface PrintDesignerData {
  template: PrintTemplate
  fields: PrintBusinessField[]
  printData: Record<string, any>[]
}

export interface PrintRenderData {
  templateJson: Record<string, any>
  printData: Record<string, any>[]
  baseUrl?: string
}

export function pageTemplate(params: PrintTemplateParams): Promise<ApiResult<PageResult<PrintTemplate>>> {
  return post<PageResult<PrintTemplate>>('/sys/print/template/page', params)
}

export function saveTemplate(data: PrintTemplateSaveParam): Promise<ApiResult<string>> {
  return post<string>('/sys/print/template/save', data)
}

export function updateTemplate(data: PrintTemplateSaveParam): Promise<ApiResult<string>> {
  return post<string>('/sys/print/template/update', data)
}

export function getTemplateById(id: string): Promise<ApiResult<PrintTemplate>> {
  return post<PrintTemplate>('/sys/print/template/getById', { id })
}

export function deleteTemplate(id: string): Promise<ApiResult<string>> {
  return post<string>('/sys/print/template/delete', { id })
}

export function listTypes(): Promise<ApiResult<PrintTemplateTypeOption[]>> {
  return post<PrintTemplateTypeOption[]>('/sys/print/template/listTypes', {})
}

export function listFields(businessType: string): Promise<ApiResult<PrintBusinessField[]>> {
  return post<PrintBusinessField[]>('/sys/print/template/listFields', { businessType })
}

export function getDesignerData(id: string): Promise<ApiResult<PrintDesignerData>> {
  return post<PrintDesignerData>('/sys/print/template/getDesignerData', { id })
}

export function setDefaultTemplate(businessType: string, templateId: string): Promise<ApiResult<string>> {
  return post<string>('/sys/print/template/setDefault', { businessType, templateId })
}

export function getDefaultTemplate(businessType: string): Promise<ApiResult<PrintTemplate>> {
  return post<PrintTemplate>('/sys/print/template/getDefault', { businessType })
}

export function renderData(params: {
  templateId: string
  businessType: string
}): Promise<ApiResult<PrintRenderData>> {
  return post<PrintRenderData>('/sys/print/render/data', params)
}

export async function uploadPrintImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await post<{ url: string }>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.url
}
