# 设计：外挂整语言包（自定义语言）与三端加载

日期：2026-11-21
状态：待批准
关联：[06-i18n.md](../../guide/06-i18n.md)、[export-locale-bundle.mjs](../../../scripts/export-locale-bundle.mjs)、[engine.ts](../../../packages/core/src/i18n/engine.ts)

## 意图与原因

用户的问题：为一个仓库里不存在的语言（如 `fr-FR`）提供完整翻译，是否只需要一份 JSON 配置文件？

重新核对代码后的结论：

- **是，交付物是一份扁平点号键 JSON**；注入用现有 `registerLocale` / `<print-designer>.messages` 能力即可，不需要新增 `injectUserLocale`。
- 但「完整」不能用现状直接兑现：帮助弹窗外，`constants`（纸张/线型/水印等约 22 条）与 `propertyTips`（18 条）目前是 canvas 里的静态语言分支，不走 i18next；`dist/i18n/resources.json` 与运行时结构分裂；render/client 各自只读环境变量/系统语言，无法加载宿主语言包；市场安装的插件副本不带语言资源。这些是平台的一次性工程。
- 帮助弹窗按用户决定**本期不做多语言化**：正文与页签保持 zh/en/th 静态内容，自定义语言回退中文；仅外壳标题/关闭按钮跟随实例语言。

## 目标

- 宿主只需提供一份扁平键 JSON，即可让浏览器设计器、render 服务、桌面客户端（按各自加载配置）显示完整自定义语言。
- `constants` / `propertyTips` 迁入 i18next 命名空间，内置 zh/en/th 与自定义语言共用一条取词路径；删除 canvas 两张映射表。
- 新增 `@worm-print-platform/i18n` CLI，提供骨架导出、校验、增量更新。
- 市场 CLI 安装/卸载/升级插件时同步插件语言资源，骨架覆盖市场安装与 npm 直装两种宿主。
- 修复 `messages` 多实例互相覆盖/删除的问题：每个 `<print-designer>` 的消息包隔离到自己的 scoped translator。

## 非目标 / 反目标

- 不做终端用户在宿主 UI 里运行期上传语言包（XSS/持久化/权限另立项）。
- 不做帮助弹窗正文与页签的多语言化（保留现状，法语回退中文）。
- 不翻译打印文档 `<html lang>`（由 `documentLang` 控制，属模板内容）。
- 不改造四个 demo 的配置弹窗，不新增 demo 页面。
- 不翻译属性搜索的分组标签与中文关键词（只参与匹配、不显示）。
- 本期不升版本号，发版由 `releasing-official-version` 流程决定。
- 不引入 TMS/Crowdin，不做翻译质量校对。

## 约束

- 引擎配置不可破坏：`keySeparator: false`、`nsSeparator: false`、`interpolation {prefix:'{', suffix:'}', escapeValue:false}`、`fallbackLng:'zh-CN'`、`returnEmptyString:false`。
- core 是浏览器/Node 同构包，不得引入 `node:fs`；语言包文件读取只能由 render/client 各自实现。
- 资源真源单一：中文文案只存一份，不允许常量里与资源里各存一份漂移。
- 帮助正文含 HTML 且现有渲染用 `innerHTML`；本期帮助出范围，不引入 sanitize。
- 插件语言包必须提供 `zh-CN`（骨架基准语言），`en-US`/`th-TH` 可选。
- 单次文件写入 ≤500 行；提交信息用简体中文。

## 决策摘要（含重核修订）

