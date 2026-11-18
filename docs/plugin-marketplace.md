# 插件市场

插件市场让第三方能力以**独立插件包**的形式接入打印设计器。索引与插件源码常驻本仓 `marketplace/`，
不创建独立仓库；安装器 `@worm-print-platform/marketplace` 支持从 npm / GitHub / Gitee 三种来源安装，
**不指定版本时取最新稳定版**。

> 完整方案与验证记录见 [plugin-marketplace-plan.md](./plugin-marketplace-plan.md)。

## 一、安装插件

```bash
npx @worm-print-platform/marketplace list
npx @worm-print-platform/marketplace install echarts
npx @worm-print-platform/marketplace install echarts@1.0.0 --source npm
npx @worm-print-platform/marketplace remove echarts
```

### 命令

| 命令 | 说明 |
| --- | --- |
| `list` | 列出 CLI 内置索引中的插件 |
| `install <名称>[@版本]` | 安装单个插件；缺省版本取最新稳定版 |
| `remove <名称>` | 卸载插件（删除目录与清单条目） |

### 选项

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `--source npm\|github\|gitee\|auto\|local` | `auto` | 安装来源；`auto` 按 npm → GitHub → Gitee 顺序回退 |
| `--dir <路径>` | `.worm-print/plugins` | 插件落盘根目录 |
| `--repo <路径或URL>` | — | 本地市场目录（离线开发）或自定义 git 仓库地址 |
| `--force` | false | 目标已存在时覆盖安装 |
| `-h, --help` | — | 帮助 |
| `-v, --version` | — | 版本 |

### 版本规则

- `<名称>` 可以是索引短 id（如 `echarts`）或完整 npm spec（如 `@worm-print-platform/plugin-echarts@1.0.0`）。
- 未带 `@版本` 即取**最新稳定版**：
  - npm 源：取 `dist-tags.latest`，若为预发布则改取最高非预发布版本；
  - GitHub / Gitee 源：列 `refs/tags/plugins/<id>/v*`，取最高非预发布 tag；无 tag 时回退默认分支并标记非稳定。
- 预发布（带 `-rc` / `-beta` / `-alpha` / `-next` / `-dev` 等后缀）不会被当作最新稳定版。
- 确定性错误（插件不存在、版本不存在、元数据不一致）**不会触发换源**；仅网络/克隆失败才回退。

### 安装结果

插件落到 `<dir>/<id>/`，宿主清单写到 `<dir>` 同级的 `plugins.json`：

```json
{
  "schemaVersion": 1,
  "plugins": {
    "echarts": {
      "version": "1.0.0",
      "entry": "dist/index.js",
      "kinds": ["barChart", "lineChart"],
      "exportFormats": [],
      "npmName": "@worm-print-platform/plugin-echarts",
      "source": { "mode": "npm" },
      "stable": true,
      "installedAt": "…"
    }
  }
}
```

## 二、宿主加载

插件入口是副作用模块，`import` 即注册；core 与 plugin-kit 的 `Symbol.for` 注册表保证跨副本单实例。

```js
// 静态 import（demo 用法）
import '../.worm-print/plugins/echarts/dist/index.js'

// 或按清单动态加载
Object.values(import.meta.glob('../.worm-print/plugins/*/dist/index.js', { eager: true }))
```

宿主构建工具建议对 `@worm-print-platform/core`、`@worm-print-platform/plugin-kit` 做 `dedupe`。

## 三、插件作者指南

### 元素插件

沿用 `defineElementPlugin` / `registerElementPlugin`（core）与 `defineElementUI` / `registerElementUI`
（plugin-kit），与内置元素同权。官方样板见 `packages/echarts` 与 `marketplace/plugins/echarts`。

### 导出插件（Excel / Word 等）

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

### 插件包协议

- `package.json` 带 `wormPrint` 元数据：`{ id, version, entry, kinds, exportFormats, peerDeps }`。
- `plugin.json` 放插件目录，字段与索引条目一致（id / version / npmName / entry / kinds / exportFormats / files）。
- `dist/` 必须预构建并提交；单文件 ESM；external 仅 core 与 plugin-kit，其余依赖内联。
- 插件包**可独立发布到 npm**（包名建议 `@worm-print-platform/plugin-<id>`）。

### 收录与发版

1. 在本仓 `marketplace/plugins/<id>/` 开发，更新 `marketplace/marketplace.json` 索引条目，走 PR 审核。
2. 发版时同步三处版本：`marketplace.json`、`plugin.json`、`package.json`（含 `wormPrint.version`）。
3. 维护者 `npm publish` 插件包，并在本仓打 tag `plugins/<id>/vX.Y.Z` 供 GitHub / Gitee 源解析。

### 独立示例：百度图表

首个插件是薄包装 `@worm-print-platform/plugin-echarts`，只做副作用注册；图表实现来自独立发布的
`@worm-print-platform/echarts`（含 `/kit`、`/ui` 子路径）。两者各自独立发布，图表库代码不被复制或内联。

## 四、信任边界

市场不做沙箱。信任来自 PR 审核 + npm 版本锁定；插件代码在宿主进程内运行，等同于普通 npm 依赖。
