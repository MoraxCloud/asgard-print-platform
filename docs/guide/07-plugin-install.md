# 插件安装与配置（Plugin Installation）

[← 返回目录](./README.md) | ← 上一篇：[多语言配置与自定义](./06-i18n.md) | 下一篇：[插件开发](./08-plugin-dev.md) →

> 目标：把市场插件（如 echarts）装进项目并让设计器加载、验证可用。
> 完整方案与验证记录见 [plugin-marketplace-plan.md](../plugin-marketplace-plan.md)。

## 1. 前置条件（Prerequisites）

- 已完成 [01](./01-getting-started.md)，宿主已能渲染设计器（02–05 任一）。
- 安装器 `@worm-print-platform/marketplace`（bin：`worm-print-marketplace`）可从 npm 解析；若 404 按第 4 节回退。
- 加载市场插件通常还需 `echarts` 运行时（见第 4 节）与含 `./i18n` 导出的 `core` 版本；两者缺失是构建期最常见的两个失败。

## 2. 步骤（Steps）

### 2.1 安装命令（cwd = 项目根）

```bash
npx @worm-print-platform/marketplace list
npx @worm-print-platform/marketplace install echarts              # 最新稳定版
npx @worm-print-platform/marketplace install echarts@1.1.0 --source npm
npx @worm-print-platform/marketplace remove echarts
```

| 命令 | 说明 |
| --- | --- |
| `list` | 列出 CLI 内置索引（`BUNDLED_CATALOG`，编译期生成）中的插件；与仓库 `marketplace/marketplace.json` 同源但需同步，以 `list` 实际输出为准 |
| `install <名称>[@版本]` | 安装单个插件；缺省取最新稳定版 |
| `remove <名称>` | 卸载（删除目录、语言资源与清单条目） |

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `--source npm\|github\|gitee\|auto\|local` | `auto` | 安装来源；`auto` 按 npm → GitHub → Gitee 顺序回退 |
| `--dir <路径>` | `.worm-print/plugins` | 插件落盘根目录 |
| `--repo <路径或URL>` | — | 本地市场目录（离线开发）或自定义 git 仓库地址 |
| `--force` | false | 目标已存在时覆盖安装 |
| `-h, --help` / `-v, --version` | — | 帮助 / 版本 |

### 2.2 版本规则

- `<名称>` 可为索引短 id（如 `echarts`）或完整 npm spec（如 `@worm-print-platform/plugin-echarts@1.1.0`）。示例版本以 `list` / 索引为准，本文档不固定具体版本号。
- 未带 `@版本` 取**最新稳定版**：npm 源取 `dist-tags.latest`（预发布则改取最高非预发布）；GitHub/Gitee 源列 `refs/tags/plugins/<id>/v*`，无 tag 回退默认分支并标记非稳定。
- 预发布（`-rc` / `-beta` 等）不会被当作最新稳定版。
- 确定性错误（插件不存在、版本不存在、元数据不一致）**不换源**；仅网络/克隆失败才回退。

### 2.3 安装结果与语言资源

插件落到 `<dir>/<id>/`，清单写到同级 `plugins.json`：

```json
{
  "schemaVersion": 1,
  "plugins": {
    "echarts": {
      "version": "1.1.0",
      "entry": "dist/marketplace.js",
      "kinds": ["barChart", "lineChart"],
      "exportFormats": [],
      "npmName": "@worm-print-platform/plugin-echarts",
      "source": { "mode": "npm" },
      "stable": true,
      "installedAt": "…",
      "i18n": { "base": "zh-CN", "locales": ["zh-CN", "en-US", "th-TH"] }
    }
  }
}
```

- 插件声明 `wormPrint.i18n` 时，安装器把 `dist/i18n/<locale>.json` 同步到 `.worm-print/i18n/<id>/`，并记入清单。
- **卸载**：同时删除 `.worm-print/i18n/<id>/` 与清单条目。
- **升级（`--force`）**：先清旧目录再写入，不留已删除语言；清单 `i18n.locales` 同步更新。
- **旧安装**：旧清单无 `i18n` 字段时，语言包 CLI 会提示「插件 X 的语言资源未同步，请重新安装」；用 `install <名称> --force` 重装。
- npm 直装的插件只要声明了 `wormPrint.i18n` 也会被语言包 CLI 发现，不必经过市场安装。

### 2.4 宿主加载（Host Loading）

插件入口是副作用模块，`import` 即注册；core/plugin-kit 用 `Symbol.for` 注册表保证跨副本单实例。

**Vite/Vue 3（推荐写法，cwd = 项目根）**：在 `src/main.js` 入口 import，别放组件内：

```js
// src/main.js
import '../.worm-print/plugins/echarts/dist/marketplace.js'
```

```ts
// vite.config.ts
export default defineConfig({
  resolve: { dedupe: ['@worm-print-platform/core', '@worm-print-platform/plugin-kit'] },
})
```