| # | 决策 |
|---|---|
| D1 | 场景：宿主开发者随应用交付自定义语言；终端上传不做 |
| D2 | 用户语言包：扁平点号键 JSON，键含命名空间前缀，无 `_meta`/无元数据 |
| D3 | 命名空间检索链：`user` > 各插件 id > `constants` > `propertyTips` > `core` |
| D4 | 资源归属（重核修订 R1）：core 拥有 `core`/`constants`/`propertyTips` 三命名空间；插件拥有自身 ns；canvas 本期不产出 i18n 资源 |
| D5 | 每包产出 `dist/i18n/<locale>.json`，`package.json` 声明 `wormPrint.i18n`；插件必须含 zh-CN |
| D6 | 语义键（重核 R9）：core 常量加 `labelKey`/`tipKey`，删除中文→键映射；中文文案只存资源 JSON |
| D7 | 内置三语同样迁入 i18next，删除 canvas 静态语言分支与两张映射表 |
| D8 | 缺键保持 `fallbackLng:'zh-CN'`，不引入按语言回退链；完整性由 CLI 交付前拦截 |
| D9 | `el.messages` 改为实例级 scoped translator（重核 R4/R5）：第二 i18next 实例只承载用户包，缺键回退全局 translator；全局 `registerLocale` 语义不变 |
| D10 | 新包 `@worm-print-platform/i18n@0.1.0`，bin `worm-print-i18n`，零运行时依赖，支持 npx |
| D11 | CLI 命令：`template` / `validate` / `update`（缺失=error、多余=warn、空值=error、占位符不一致=error） |
| D12 | 市场 CLI 安装时把插件语言资源写到 `.worm-print/i18n/<id>/` 并记入 `plugins.json`；卸载/升级同步 |
| D13 | CLI 发现源：统一目录优先，兼扫 `node_modules` 的 `wormPrint.i18n` 补充；旧安装提示重装 |
| D14 | 三端加载：render `WORM_PRINT_LOCALE_FILE`；client `config.json` 的 `locale`/`localePack` + 打包内置 `locales/`；浏览器用现有 API 配方 |
| D15 | 统一发现约定：显式配置优先，回落应用根 `locales/<locale>.json` |
| D16 | 加载失败 warn + 回退内置语言，不阻塞启动 |
| D17 | 帮助弹窗出本期范围；仅外壳标题/关闭按钮跟随实例语言 |
| D18 | 验收：三端除帮助正文外零中文、CLI validate 全绿、内置三语零回归、三端各一只进程内冒烟 |
| D19 | 文档只改 06/07/08 与新包 README + AGENTS.md；bundle 产物破坏式更新 |
| D20 | PR 切分：① 引擎+资源 ② CLI+市场同步 ③ 三端加载+冒烟+文档 |

## 详细设计

### 1. 命名空间与资源归属

- `createI18nInstance()` 的内置 resources 从 `{ core }` 扩展为 `{ core, constants, propertyTips }`（三语）。
- `lookupNamespaces()` 返回 `['user', ...registeredPluginIds, 'constants', 'propertyTips', 'core']`；`defaultNS` 仍为 `core`。
- `clearLocales()` 只清 `user` 与插件层，不动内置三命名空间。
- `getResources(locale)` 自然包含新命名空间；`bundle.spec` 的键集合断言同步更新。

### 2. 资源文件格式与插件契约

包内声明：

```json
{
  "wormPrint": {
    "id": "echarts",
    "i18n": { "dir": "dist/i18n", "base": "zh-CN" }
  }
}
```

`dist/i18n/<locale>.json` 形状：

```json
{
  "echarts": {
    "echarts.panel.chart": "图表",
    "echarts.series.typeNames.bar": "柱状"
  }
}
```

- 顶层是命名空间，第二层是扁平键（键自带 ns 前缀），值为字符串。
- `zh-CN.json` 必须存在；`en-US.json`/`th-TH.json` 可选。
- core 的 `dist/i18n/<locale>.json` 包含 `core`/`constants`/`propertyTips` 三个命名空间；插件文件只含自身命名空间。
- 插件命名空间 = `wormPrint.id`，必须与注册 `ElementUI` 时的 `i18nId` 一致；core 自身也声明 `wormPrint.id: "core"` 与 `wormPrint.i18n`。
- 第三方插件未声明 `wormPrint.i18n` 时不进骨架，CLI 在输出中列出被跳过的包。

### 3. 内置三语迁移（语义键）

新增 core 资源源文件（JSON 为真源，`i18n-instance.ts` 直接 import）：

```
packages/core/src/i18n/locales/constants-zh-CN.json / -en-US / -th-TH
packages/core/src/i18n/locales/propertyTips-zh-CN.json / -en-US / -th-TH
```

