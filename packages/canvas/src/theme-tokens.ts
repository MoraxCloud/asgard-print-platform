/**
 * 内置主题预设的色值表，与 core/styles/theme.css 的浅色令牌一一对应。
 *
 * 只服务于 <print-designer> 的 theme 参数通道：applyTheme() 把这些值写成
 * 内部 .designer-container 的行内 CSS 变量，优先级高于 Shadow DOM 内的令牌声明。
 *
 * 画布保持现状：纸张、画布背景、标尺、手柄与纸张阴影的令牌一律不进暗色表，
 * 换肤只影响设计器外壳，预览所见即所得不失真。宿主如需调整画布外围背景，
 * 可用 theme-config 显式覆盖 --pd-canvas-bg。
 */
import type { PrintDesignerThemeToken } from './host-contract'

/** 暗色模式下保持浅色原值的令牌（画布区 / 非颜色项），刻意不写入行内覆盖 */
export const CANVAS_UNCHANGED_TOKENS = [
  '--pd-canvas-bg', '--pd-paper', '--pd-handle', '--pd-ruler',
  '--pd-ruler-bg', '--pd-ruler-cursor', '--pd-shadow-paper', '--pd-radius',
] as const satisfies readonly PrintDesignerThemeToken[]

/** 暗色外壳预设：47 项 = 55 项完整清单 - 8 项画布/非颜色令牌 */
export const DARK_THEME_TOKENS: Partial<Record<PrintDesignerThemeToken, string>> = {
  '--pd-bg': '#181a20',
  '--pd-surface': '#1f2229',
  '--pd-field-bg': '#252830',
  '--pd-sidebar': '#1f2229',
  '--pd-sidebar-hover': '#2b2f39',

  '--pd-accent': '#4C8DFF',
  '--pd-accent-2': '#6C9DFF',
  '--pd-accent-soft': 'rgba(76, 141, 255, .16)',
  '--pd-accent-secondary': '#ff7a7a',
  '--pd-danger-soft': 'rgba(255, 122, 122, .14)',
  '--pd-ink-green': '#6cce5a',

  '--pd-text': '#e6e8ee',
  '--pd-text-muted': '#9aa0ad',
  '--pd-text-faint': '#6f7683',
  '--pd-text-regular': '#c9cdd8',

  '--pd-border': '#3a3f4b',
  '--pd-border-soft': '#2d323c',
  '--pd-input-bg': '#262a33',
  '--pd-hover-tint': 'rgba(76, 141, 255, .12)',
  '--pd-fill-light': '#2b2f39',

  '--pd-danger': '#ff6b6b',
  '--pd-danger-bg': '#3a2226',
  '--pd-danger-border': '#6b3535',
  '--pd-success': '#4ade80',

  '--pd-menu-text': '#d6d9e0',
  '--pd-menu-hover': '#2b2f39',
  '--pd-menu-border': '#3a3f4b',
  '--pd-menu-divider': '#2d323c',
  '--pd-menu-muted': '#8b91a0',
  '--pd-menu-disabled': '#555b68',

  '--pd-scrollbar': 'rgba(255, 255, 255, .18)',
  '--pd-scrollbar-thumb': 'rgba(255, 255, 255, .16)',
  '--pd-scrollbar-thumb-hover': 'rgba(255, 255, 255, .3)',

  '--pd-help-field-bg': '#16283a',
  '--pd-help-field-line': '#2c5870',
  '--pd-help-field-ink': '#7cc4f5',
  '--pd-help-function-bg': '#162e22',
  '--pd-help-function-line': '#2c5b3c',
  '--pd-help-function-ink': '#79d69a',
  '--pd-help-variable-bg': '#302c16',
  '--pd-help-variable-line': '#6b5d24',
  '--pd-help-variable-ink': '#d6b25e',
  '--pd-help-conditional-bg': '#301a28',
  '--pd-help-conditional-line': '#6b3454',
  '--pd-help-conditional-ink': '#e58ab5',

  '--pd-shadow-sm': '0 1px 2px rgba(0, 0, 0, .3)',
  '--pd-shadow-md': '0 2px 8px rgba(0, 0, 0, .4), 0 10px 28px rgba(0, 0, 0, .5)',
}
