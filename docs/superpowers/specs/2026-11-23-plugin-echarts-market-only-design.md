# 百度图表插件停止单独发版 · 设计（2026-11-23）

## 意图与原因

百度图表插件当前由 `marketplace/plugins/echarts/` 同一份源码产出两个 npm 包：市场主包 `@worm-print-platform/plugin-echarts` 与兼容镜像 `@worm-print-platform/echarts`。用户决定：**主包不再单独发布新版本，后续更新全部走插件市场**；兼容镜像继续随主线发版，以保证 `services/render`、`clients/client` 的服务端 PDF 与桌面静默打印不受影响。

## 目标

1. 从所有发布入口移除 `plugin-echarts`：根 `publish:npm` / `publish:dry-run` 脚本、发布文档、发布包清单，避免后续版本误发。
2. 明确主包定位为市场插件：改 `package.json` 描述、移除 `publishConfig`、加 `private: true` 防呆，README 只保留市场安装路径。
3. 市场 CLI 的 `auto` 回退顺序由 `npm → GitHub → Gitee` 改为 **`npm → Gitee → GitHub`**，并同步 CLI 帮助、类型注释与用户文档。
4. 兼容镜像 `@worm-print-platform/echarts` 的发布与同步链路保持不变。

## 非目标

- 不改 `packages/echarts`（兼容镜像）的发布与 `sync-compat.mjs` 同步逻辑。
- 不改 `services/render` / `clients/client` 的依赖声明。
- 不改已发布的 npm 1.6.0/1.6.1 资产，不改 CHANGELOG 历史条目。
- 不为 echarts 单独加"跳过 npm 源"的特殊逻辑（用户明确接受限制）。

## 约束与已接受的限制

- 市场索引保留 echarts 的 `npmName`：CLI 用它做短 id → 插件身份映射，`list` 也展示它；移除会破坏 `resolvePluginName` 与清单契约。
- 全局顺序仍以 npm 为首选；经核实 npm 上 `@worm-print-platform/plugin-echarts` 为 404（从未发布），因此默认 `install echarts` 会在 npm 源失败后自动回退 Gitee（其次 GitHub）。不跳过 npm 源的限制已由用户确认接受。
- `resolveVersion` 对"指定版本在 npm 不存在"抛确定性错误 `VERSION_NOT_FOUND` 且不换源，因此装市场新版时显式带版本号也必须带 `--source gitee`。文档需写明。
- 仓库当前没有 `plugins/echarts/v*` tag，Git 源无版本时回退主干并标记非稳定；本次不打 tag、不改 tag 策略。

## 方案（已选）

采用最小改动路径：发布侧移除 + 文档口径调整 + CLI 源顺序对调。不引入索引 `sources` 字段，不改 CLI 源分派逻辑，只改 `auto` 数组顺序。

被放弃的备选：
- **索引按插件配置源偏好**：影响精确但要改 CLI、类型、索引、生成产物与单测；用户选择不跳过 npm，无需引入。
- **仅改文档**：源顺序偏好未落地。

## 具体改动

| 文件 | 改动 |
| --- | --- |
| `packages/marketplace/src/install.ts` | `auto` 源顺序 `['npm','github','gitee']` → `['npm','gitee','github']` |
| `packages/marketplace/src/cli.ts` | `--source` 帮助文本顺序改为 `npm → Gitee → GitHub` |
| `packages/marketplace/src/types.ts` | `InstallOptions.source` 注释同步顺序 |
| `packages/marketplace/src/*.test.ts` | 如有顺序断言同步更新 |
| `package.json` | `publish:npm` / `publish:dry-run` 删除 `plugin-echarts` 发布段 |
| `marketplace/plugins/echarts/package.json` | 删 `publishConfig`、加 `"private": true`、描述改为市场插件口径 |
| `marketplace/plugins/echarts/README.md` | 删「作为 npm 包使用」与 `npm publish` 指引；市场安装示例补 `--source gitee` 获取新版说明 |
| `marketplace/marketplace.json` | echarts 条目的 `description` 改为市场唯一分发口径（保留 `npmName`） |
| `AGENTS.md` | 发布包清单 8 → 7，去掉 `plugin-echarts`，补一句市场分发说明 |
| `docs/commands.md` | 发布包清单、`publish:npm` 顺序、版本同步步骤、workflow 表格中的包数同步 |
| `docs/guide/07-plugin-install.md` | 选项表与版本规则的源顺序改为 npm → Gitee → GitHub；示例改 `--source gitee`；补 echarts 停发 npm 的说明 |
| `docs/plugin-marketplace-plan.md` | 当前方案文档中的 `auto` 顺序描述同步 |
| `CHANGELOG.md` | 在 V1.6.1 条目补一条策略调整说明（不改历史条目内容） |
| 技能文档（如含 echarts npm 安装指引） | 口径同步为市场安装 |

## 验证

1. `npm run build` 与 `npm test` 全绿。
2. `npm run publish:dry-run` 的脚本文本中不再出现 `plugin-echarts`。
3. `npx @worm-print-platform/marketplace install echarts --source gitee` 能解析到市场源码；默认 `install echarts` 在 npm 源 404 后自动回退 Gitee（符合已接受限制）。
4. `git diff` 审查：仅上述文件，无无关重构。

## 待办（不在本次改动）

- 后续若希望默认命令也拿市场新版，需重新评估"echarts 跳过 npm 源"或发布 `plugins/echarts/vX.Y.Z` tag。
