# 百度图表插件停止单独发版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `@worm-print-platform/plugin-echarts` 不再单独发布 npm 新版本，市场安装器默认顺序改为 npm → Gitee → GitHub，并同步所有发布与市场文档口径；`@worm-print-platform/echarts` 兼容镜像继续发布。

**Architecture:** 一行改动市场 CLI 的 `auto` 源顺序，其余为发布入口清理与文档口径同步。不改 CLI 源分派逻辑、不改市场索引契约、不改兼容镜像构建链路。

**Tech Stack:** TypeScript（marketplace CLI + vitest）、npm workspaces 脚本、Markdown 文档。

**Spec:** `docs/superpowers/specs/2026-11-23-plugin-echarts-market-only-design.md`

## Global Constraints

- 版本号维持 `1.6.1`，不改任何包版本。
- 市场索引 `marketplace/marketplace.json` 中 echarts 条目的 `npmName` 字段**保留**（CLI 用它做短 id 映射）。
- echarts **不**跳过 npm 源；用户接受该限制。经核实 npm 上主包为 404，`auto` 会在 npm 源失败后自动回退 Gitee。
- 不打 `plugins/echarts/vX.Y.Z` tag，不改 tag 策略。
- 不改 CHANGELOG 历史条目，只在 V1.6.1 条目追加一条说明。
- 所有提交信息与回复用简体中文。

## Review Focus

- `auto` 源首个来源网络失败后应回退 **gitee**（而非 github）——由 Task 1 的测试断言固定。
- 确定性错误（如 `VERSION_NOT_FOUND`）仍不换源——现有 `确定性错误不换源` 测试须保持通过。
- `publish:dry-run` / `publish:npm` 脚本文本中不得再出现 `plugin-echarts`——Task 4 文本检查。
- 默认 `install echarts` 在 npm 源 404 后自动回退 Gitee 是**符合预期的行为**，不是缺陷——文档须写明，勿"修复"。
- 兼容镜像 `@worm-print-platform/echarts` 必须仍在发布清单中——Task 2/4 检查。

---

### Task 1: 市场 CLI 默认源顺序改为 npm → Gitee → GitHub

**Files:**
- Modify: `packages/marketplace/src/install.ts:227-229`
- Modify: `packages/marketplace/src/cli.ts:22`
- Modify: `packages/marketplace/src/types.ts:90`
- Test: `packages/marketplace/src/install.test.ts:68-76`

**Interfaces:**
- Consumes: `installPlugin(options: InstallOptions)` 现有的 `source: 'auto'` 分支。
- Produces: 无新接口；`auto` 顺序改为 `['npm','gitee','github']`。

- [ ] **Step 1: 修改回退测试断言**
  在 `install.test.ts` 的 `auto 源首个来源网络失败时回退到下一源` 用例中，把 `expect(result.source).toBe('github')` 改为 `expect(result.source).toBe('gitee')`。测试名可保持不变（仍描述"下一源"）。

- [ ] **Step 2: 运行测试确认失败**
  Run: `npm run test -w @worm-print-platform/marketplace`
  Expected: FAIL，实际值为 `github`，期望 `gitee`。

- [ ] **Step 3: 实现源顺序变更**
  在 `install.ts` 的 `sources` 赋值处将 `['npm', 'github', 'gitee']` 改为 `['npm', 'gitee', 'github']`；同步把 `cli.ts` 帮助文本中的 `npm → GitHub → Gitee` 改为 `npm → Gitee → GitHub`，`types.ts` 注释中的 `npm → github → gitee` 同步为 `npm → gitee → github`。

- [ ] **Step 4: 运行 marketplace 全部测试**
  Run: `npm run test -w @worm-print-platform/marketplace`
  Expected: PASS（含 `确定性错误不换源` 等用例）。

- [ ] **Step 5: 提交**
  ```bash
  git add packages/marketplace/src/install.ts packages/marketplace/src/cli.ts packages/marketplace/src/types.ts packages/marketplace/src/install.test.ts
  git commit -m "feat(marketplace): auto 源顺序改为 npm → Gitee → GitHub"
  ```

---

### Task 2: 从发布入口移除 plugin-echarts

**Files:**
- Modify: `package.json`（`publish:npm`、`publish:dry-run` 脚本）
- Modify: `marketplace/plugins/echarts/package.json`
- Modify: `AGENTS.md:61`
- Modify: `docs/commands.md:69,77,82,213`

**Interfaces:**
- Consumes: Task 1 完成后的工作区。
- Produces: 根发布脚本仅含 7 个包（`core`/`plugin-kit`/`canvas`/`echarts`/`skills`/`marketplace`/`i18n`）。

- [ ] **Step 1: 移除根脚本中的 plugin-echarts 发布段**
  从 `publish:npm` 删除末尾的 `&& npm publish -w @worm-print-platform/plugin-echarts --registry=https://registry.npmjs.org --access public`；从 `publish:dry-run` 删除对应的 `--dry-run` 段。保留 `@worm-print-platform/echarts` 段不动。

- [ ] **Step 2: 标记主包不再发布**
  在 `marketplace/plugins/echarts/package.json` 中删除 `publishConfig` 对象、新增顶层 `"private": true`，并把 `description` 改为市场插件口径（去掉"可单独发布 npm"）。