键规范：

| 来源 | 键 |
|---|---|
| 纸张预设标签 | `constants.paper.<PRESET_KEY>.label`，如 `constants.paper.A4.label` |
| 纸张分组 | `constants.paper.group.<common\|dotMatrix\|labels\|receipt\|continuous>` |
| 边框线型 | `constants.borderStyle.<none\|solid\|dashed\|dotted\|double>` |
| 边框长提示（4 条） | `constants.hint.border.apply` / `.pending` / `.multi` / `.mixed` |
| 水印密度 | `constants.watermark.density.<dense\|medium\|loose>` |
| 其它常量标签 | `constants.label.<语义名>`（实现时把 `label-translation.ts` 的 22 条逐条列全） |
| 属性说明 | `propertyTips.<属性 key>`，如 `propertyTips.ap-img-fit` |

数据结构改造：

- `PAPER_PRESETS` 条目：`label?: string` → `labelKey: string`；`group?: string` → `group: PaperGroupId`（语义值 `common|dotMatrix|labels|receipt|continuous`），删 `LABEL_PAPER_GROUP` 的中文字面量，`isLabelPaperSize()` 改为比较 `'labels'`。
- `BORDER_LINE_STYLES`：`{ value, label }` → `{ value, labelKey }`。
- `WATERMARK_DENSITY_PRESETS`：`{ width, height, label }` → `{ width, height, labelKey }`。
- `ELEMENT_BORDER_APPLY_HINT` 等提示常量改为导出 key 常量（如 `ELEMENT_BORDER_APPLY_HINT_KEY = 'constants.hint.border.apply'`）；其余三条「待应用/多选/混合」提示是 canvas 内联字符串，直接使用 `constants.hint.border.pending|multi|mixed` 字面量 key。
- `PROPERTY_REGISTRY` 项新增 `tipKey?: string` 并删除 `tip` 文案字段（zh 文案迁入 resources）；`propertyTip(key)` 保留为兼容导出，内部返回 `translate('zh-CN', tipKey)`；canvas 不再调用它。
- JSON 作为资源源后，core/plugins 的 tsconfig 需开启 `resolveJsonModule`，tsup 默认支持 JSON import。
- canvas 侧：`translateConstantLabel` / `localizedPropertyTip` 删除，调用点改 `t(labelKey)` / `t(tipKey)`；`getHelpSections` 不动。
- 属性搜索：`groupLabel` 与中文 `keywords` 保留（仅匹配、不显示），本期不改。

校验与导出：

- `gen-locale-keys.mjs` 同时解析 TS 语言包与 JSON 资源，生成合并的 `locale-keys.json`；`i18n:check` 对 `core/constants/propertyTips` 三语做键 parity。
- 根 `scripts/export-locale-bundle.mjs` 改为读取各包 `dist/i18n/*.json` + 帮助静态内容，输出 `{ locale: { core, help, constants, propertyTips, echarts, ... } }`；`help` 段保持旧嵌套结构并标注「静态内容，不参与运行时」。
- core 构建链增加 `node scripts/gen-i18n-json.mjs`：tsup 之后从 `dist/i18n/index.js` 的 `getResources()` 写出 `dist/i18n/<locale>.json`。
- echarts：`src/i18n/<locale>.ts` 改为 `src/i18n/<locale>.json`（TS 直接 import JSON），构建脚本复制到 `dist/i18n/`；`sync-compat.mjs` 同步 `wormPrint` 字段并保留 dist 目录整体复制。

### 4. 引擎：lookup 与 scoped translator

新增/调整 API（`packages/core/src/i18n/engine.ts`）：

```ts
// messages 可选；提供时返回「用户包优先、全局兜底」的 translator
export function createTranslator(locale: Locale, messages?: CustomLocaleMessages): Translate
```

实现要点：

