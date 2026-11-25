# 插件市场标准化与内容索引 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给插件市场索引加类型/唯一标识/多语言元数据，CLI 可筛选浏览，并产出可发布静态目录页与规范文档，满足 Gitee IKX17O。

**Architecture:** `marketplace.json` 作为权威索引向后兼容扩展（schemaVersion 保持 1），`gen-catalog.mjs` 派生内置 catalog；新增 `localize` 与 `validate-index` 两个纯函数模块；CLI `list` 消费这些模块做筛选/展示并新增 `validate` 子命令；独立脚本把索引渲染成单文件静态页。全程不改 `id`、模板契约、i18n 命名空间与安装链路。

**Tech Stack:** TypeScript、Node ≥18、vitest、tsup、零运行时依赖（不引入 semver 等库）。

**Spec:** `docs/superpowers/specs/2026-11-23-plugin-market-standardization-design.md`

## Global Constraints

- `schemaVersion` 恒为 `1`；所有新字段可选，读取端必须兼容旧索引（缺 `uniqueId`/`type`/`engines`/`versions` 不报错）。
- `id` 不变（模板 `plugins` 契约键与 i18n 命名空间）；`uniqueId` 匹配 `^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$`，全局唯一。
- `LocalizedText = string | ({ 'zh-CN': string } & Record<string, string>)`；对象形式必须含 `zh-CN`。
- 提交信息一律简体中文；文件 UTF-8 无 BOM；单次写入不超过 500 行。
- marketplace 包保持零运行时依赖；不使用 `semver` 库。
- `minCoreVersion` 与安装链路不动；`engines.core` 只做格式校验。

## Review Focus

- 旧结构索引（仅 `id/version/npmName`）跑 `list`/`validateIndex`：应推断 `type`、回退 `uniqueId=id`、不报错 → Task 4、Task 3 的兼容用例。
- `localize()` 回退链：`en-US` 命中 `en`、缺目标语言回退 `zh-CN`、字符串原样 → Task 2。
- 校验器拦截：重复 `uniqueId`、未声明 `category`、`LocalizedText` 缺 `zh-CN`、`uniqueId` 无连字符 → Task 3。
- 新 CLI 参数（`--type/--search/--locale/--sort/--json`）不影响 install/remove → Task 4 保留现有用例。
- 索引内容视为不可信文本：静态页内嵌 JSON 必须转义，不产生可执行脚本 → Task 5。

---

### Task 1: 扩展索引类型与权威数据

**Files:**
- Modify: `packages/marketplace/src/types.ts`
- Modify: `marketplace/marketplace.json`
- Modify: `marketplace/plugins/echarts/plugin.json`
- Modify: `marketplace/plugins/data-preview/plugin.json`
- Test: `packages/marketplace/src/index-data.test.ts`（新增）

**Interfaces:**
- Produces: `LocalizedText`、`PluginType`、`MarketVersionEntry`、`IndexIssue`、`MarketIndexEntry.uniqueId/type/title/metadata/engines/publishTimestamp/versions`、`MarketIndex.format/title/description/metadata` — 后续任务依赖这些类型名。

- [ ] **Step 1: 写失败测试**：读 `marketplace/marketplace.json`，断言 `plugins` 每条有 `uniqueId`（匹配 `^worm-`）、`type ∈ {element,functional}`、`title` 含 `zh-CN`；断言两条 `id` 仍为 `echarts`/`data-preview`。
- [ ] **Step 2: 运行 `npm test -w @worm-print-platform/marketplace`，确认 FAIL**（字段缺失）。
- [ ] **Step 3: 扩展 `types.ts`**：按设计 §5.1–5.4 加类型与可选字段；`description` 由 `string` 改为 `LocalizedText`；`MarketIndexEntry` 加 `uniqueId?/type?/title?/metadata?/engines?/publishTimestamp?/versions?`；`MarketIndex` 加 `format?/title?/description?/metadata?`（metadata 结构含 categories/labels/sortKeys 声明映射）。
- [ ] **Step 4: 更新 `marketplace.json` 与两个 `plugin.json`**：按设计 §5.1 填 `format/title/description/metadata`，echarts 加 `uniqueId:"worm-echarts", type:"element", category:"element", labels:["official"]`，data-preview 加 `uniqueId:"worm-data-preview", type:"functional", category:"functional"`；两插件 `plugin.json` 各加 `uniqueId`。
- [ ] **Step 5: 运行 `npm run build -w @worm-print-platform/marketplace` 重新生成 `catalog.generated.ts`，再跑 `npm test -w @worm-print-platform/marketplace`，确认 PASS**。
- [ ] **Step 6: 提交**：`git add -A && git commit -m "feat(marketplace): 索引新增类型与唯一标识字段"`

### Task 2: `localize()` 多语言回退

