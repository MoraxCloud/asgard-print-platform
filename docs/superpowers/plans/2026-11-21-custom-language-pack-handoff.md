# 交接提示词：实施「外挂整语言包与三端加载」

> 把下面整段交给实施代理；它应只依赖本文件、设计文档与实施计划，不重做设计。

---

你是 worm-print-platform 仓库的资深 TypeScript 全栈工程师，负责按已批准的设计与计划**内联、逐任务**实施 13 个 Task。不要重新设计、不要扩大范围；设计级疑问先停下提问。

## 一、仓库与上下文

- 仓库：`/Users/worm/worm/worm-print-platform`（npm workspaces monorepo，master 分支直接开发）。
- 当前基线：设计提交 `b3077b9`，实施计划 `4c8d911`，测试验证方案 `0ed5782`。
- 实施前先执行：`git log --oneline -3`、`git status --short`。工作树必须干净；不干净就停下并报告。

必读（按顺序）：

1. `AGENTS.md`：简体中文回复、UTF-8 无 BOM、单次写入 ≤500 行、提交信息中文、启动前加载相关规范。
2. `docs/superpowers/specs/2026-11-21-custom-language-pack-design.md`：已批准设计（D1–D20 与 12 节详细设计）。
3. `docs/superpowers/plans/2026-11-21-custom-language-pack.md`：Task 1–13、Global Constraints、Review Focus、测试验证方案、回归矩阵。
4. 现状代码（至少读一遍）：
   - `packages/core/src/i18n/{engine,i18n-instance,index}.ts`、`messages/*.ts`、`__tests__/*`
   - `packages/canvas/src/shell/{label-translation,property-tip-translation}.ts` 及调用点
   - `packages/plugin-kit/src/registry.ts`、`marketplace/plugins/echarts/src/{ui,i18n/*}.ts`
   - `packages/marketplace/src/{install,types}.ts`、`services/render/src/server.ts`
   - `clients/client/src/main/{config,index}.ts`、`clients/client/electron-builder.yml`
   - `docs/guide/{06-i18n,07-plugin-install,08-plugin-dev}.md`、`scripts/export-locale-bundle.mjs`

## 二、目标与边界（不可偏离）

- 用户交付物：一份扁平点号键 JSON（键自带命名空间前缀，如 `constants.borderStyle.none`），无 `_meta`、无嵌套。
- 命名空间检索链：`user` > 各插件 id > `constants` > `propertyTips` > `core`。
- core 拥有 `core`/`constants`/`propertyTips` 三个内置命名空间；每个包产出 `dist/i18n/<locale>.json` 并在 `package.json` 声明 `wormPrint.i18n`；插件必须提供 `zh-CN`，`en-US`/`th-TH` 可选。
- 语义键：core 常量改 `labelKey`/`tipKey`，删除 canvas 两张映射表；中文文案只存资源 JSON（单一真源）。
- `el.messages` 改为实例级：`createTranslator(locale, messages?)` 用第二 i18next 实例只承载用户包，缺键回退全局；全局 `registerLocale` 语义不变。
- 三端加载：render 新增 `WORM_PRINT_LOCALE_FILE`；client 新增 `config.json` 的 `locale`/`localePack` + 打包 `out/locales` 兜底；浏览器沿用现有 API 配方。
- 市场 CLI 安装/卸载/升级时把插件语言资源同步到 `.worm-print/i18n/<id>/`；骨架 CLI 统一目录优先、node_modules 补充。
- 新包 `@worm-print-platform/i18n@0.1.0`（bin `worm-print-i18n`，零运行时依赖）：`template` / `validate` / `update`。
- 帮助弹窗正文与页签**本期不动**（保持 zh/en/th 静态，自定义语言回退中文）；仅外壳标题/关闭跟随实例语言。
- 加载失败一律 warn + 回退内置语言，不阻塞启动。
- 既有包本期不升版本号；不改变打印文档 `<html lang>`；不改造 demo。

## 三、执行方式

- 采用**内联执行**：按 Task 1 → 13 顺序直接改代码，不派生子代理。
- 每个 Task 严格 TDD：写失败测试 → 运行确认 RED → 最小实现 → 运行确认 GREEN → 构建/类型检查 → 提交（commit message 计划里已给出）。
- 每个 Task 一个独立 commit；提交前 `git diff` 自审：只包含本 Task 文件，无顺手重构。
- 计划中的 Interfaces 与代码片段是契约；现有文件行号漂移时以实际代码为准，保持语义不变。发现计划与仓库现状冲突时，先停下报告，不要自行改设计。
- 单次写入 ≤500 行；大文件拆分。所有新增注释/文档/提交信息用简体中文。

## 四、关键陷阱（每个 Task 收尾自查）

1. 含点键必须命中（`t('constants.borderStyle.none')`），不得被当嵌套路径。
2. 迁移后 core 常量里不得再有中文显示文案；`rg "translateConstantLabel|localizedPropertyTip" packages/canvas/src` 必须为空。
3. `el.messages` 不泄漏全局：实例注入后 `t('toolbar.save')` 的全局值不变。
4. 空串必须回退 zh-CN（依赖 `returnEmptyString:false`），`update` 写入空串后运行时不得显示空白。
5. 市场安装必须落 `.worm-print/i18n/echarts/zh-CN.json`，卸载/升级同步清理；旧清单无 i18n 字段时提示重装。
6. 客户端 asar 内 `out/locales` 可读，无 `locales/` 目录时跳过；启动顺序必须是 load config → setLocale → load pack → 打印引擎。
7. render 的加载器放在独立文件（避免单测 import `server.ts` 触发 `app.listen`）。
8. echarts 语言包 TS→JSON 转换脚本只跑一次，转换后删除旧 TS；`sync-compat.mjs` 要同步 `wormPrint` 字段与 dist。
9. core `dist/i18n/*.json` 由 tsup 之后的脚本从 `getResources()` 生成；不要手写产物。
10. 帮助正文中文是已接受限制，测试要显式断言，不要「顺手」把帮助迁入 i18n。

## 五、门禁命令

单 Task：

```bash
npm run typecheck -w <包名>
npm test -w <包名> -- --run <测试文件>
npm run build -w <包名>
```

最终（全部 Task 完成后必须全绿，才可报告完成）：

```bash
npm run verify:i18n:full   # build + 全量 test + i18n:bundle + scripts/verify-i18n.mjs
npm run i18n:check -w @worm-print-platform/core
```

任何一条失败：先修复，不得跳过、不得标记完成。

## 六、交付报告格式

- 每个 Task 一行：`Task N — commit <hash> — 验证命令与结果`。
- 收尾汇总：
  - 13 个 Task 的 commit 列表；
  - `verify:i18n:full` 与 `i18n:check` 的输出摘要；
  - 未完成/偏差事项（含计划与实现不一致处及原因）；
  - L4 手工项（`npm run pack:client:dir` 后 `out/locales`、Docker render 挂载）是否执行；未执行则明确写「未做」，不得宣称三端完成；
  - 三个 PR 的拆分建议（PR① Task 1–5、PR② Task 6–9、PR③ Task 10–13）。

## 七、立即开始

读完必读材料后，从 Task 1（core 命名空间与内置资源）开始；每个 Task 完成后继续下一个，不要中途停下来征求确认（设计级疑问除外）。
