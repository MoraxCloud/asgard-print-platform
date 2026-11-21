# 开始之前

[← 返回目录](./README.md) | 下一篇：[Vue 3 接入](./02-vue3.md) →


## 1.1 三条打印链路速记

三条链路吃同一份 `templateJson + printData + baseUrl`，可单选可并存：

- **A 浏览器打印**：core 同构渲染进 iframe → `contentWindow.print()`，零额外基础设施（各框架文档默认接入）。
- **B 服务端 PDF**：部署 `services/render` 微服务，后端持密钥代理，产出可下载 PDF。
- **C 桌面客户端静默打印**：本机 Electron 客户端（`127.0.0.1:17521`）+ `PrintClient.printHtml()`，无对话框直接出纸。

细节见 integration 技能的 `references/server-render.md` 与 `references/silent-print.md`。

## 1.2 配套技能与 AI 提示词（AI agent 接入用）

> 所有命令块都支持快捷复制（点击代码块右上角的复制按钮即可）。默认安装目录为 `.agents/skills/<技能名>/`（OpenAI 规范位置）。

技能以仓库为源，通过命令行安装器安装到当前项目（推荐），也可从仓库源码手动取用（离线回退）。

| 技能 | 覆盖范围 | 适用文档 |
| --- | --- | --- |
| `worm-print-platform-integration` | 全形态宿主集成：NPM 宿主的 `canvas/vue3` 组件门面与 `<print-designer>` 契约、浏览器直挂 / 无打包器与 Vue 2 / React / jQuery、三条打印链路、全栈宿主最小清单、宿主 MCP、故障排查 | 四份文档共用 |
| `worm-print-platform-mcp` | 桌面 MCP 工具：AI 实时读写画布、模板生成校验、视觉回读与参考图比对 | 可选增强，任何框架 |

### 1.2.1 方式 A：npx 安装器（推荐）

在**当前项目根目录**逐条执行（`<技能名>` 见上表）。默认 Gitee 优先（国内网络快），网络不通时自动回退 GitHub：

**Gitee 优先（推荐，国内网络快）**：

```bash
npx @worm-print-platform/skills worm-print-platform-integration --repo https://gitee.com/liulong_oschina/worm-print-platform.git --force
npx @worm-print-platform/skills worm-print-platform-mcp           --repo https://gitee.com/liulong_oschina/worm-print-platform.git --force
```

**GitHub 自动回退**：

```bash
# 不带 --repo 时默认 GitHub 优先、失败自动回退 Gitee
npx @worm-print-platform/skills worm-print-platform-integration --force
npx @worm-print-platform/skills worm-print-platform-mcp           --force
```

**自定义安装目录**（可选，指定 `--dir`）：

```bash
# 常见目标目录：
#   Claude Code  → .claude/skills
#   Qoder        → .qoder/skills
#   用户级       → ~/.agents/skills
#   其他任意路径 → 绝对路径

npx @worm-print-platform/skills worm-print-platform-integration \
  --repo https://gitee.com/liulong_oschina/worm-print-platform.git \
  --dir .claude/skills --force
```

参数速查：

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `<技能名>` | 必填，单个技能名（如 `worm-print-platform-integration`） | — |
| `--repo <地址>` | 仓库地址（GitHub / Gitee 均可，或 `owner/repo` 简写） | 双源：GitHub 优先、失败自动回退 Gitee |
| `--dir <目录>` | 技能根目录，技能装到 `<目录>/<技能名>/` | `.agents/skills`（OpenAI 规范位置） |
| `--force` | 目标目录已存在时覆盖（默认拒绝并报错） | 否 |
| `-h, --help` | 显示帮助 | — |
| `-v, --version` | 显示版本 | — |

完整参数见 `npx @worm-print-platform/skills --help`。

### 1.2.2 方式 B：仓库源码手动取用（离线回退）

无 npm / git 环境时，从 [GitHub](https://github.com/worm-longliu/worm-print-platform) 或
[Gitee](https://gitee.com/liulong_oschina/worm-print-platform) 仓库的 `skills/<技能名>/`
目录手动下载整个目录，放到所用 AI 编程工具的技能目录并重载。
安装器不可用或网络受限时，提示词降级为「完整阅读该目录下 `SKILL.md` 与 `references/`
全部文档」，门控效果等价。

### 1.2.3 给 AI Agent 的提示词片段（可整段复制）

把下面这段直接粘给 AI 编程工具，它会先装规范再动手：

```
请先在项目根目录执行以下命令安装 worm-print-platform 的官方技能规范，再开始接入开发：

npx @worm-print-platform/skills worm-print-platform-integration --repo https://gitee.com/liulong_oschina/worm-print-platform.git --force

默认安装到 .agents/skills/worm-print-platform-integration/（OpenAI 规范位置）。
若 Gitee 网络不通，去掉 --repo 参数即可自动回退 GitHub；
需要其他技能目录（如 .claude/skills / .qoder/skills）时加 --dir 指定。
安装完成后，请完整阅读该目录下的 SKILL.md 与 references/ 全部文件。
```


---

---

[← 返回目录](./README.md) | 下一篇：[Vue 3 接入](./02-vue3.md) →
