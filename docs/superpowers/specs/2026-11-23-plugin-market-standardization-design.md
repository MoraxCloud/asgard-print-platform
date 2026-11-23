# 插件市场标准化与内容索引设计

> 设计日期 2026-11-23。对应 Gitee issue IKX17O。参考 DeepSeek Harness 插件市场索引格式（`format 1`）。
> 状态：设计稿，待批准。通过后由 `writing-plans` 拆实施计划。

## 1. 意图与背景

IKX17O 要求三件事：插件市场规范文档、插件条目标注类型（元素 / 功能化）、全局唯一标识与命名规则。用户追加要求「内容索引」，参考 DSH 的索引格式，让插件像 DSH「发现」页那样可浏览、可筛选。

当前 `marketplace/marketplace.json` 只是 CLI 内置的安装索引（id/version/npmName/kinds/minCoreVersion），`marketplace list` 仅打印 `id@version npmName`；没有类型、唯一标识、分类、多语言标题。现有 `docs/plugin-marketplace-plan.md` 标题仍写「待实现」（实际大部分已落地），不宜直接改写成规范。

## 2. 目标 / 非目标 / 反目标

**目标**
- G1 标准化：产出权威规范文档；`marketplace.json` 每条标注 `type` 与 `uniqueId`。
- G2 内容索引：索引携带可浏览元数据（多语言标题/描述、分类、标签、排序键、版本、兼容范围），与安装解析同处一份文件；索引与生成器分离（`gen-catalog.mjs` 负责派生内置 catalog）。
- G3 本地浏览：CLI `list` 支持筛选/搜索/多语言展示；另生成一份可发布到 Pages 的静态 HTML 目录页。
- G4 存量零改动：不改 `id`、模板契约、i18n 命名空间、安装链路。

**非目标**
- 外部 URL 索引源、多索引源、索引签名、信任评级、能力词表（DSH 的 `dsh.plugin`、`capabilities` 等）。
- 插件运行时契约（`PrintElementPlugin` / `ElementUI`）变更。
- 引入外部运行时依赖。

**反目标（做了即失败）**
- 为「标准化」破坏存量模板 `plugins: ['echarts']` 或插件语言包键 `echarts.*`。
- 把 `uniqueId` 当成新的契约键替换 `id`。

## 3. 约束与已定决策

| 编号 | 决策 | 来源 |
| --- | --- | --- |
| D1 | 范围＝索引格式升级 + 本地浏览；不引入外部 URL 索引源，目录常驻本仓 | 用户选择 |
| D2 | 唯一标识＝新增 `uniqueId`，`id` 保持不变（存量零改动） | 用户选择（否决全量迁移） |
| D3 | 浏览载体＝CLI 增强 + 静态 HTML 目录页 | 用户选择 |
| D4 | 工程判断：`type` 预留 `element/functional/export` 三态（当前只用到前两个） | 本设计 |
| D5 | 工程判断：新增 `engines.core` 范围字段与现有 `minCoreVersion` 并存 | 本设计 |
| D6 | 工程判断：规范独立成 `docs/plugin-market-spec.md`，plan 留作历史记录 | 本设计 |
| D7 | `schemaVersion` 保留 `1`，新字段全部可选（读取端兼容缺失） | 本设计 |
| D8 | marketplace 包保持零运行时依赖；不引入 `semver` 库 | 既有约束 |

## 4. 方案选择

| 方案 | 做法 | 取舍 | 结论 |
| --- | --- | --- | --- |
| A 全量迁移 id | 把 `id` 改成 `worm-echarts`，旧 id 走别名 | 语义干净，但模板契约、i18n 命名空间、兼容镜像全要迁移，破坏存量 | 否决（用户选择） |
| B 新增 uniqueId | `id` 不变，新增 `worm-echarts` 作唯一标识 | 存量零改动；旧 id 天然兼容；多一个字段需文档说明职责 | **采用** |
| C 不动 | 只写文档 | 不满足「内容索引」诉求 | 否决 |

浏览载体同理：只做 CLI 不满足「内容索引」可浏览诉求；只做页面则 CLI 用户无法用；**CLI + 静态页**采用。

