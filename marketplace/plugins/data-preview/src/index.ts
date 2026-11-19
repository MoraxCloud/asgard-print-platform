// 数据源预览插件（市场入口）：import 即注册「字段分组 → 查看数据源」动作。
// 宿主无需改业务代码；canvas/vue3 门面在字段树父节点自动渲染按钮。
import { defineFieldActionUI, registerFieldActionUI } from '@worm-print-platform/plugin-kit'
import { mountPreview, PREVIEW_STYLES } from './ui.js'

export const DATA_PREVIEW_ACTION = defineFieldActionUI({
  id: 'data-preview',
  label: '查看数据源',
  icon: '👁',
  styles: PREVIEW_STYLES,
  onActivate: ctx => mountPreview(ctx),
})

/** 手动注册/注销（热更新或宿主按需控制时用；import 本入口已自动注册一份） */
export function registerDataPreviewPlugin(): () => void {
  return registerFieldActionUI(DATA_PREVIEW_ACTION)
}

registerDataPreviewPlugin()

export { describeDataSource } from './describe.js'
export { mountPreview, PREVIEW_STYLES } from './ui.js'
export type {
  ValueKind, PreviewColumn, FormRow, OverviewRow, PreviewTab, PreviewDescriptor,
} from './types.js'