- [ ] **Step 3: 同步发布包清单文档**
  把 `AGENTS.md` 发布包清单改为 7 个（去掉 `plugin-echarts`），补一句"百度图表插件通过市场 CLI 分发，不再单独发 npm"；`docs/commands.md` 第 69 行改为 7 个，第 77 行版本同步步骤去掉 `marketplace/plugins/echarts`，第 213 行表格按实际 workflow 口径修正（workflow 本身只发 4 个代码包）。

- [ ] **Step 4: 文本验证**
  Run: `node -p "require('./package.json').scripts['publish:npm']+" "+require('./package.json').scripts['publish:dry-run']" | grep -c plugin-echarts`
  Expected: `0`，且两个脚本中 `@worm-print-platform/echarts` 各出现 1 次。

- [ ] **Step 5: 提交**
  ```bash
  git add package.json marketplace/plugins/echarts/package.json AGENTS.md docs/commands.md
  git commit -m "chore: plugin-echarts 不再单独发布 npm，兼容镜像继续发"
  ```

---

### Task 3: 更新市场安装与 CHANGELOG 文档口径

**Files:**
- Modify: `marketplace/plugins/echarts/README.md`
- Modify: `marketplace/marketplace.json`
- Modify: `docs/guide/07-plugin-install.md`
- Modify: `docs/plugin-marketplace-plan.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: Task 2 的发布口径。
- Produces: 无代码接口；用户可见的安装命令与源顺序说明。

- [ ] **Step 1: 改写主包 README**
  删除「作为 npm 包使用」整段（含 `npm install @worm-print-platform/plugin-echarts` 与子路径 import 示例）和 `npm publish` 命令块；把「安装（插件市场口径，推荐）」段的命令保留 `npx @worm-print-platform/marketplace install echarts`，并补一行说明：npm 上未发布主包，`auto` 会在 npm 源失败后自动回退 Gitee，也可显式 `--source gitee`。表格中主包定位改为"市场插件（不再单独发 npm）"。

- [ ] **Step 2: 更新市场索引描述**
  `marketplace/marketplace.json` 的 echarts 条目 `description` 改为市场唯一分发口径；`npmName` 与 `version` 字段保持原值不动。

- [ ] **Step 3: 更新用户文档**
  `docs/guide/07-plugin-install.md`：选项表 `--source` 顺序改为 `npm|gitee|github|auto|local` 并更新说明文本为 `npm → Gitee → GitHub`；示例 `install echarts@1.1.0 --source npm` 改为不带 npm 的示例（或 `--source gitee`）；补一条说明：echarts 主包未发布到 npm（404），默认 `auto` 会在 npm 源失败后自动回退 Gitee，显式 `--source gitee` 可直接指定来源。`docs/plugin-marketplace-plan.md` 中 `auto` 顺序描述同步为 npm → Gitee → GitHub。

- [ ] **Step 4: CHANGELOG 追加说明**
  在 `CHANGELOG.md` 的 `## V1.6.1(2026-11-22)` 条目末尾追加一条：百度图表插件 `@worm-print-platform/plugin-echarts` 不再单独发布 npm，后续版本通过插件市场分发；兼容镜像 `@worm-print-platform/echarts` 继续随主线发版。

- [ ] **Step 5: 提交**
  ```bash
  git add marketplace/plugins/echarts/README.md marketplace/marketplace.json docs/guide/07-plugin-install.md docs/plugin-marketplace-plan.md CHANGELOG.md
  git commit -m "docs: 百度图表插件改为市场分发并更新源顺序"
  ```

---

### Task 4: 全量验证与 diff 审查

**Files:** 无新增（验证任务）

**Interfaces:**
- Consumes: Task 1–3 的全部改动。
- Produces: 验证输出与最终提交状态。

- [ ] **Step 1: 构建与测试**
  Run: `npm run build && npm test`
  Expected: 两者 exit code 均为 0。

- [ ] **Step 2: CLI 行为抽查**
  Run: `npm exec -w @worm-print-platform/marketplace -- node dist/cli.js --help 2>&1 | grep -i source`（若 dist 路径不同，以 `packages/marketplace/package.json#bin` 为准）
  Expected: 帮助文本含 `npm → Gitee → GitHub`。

- [ ] **Step 3: diff 审查**
  Run: `git diff HEAD~3 --stat && git log -3 --oneline`
  Expected: 改动文件与本计划 Tasks 1–3 列出的文件一致，无无关重构；三条提交信息均为中文。

- [ ] **Step 4: 不提交的手工检查**
  确认 `packages/echarts/package.json` 的 `version` 仍为 `1.6.1`、`publish:npm` 仍包含 `@worm-print-platform/echarts`、市场索引仍含 `npmName` 字段。

## Self-Review

- 设计文档每条目标均有对应任务：停发（Task 2）、市场口径（Task 3）、源顺序（Task 1）、兼容镜像不变（Task 2/4 检查）。
- Review Focus 五项均有对应测试或验证步骤。
- 计划未引入新接口或类型，Task 间无签名依赖。
- 计划长度与设计文档相当，无代码转录。