## 5. 设计

### 5.1 索引 schema（`marketplace.json`）

在现有结构上向后兼容扩展，`schemaVersion` 保持 `1`：

```jsonc
{
  "schemaVersion": 1,
  "format": "worm-market-v1",                 // 新增，可选：标识这是升级后的索引
  "title": { "zh-CN": "Worm 插件市场", "en": "Worm Plugin Market" },
  "description": { "zh-CN": "…", "en": "…" },
  "metadata": {                                // 新增：分类/标签/排序键声明
    "categories": {
      "element":    { "title": { "zh-CN": "元素插件", "en": "Element" } },
      "functional": { "title": { "zh-CN": "功能插件", "en": "Functional" } },
      "export":     { "title": { "zh-CN": "导出插件", "en": "Export" } }
    },
    "labels": {
      "official": { "title": { "zh-CN": "官方", "en": "Official" } }
    },
    "sortKeys": {
      "publishedAt": { "title": { "zh-CN": "发布时间", "en": "Published" }, "order": "desc" }
    }
  },
  "plugins": [
    {
      "id": "echarts",                         // 不变：模板契约键、i18n 命名空间
      "uniqueId": "worm-echarts",              // 新增：全局唯一标识（作者代号-插件名）
      "type": "element",                       // 新增：element | functional | export
      "name": "百度图表元素",                   // 保留：默认展示名（字符串）
      "title": { "zh-CN": "百度图表元素", "en": "ECharts" },   // 新增：LocalizedText
      "description": { "zh-CN": "…", "en": "…" },              // 由 string 扩展为 LocalizedText
      "version": "1.6.1",                      // 保留：当前稳定版本
      "npmName": "@worm-print-platform/plugin-echarts",
      "path": "plugins/echarts",
      "entry": "dist/marketplace.js",
      "kinds": ["barChart", "…"],
      "exportFormats": [],
      "homepage": "…",
      "license": "MIT",
      "minCoreVersion": "1.5.2",               // 保留：最低兼容版本
      "engines": { "core": ">=1.5.2 <2" },     // 新增：兼容范围（展示/文档用）
      "publishTimestamp": 1763800000,          // 新增：Unix 秒，排序用
      "metadata": {                            // 新增：引用根级声明
        "category": "element",
        "labels": ["official"],
        "sortKeys": { "publishedAt": 1763800000 }
      },
      "versions": [                            // 新增：精简版版本清单（可选）
        { "version": "1.6.1", "publishTimestamp": 1763800000,
          "source": { "type": "npm", "name": "@worm-print-platform/plugin-echarts" },
          "engines": { "core": ">=1.5.2 <2" } }
      ]
    }
  ]
}
```

`data-preview` 同理：`uniqueId: "worm-data-preview"`、`type: "functional"`、`category: "functional"`。

### 5.2 LocalizedText

`LocalizedText = string | ({ 'zh-CN': string } & Record<string, string>)`。
- 字符串形式兼容现状（视为 zh-CN）。
- 对象形式必须含 `zh-CN`（基准语言），其它语言键为小写 BCP47。
- 取值函数 `localize(text, locale)` 回退链：精确 locale → 语言前缀（如 `en-US` → `en`）→ `zh-CN` → 字符串原值。marketplace 包不依赖 core 的 i18n，自己实现这个纯函数。

### 5.3 类型字段

`type: 'element' | 'functional' | 'export'`：
- `element`：产出可设计/可渲染的打印元素（`kinds` 非空），如 echarts。
- `functional`：只提供设计器/宿主增强能力、不产出元素（`kinds` 与 `exportFormats` 均空），如 data-preview。
- `export`：接收渲染结果生成文件（`exportFormats` 非空），当前无实例，为规划预留。

读取端兼容：缺失 `type` 时从 `exportFormats`/`kinds` 推断（非空 `exportFormats`→export，`kinds` 非空→element，否则 functional）。

### 5.4 唯一标识