- 模块级 `const scopeInstances = new WeakMap<CustomLocaleMessages, I18nInstance>()`；每个 messages 对象对应一个独立 i18next 实例（`resources: {}`，仅承载 `user` 命名空间）。
- 取词：先用 scoped 实例的 `getFixedT(locale, 'user')` 取词，命中（返回值非空且不等于 key）则使用；否则回退 `globalInstance.getFixedT(locale, lookupNamespaces())`。命中判定需要单测覆盖空串、插值键与「译文恰好等于 key」的边界。
- 空串按缺失处理（依赖 `returnEmptyString:false`），保证 `update` 写入的空值在运行时回落 zh-CN。
- `print-designer.messages` setter 不再调用 `registerLocale`；`ctx.t = createTranslator(this.lang, this._messages)`；`lang`/`messages` 变化即重建 translator；删除 `disposeMessages`。
- `registerLocale` / `mergeLocale` / `registerPluginMessages` / `setLocale` / `clearLocales` 语义不变，继续服务全局注入与插件注册。
- 帮助弹窗：`HelpModalOptions` 增 `t?: Translate`，标题/关闭/aria 用 `opts.t ?? createTranslator(opts.locale)`；正文与页签仍走 `getHelpSections` 静态内容。
- 行为变化（修复）：`el.messages` 不再泄漏到全局 `user` 层；需要多实例共享一份包时用全局 `registerLocale`。
- 已知限制：未使用 `ctx.t` 的第三方插件 UI 仍跟随全局 locale（文档写明）。

### 5. CLI：`@worm-print-platform/i18n`

包结构参照 `packages/skills`：`bin` 指向 `dist/cli.js`，tsup 构建，`engines.node >= 18`，零运行时依赖，不依赖 core。

命令：

```
worm-print-i18n template [-o <file>] [--dir <projectRoot>]
worm-print-i18n validate <file> [--strict] [--dir <projectRoot>]
worm-print-i18n update   <file> [--prune] [--dir <projectRoot>]
```

- **发现**：先读 `<projectRoot>/.worm-print/i18n/<id>/<locale>.json`；再读 `<projectRoot>/node_modules/<pkg>/<wormPrint.i18n.dir>/<locale>.json` 补充；同 id 时统一目录优先；`<projectRoot>` 默认 `process.cwd()`。
- **template**：以 zh-CN 为基准，合并为扁平对象；排序规则：`core` → `constants` → `propertyTips` → 插件 id 字母序，同组内按键字母序；输出 2 空格缩进 JSON + 末尾换行。
- **validate**：文件必须是扁平对象、值必须是字符串；基准键缺失 = error；多余键 = warn（`--strict` 转 error）；空串 = error；占位符集合（正则 `\{([A-Za-z_][\w]*)\}`）与基准不一致 = error；发现 `_meta` 或嵌套对象按 error 并提示正确格式。输出错误清单，非零退出。
- **update**：保留已有译文；补新增键为空串；`--prune` 删除多余键；输出新增/删除计数；写回前按 template 排序。`update` 后立即 `validate` 会因新增的空值报错，这是预期行为（提示待翻译项），文档写清工作流。
- 退出码：0 成功；1 校验失败；2 用法错误。
- 旧安装检测：`.worm-print/plugins.json` 中存在插件条目但没有 `i18n` 字段时，输出「插件 X 的语言资源未同步，请重新安装」，不阻断其他插件的骨架生成。

### 6. 市场 CLI 同步语言资源

`packages/marketplace/src/install.ts`：

- 安装：在 `copyFiles()` 之后，读取 `fetched.sourceDir/package.json` 的 `wormPrint.i18n`；若存在，把 `sourceDir/<dir>/<locale>.json` 复制到 `<pluginDir>/../i18n/<id>/<locale>.json`（即 `.worm-print/i18n/<id>/`），并写入临时目录后原子改名。
- `plugins.json` 条目新增：`i18n?: { base: string; locales: string[] }`；`types.ts` 的 `ManifestEntry` 同步扩展。
- 卸载：`rmSync(.worm-print/i18n/<id>)` + 删除清单条目。
- 升级（`--force`）：先清理旧目录再写入，避免残留已删除语言。
- `plugin.json` 的 `files` 不需改（统一目录从 `sourceDir` 读）；但插件 npm 包 `files` 必须包含 `dist/i18n`（现有 `["dist"]` 已覆盖）。
- echarts 源码包与 `packages/echarts` 兼容包的 `package.json` 都补 `wormPrint.i18n`；`sync-compat.mjs` 同步该字段，并加断言测试防止兼容包漂移。

