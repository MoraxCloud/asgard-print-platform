# 插件市场规范（worm-print-platform）

> 本文是插件市场的**权威规范**，描述索引格式、元信息、安装、版本与契约。
> 历史方案记录见 [plugin-marketplace-plan.md](./plugin-marketplace-plan.md)（实施背景与决策沿革）。
> 适用版本：marketplace CLI ≥ 1.6.1。索引文件：`marketplace/marketplace.json`。

## 1. 索引格式

索引是一份 JSON，根字段与插件字段如下。`schemaVersion` 恒为 `1`；所有「新增」字段均为可选，读取端必须兼容缺失它们的旧索引。

### 1.1 根字段

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `schemaVersion` | 是 | 固定 `1`。 |
| `format` | 否 | 索引格式标识，当前 `worm-market-v1`。 |
| `title` | 否 | `LocalizedText`，市场名称。 |
| `description` | 否 | `LocalizedText`，市场描述。 |
| `metadata` | 否 | 分类 / 标签 / 排序键的声明映射，见下。 |
| `plugins` | 是 | 插件数组；客户端初次展示保持此数组顺序。 |

`metadata` 的三类声明都是 `id → { title: LocalizedText }` 映射，`sortKeys` 另带可选 `order: "asc" | "desc"`（初始排序方向）：

```json
{
  "categories": { "element": { "title": { "zh-CN": "元素插件", "en": "Element" } } },
  "labels": { "official": { "title": { "zh-CN": "官方", "en": "Official" } } },
  "sortKeys": { "publishedAt": { "title": { "zh-CN": "发布时间" }, "order": "desc" } }
}
```

### 1.2 插件字段

| 字段 | 必填 | 含义 |
| --- | --- | --- |
| `id` | 是 | 逻辑 id，**同时是模板 `plugins` 契约键与 i18n 命名空间**，不随本规范改变。 |
| `uniqueId` | 否 | 全局唯一标识，形如 `worm-echarts`，见 §2.1。 |
| `type` | 否 | `element` / `functional` / `export` 三态之一，见 §2.2。 |
| `name` | 是 | 默认展示名（字符串）。 |
| `title` | 否 | `LocalizedText`，多语言标题。 |
| `description` | 否 | `LocalizedText`（兼容旧字符串）。 |
| `version` | 是 | 当前稳定版本，SemVer。 |
| `npmName` / `path` / `entry` | 是 | 安装来源信息。 |
| `kinds` / `exportFormats` | 是 | 元素类型列表 / 导出格式列表（可为空数组）。 |
| `engines.core` | 否 | 兼容范围字符串，如 `>=1.5.2 <2`，见 §4。 |
| `minCoreVersion` | 否 | 最低兼容版本，安装链路据此把关。 |
| `publishTimestamp` | 否 | Unix 秒，排序与展示用。 |
| `metadata` | 否 | `category`（单个已声明分类 id）、`labels`（已声明标签 id 数组）、`sortKeys`（已声明排序键 → 数值或 `null`）。 |
| `versions` | 否 | 精简版本清单，见 §1.3。 |

### 1.3 版本字段

`versions` 为数组，非空时每条含：`version`（SemVer）、可选 `publishTimestamp`、`source`（npm 用 `{ "type": "npm", "name": "@scope/pkg" }`，git 用 `{ "type": "git", "url", "commit", "path"? }`）、`engines.core`。

### 1.4 LocalizedText

`LocalizedText` 为字符串（视为 zh-CN）或对象。对象形式**必须含基准语言 `zh-CN`**，其它键为小写 BCP47。取值回退链：精确 locale → 语言前缀（`en-US` → `en`）→ `zh-CN` → 空串。

### 1.5 校验规则

`worm-print-marketplace validate` 校验：根 `schemaVersion === 1`；`id`/`uniqueId` 非空且各自唯一、`uniqueId` 符合 §2.1 正则；`type` 在枚举内；`metadata` 引用的 id 在根级声明中存在；`LocalizedText` 对象含 `zh-CN`；可选字段一旦出现则校验 `versions` 非空且 `version` 可解析、`engines.core` 非空。缺失可选字段不报错。

## 2. 元信息

### 2.1 唯一标识命名规则

`uniqueId` 是插件的**全局唯一标识**，正则 `^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$`，形如 `作者代号-插件名`：

- 官方插件：`worm-echarts`、`worm-data-preview`。
- 第三方插件：作者代号需自建并在社区内保持唯一，例如 `acme-foo`。

