// 数据源预览插件：只提供触发 API，不自动往设计器字段树挂按钮。
// 宿主自己决定入口位置与开关，调用 openDataPreview(options) 即可弹出预览。
export { openDataPreview, PREVIEW_STYLES } from './ui.js'
export { describeDataSource } from './describe.js'
export type {
  ValueKind, PreviewColumn, FormRow, OverviewRow, PreviewTab, PreviewDescriptor,
  FieldGroupInfo, DataPreviewOptions,
} from './types.js'
