// @worm-print-platform/echarts 入口：ECharts 图表元素可选包
// core / common 主包不引入 echarts；仅本包依赖图表库（依赖: core、plugin-kit、echarts）。
// 本入口为框架无关主入口：import 即把「十 kind」插件描述符注册到 core 通用注册表。
// Web Components / plugin-kit 设计器 UI（画布 + 属性台）走 ./ui 子路径，按需引入。
import './type-augmentation.js'
import { registerChartPlugin } from './plugin.js'

export { CHART_PLUGIN, registerChartPlugin, registerChartDesigner, registerChartExecutorBundle, uninstallChartPlugin } from './plugin.js'
export { CHART_PLUGIN_ID, CHART_PALETTES } from './constants.js'
export type { ChartPaletteKey } from './constants.js'
export {
  configureChartPlugin,
  getChartPluginConfig,
  getChartPalettes,
  getSampleCategories,
  chartFactoryDefaults,
} from './config.js'
export type { ChartPluginConfig, ChartPaletteDefinition, ChartPalette } from './config.js'
export { CHART_KINDS, CHART_KIND_DEFINITIONS, getChartKindDefinition, resolveChartPanelFields } from './kinds.js'
export type { ChartFieldKey, ChartKindDefinition, ChartSeriesType } from './kinds.js'
export { createDefaultChartOption } from './defaults.js'
export { normalizeChartOption } from './normalize.js'
export { bindChartData } from './bind.js'
export { fitSvgRoot, mmToChartPx, renderChartElement, renderChartToSvg } from './renderer.js'
export type { ChartRenderSpec } from './renderer.js'

// 触发插件描述符注册（幂等；同 id 覆盖不会重复累积）
registerChartPlugin()
