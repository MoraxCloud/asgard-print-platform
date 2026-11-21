# 打印模板设计器国际化（i18n）设计

> 本文是 `2026-11-20-designer-i18n.md` 实施计划的规格来源。经 @grill-me 多轮追问收敛，所有设计决策均已明确；未在本文件写明的行为沿用仓库现状。

## 1. 目标与范围

- **默认/源语言**：简体中文（zh-CN）。首个目标语言：英文（en-US）。
- **扩展性**：架构必须支持宿主或插件新增任意语言（如 ja-JP），不需要改 core 源码、不需要重新构建设计器。
- **不做 RTL**：不处理阿拉伯语等从右向左布局。
- **纳入范围（A）**：设计器 UI 文案（工具栏、属性面板、图层树、菜单、按钮、提示、placeholder、对话框、表达式编辑器、取色器），**含** plugin-kit 表达式编辑器（≈85 行中文）与 echarts 插件属性面板（≈144 行中文）。
- **纳入范围（C）**：运行时诊断/错误文案（core 表达式解析错误、分页/拼版校验诊断、打印管线校验、桌面客户端连接提示）。
- **不纳入（B）**：模板 JSON 中的用户数据与元素文本（`formatter`、`title`、设计态示例数据）。它们属于用户内容，不随界面语言变化。

## 2. 术语与文案来源

- 现有硬编码中文是**源文本**，以其语义抽取**语义化点分层键**，例如 `toolbar.editTemplate`、`propertyPanel.positionSize.title`、`diagnostic.tiling.columnsExceedWidth`。
- 内置 zh-CN / en-US 语言包用 **TS 模块**导出对象，core 对外导出 `LocaleMessages` 类型。
- 构建时生成 **JSON 键名清单**，供用户/插件作者查阅；生成脚本带 `--check` 漂移检测（口径：所有已注册键必须在两份内置语言包中一致存在，缺失或多余即报错退出，与 `gen-styles.mjs --check` 的「只报告不阻断」不同，本场景必须阻断）。

## 3. 引擎架构

- 在 `packages/core` 新增**无框架微型 i18n 模块**，通过子路径 `@worm-print-platform/core/i18n` 导出。
- 模块职责：locale 状态、按语言分层的注册表、`t(key, params)` 插值、缺键警告（开发模式）、语言变更订阅。
- **不引入 i18next / vue-i18n / intl-messageformat 等外部依赖**；core 不反向依赖 UI 层。
- 状态沿用 core 既有套路：挂在 `globalThis` 的 `Symbol.for(...)` 键上，保证多 bundle/双实例不漂移。
- 运行时注册表分层（同语言内按优先级合并）：
  1. 用户自定义包（`registerLocale` / `mergeLocale` / 设计器 `messages` 属性）
  2. 插件包（`registerElementUI({ locales })` 注册）
  3. 内置 en-US
  4. 内置 zh-CN（源文本兜底）
- 查词规则：取第一个命中层；整条消息键缺失时才降级（不做逐片段降级）。

## 4. 用户自定义语言包

- 支持：① 覆盖个别文案；② 新增任意语言；③ 局部补充未译键。
- **对象注入**：宿主自己 `import` JSON / JS / TS 语言文件，把对象传给 `messages` 属性或 `registerLocale(locale, messages)`。**不提供 URL 异步加载**。
- 用户包类型：宽松类型（内置键有补全提示，任意键允许写入以便覆盖插件键）。

## 5. 插件语言包合并

- 插件随 `registerElementUI` 声明 `locales` 字段（扩展 plugin-kit 的 `ElementUI` 契约），由 plugin-kit 注册时合并进 core 引擎；异步注册后引擎通知已存在设计器重渲染。
- 插件键**强制以插件 id 为前缀**，如 `echarts.kind.bar`；注册时校验，缺前缀抛错。
- 插件包类型用 `PluginLocaleMessages<'echarts'>`（模板字面量类型 `` `${PluginId}.${string}` ``）在编译期强制前缀；插件各用局部类型，不污染全局 `LocaleMessages`。
- 用户包可覆盖插件译文：用户层优先于插件层（见第 3 节）。

## 6. 配置与切换 API