`uniqueId` 是**第五个标识**，与下列四者职责不同：

| 标识 | 出现位置 | 用途 |
| --- | --- | --- |
| 逻辑 `id` | 模板 `plugins`、`wormPrint.id`、`ElementUI.i18nId`、语言包顶层键 | 模板契约与 i18n 命名空间 |
| npm 包名 | `package.json.name`、`npmName` | npm 分发 |
| 元素类型 `type` | `kinds[].type`、模板元素 `type` | 具体元素品种（如 `barChart`） |
| i18n 命名空间 | 语言包顶层键 | 译文检索链 |
| **`uniqueId`** | 市场索引 `uniqueId` | 跨市场、跨作者的全局唯一标识 |

**`uniqueId` 不等于逻辑 id，也不等于 i18n 命名空间**。存量插件的逻辑 id 保持不变，因此存量模板零改动。

### 2.2 类型三态

- `element`：产出可设计/可渲染的打印元素（`kinds` 非空），如 echarts。
- `functional`：只增强设计器/宿主、不产出元素（`kinds` 与 `exportFormats` 均空），如 data-preview。
- `export`：接收渲染结果生成文件（`exportFormats` 非空），当前无实例，为规划预留。

缺失 `type` 时读取端按 `exportFormats` → `kinds` 推断（非空 `exportFormats` 为 export，`kinds` 非空为 element，否则 functional）。

## 3. 安装方式

CLI `worm-print-marketplace` 支持四源：

| 来源 | 安装单元 | 版本载体 |
| --- | --- | --- |
| `npm` | `@worm-print-platform/plugin-<id>` | npm `latest` / 最高稳定版 |
| `gitee` | 本仓 `marketplace/plugins/<id>/` | tag `plugins/<id>/vX.Y.Z` |
| `github` | 同上（另一处托管） | 同上 |
| `local` | `--repo` 指向的本地市场目录 | 目录内 `plugin.json` |

`--source` 可指定单一来源；缺省 `auto` 按 **npm → Gitee → GitHub** 顺序回退，确定性错误（NOT_FOUND / VERSION_NOT_FOUND / INVALID_PLUGIN 等）不换源。GitHub / Gitee 是同一份本仓目录的两处托管，不新建仓库。索引由 CLI 内置（`gen-catalog.mjs` 从 `marketplace.json` 派生 `catalog.generated.ts`），不引入外部 URL 索引源。

索引浏览：

```bash
worm-print-marketplace list --type element --search charts --locale en
worm-print-marketplace list --json
worm-print-marketplace validate
npm run market:site        # 由索引生成 docs/market/index.html 静态目录页
npm run market:site -- --check   # CI 漂移检测
```

## 4. 版本约定

- 版本号为 `major.minor.patch` SemVer；带 `-rc` / `-beta` 等后缀视为预发布，`auto` 默认不选。
- `minCoreVersion` 是安装链路实际把关的最低 core 版本；`engines.core` 是索引展示与文档用的兼容范围，`validate` 只校验非空，不做范围求值。插件发版时两者需保持一致（`minCoreVersion` 为范围下界）。
- 插件发版同步两件事：发布对应 npm 包；在本仓打 tag `plugins/<id>/vX.Y.Z`（正式版不用预发布后缀）。
- `dist` 预构建并提交仓库，三源共用单文件 ESM `dist/marketplace.js`；external 白名单仅 core 与 plugin-kit。

## 5. 契约、收录与信任

- 元素插件契约见 [使用文档 08 插件开发](./guide/08-plugin-dev.md)；索引 schema 见 §1，校验规则见 §1.5。
- 收录走本仓 PR：审核 `plugin.json` 与 dist、登记 `marketplace.json` 条目（含 `uniqueId`/`type`），并重新生成 catalog 与静态页。
- 市场不做沙箱，信任边界 = PR 审核 + 版本锁定。索引无签名，卡片标题/作者/来源均为市场声明，客户端只校验格式不背书内容；静态目录页顶部保留此提示。

## 6. 与现有文档的关系

- 本文是权威规范；[plugin-marketplace-plan.md](./plugin-marketplace-plan.md) 是历史方案记录，背景与决策沿革以其为准，字段口径以本文为准。
- 插件开发者先读 [07 插件安装](./guide/07-plugin-install.md) 与 [08 插件开发](./guide/08-plugin-dev.md)，再按本文 §2.1 为自己的插件分配 `uniqueId`。
