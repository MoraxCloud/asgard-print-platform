import type {
  MultiPageTemplateData,
  PrintBusinessField,
  TemplateData,
} from '@worm-print-platform/canvas/vue3'
// 官方体检报告样本含图表元素，加载 echarts 的声明合并以通过类型检查
import type {} from '@worm-print-platform/echarts'
import type { PrintTemplateTypeOption } from '@/types/print'
import { TEMPLATE_TYPE_OPTIONS } from './template-types'
import { OFFICIAL_SAMPLES } from './official-samples'

export { TEMPLATE_TYPE_OPTIONS } from './template-types'

/** 某类模板的完整画像：类型元信息 + 字段树 + 示例打印数据 + 初始模板 */
export interface TemplateTypeProfile {
  value: string
  label: string
  fields: PrintBusinessField[]
  sampleData: Record<string, unknown>
  createTemplate: () => TemplateData | MultiPageTemplateData
}

type Template = TemplateData | MultiPageTemplateData

function cloneTemplate(template: Template): Template {
  return JSON.parse(JSON.stringify(template)) as Template
}

function profile(option: PrintTemplateTypeOption): TemplateTypeProfile {
  const official = OFFICIAL_SAMPLES[option.value]
  return {
    value: option.value,
    label: option.label,
    fields: official.fields,
    sampleData: official.data,
    createTemplate: () => cloneTemplate(official.template),
  }
}

export const TEMPLATE_TYPE_PROFILES: Record<string, TemplateTypeProfile> = {
  express: profile(TEMPLATE_TYPE_OPTIONS[0]),
  label: profile(TEMPLATE_TYPE_OPTIONS[1]),
  receipt: profile(TEMPLATE_TYPE_OPTIONS[2]),
  invoice: profile(TEMPLATE_TYPE_OPTIONS[3]),
  healthReport: profile(TEMPLATE_TYPE_OPTIONS[4]),
}
