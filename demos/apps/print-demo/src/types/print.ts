/** 打印模板元信息；elements 为设计器 JSON 字符串，与元信息分离存储 */
export interface PrintTemplate {
  id: string
  name: string
  businessType: string
  elements: string
  paperConfig?: string
  remark: string
  isDefault: boolean
  createTime: string
  updateTime: string
}

/** 模板类型字典项 */
export interface PrintTemplateTypeOption {
  value: string
  label: string
}

/** 模板保存参数（新增/更新共用） */
export interface PrintTemplateSaveParam {
  id?: string
  name?: string
  businessType?: string
  elements: string
  remark?: string
  paperConfig?: string
}
