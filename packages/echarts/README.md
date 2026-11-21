# 百度图表插件（@worm-print-platform/plugin-echarts）

worm-print-platform 插件市场的百度图表插件：**十类 ECharts 图表元素 + 设计器 UI，import 即注册**。

本目录 `marketplace/plugins/echarts/` 是图表插件的**唯一源码真源**。同一份源码构建出两个 npm 包：

| 包名 | 定位 | 根入口行为 |
| --- | --- | --- |
| `@worm-print-platform/plugin-echarts` | 插件市场主口径（推荐） | 注册插件描述符 + 设计器 UI |
| `@worm-print-platform/echarts` | 兼容镜像，供存量依赖方零改动使用 | 仅注册插件描述符（原行为） |

## 安装（插件市场口径，推荐）

```bash
npx @worm-print-platform/marketplace install echarts
```

宿主按清单加载插件入口（import 即注册，无需额外调用）：

```js
import '../.worm-print/plugins/echarts/dist/marketplace.js'
```

插件安装后，素材台出现「图表」分组的十张卡片：柱状图、条形图、折线图、面积图、饼图、环形图、
散点图、雷达图、漏斗图、仪表盘。

## 作为 npm 包使用

```bash
npm install @worm-print-platform/plugin-echarts
```

```js
// 主入口：插件描述符 + 设计器 UI 一次注册完成
import '@worm-print-platform/plugin-echarts'

// 按需子路径
import '@worm-print-platform/plugin-echarts/kit'  // 仅框架无关插件描述符（无 UI）
import '@worm-print-platform/plugin-echarts/ui'   // 仅设计器 UI
```

服务端 PDF / Electron 静默打印使用 `@worm-print-platform/plugin-echarts/node` 与
`/browser/executor.iife`（页面执行器），浏览器直挂使用 `/browser` UMD 产物。

存量项目若仍依赖 `@worm-print-platform/echarts`，无需改动：兼容镜像保留全部原有子路径
（`.`、`/kit`、`/ui`、`/node`、`/browser`、`/browser/executor.iife`）与行为。

## 数据标签

属性面板的「自定义属性」页签内含一个可折叠的「数据标签」分组，配置直接写入
`chartOption.series[].label`（仪表盘写 `series[].detail`），与模板里手写的标签是同一份数据。

| 块 | 字段 | 控件 |
| --- | --- | --- |
| 内容 | 显示数据标签、数据标签内容（formatter）、溢出处理 | 开关、预设下拉 + 文本框、下拉 |
| 位置 | 标签位置、距离、旋转、水平 / 垂直偏移 | 下拉、数字 |
| 样式 | 字号、字重、文字颜色、背景色、边框色、边框宽度、圆角、内边距 | 数字、下拉、文本 |
| 引导线 | 显示引导线、引导线长度、第二段长度、平滑引导线 | 开关、数字（饼图 / 环形图 / 漏斗图） |

字段按图表能力分档：柱状 / 条形 / 折线 / 面积开放全部基础项，散点额外支持距离，
雷达只给内容与字号 / 字重 / 颜色，仪表盘走 `detail`（数值文本）。

formatter 预设：数值 `{c}`、名称: 数值 `{b}: {c}`、名称 `{b}`、百分比 `{d}%`；
也可以直接手写 ECharts 字符串模板。预设与手写都只写 `formatter` 一个键。

默认行为：

- 未打开总开关时不写入任何 label 键，存量模板渲染结果不变。
- 打开总开关时按图表写入一套默认集（例：柱状图 `position: 'top'` + `fontSize: 12`；
  饼图额外写 `overflow: 'none'`，避免小尺寸下标签被 `truncate` 裁空），已有值不覆盖。
- 关闭总开关只写 `show: false`，字号 / 颜色 / formatter 等配置保留，重开即还原。

手写通道仍然有效，适合需要 `rich` 富文本等面板未覆盖的场景：

```js
chartOption: {
  series: [{
    type: 'bar',
    data: ['$data'],
    label: { show: true, position: 'top', formatter: '{b}: {c}' },
  }],
}
```

不支持：`rich` 富文本、`emphasis.label`（SSR 导出只含 normal 态）、`labelLayout`
（防重叠会改变存量观感，后续单独立项）。

## 独立发布

两个包均可单独 `npm publish`，且从同一源码生成：

```bash
cd marketplace/plugins/echarts
npm run build          # vite + tsc + tsup + UMD + 兼容镜像同步
npm publish --registry=https://registry.npmjs.org --access public
# 根目录：npm publish -w @worm-print-platform/echarts（兼容镜像）
```

发版时同步 `marketplace.json`、`plugin.json`、本 `package.json` 的 `wormPrint.version`；市场 CLI
通过本仓 tag `plugins/echarts/vX.Y.Z` 解析稳定版本。完整收录与版本规则见
[用户使用文档 · 插件安装与配置](../../docs/guide/07-plugin-install.md)。

## 信任边界

市场不做沙箱。插件代码在宿主进程内运行，等同于普通 npm 依赖；信任来自 PR 审核与版本锁定。