**Files:**
- Create: `packages/marketplace/src/localize.ts`
- Create: `packages/marketplace/src/localize.test.ts`
- Modify: `packages/marketplace/src/index.ts`（导出）

**Interfaces:**
- Consumes: `LocalizedText`（Task 1）
- Produces: `localize(text: LocalizedText | string | undefined, locale: string): string` — Task 4、Task 5 使用。

- [ ] **Step 1: 写失败测试**：① 字符串原样返回；② 对象 `{zh-CN, en}` + locale `en-US` → `en`；③ 对象 `{zh-CN, en}` + locale `fr-FR` → `zh-CN`；④ `undefined` → 空串。
- [ ] **Step 2: 运行测试确认 FAIL**（模块不存在）。
- [ ] **Step 3: 实现 `localize`**：归一化 locale 为小写、先精确匹配、再取语言前缀（`-` 前段）、再 `zh-CN`、最后空串；`text` 为字符串时直接返回。
- [ ] **Step 4: 运行测试确认 PASS，并在 `index.ts` 导出 `localize` 与 `LocalizedText` 类型**。
- [ ] **Step 5: 提交**：`git commit -m "feat(marketplace): 新增多语言文本回退函数"`

### Task 3: `validateIndex` 校验器与 `validate` 子命令

**Files:**
- Create: `packages/marketplace/src/validate-index.ts`
- Create: `packages/marketplace/src/validate-index.test.ts`
- Modify: `packages/marketplace/src/index.ts`（导出）

**Interfaces:**
- Consumes: `MarketIndex`、`IndexIssue`（Task 1）、`parseSemver`（现有 `semver.ts`）
- Produces: `validateIndex(index: MarketIndex): IndexIssue[]`，`IndexIssue = { path: string; message: string }` — Task 4 使用。

- [ ] **Step 1: 写失败测试**：用最小合法索引 `baseIndex()` 开始，逐个断言违规返回 issue：① `schemaVersion:2`；② 两条 `uniqueId` 相同；③ `uniqueId:"echarts"`（无连字符）；④ `metadata.category:"nope"` 未声明；⑤ `title:{en:"X"}` 缺 `zh-CN`；⑥ `versions` 为空数组；⑦ `engines.core:""`。再断言旧结构索引（仅 id/version/npmName）返回空数组、不因缺可选字段报错。
- [ ] **Step 2: 运行测试确认 FAIL**。
- [ ] **Step 3: 实现 `validateIndex`**：按 Global Constraints 与设计 §5.6 逐条校验；可选字段仅「出现时校验」；`IndexIssue.path` 形如 `plugins[0].uniqueId`。
- [ ] **Step 4: 运行测试确认 PASS，在 `index.ts` 导出 `validateIndex` 与 `IndexIssue`**。
- [ ] **Step 5: 提交**：`git commit -m "feat(marketplace): 新增索引校验器"`

### Task 4: CLI `list` 增强与 `validate` 命令

**Files:**
- Modify: `packages/marketplace/src/cli.ts`
- Modify: `packages/marketplace/src/cli.test.ts`
- Modify: `packages/marketplace/src/types.ts`（`MarketErrorCode` 加 `INVALID_INDEX`）

**Interfaces:**
- Consumes: `localize`（Task 2）、`validateIndex`（Task 3）、`MarketIndexEntry`（Task 1）
- Produces: `filterAndSortPlugins(index: MarketIndex, opts: ListOptions): MarketIndexEntry[]`、`formatPluginLines(entries: readonly MarketIndexEntry[], locale: string): string`、`ListOptions` — 导出供测试与潜在复用。

- [ ] **Step 1: 写失败测试**：① `parseArgs(['list','--type','element','--search','charts','--locale','en','--sort','publishedAt','--json'])` 字段解析正确、非法 `--type` 报错；② `filterAndSortPlugins` 按 type/category/label/search 过滤且 `--sort` 缺值排最后；③ `formatPluginLines` 输出含 uniqueId、localized 类型名与标题、版本、engines；④ `main(['list','--json'],{index})` 输出合法 JSON 且含 `uniqueId/type/title`；⑤ `main(['validate'],{index: 违规索引, out})` 返回 1 且 stderr 含 issue；⑥ 现有 install/remove 测试保持通过。
- [ ] **Step 2: 运行测试确认 FAIL**。
- [ ] **Step 3: 扩展 `ParsedArgs`**（加 `type?/category?/label?/search?/locale?/sort?/json?`，`command` 联合加 `'validate'`）与 `parseArgs`（新旗标解析、`--type` 枚举校验）；更新 `USAGE`。
- [ ] **Step 4: 实现 `filterAndSortPlugins` 与 `formatPluginLines`**：`search` 匹配 `uniqueId/id/name/各语言 title/description`；`formatPluginLines` 用 `localize` 取类型名（从 `index.metadata.categories` 的 localized title）与标题；默认 locale `zh-CN`。
- [ ] **Step 5: 改 `main`**：`list` 调用过滤与格式化（`--json` 走 `JSON.stringify`）；新增 `validate` 分支调用 `validateIndex`，有错输出到 `stderr`（注入 `err?: (m:string)=>void` 便于测试，默认 `console.error`）并返回 1；`errorCode` 映射加 `INVALID_INDEX:5`。
- [ ] **Step 6: 运行测试确认 PASS，运行 `npm run typecheck -w @worm-print-platform/marketplace` 确认无类型错误**。
- [ ] **Step 7: 提交**：`git commit -m "feat(marketplace): CLI list 支持筛选与索引校验命令"`

