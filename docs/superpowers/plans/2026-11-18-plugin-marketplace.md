# 插件市场（三源分发 + 百度图表首个插件）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现常驻本仓的插件市场：CLI 支持 npm / GitHub / Gitee 三源安装、默认最新稳定版，以独立可发布的百度图表插件作为首个插件完成端到端验证；同时落地 core 导出插件契约。

**Architecture:** `marketplace/` 维护索引与薄包装插件；`packages/marketplace` 提供零运行时依赖 CLI（semver 解析 + 三源安装 + 清单）；core 新增与元素插件并列的导出插件注册表。百度图表库包 `@worm-print-platform/echarts` 保持独立发布，市场侧 `@worm-print-platform/plugin-echarts` 仅做副作用注册，不修改图表库源码。

**Tech Stack:** TypeScript、tsup（ESM node18）、vitest、git sparse checkout、npm CLI、Symbol.for 注册表

**Spec:** `docs/plugin-marketplace-plan.md`

## Global Constraints

- UTF-8 无 BOM；单次写入 ≤500 行；回复与注释用简体中文。
- 分层：core（纯逻辑）→ plugin-kit → canvas；marketplace CLI 零运行时依赖。
- npm scope `@worm-print-platform`；插件包命名 `plugin-<id>`；正式版不得带预发布标识。
- git tag 约定 `plugins/<id>/vX.Y.Z`；默认源顺序 npm → GitHub → Gitee。
- 不创建远端仓、不推送、不实际发布 npm；**不修改 `packages/echarts` 源码**（图表库保持独立）。

## Review Focus

- 未指定版本且全为预发布：必须报 `VERSION_NOT_FOUND`，不得回退到预发布版。
- 短 id 未登记：按约定 scope 解析；名称含空白或 `-` 开头必须拒绝（防命令注入）。
- 确定性错误（NOT_FOUND / VERSION_NOT_FOUND / INVALID_PLUGIN）：`auto` 模式不得换源。
- 索引与 plugin.json 的 id/version 不一致：必须 `INVALID_PLUGIN`，不得落盘。
- 导出插件注册表跨 bundle：`Symbol.for` 必须共享，同 id 后注册覆盖。
- 薄包装插件不得复制图表库代码，`dist` 中不得内联 echarts。

---

### Task 1: marketplace 索引与百度图表薄包装插件

**Files:**
- Create: `marketplace/marketplace.json`
- Create: `marketplace/plugins/echarts/{package.json,plugin.json,tsup.config.ts,src/index.ts,README.md}`
- Test: `marketplace/plugins/echarts/src/index.test.ts`

**Interfaces:**
- Consumes: `@worm-print-platform/echarts/kit` 与 `/ui` 的副作用注册（已存在）。
- Produces: 索引条目 `id:"echarts"`, `npmName:"@worm-print-platform/plugin-echarts"`, `path:"plugins/echarts"`, `entry:"dist/index.js"`, 10 类图表 kind；plugin.json 同字段。

- [ ] **Step 1: 写失败测试**：读取 `marketplace/marketplace.json` 与 `marketplace/plugins/echarts/plugin.json`，断言两者 id/version/npmName/entry 一致，`kinds` 含 10 类图表 type，`exportFormats` 为空。
- [ ] **Step 2: 运行验证失败**：`npx vitest run marketplace/plugins/echarts/src/index.test.ts`，应因文件不存在失败。
- [ ] **Step 3: 创建索引与插件包**：`marketplace.json` 按 spec schema 写入 echarts 条目；`plugin.json` 同字段；`package.json` 名称 `@worm-print-platform/plugin-echarts`、version `1.0.0`、`wormPrint` 元数据、dependencies 含 `@worm-print-platform/echarts:^1.5.2`、peerDeps 为 core/plugin-kit、bin 无；`src/index.ts` 仅两行副作用 import；`tsup.config.ts` 单 ESM entry，external core / plugin-kit / echarts 子路径；README 说明用法与独立发布。
- [ ] **Step 4: 构建 dist 并跑测试通过**：`npm run build --prefix marketplace/plugins/echarts`；`npx vitest run .../index.test.ts` 应 PASS。
- [ ] **Step 5: 提交**：`git add marketplace && git commit -m "feat(marketplace): 添加索引与百度图表薄包装插件"`

### Task 2: core 导出插件契约

**Files:**
- Create: `packages/core/src/designer/export-plugin-registry.ts`, `packages/core/src/designer/export-plugin-registry.test.ts`
- Modify: `packages/core/src/designer/index.ts`, `packages/core/src/index.ts`, `packages/contract/src/kinds.ts`（+对应测试）

