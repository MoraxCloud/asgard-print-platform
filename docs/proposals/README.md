# worm-print-platform 待增功能提案（基于 v1.6.2 代码基线）

> 本目录回答两个问题：**接下来该补哪些功能**，以及**每个功能长什么样**。
> 每项功能配一份用纯 HTML/CSS 绘制的方案草图（可直接在浏览器打开），草图即设计交付物，不是最终产品代码。

## 一、为什么是这些功能

拉取远端更新（v1.6.2）后，对现有代码做了盘点。当前已具备：表达式引擎、同构渲染与分页、三区设计器（11 类内置元素 + 图表插件）、插件市场 CLI、桌面静默打印客户端、模板会话通道与桌面 MCP 12 工具、技能安装器。

但以下空白有明确的代码证据：

- **没有任何内置 LLM 会话/聊天界面**：全仓搜索 `openai|anthropic|@ai-sdk|chat/completions|generateText` 零命中；`skills/worm-print-platform-mcp/SKILL.md` 明确「MCP 不调用模型、不持有模型密钥；模型和工具循环归宿主 Agent」。AI 能力目前只能靠用户自行配置外部 Agent。
- **AI 通道前置条件重**：需要桌面客户端 + 配对 token + 外部 MCP 客户端；浏览器直挂（jQuery demo）只能只读（`demos/README.md`）。模板会话实现在 4 个 demo 中重复内联。
- **MCP 是无状态、POST-only 的请求-响应**（`clients/client/src/main/mcp-host.ts`）：无 SSE、无跨请求会话、无 `resources` / `prompts` 能力。
- **渲染服务只有 `/render/pdf`**（`services/render/src/server.ts`）：README 标题写「PDF/截图」但没有截图/缩略图接口。
- **导出插件只有契约、没有实现**：`export-plugin-registry.ts` 注册表已用 `Symbol.for` 落地，但 `marketplace.json` 的 `exportFormats` 全空，宿主菜单也没有导出入口。
- **无模板版本历史**：print-demo 的管理是 demo 级；设计器没有版本时间线、差异审阅与回滚。

## 二、功能清单（6 项，含 AI 会话接入）

| # | 功能 | 解决什么 | 主要落点 | 优先级 | 草图 |
|---|------|----------|----------|--------|------|
| 01 | **内置 AI 会话面板（AI 模板助手）** | 把「外部 Agent 配置 MCP」变成设计器内开箱即用的对话：自然语言生成/修改模板，变更可审阅、可撤销 | `packages/canvas` 右侧面板 + `demos/shared/template-session.ts` 的 revision / 封禁校验机制 + 宿主模型适配层 | P0 | [01-ai-session-panel.html](01-ai-session-panel.html) |
| 02 | **MCP 流式工具调用与 Prompt/Resources 能力** | 让长任务有进度、让输出可流式呈现，并把「生成单据」「字段映射」等提示词做成可复用资产 | `packages/mcp` + `clients/client/src/main/mcp-host.ts` 增加 SSE 与 `prompts/list`、`resources/list|read` | P1 | [02-mcp-streaming.html](02-mcp-streaming.html) |
| 03 | **浏览器直连 AI 通道与统一会话 SDK** | 去掉 Electron 前置条件；把 4 份重复的 `mcp-session.js` 收敛成一个公开 SDK | 新增 `@worm-print-platform/ai-session`（传输可插拔：WS / SSE / 服务端代理） | P1 | [03-browser-ai-sdk.html](03-browser-ai-sdk.html) |
| 04 | **服务端 PNG 截图与模板缩略图 API** | 补上 README 已承诺的「截图」能力，并让 AI 生成结果能在对话里直接看到 | `services/render` 增加 `/render/png`、`/render/thumbnail`，复用现有同构渲染管线 | P1 | [04-render-thumbnail.html](04-render-thumbnail.html) |
| 05 | **真实 Excel/Word 导出插件与宿主菜单** | 把已落地的导出插件注册表接上真实插件与用户可见入口 | 新增 `plugin-export-xlsx`、`plugin-export-docx` + `packages/canvas` 导出菜单 | P2 | [05-export-plugins.html](05-export-plugins.html) |
| 06 | **模板版本历史与可视化差异审阅** | 让 AI 改动和手动编辑都可追溯、可对比、可回滚 | 设计器版本时间线 + 基于 revision 的快照存储 + 复用 `template.apply` 回滚 | P2 | [06-template-version-history.html](06-template-version-history.html) |

## 三、功能依赖关系

```
01 AI 会话面板  ──依赖──▶  03 统一会话 SDK（连接层）
       │                         │
       │                         └──依赖──▶ 02 MCP 流式与提示词（工具层）
       │
       ├──受益──▶ 04 缩略图 API（AI 结果可视化回传）
       ├──并列──▶ 06 版本历史（AI 变更进入版本时间线）
       └──独立──▶ 05 导出插件（扩展交付形态）
```

建议实施顺序：**03 → 02 → 01 → 04 → 06 → 05**（先把连接层和工具层做扎实，再做面向用户的会话面板）。

## 四、草图说明

- 所有草图为单文件、无外部依赖，UTF-8 编码，直接用浏览器打开即可查看。
- 草图中的界面元素是对现有设计器布局（三区 + 右侧属性面板 + 顶栏）的**增量绘制**，便于对照现状评审。
- 草图底部「设计要点」列出了与现有代码契约的衔接方式，供后续写实现计划时直接引用。
- 汇总导航：[index.html](index.html)
