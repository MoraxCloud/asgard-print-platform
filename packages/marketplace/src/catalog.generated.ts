// 由 scripts/gen-catalog.mjs 从 marketplace/marketplace.json 生成，请勿手改
import type { MarketIndex } from './types.js'

export const BUNDLED_CATALOG: MarketIndex = {
  "schemaVersion": 1,
  "plugins": [
    {
      "id": "echarts",
      "name": "百度图表元素",
      "description": "基于 ECharts 的十类打印图表元素，浏览器与服务端同构出图。图表库包 @worm-print-platform/echarts 独立发布，本插件仅做副作用注册。",
      "version": "1.1.0",
      "npmName": "@worm-print-platform/plugin-echarts",
      "path": "plugins/echarts",
      "entry": "dist/marketplace.js",
      "kinds": [
        "barChart",
        "barHChart",
        "lineChart",
        "areaChart",
        "pieChart",
        "doughnutChart",
        "scatterChart",
        "radarChart",
        "funnelChart",
        "gaugeChart"
      ],
      "exportFormats": [],
      "homepage": "https://github.com/worm-longliu/worm-print-platform/tree/master/marketplace/plugins/echarts",
      "license": "MIT",
      "minCoreVersion": "1.5.2"
    }
  ]
}
