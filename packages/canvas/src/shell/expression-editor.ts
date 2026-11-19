// 表达式编辑器弹窗 —— 单一真源已上移到 @worm-print-platform/plugin-kit/expression-editor。
// 本文件保留 re-export：canvas 内部（print-designer.ts）既有 import 路径不变，
// 插件则通过 @worm-print-platform/plugin-kit/expression-editor 复用同一实现。
export { renderExpressionEditor, normalizeFieldDisplay } from '@worm-print-platform/plugin-kit/expression-editor'
export type { ExpressionEditorTarget, ExpressionEditorOptions, FieldDisplayMode } from '@worm-print-platform/plugin-kit/expression-editor'