- **设计器元素**：`lang` attribute + `messages` property + 实例 `setLocale(locale)`（运行时切换，立即重渲染 Shadow DOM）。
- **Vue 3 门面**：对应新增 `lang` / `messages` props，`syncAll()` 同步。
- **core 全局通道**：`setLocale(locale)` / `registerLocale(locale, messages)` / `mergeLocale(locale, partial)` / `getLocale()` / `subscribe(listener)`；服务于无设计器实例的场景（render 服务、client 主进程、`window.alert`/`confirm` 等命令式 API）。
- 未提供显式配置时按 `navigator.language` 探测并归一化（如 `en-* → en-US`，其余 → zh-CN）；无 `navigator` 的 Node 环境回退 zh-CN。
- 设计器实例 `lang` 优先于 core 全局 locale；无实例上下文的 core 诊断始终用全局 locale。
- 未知 locale 标识静默回退 zh-CN，不抛错。

## 7. 帮助文档

- `packages/canvas/src/shell/help-content/` 下约 511 行中文长文按语言拆为独立内容模块：`help-content/zh-CN/*.ts` 与 `help-content/en-US/*.ts`，由入口按当前 locale 选择。
- 不把整篇段落塞进 `t()` 键值；翻译保留整篇语境。

## 8. 格式化与固有中文

- **人民币大写**（`core/src/functions/format.ts` 的 `零/壹/贰…元/角/分`）保持中文：属于打印内容，业务语义不可译。
- `core/src/designer/utils/expression-eval.ts` 的 `toLocaleString('zh-CN')` 改为跟随当前 locale。
- `core/src/render/html-generator.ts` 写死的 `<html lang="zh-CN">` 改为独立 `documentLang` 配置，默认 `zh-CN`，**不随 UI 语言变化**（文档语言属于模板内容，不是界面语言）。
- 诊断信息中的数字/日期用 locale 感知格式化（`Intl.NumberFormat` / `Intl.DateTimeFormat`），在 core 内封装为工具函数，插件可复用。

## 9. 兼容与质量约束

1. 未指定语言时默认中文，现有行为逐字不变（DOM 文本、诊断文案、格式化输出）。
2. 缺键回退链：用户包 → 插件包 → 内置 en-US → 内置 zh-CN（源文本）；绝不显示键名或空白。
3. 所有 UI 文案必须走 `t()`；新增硬编码中文用检查脚本约束。
4. 开发模式下缺键 `console.warn` 并显示源文本，便于用户/插件作者排查。
5. 宿主契约新增 `lang` / `messages` 属 MINOR 变更，`PRINT_DESIGNER_CONTRACT_VERSION` 由 `1.3.0` 升为 `1.4.0`。
6. 包边界不变：`core` 纯逻辑不依赖 UI；`plugin-kit` 只依赖 core；`canvas` 依赖 core + plugin-kit；`echarts` 真源在 `marketplace/plugins/echarts`，`packages/echarts` 为兼容镜像，改动后必须走 `sync-compat.mjs` 同步。
7. 产物需重新注入版权头与许可证横幅（沿用现有 `inject-license-banner.mjs`）。

## 10. 交付物

- 本次一并产出首版 en-US 译文（UI 文案 + 诊断 + 约 511 行帮助文档），未译键回退中文，后续人工精修。
- 用户/插件作者文档：如何写自己的语言文件、键名清单在哪、如何覆盖插件文案。

## 11. 先行验证结论（Task 0）

执行日期：2026-11-20。门禁结论：**4/4 PASS，可进入实施**。

| 验证点 | 结论 | 证据 |
|---|---|---|
| 模板字面量类型强制插件键前缀 | PASS | 宽松 `Record<string,string>` 下两个 `@ts-expect-error` 报 TS2578（RED）；`PluginLocaleMessages<Id extends string> = { [K in \`${Id}.${string}\`]: string }` 下隔离 tsc EXIT=0（GREEN） |
| 语言包键解析正则 | PASS | 样本解析得 3 键，注释键与嵌套键均未混入 |
| 硬编码中文扫描精度 | PASS | 扫描 `canvas/src/shell`（排除 `help-content/` 与测试）：20 文件、397 行字面量，命中样本均为真实 UI 文案 |
| 跨 bundle 注册表与 locale 探测 | PASS | 两个独立模块经 `Symbol.for` 拿到同一状态实例；当前 Node v22.23.2 存在 `navigator`，`language=zh-CN` |

对实现的约束修正：
- `getLocale()` 不得假设 Node 环境无 `navigator`，须做防御性检测（`typeof navigator !== 'undefined' && typeof navigator.language === 'string'`）；Node 22 实测 `language=zh-CN`，默认中文行为成立。
- 硬编码中文扫描排除 `help-content/`（由帮助文档按语言拆模块的任务单独保证），JSDoc 注释行需跳过。
- 全仓 `tsc -p packages/core/tsconfig.json` 存在与本次无关的既有类型错误，类型契约验证改用隔离编译（见计划台账裁定）。
