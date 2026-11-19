// 极简 DOM 构建助手 —— 单一真源已上移到 @worm-print-platform/plugin-kit/dom。
// 本文件保留 re-export，让 canvas 内部既有的 53 处 `../core/h` 引用路径保持不变；
// 插件通过 @worm-print-platform/plugin-kit/dom 或 /controls 使用同一份实现。
export { h, render, clear, mm, SVG_NS_CONST } from '@worm-print-platform/plugin-kit/dom'
export type { AttrValue, Child, El } from '@worm-print-platform/plugin-kit/dom'