### Task 5: 静态 HTML 目录页生成器

**Files:**
- Create: `packages/marketplace/scripts/gen-market-site.mjs`
- Create: `docs/market/index.html`（生成产物）
- Create: `packages/marketplace/src/gen-market-site.test.ts`（验证生成产物结构）
- Modify: 根 `package.json`（加 `market:site`、`market:validate`）

**Interfaces:**
- Consumes: `marketplace/marketplace.json`（直接读文件）、`localize` 语义（在 mjs 内实现等价回退，不跨语言 import TS）
- Produces: `docs/market/index.html` — 可发布到 Pages 的静态页。

- [ ] **Step 1: 写失败测试**：运行生成脚本后读 `docs/market/index.html`，断言：包含 `<!doctype html>`、包含 `worm-echarts` 与 `worm-data-preview`、内嵌数据经过转义（构造含 `<script>` 的假索引时输出不含可执行标签）、包含筛选/搜索控件标记。
- [ ] **Step 2: 运行测试确认 FAIL**（脚本/产物不存在）。
- [ ] **Step 3: 实现 `gen-market-site.mjs`**：支持 `--input <索引路径>`（默认仓库 `marketplace/marketplace.json`）与 `--output <html 路径>`（默认 `docs/market/index.html`），便于测试注入假索引。读索引后把插件数据 `JSON.stringify` 并替换 `<` 为 `\u003c` 再内嵌；输出单文件 HTML（内联 CSS + 原生 JS），实现卡片渲染、类型/分类/标签筛选、文本搜索、`sortKeys` 排序、localized 文本回退、顶部信任提示（索引为第三方内容、只校验格式不背书）。支持 `--check` 模式：产物与期望不一致时退出码 1（CI 漂移检测）。
- [ ] **Step 4: 运行脚本生成 `docs/market/index.html`，测试确认 PASS；手工检查 HTML 片段无明显 XSS 向量**。
- [ ] **Step 5: 根 `package.json` 加 `market:site`（调用脚本）与 `market:validate`（调用 `node packages/marketplace/dist/cli.js validate`）**。
- [ ] **Step 6: 提交**：`git commit -m "feat(marketplace): 新增静态插件目录页生成器"`

### Task 6: 规范文档与术语同步

**Files:**
- Create: `docs/plugin-market-spec.md`
- Modify: `docs/guide/08-plugin-dev.md`
- Modify: `README.md`（或 `docs/guide/README.md`，选索引实际链接处）

**Interfaces:**
- Consumes: 前五任务的最终字段与命令（按设计 §5.10）。

- [ ] **Step 1: 写 `docs/plugin-market-spec.md`**：按设计 §5.10 六章成文——索引格式（根/插件/版本字段、LocalizedText、校验规则）、元信息（`uniqueId` 命名、`type` 三态）、安装方式（四源与 auto 顺序）、版本约定（SemVer/minCoreVersion/engines.core/tag/dist）、契约与收录流程、与 `08-plugin-dev.md` 四 id 的关系（`uniqueId` 为第五标识，不等于逻辑 id/i18n 命名空间）。
- [ ] **Step 2: 更新 `docs/guide/08-plugin-dev.md`**：在术语表加 `uniqueId` 一行，明确「市场唯一标识，非模板契约键、非 i18n 命名空间」，并链接规范文档。
- [ ] **Step 3: 在 README/guide 索引加 `plugin-market-spec.md` 链接**。
- [ ] **Step 4: 运行 `npm run build && npm test`，确认全绿**（文档测试如 `docs.spec.ts` 若检查链接则同步更新）。
- [ ] **Step 5: 提交**：`git commit -m "docs: 新增插件市场规范文档并同步术语"`

---

## 收尾

- [ ] 全量验证：`npm run build && npm test`，Gitee IKX17O 回复「已实现」并关闭（用户决策前先确认）。
- [ ] `git diff` 审查：命名一致（`uniqueId`/`type`/`localize`/`validateIndex`）、包边界（marketplace 零运行时依赖）、无遗漏的字段投影。
