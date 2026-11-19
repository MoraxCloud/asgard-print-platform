import { http, HttpResponse } from 'msw'
import type { PrintBusinessField } from '@worm-print-platform/canvas/vue3'
import { TEMPLATE_TYPE_PROFILES } from '@/print/registry'
import type { PrintTemplateSaveParam } from '@/types/print'
import { templateStore } from './store'

function ok<T>(data: T) {
  return HttpResponse.json({ ret: true, msg: 'ok', data })
}

function fail(msg: string) {
  return HttpResponse.json({ ret: false, msg, data: null })
}

async function bodyOf(request: Request): Promise<Record<string, any>> {
  try {
    return (await request.json()) as Record<string, any>
  } catch {
    return {}
  }
}

export const handlers = [
  http.post('*/sys/print/template/page', async ({ request }) => ok(templateStore.list(await bodyOf(request)))),

  http.post('*/sys/print/template/save', async ({ request }) => {
    const body = await bodyOf(request)
    return ok(templateStore.save(body as PrintTemplateSaveParam))
  }),

  http.post('*/sys/print/template/update', async ({ request }) => {
    templateStore.update(await bodyOf(request) as PrintTemplateSaveParam)
    return ok('更新成功')
  }),

  http.post('*/sys/print/template/getById', async ({ request }) => {
    const body = await bodyOf(request)
    const template = templateStore.getById(String(body.id ?? ''))
    return template ? ok(template) : fail('模板不存在')
  }),

  http.post('*/sys/print/template/delete', async ({ request }) => {
    const body = await bodyOf(request)
    templateStore.remove(String(body.id ?? ''))
    return ok('删除成功')
  }),

  http.post('*/sys/print/template/listTypes', () => ok(templateStore.listTypes())),

  http.post('*/sys/print/template/listFields', async ({ request }) => {
    const body = await bodyOf(request)
    const fields: PrintBusinessField[] = templateStore.listFields(String(body.businessType ?? ''))
    return ok(fields)
  }),

  http.post('*/sys/print/template/setDefault', async ({ request }) => {
    const body = await bodyOf(request)
    templateStore.setDefault(String(body.businessType ?? ''), String(body.templateId ?? ''))
    return ok('设置成功')
  }),

  http.post('*/sys/print/template/getDefault', async ({ request }) => {
    const body = await bodyOf(request)
    const template = templateStore.getDefault(String(body.businessType ?? ''))
    return template ? ok(template) : fail('默认模板不存在')
  }),

  http.post('*/sys/print/template/getDesignerData', async ({ request }) => {
    const body = await bodyOf(request)
    const template = templateStore.getById(String(body.id ?? ''))
    if (!template) return fail('模板不存在')
    const fields = templateStore.listFields(template.businessType)
    const sample = TEMPLATE_TYPE_PROFILES[template.businessType]?.sampleData ?? {}
    return ok({ template, fields, printData: [sample] })
  }),

  http.post('*/sys/print/render/data', async ({ request }) => {
    const body = await bodyOf(request)
    const template = templateStore.getById(String(body.templateId ?? ''))
    if (!template) return fail('模板不存在')
    const sample = TEMPLATE_TYPE_PROFILES[template.businessType]?.sampleData ?? {}
    return ok({
      templateJson: JSON.parse(template.elements) as Record<string, unknown>,
      printData: [sample],
      baseUrl: '/files',
    })
  }),

  http.post('*/api/upload', () => ok({ url: 'data:image/png;base64,iVBORw0KGgo=' })),
]
