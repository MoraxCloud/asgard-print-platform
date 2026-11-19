// 颜色选择器 —— 单一真源已上移到 @worm-print-platform/plugin-kit/controls。
// 本文件保留 re-export：canvas 侧既有调用方（controls.ts）与单测的 import 路径不变，
// 插件则通过 @worm-print-platform/plugin-kit/controls 复用同一实现。
export {
  parseHex,
  normalizeHex,
  rgbToHex,
  rgbToHsv,
  hsvToRgb,
  colorPicker,
  closeColorPicker,
} from '@worm-print-platform/plugin-kit/controls'
export type { ColorPickerOptions } from '@worm-print-platform/plugin-kit/controls'
