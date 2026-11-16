# docs · 各框架接入操作方法与 AI 提示词

面向宿主开发者的接入文档：每个 UI 框架一份文件，包含「最小接入操作方法」与可直接复制给
AI 编程工具的「集成提示词」。提示词内置技能安装引导，让 AI agent 先装规范再动手。

| 框架 | 文档 | 接入形态 | 可运行示例 | 端口 |
| --- | --- | --- | --- | --- |
| Vue 3 | [vue3.md](./vue3.md) | `@worm-print-platform/canvas/vue3` 组件门面（原 `@worm-vue3-print/canvas` 用户迁移零业务改动） | `demos/apps/vue3` | 9331 |
| Vue 2.7 | [vue2.md](./vue2.md) | `<print-designer>` 自定义元素 + `registerAll()` | `demos/apps/vue2` | 9332 |
| React 18 | [react.md](./react.md) | `<print-designer>` 自定义元素 + `addEventListener` | `demos/apps/react` | 9335 |
| jQuery / 原生 JS | [jquery.md](./jquery.md) | UMD 直挂（无打包器，`window.WormPrintCanvas` 全局） | `demos/apps/jquery` | 9334 |

老用户迁移：[migration-worm-vue3-print.md](./migration-worm-vue3-print.md)
—— 包名映射、三条迁移路径、行为差异要点与 AI 迁移提示词。

四个示例工程互跳总览页在 `:9300`，一条命令全部拉起：`npm run dev:demos:all`。
每个 demo 的验收脚本：`node demos/scripts/verify-demo.mjs http://localhost:<端口>/`。

## 配套技能（AI agent 接入用的规范包）

仓库随源码维护三个技能（`skills/` 目录，不发布 npm），是 AI agent 接入时「先读规范再动手」的单一真源：

| 技能 | 覆盖范围 | 适用文档 |
| --- | --- | --- |
| `worm-print-platform-integration` | 全形态宿主集成：NPM 宿主的 `canvas/vue3` 组件门面与 `<print-designer>` 契约、浏览器直挂 / 无打包器与 Vue 2 / React / jQuery、三条打印链路、全栈宿主最小清单、宿主 MCP、故障排查 | 四份文档共用 |
| `worm-print-platform-mcp` | 桌面 MCP 工具：AI 实时读写画布、模板生成校验、视觉回读与参考图比对 | 可选增强，任何框架 |

## 技能安装方法（提示词「第 0 步」的通用说明）

技能以仓库为源，通过命令行安装器安装到当前项目（推荐），也可从仓库源码手动取用（离线回退）。

### 方式 A：npx 安装器（推荐）

在**当前项目根目录**逐条执行（`<技能名>` 见上表）：

```bash
npx @worm-print-platform/skills worm-print-platform-integration
npx @worm-print-platform/skills worm-print-platform-mcp
```

- 默认装到当前项目的 `.agents/skills/<技能名>/`，含 `SKILL.md` 与 `references/` 全部文件。
- 默认源为 GitHub，失败自动回退 Gitee 镜像；两者都不通时可用 `--repo` 指定任意 GitHub /
  Gitee 仓库（或 `owner/repo` 简写）。
- 其他技能目录用 `--dir` 指定，例如 Qoder 项目级目录 `--dir .qoder/skills`，
  Claude Code 用 `--dir .claude/skills`；用户级目录可传绝对路径。
- 目标已存在时默认拒绝覆盖并报错，确认覆盖才加 `--force`。
- 完整参数见 `npx @worm-print-platform/skills --help`。

### 方式 B：仓库源码手动取用（离线回退）

无 npm / git 环境时，从 [GitHub](https://github.com/worm-longliu/worm-print-platform) 或
[Gitee](https://gitee.com/liulong_oschina/worm-print-platform) 仓库的 `skills/<技能名>/`
目录手动下载整个目录，放到所用 AI 编程工具的技能目录并重载。
安装器不可用或网络受限时，提示词降级为「完整阅读该目录下 `SKILL.md` 与 `references/`
全部文档」，门控效果等价。

## 打印链路速记

三条链路吃同一份 `templateJson + printData + baseUrl`，可单选可并存：

- **A 浏览器打印**：core 同构渲染进 iframe → `contentWindow.print()`，零额外基础设施（各文档默认接入）。
- **B 服务端 PDF**：部署 `services/render` 微服务，后端持密钥代理，产出可下载 PDF。
- **C 桌面客户端静默打印**：本机 Electron 客户端（`127.0.0.1:17521`）+ `PrintClient.printHtml()`，无对话框直接出纸。

细节见 integration 技能的 `references/server-render.md` 与 `references/silent-print.md`。
