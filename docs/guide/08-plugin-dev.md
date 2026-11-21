# 插件开发

## 5.1 插件作者指南

### 5.1.1 元素插件

沿用 `defineElementPlugin` / `registerElementPlugin`（core）与 `defineElementUI` / `registerElementUI`
（plugin-kit），与内置元素同权。官方样板见 `packages/echarts` 与 `marketplace/plugins/echarts`。

### 5.1.2 导出插件（Excel / Word 等）

导出能力不是新元素类型，而是与渲染结果对接的输出类插件。core 提供第二契约：

```ts
import { defineExportPlugin, registerExportPlugin } from '@worm-print-platform/core'

registerExportPlugin(defineExportPlugin({
  id: 'plugin-excel',
  version: '1.0.0',
  formats: ['xlsx'],
  async export(input, options) {
    // input.pages：渲染后的分页 HTML 与纸型尺寸
    // input.template / input.printData：模板与打印数据
    // 在浏览器侧生成文件 blob，返回 { filename, blob }
    return { filename: '报表.xlsx', blob: new Blob() }
  },
}))
```

宿主 UI 按已注册的 `formats` 自动生成「导出 Excel」「导出 Word」菜单项，调用 `export()` 后触发下载。
注意：渲染结果导出是「所见即所得」但结构化差——HTML 表格转单元格、文档排版的还原由插件自身负责。

### 5.1.3 插件包协议

- `package.json` 带 `wormPrint` 元数据：`{ id, version, entry, kinds, exportFormats, peerDeps }`。
- `plugin.json` 放插件目录，字段与索引条目一致（id / version / npmName / entry / kinds / exportFormats / files）。
- `dist/` 必须预构建并提交；单文件 ESM；external 仅 core 与 plugin-kit，其余依赖内联。
- 插件包**可独立发布到 npm**（包名建议 `@worm-print-platform/plugin-<id>`）。

### 5.1.4 收录与发版

1. 在本仓 `marketplace/plugins/<id>/` 开发，更新 `marketplace/marketplace.json` 索引条目，走 PR 审核。
2. 发版时同步三处版本：`marketplace.json`、`plugin.json`、`package.json`（含 `wormPrint.version`）。
3. 维护者 `npm publish` 插件包，并在本仓打 tag `plugins/<id>/vX.Y.Z` 供 GitHub / Gitee 源解析。

### 5.1.5 示例：百度图表（唯一源码真源）

`marketplace/plugins/echarts/` 是百度图表插件的唯一源码真源：十类图表描述符、SSR 渲染器、页面执行器
与设计器 UI 均在此目录。构建脚本 `npm run build` 从同一源码同时产出：

- `@worm-print-platform/plugin-echarts`：市场主口径，根入口 `dist/marketplace.js` 一次 import 注册插件与 UI；
- `@worm-print-platform/echarts`：兼容镜像，保留原包名与全部子路径（`.`、`/kit`、`/ui`、`/node`、`/browser`、
  `/browser/executor.iife`）及原根入口行为，供存量依赖方零改动使用。

两个包均可单独 `npm publish`，README 为同一份市场口径文档（构建时同步到兼容包）。插件 id
`@worm-print-platform/echarts` 保持不变，避免既有模板的 `plugins` 声明被 contract 判为 MISSING_PLUGIN。

## 5.2 信任边界

市场不做沙箱。信任来自 PR 审核 + npm 版本锁定；插件代码在宿主进程内运行，等同于普通 npm 依赖。

---