命名规则：`^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$`，形如 `作者代号-插件名`（`worm-echarts`、`worm-data-preview`）。
- `uniqueId` 全局唯一，写入规范与 `plugin.json` / `package.json` 的 `wormPrint.uniqueId`（如插件侧声明，便于生成器核对）。
- `id` 仍是模板 `plugins` 契约键与 i18n 命名空间，**不改**；旧 id 因此天然兼容。
- 读取端兼容：缺失 `uniqueId` 时回退 `id`，并在 `validate` 中报缺失（不阻断 list）。

### 5.5 兼容范围

`engines.core` 为 npm SemVer 范围字符串（如 `>=1.5.2 <2`），与 `minCoreVersion` 并存：
- `minCoreVersion` 继续被安装链路使用（最低版本比较，已有逻辑）。
- `engines.core` 用于索引展示与文档说明；CLI 只做「是否非空 / 是否可解析为简单范围」的格式校验，**不做完整范围求值**（受 D8 约束，不引入 semver 库）。
- 规范要求插件发版时两字段保持一致（`minCoreVersion` 为范围下界）。

### 5.6 索引校验器

新增 `packages/marketplace/src/validate-index.ts`，纯函数 `validateIndex(index): IndexIssue[]`：
- `schemaVersion !== 1` 报错。
- `id` / `uniqueId` 非空且各自唯一；`uniqueId` 符合 §5.4 正则。
- `type` 在枚举内；`metadata.category/labels/sortKeys` 引用的 id 在根级声明中存在。
- `LocalizedText` 对象含 `zh-CN`。
- 可选字段一旦出现即校验：`versions` 非空数组且每条 `version` 可被现有 `parseSemver` 解析；`engines.core` 为非空字符串（不校验范围语义）。缺失这些可选字段不报错，符合 D7。

新增 CLI 子命令 `validate`：读内置或 `--index <path>` 指定索引，有错输出到 stderr 并退出码 1，供 CI 门禁。`list` 也调用校验器，有错仅警告不阻断。

### 5.7 生成器扩展

`gen-catalog.mjs` 当前把整份 `marketplace.json` 原样写入 `catalog.generated.ts`（无字段投影），因此新字段自动进入内置 catalog；无需改生成逻辑，只需确保 `MarketIndex` 类型扩展后仍通过类型检查。注意 catalog 生成已挂在 `packages/marketplace` 的 `build` 脚本（`node scripts/gen-catalog.mjs && tsup`），根 `package.json` 只需新增 `market:site`（生成静态页）与 `market:validate`（校验索引）两个开发脚本，不重复 catalog 生成。

### 5.8 CLI `list` 增强

```
worm-print-marketplace list
  [--type element|functional|export]
  [--category <id>] [--label <id>]
  [--search <text>]          # 匹配 uniqueId / id / name / 各语言 title/description
  [--locale <bcp47>]         # 默认 zh-CN
  [--sort <sortKeyId>]       # 默认保持索引数组顺序
  [--json]                   # 输出结构化 JSON，供其它工具消费
```

输出示例（默认中文）：
```
worm-echarts       元素插件  百度图表元素              v1.6.1
  npm @worm-print-platform/plugin-echarts · core >=1.5.2 <2 · 官方
worm-data-preview  功能插件  数据源预览                v0.1.0
  npm @worm-print-platform/plugin-data-preview · core >=1.5.3
```

实现要点：`list` 的解析与渲染拆为纯函数便于测试；`--json` 输出 `uniqueId/type/title/description/version/engines/metadata`。安装 `install` / `remove` 链路不动。

### 5.9 静态 HTML 目录页

新增 `packages/marketplace/scripts/gen-market-site.mjs`：读 `marketplace.json`，输出单文件 `docs/market/index.html`（内联 CSS + 原生 JS，数据以 JSON 内嵌，无构建、无外部依赖）。内容：
- 卡片列表：localized 标题/描述、类型徽标、分类/标签、版本、兼容范围、安装命令。
- 筛选（类型/分类/标签）、文本搜索、排序（使用索引声明的 sortKeys）。
- 顶部标注索引 URL 与「索引为第三方内容、只校验格式不背书」的提示（借鉴 DSH 信任模型，本地索引亦保留口径）。
- 发布到 GitHub Pages / Gitee Pages 的既有站点路径，不新建仓库。

