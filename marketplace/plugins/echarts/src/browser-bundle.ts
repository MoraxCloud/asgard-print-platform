// 浏览器直挂入口（UMD）：无构建器的宿主（jQuery / 原生页面）用 <script src> 引入。
// 与 index.ts 的差别：core、plugin-kit 与 echarts 本体全部内联（不走 bare import）。
// core 元素插件注册表与 plugin-kit UI 注册表都挂在 globalThis 固定 Symbol key 上，
// 与 canvas.js UMD 双 bundle 共享同一实例，import 副作用即可让素材卡、画布出图
// 与浏览器预览渲染管线（generateHtml 调插件 render.html）全部生效。
import * as CommonIndex from './index'
import './ui'

const WormPrintEcharts = {
  ...CommonIndex,
}
;(globalThis as Record<string, unknown>).WormPrintEcharts ??= WormPrintEcharts

export * from './index'