### 7. 三端加载

**render**（`services/render/src/server.ts`）：

- 环境变量：`WORM_PRINT_LOCALE`（现有）、`WORM_PRINT_LOCALE_FILE`（新增，绝对路径或相对进程 cwd 的路径）。
- 启动顺序：`setLocale(normalizeLocale(env))` → 若 `WORM_PRINT_LOCALE_FILE` 非空，读文件并 `registerLocale(locale, pack)`；失败 `console.warn('[i18n] 语言包加载失败: <path>: <reason>')` 并继续启动。
- 文档补 Docker 挂载/环境变量示例。

**client**（`clients/client/src/main`）：

- `AppConfig` 新增 `locale: string`（`''` = 跟随系统）与 `localePack: string`（空 = 不使用外部文件）；`DEFAULT_CONFIG`、`parseConfig()`、配置 round-trip 同步。`localePack` 为绝对路径或相对 `<userData>` 的路径（配置文件自身所在目录）。
- 启动顺序：删除模块顶层 `setLocale(app.getLocale())`；在 `configStore.load()` 之后、打印引擎初始化之前执行：`setLocale(normalizeLocale(config.locale || app.getLocale()))`，随后按 `config.localePack` → `join(__dirname, '../locales', `${locale}.json`)` 顺序尝试读取并 `registerLocale`；失败写 logger warn 并回退。
- 打包：`clients/client/scripts/copy-locales.mjs` 在 `electron-vite build` 之后、`electron-builder` 之前把仓库根 `locales/*.json` 复制到 `out/locales/`（`out/**` 已在 `files` 中，自动进 asar）；无 `locales/` 目录时跳过。`pack:client:*` 脚本串入该步骤。
- 文档说明：新语言要么放 `locales/` 后重新打包，要么在 `config.json` 填 `localePack` 后重启。

**浏览器宿主**：文档给两种配方，不新增 API。

```ts
// 全局注入（多实例共享）
registerLocale('fr-FR', frPack); setLocale('fr-FR')

// 单实例隔离
const el = document.querySelector('print-designer'); el.lang = 'fr-FR'; el.messages = frPack
```

**统一发现约定**：显式配置（env / config.json / 浏览器宿主代码）优先；未配置时回落应用根 `locales/<locale>.json`。

### 8. 帮助弹窗（本期出范围）

- 正文与页签：保留 `getHelpSections` 的 zh/en/th 静态内容；法语等自定义语言回退中文。
- 外壳：标题、关闭、aria 走实例 translator（`opts.t`），保证「帮助弹窗允许中文正文」但按钮文案不倒退。
- 06-i18n.md 明示该限制与后续迁移方向（迁入 `help` 命名空间 + 白名单 + sanitize）。

### 9. 错误处理与降级

- 文件不存在 / JSON 非法 / 顶层不是对象 / 值不是字符串：warn 并回退内置语言，不阻塞启动；错误信息包含路径与原因。
- 运行时缺键：回退 zh-CN（现有行为不变）；`update` 写入的空串同样回退。
- 交付前：`validate` 失败退出码 1，宿主 CI 可拦截。
- `registerLocale` 注入的插件键与内置键冲突时：按命名空间检索链，user 层优先（与现有一致）。

### 10. 测试与验收