**按清单动态加载**（需 Vite 的 `import.meta.glob`，其他构建器请改用显式 import 或动态 `import()`）：

```js
Object.values(import.meta.glob('../.worm-print/plugins/*/dist/marketplace.js', { eager: true }))
```

> 路径基准：`../.worm-print/...` 假设 `.worm-print` 在项目根、`main.js` 在 `src/`。若目录不同，按实际相对路径调整；`import.meta.glob` 是 Vite 专有，webpack/无打包器不可用。

## 3. 验证（Verification）

```bash
npx @worm-print-platform/marketplace list          # 能看到已装插件；npx 404 时用 §4 的本地 CLI 执行 list
cat .worm-print/plugins.json                        # 回读版本/entry/i18n 与安装一致
ls .worm-print/i18n/echarts/                        # 语言资源已同步
npm run build                                       # 加载插件后构建通过
```

> 无 GUI / 无桌面浏览器环境可用等效 smoke：起 `npm run dev` 后 `curl` 检查 `/`、`/src/main.js`、插件入口文件的 HTTP 200，确认 dev server 无编译错误；页面视觉确认留到有浏览器时再做。

页面现象：设计器素材区出现该插件的元素类型；切到属性面板不报错。装了语言包时按 [06 §3.3.4](./06-i18n.md#334-切换与验证) 验证文案切换。

## 4. 排错（Troubleshooting）

| 症状 | 原因 / 处理 |
| --- | --- |
| `npx @worm-print-platform/marketplace` 返回 404 | 包未发布 / 镜像未同步 / 网络受限。回退用仓库本地 CLI：先 `npm install` 本仓，再 `node packages/marketplace/dist/cli.js install echarts --source local --repo <仓库根>/marketplace --dir .worm-print/plugins`。`--repo` 指向本地市场目录即可离线安装。 |
| 构建报 `Missing "./i18n" specifier in "@worm-print-platform/core"` | 市场插件 import `core/i18n`，但已装的 npm `core@1.6.0` 发布产物缺 `./i18n` 导出（仓库源码的 `package.json` 已声明，二者不同步；没有更高版本可升）。**回退（三包同源一起切，不要只换 core）**：在仓库根 `npm install && npm run build` 后，到你的项目执行 `npm install <仓库根>/packages/core <仓库根>/packages/canvas <仓库根>/packages/plugin-kit`，让三者指向同一份仓库构建产物；只换 core 会因 npm canvas 与本地 core 导出常量不一致而报 `CELL_BORDER_APPLY_HINT* MISSING_EXPORT`。需求：项目里这三者版本号仍齐平。版本同步发布后再切回 npm。 |
| 构建报 `Rollup failed to resolve import "echarts/charts"` | 市场 echarts 插件依赖 `echarts` 运行时（它不在 core/plugin-kit peerDeps 里，但运行时确实需要）：`npm install echarts@^6.1.0` 后重编。 |
| 两条 echarts 路径分不清 | 「npm 包方式」=`npm i @worm-print-platform/echarts` + `import '@worm-print-platform/echarts/ui'`（兼容镜像包，含 `/ui`、`/node`、`/browser` 子路径）；「市场 CLI 方式」= 安装到 `.worm-print/plugins/echarts` + import `dist/marketplace.js`。二者都能注册元素，但来源与文件路径不同，**不要混用同一元素的两份注册**；二选一即可。 |
| 外部项目不知道 `--repo` 填什么 | 装已发布插件用 `--source npm` 或默认 `auto`，无需 `--repo`；仅在离线/仓库内开发时才用 `--repo <本地市场目录或自定义 git 地址>`。 |

## 5. AI 工具集成提示词（场景差异）

通用门控/安装/验收模板见 [01 §5](./01-getting-started.md#5-ai-提示词模板唯一模板源)，本场景额外约束：

```text
【任务】安装指定插件并让设计器加载验证。
- 先 marketplace list 确认可用；install 不指定版本取最新稳定版，以 list/索引为准。
- npx 404 时按 07 §4 用本地 CLI（--source local --repo <本地市场目录>）回退，先判因再回退。
- 宿主加载：入口 main.js import 插件 dist/marketplace.js；Vite 下对 core/plugin-kit 做 dedupe。
- 前置：确认已装含 ./i18n 导出的 core；市场 echarts 插件需 npm install echarts@^6.1.0。
- npm 包方式（@worm-print-platform/echarts/ui）与市场 CLI 方式二选一，不混用同一元素。
【验收】marketplace list 可见；回读 plugins.json 一致；语言资源目录存在；npm run build 通过；设计器出现插件元素。
```

[← 返回目录](./README.md) | ← 上一篇：[多语言配置与自定义](./06-i18n.md) | 下一篇：[插件开发](./08-plugin-dev.md) →
