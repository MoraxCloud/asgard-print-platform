# 插件安装与配置

插件市场让第三方能力以**独立插件包**的形式接入打印设计器。索引与插件源码常驻本仓 `marketplace/`，
不创建独立仓库；安装器 `@worm-print-platform/marketplace` 支持从 npm / GitHub / Gitee 三种来源安装，
**不指定版本时取最新稳定版**。

> 完整方案与验证记录见 [plugin-marketplace-plan.md](../plugin-marketplace-plan.md)。

## 4.1 安装插件

```bash
npx @worm-print-platform/marketplace list
npx @worm-print-platform/marketplace install echarts
npx @worm-print-platform/marketplace install echarts@1.0.0 --source npm
npx @worm-print-platform/marketplace remove echarts
```

### 4.1.1 命令

| 命令 | 说明 |
| --- | --- |
| `list` | 列出 CLI 内置索引中的插件 |
| `install <名称>[@版本]` | 安装单个插件；缺省版本取最新稳定版 |
| `remove <名称>` | 卸载插件（删除目录与清单条目） |

### 4.1.2 选项

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `--source npm\|github\|gitee\|auto\|local` | `auto` | 安装来源；`auto` 按 npm → GitHub → Gitee 顺序回退 |
| `--dir <路径>` | `.worm-print/plugins` | 插件落盘根目录 |
| `--repo <路径或URL>` | — | 本地市场目录（离线开发）或自定义 git 仓库地址 |
| `--force` | false | 目标已存在时覆盖安装 |
| `-h, --help` | — | 帮助 |
| `-v, --version` | — | 版本 |

### 4.1.3 版本规则

- `<名称>` 可以是索引短 id（如 `echarts`）或完整 npm spec（如 `@worm-print-platform/plugin-echarts@1.0.0`）。
- 未带 `@版本` 即取**最新稳定版**：
  - npm 源：取 `dist-tags.latest`，若为预发布则改取最高非预发布版本；
  - GitHub / Gitee 源：列 `refs/tags/plugins/<id>/v*`，取最高非预发布 tag；无 tag 时回退默认分支并标记非稳定。
- 预发布（带 `-rc` / `-beta` / `-alpha` / `-next` / `-dev` 等后缀）不会被当作最新稳定版。
- 确定性错误（插件不存在、版本不存在、元数据不一致）**不会触发换源**；仅网络/克隆失败才回退。

### 4.1.4 安装结果

插件落到 `<dir>/<id>/`，宿主清单写到 `<dir>` 同级的 `plugins.json`：

```json
{
  "schemaVersion": 1,
  "plugins": {
    "echarts": {
      "version": "1.0.0",
      "entry": "dist/marketplace.js",
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

## 4.2 宿主加载

插件入口是副作用模块，`import` 即注册；core 与 plugin-kit 的 `Symbol.for` 注册表保证跨副本单实例。

```js
// 静态 import（demo 用法）
import '../.worm-print/plugins/echarts/dist/marketplace.js'

// 或按清单动态加载
Object.values(import.meta.glob('../.worm-print/plugins/*/dist/marketplace.js', { eager: true }))
```

宿主构建工具建议对 `@worm-print-platform/core`、`@worm-print-platform/plugin-kit` 做 `dedupe`。

---