### 5.10 规范文档

新增 `docs/plugin-market-spec.md`，作为权威规范（plan 保留历史）。章节：
1. 索引格式（根字段 / 插件字段 / 版本字段 / LocalizedText / 校验规则）。
2. 元信息：字段含义、必填性、`uniqueId` 命名规则、`type` 三态。
3. 安装方式：npm / gitee / github / local 四源与 `auto` 回退顺序；安装单元与 tag 约定。
4. 版本约定：SemVer、`minCoreVersion` 与 `engines.core`、tag `plugins/<id>/vX.Y.Z`、dist 预构建提交。
5. 契约：索引 schema、校验器用法、收录 PR 流程、信任边界。
6. 与现有术语表（`docs/guide/08-plugin-dev.md` 的四个 id）的关系：`uniqueId` 是第五个标识，明确「不等于逻辑 id / i18n 命名空间」。

## 6. 改动清单（文件级）

| 文件 | 动作 |
| --- | --- |
| `marketplace/marketplace.json` | 加 `format/title/description/metadata`，两条插件加 `uniqueId/type/title/description(LocalizedText)/engines/publishTimestamp/metadata/versions` |
| `marketplace/plugins/*/plugin.json` | 加 `uniqueId`（与索引一致），供生成器核对 |
| `packages/marketplace/src/types.ts` | 扩展 `MarketIndex`/`MarketIndexEntry`，新增 `LocalizedText`/`PluginType`/`MarketVersionEntry`/`IndexIssue` |
| `packages/marketplace/src/validate-index.ts` + 测试 | 新增校验器 |
| `packages/marketplace/src/localize.ts` + 测试 | 新增 `localize()` 回退函数 |
| `packages/marketplace/src/cli.ts` + 测试 | `list` 增参数与展示；新增 `validate` 子命令 |
| `packages/marketplace/src/catalog.generated.ts` | 重新生成（字段自动带入） |
| `packages/marketplace/scripts/gen-market-site.mjs` | 新增静态页生成器 |
| `docs/market/index.html` | 新增生成产物（提交） |
| `docs/plugin-market-spec.md` | 新增规范文档 |
| `docs/guide/08-plugin-dev.md`、`README.md` | 补 `uniqueId` 术语与链接（不改 id 口径） |
| 根 `package.json` | 增加 `market:site` / `market:validate` scripts（catalog 生成沿用 workspace build） |

## 7. 验收

- IKX17O 三项：规范文档存在；`marketplace.json` 两条均有 `type`；两条均有 `uniqueId` 且 `id` 未变（旧 id 兼容）。
- `worm-print-marketplace validate` 退出码 0；故意破坏索引（重复 uniqueId / 未声明 category / 缺 zh-CN）能报出对应错误。
- `worm-print-marketplace list --type element --search echarts --locale en` 命中 echarts 并显示英文标题；`--json` 结构稳定。
- `docs/market/index.html` 打开可筛选/搜索/排序；构建产物随 `npm run build` 或独立 script 可复现。
- `npm test` 全绿；`npm run build` 通过；存量模板 `plugins: ['echarts']` 契约校验仍通过。

## 8. 风险与已知边界

- 索引无签名，卡片文字是市场声明；静态页与 CLI 均须展示来源与信任提示。
- `engines.core` 只做格式校验不做范围求值；真正兼容性仍由安装链路的 `minCoreVersion` 把关。
- 静态页为生成产物，索引改动后须重跑 `market:site`，否则页面漂移（可在 CI 加 `--check` 漂移检测，列为后续项）。
- `versions` 首期为精简清单，不与 npm registry 实时同步；发布时间由收录 PR 维护。

## 9. 留给 builder 的实施细节

- `localize()` 的语言前缀回退粒度、大小写归一化。
- `--sort` 缺值时排序键的展示顺序（建议缺值排最后，沿用 DSH 口径）。
- 静态页 JSON 内嵌的转义与 XSS 处理（索引内容视为不可信文本，统一转义）。
- 校验器错误文案的中文表述与退出码映射。
