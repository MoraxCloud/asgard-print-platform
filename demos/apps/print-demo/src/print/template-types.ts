import type { PrintTemplateTypeOption } from '@/types/print'

/** 打印模板类型：通用业务场景，不含任何业务域语义 */
export const TEMPLATE_TYPE_OPTIONS: PrintTemplateTypeOption[] = [
  { value: 'express', label: '快递面单模板' },
  { value: 'label', label: '标签模板' },
  { value: 'receipt', label: '小票模板' },
  { value: 'invoice', label: '发票模板' },
  { value: 'healthReport', label: '体检报告模板' },
]