**Interfaces:**
- Produces: `PrintExportPlugin`（`id`, `version`, `formats`, `export(input,options):Promise<ExportResult>`）、`ExportInput`（`pages`,`template`,`printData`）、`ExportResult`（`filename`,`blob`）；`defineExportPlugin` / `registerExportPlugin` / `getExportPlugins` / `getExportPluginByFormat` / `clearExportPlugins`；注册表键 `Symbol.for('worm-print-platform.export-plugin-registry.v1')`。

- [ ] **Step 1: 写失败测试**：断言注册插件后 `getExportPluginByFormat('xlsx')` 命中；模拟两个 bundle 各自持有一份模块副本（共用 Symbol.for），同 id 后注册覆盖；`formats` 为空时 define 抛错。
- [ ] **Step 2: 运行验证失败**：`npm run test -w @worm-print-platform/core -- export-plugin-registry`，应 FAIL。
- [ ] **Step 3: 实现注册表**：仿 `element-plugin-registry.ts` 的 globalThis + Symbol.for 形态；`define` 校验 id/version/formats；`register` 按 id 覆盖并返回 dispose；按 format 建索引。
- [ ] **Step 4: 补 core 导出并从 contract 校验暴露**：在 `core/src/designer/index.ts` 与 `core/src/index.ts` 导出上述 API 与类型；`contract/src/kinds.ts` 的 strict 插件清单校验同时识别已注册导出插件 id，避免 MISSING_PLUGIN 误报。
- [ ] **Step 5: 跑测试通过**：`npm run test -w @worm-print-platform/core && npm run test -w @worm-print-platform/contract`。
- [ ] **Step 6: 提交**：`git commit -m "feat(core): 新增导出插件契约并联动 contract 校验"`

### Task 3: marketplace CLI 工程骨架 + 类型 + 版本解析

**Files:**
- Create: `packages/marketplace/{package.json,tsconfig.json,tsup.config.ts}`
- Create: `src/{types.ts,semver.ts,resolve.ts,semver.test.ts,resolve.test.ts}`

**Interfaces:**
- Produces: `MarketErrorCode` / `MarketError`；`semver.ts`: `parseSemver`, `isStableVersion`, `compareStable`, `latestStable(versions): string|null`；`resolve.ts`: `resolvePluginName(name, index): {id,npmName}`, `resolveVersion(source, versions, requested?): string`, `buildGitTag(id,version)`。

- [ ] **Step 1: 写失败测试**：`semver.test.ts` 覆盖 `v` 前缀、预发布过滤、全预发布返回 null；`resolve.test.ts` 覆盖短 id 映射、约定 scope、空白/`-` 开头拒绝、git tag 拼装。
- [ ] **Step 2: 运行验证失败**：`npx vitest run packages/marketplace/src/{semver,resolve}.test.ts`。
- [ ] **Step 3: 创建工程配置**：仿 `packages/skills`：ESM、tsup 双 entry、node18、dts、零运行时依赖、vitest 同目录。
- [ ] **Step 4: 实现 semver 与 resolve**：内部极简比较器，不引第三方包；`resolveVersion` 对 npm 用 latest/最高非预发布版本，对 git 用 tag 列表最高非预发布 tag。
- [ ] **Step 5: 跑测试通过**：`npm run test -w @worm-print-platform/marketplace`。
- [ ] **Step 6: 提交**：`git commit -m "feat(marketplace): 搭建 CLI 骨架与版本解析"`

### Task 4: 三源安装引擎

**Files:**
- Create: `packages/marketplace/src/{repo.ts,manifest.ts,install.ts,install.test.ts,manifest.test.ts}`

**Interfaces:**
- Consumes: Task 3 的 `MarketError` / `resolveVersion` / `resolvePluginName`。
- Produces: `installPlugin(options): Promise<InstallResult>`、`removePlugin(options)`、`readManifest` / `writeManifest`；可注入 `npmExecutor` / `gitExecutor` 供测试。

- [ ] **Step 1: 写失败测试**：fixture 本地 repo 安装（落盘 + 清单回读）；索引与 plugin.json id/version 不一致报 INVALID_PLUGIN；auto 模式首个源确定性错误不换源；npmExecutor 失败才换源；remove 清目录与清单。
- [ ] **Step 2: 运行验证失败**：`npx vitest run packages/marketplace/src/{install,manifest}.test.ts`。
- [ ] **Step 3: 实现 repo/manifest/install**：`repo.ts` 复用 skills 双源解析与稀疏检出参数；`manifest.ts` 读写 `.worm-print/plugins.json`；`install.ts` 按 npm / github / gitee / local 分派，校验后落盘并更新清单。
- [ ] **Step 4: 跑测试通过**：`npm run test -w @worm-print-platform/marketplace`。
- [ ] **Step 5: 提交**：`git commit -m "feat(marketplace): 实现 npm/GitHub/Gitee/local 安装引擎"`

