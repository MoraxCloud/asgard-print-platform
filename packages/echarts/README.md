<p align="center">
  <strong>@worm-print-platform/echarts</strong><br>
  <em>打印模板 ECharts 图表元素可选包</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/npm-v1.5.1-384BFF" alt="npm">
  <img src="https://img.shields.io/badge/license-MIT-9A9A9A" alt="license">
</p>

> monorepo 根：[worm-print-platform](https://github.com/worm-longliu/worm-print-platform)

一个插件注册十个图表元素：提供 ECharts SSR SVG 渲染器、页面执行器、设计器画布 / 图形化属性面板与共享数据契约。主包 `@worm-print-platform/core` 与 `@worm-print-platform/canvas` **不依赖任何图表库**，只有本包引入 `echarts`（Apache-2.0）。

**「import 即注册」**：宿主不需要写任何注册代码，也不需要手写渲染器传参。

## 安装

```bash
npm i @worm-print-platform/echarts
```

依赖：`echarts`（^6.1.0）、`@worm-print-platform/core`、`@worm-print-platform/plugin-kit`

## 十个元素

| type | 元素 | 默认尺寸 | 数据映射要点 |
| --- | --- | --- | --- |
| `barChart` | 柱状图 | 100×60mm | 类目 + 多数值字段（多值多系列） |
| `barHChart` | 条形图（横向） | 100×60mm | 类目写 yAxis，xAxis 为数值 |
| `lineChart` | 折线图 | 100×60mm | 同柱状图，series 为 line |
| `areaChart` | 面积图 | 100×60mm | 折线 + areaStyle |
| `pieChart` | 饼图 | 60×60mm | 类目 + 首数值 → `{ name, value }` |
| `doughnutChart` | 环形图 | 60×60mm | 饼图 + 可配内径 |
| `scatterChart` | 散点图 | 80×60mm | 类目作 x、首数值作 y；`chartBubble` 开启时第二数值作点大小 |
| `radarChart` | 雷达图 | 70×60mm | 数值字段 = 维度，每行一个系列 |
| `funnelChart` | 漏斗图 | 60×60mm | 类目 + 首数值，按数值降序 |
| `gaugeChart` | 仪表盘 | 60×60mm | 取首行首值；min/max 面板可配 |

所有元素共用同一份数据契约：`chartOption` + `chartDataSource` / `chartCategoryField` / `chartValueFields` / `chartSeriesField`。模板只存 option 模板与字段映射，真实数据由 core 绑定阶段注入。

## 用法

### 设计器 / 浏览器宿主

```ts
// 一行副作用 import：素材卡、画布、属性面板、校验、绑定、出图全部生效
import '@worm-print-platform/echarts'
```

### 服务端 PDF / Electron 主进程

```ts
// ① 部署白名单：显式 import 才允许该插件进入注册表
import '@worm-print-platform/echarts/node'

// ② runtime 装配：执行器由注册表自动收集，新增插件无需改这行
import { collectExecutorBundles, createDomHostRuntime } from '@worm-print-platform/core'
createDomHostRuntime(factory, loadExecutorBundle(), collectExecutorBundles())
```

### 零框架宿主 / 自建设计器 UI（`/kit`）

`/kit` 是**框架无关的纯 TS 出口**：不包含任何 `.vue` 组件、不读磁盘，import 即把十个 kind 注册到 core 插件注册表，但**不**注册设计器组件与执行器产物。

```ts
import {
  CHART_KIND_DEFINITIONS, createDefaultChartOption, normalizeChartOption,
  previewChartOption, renderChartToSvg,
} from '@worm-print-platform/echarts/kit'
```

## 配置

```ts
import { configureChartPlugin } from '@worm-print-platform/echarts'

configureChartPlugin({
  defaultWidth: 120,           // 新建图表元素的全局默认尺寸
  defaultHeight: 70,
  palettes: {
    default: { label: '企业蓝', colors: ['#165DFF', '#36B37E'] },
    brand: { label: '品牌色', colors: ['#F2704E', '#F7A35C'] },
  },
  sampleCategories: ['一季度', '二季度', '三季度'],
  components: [GaugeChart],    // 追加 echarts.use 的图表/组件构造器
})
```

配置是**惰性**的：可在注册前调用、按键合并，不需要注销重注册。

## 导出

| 子路径 | 内容 |
| --- | --- |
| `.` | `CHART_PLUGIN` / `CHART_KIND_DEFINITIONS` / `createDefaultChartOption` / `renderChartToSvg` / `configureChartPlugin` 等（注册副作用 + 纯 TS 能力） |
| `/kit` | 框架无关纯 TS 出口（无 Vue、无 `node:fs`） |
| `/node` | 注册副作用 + `render.executorBundle()`（惰性读取 IIFE 产物，服务端装配用） |
| `/ui` | plugin-kit 设计器 UI（静态 SVG 画布 + 原生 DOM 属性面板） |
| `/browser` | UMD bundle（`dist/echarts.js`） |

`type-augmentation.ts` 用声明合并把十个图表类型与 `chartOption` 等专属字段注入 core 的类型扩展点。

## 开发

```bash
npm run build   # vite + tsc + tsup
npm test        # vitest
```

## 相关链接

- [根 README](https://github.com/worm-longliu/worm-print-platform/blob/main/README.md)
- [插件化自定义元素章节](https://github.com/worm-longliu/worm-print-platform/blob/main/README.md#插件化自定义元素)
- [plugin-kit 契约](../plugin-kit/README.md)

## License

[MIT](../../LICENSE)