- core：命名空间检索顺序、`clearLocales` 不清内置、`getResources` 新结构、scoped translator 的隔离/回退/空串、三语资源 parity（`i18n:check`）、bundle 新结构（`bundle.spec`）。
- canvas：`messages` 注入法语后纸张下拉、线型、水印密度、属性说明、长提示均为法语；帮助正文仍中文（显式断言）；同一 locale 两个实例分别注入不同 `messages` 互不影响；帮助外壳跟随实例。
- render：`WORM_PRINT_LOCALE_FILE` 生效（校验/诊断文案法语）；文件缺失/非法时 warn 且服务继续。
- client：`config.json` 的 `localePack` 生效（请求校验文案法语）；打包内置 `out/locales` 兜底生效；无效文件回退。
- marketplace：安装写入 `.worm-print/i18n` 与清单、卸载清理、升级重写、旧清单告警、兼容包 `wormPrint` 字段一致。
- CLI：夹具覆盖缺失/多余/空值/占位符缺失/`_meta`/嵌套对象/非字符串/排序稳定性/update 保留译文与 `--prune`。
- 文档测试：`docs.spec.ts` 关键词随 06-i18n.md 更新；`help-i18n.spec.ts` 不变；跨端 parity 不涉及。
- 验收：三端（浏览器/render/client）除帮助正文外法语零中文；`validate` 全绿；内置 zh/en/th 零回归。

### 11. 文档、发布与 PR 切分

文档：

- 重写 `docs/guide/06-i18n.md`：区分「内置语言开发 SOP」与「外挂语言包」两条路径；更新命名空间/API/资源契约/CLI/bundle/三端加载/多实例语义/帮助限制/插件 zh-CN 契约。
- `docs/guide/07-plugin-install.md` 补市场安装同步语言资源；`docs/guide/08-plugin-dev.md` 补插件 i18n 契约与 `wormPrint.i18n`。
- 新增 `packages/i18n/README.md`；`AGENTS.md` 发布包清单与根 `package.json` 的 `build`/`test`/`publish:npm` 补齐新包（发版时生效）。

PR 切分：

1. 引擎与资源：core 命名空间/资源/scoped translator/`labelKey`/`i18n:check`/bundle；canvas 调用点与测试；echarts 资源产出与契约字段。
2. CLI 与市场同步：新包、`template/validate/update`、marketplace 安装/卸载/升级、兼容包同步。
3. 三端加载与收尾：render/client 加载、copy-locales、三端冒烟、06/07/08 与新包 README。

### 12. 风险与待办

- **引擎改动面**：scoped translator 与 `messages` 语义变化是最大风险；必须用单测覆盖隔离/回退/空串，并在文档标注行为变化。
- **core 公共类型破坏**：删除 `PaperPreset.label`/`BORDER_LINE_STYLES.label`/`WATERMARK_DENSITY_PRESETS.label` 影响发布包类型；Vue 3 轨（worm-vue3-print 仓库）共用 core，需同步协调后再发版。
- **旧市场安装**：旧 `.worm-print/plugins` 副本没有语言资源，只能提示重装；文档写清。
- **帮助仍中文**：法语用户会看到中文帮助正文，属已接受限制，文档必须显式声明。
- **bundle 破坏**：已拷走 `dist/i18n/resources.json` 的用户需重新导出；文档给迁移说明。
- **空值回退依赖 i18next 配置**：`returnEmptyString:false` 若被改动会破坏 update 语义，加回归测试锁住。
- **插件 `ctx.t` 覆盖不全**：未使用 `ctx.t` 的插件在实例语言下显示全局语言，属已知限制。
- **客户端打包路径**：asar 内 `out/locales` 读取、无 `locales/` 目录时跳过，需在 mac/win/linux 打包冒烟。

## 验收清单

1. `npm run build` 全绿；`npm test` 全绿（含新增 CLI/marketplace/render/client/canvas 用例）。
2. `npm run i18n:check` 全绿（core/constants/propertyTips 三语 parity）。
3. 用 `template` 生成骨架 → 人工填一份法语夹具 → `validate` 全绿；缺键/多键/空值/占位符错误分别能被拦截。
4. 浏览器设计器注入法语后，除帮助正文外无中文；两个实例不同 `messages` 互不影响。
5. render 通过 `WORM_PRINT_LOCALE_FILE` 输出法语诊断；client 通过 `config.json` 输出法语诊断；无效文件均 warn 回退。
6. 市场安装/卸载/升级 echarts 后，`.worm-print/i18n/echarts/` 与 `plugins.json` 一致；直接 npm 安装的插件也能进骨架。