### Task 5: CLI 与内置 catalog

**Files:**
- Create: `packages/marketplace/src/{cli.ts,index.ts}`, `packages/marketplace/scripts/gen-catalog.mjs`
- Modify: `packages/marketplace/package.json`（build 脚本串接 gen-catalog）

**Interfaces:**
- Consumes: Task 4 的 `installPlugin` / `removePlugin` / `readManifest`。
- Produces: `worm-print-marketplace` bin，命令 `list` / `install <name>[@<version>]` / `remove <name>`，旗标 `--source` / `--dir` / `--repo` / `--force` / `-h` / `-v`。

- [ ] **Step 1: 写失败测试**：`cli.test.ts` 断言参数解析（含 `--source` 非法值报错）、`install` 调用注入的 installPlugin 并传出解析后的 name/version/source、无版本时不传 version。
- [ ] **Step 2: 运行验证失败**：`npx vitest run packages/marketplace/src/cli.test.ts`。
- [ ] **Step 3: 实现 cli/index 与 catalog 生成**：VERSION 由 tsup `define` 注入；`gen-catalog.mjs` 从 `marketplace/marketplace.json` 生成 `src/catalog.generated.ts`（入口和索引的单一来源）。
- [ ] **Step 4: 构建并跑测试通过**：`npm run build -w @worm-print-platform/marketplace && npm run test -w @worm-print-platform/marketplace`。
- [ ] **Step 5: 提交**：`git commit -m "feat(marketplace): 添加 CLI 与内置 catalog"`

### Task 6: 根配置、文档与 demo 接线

**Files:**
- Modify: `package.json`（build/test/publish:npm/publish:dry-run 四处），`AGENTS.md`（工作区包清单 + 顶层 marketplace 说明 + 发布包数）
- Create: `docs/plugin-marketplace.md`
- Modify: `README.md`, `docs/README.md`, `demos/apps/vue3/src/main.js`, `demos/apps/vue3/vite.config.js`, `demos/apps/vue3/.gitignore`

**Interfaces:**
- Consumes: Task 1–5 产物。
- Produces: 用户可查阅的 CLI 用法与插件作者指南；vue3 demo 从 `.worm-print/plugins/echarts/dist/index.js` 加载插件。

- [ ] **Step 1: 改根脚本与 AGENTS.md**：build/test 末尾串接 `-w @worm-print-platform/marketplace`；两条 publish 脚本追加该包；AGENTS.md 增 marketplace 条目、顶层目录说明（常驻本仓、不独立建仓）、发布包「五个」→「六个」。
- [ ] **Step 2: 写文档**：`docs/plugin-marketplace.md` 覆盖三源安装、版本规则、插件作者指南（wormPrint 元数据 / tag 约定 / 独立发布）、导出插件契约；README 增加入口链接。
- [ ] **Step 3: demo 接线**：main.js 增插件副作用 import（并移除原有 echarts 直接 import 以验证插件真实生效）；vite.config.js 加 dedupe；.gitignore 加 `.worm-print/`。
- [ ] **Step 4: 构建验证**：`npm run build`，确认全仓与新包均构建成功。
- [ ] **Step 5: 提交**：`git commit -m "docs: 补齐市场文档与 demo 插件接线"`

### Task 7: 端到端验证

**Files:** 无（验证任务；失败则回退对应 Task 修复）

- [ ] **Step 1: 全量测试**：`npm test`，确认 core / contract / marketplace / echarts 等全绿。
- [ ] **Step 2: 本地源安装**：`node packages/marketplace/dist/cli.js install echarts --source local --repo ./marketplace --dir demos/apps/vue3/.worm-print/plugins`，核对 `.worm-print/plugins.json` 与落盘文件。
- [ ] **Step 3: npm 源安装**：用 `npm pack` 产生的 tarball 或本地 registry mock 走 `--source npm`，核对元数据读取与清单。
- [ ] **Step 4: git 源安装**：分别 `--source github` / `--source gitee` 安装（真实远端稀疏检出 + tag 解析），核对检出路径与版本。
- [ ] **Step 5: 默认版本验证**：`install echarts`（不带版本）解析到最新稳定版；全预发布 fixture 报 VERSION_NOT_FOUND。
- [ ] **Step 6: 浏览器验证**：启动 vue3 demo，确认十类图表元素仍可拖入、属性台可用、预览出图一致（插件副作用注册生效，图表库包未被修改）。
- [ ] **Step 7: 导出插件冒烟**：安装/注册一个最小导出插件样例，按 formats 生成菜单项并触发下载（不依赖真实 xlsx/docx 库，验证契约与宿主接入即可）。
