# 设计：i18next 统一语言引擎 + 泰语种 + 可导出 bundle

日期：2026-11-21
状态：待批准

## 意图与原因

用户要两件事：
1. 新增泰语（`th-TH`）语言选项，AI 直译英文包覆盖的全部字段，用于查看泰语界面效果。
2. 不再自造聚合方案，采用成熟平台的插件化多语言做法，让所有语言包集成在一起，并提供脚本把全部语言包合并成一个对象，供用户拷到自己的项目。

调研结论（已核实官方资料）：
- **i18next**：`resources = { locale: { namespace: { key: value } } }` 就是“合并成一个对象”的标准结构；插件用 `addResourceBundle(locale, ns, messages)` 注册；`getFixedT(locale)` 提供绑定语言的 translator；`services.resourceStore.data` 即完整聚合对象；官方 `i18next-parser` / `i18next-resources-to-backend` 提供提取与动态加载。
- **VS Code 扩展**：`package.nls.<locale>.json` / `bundle.l10n.<locale>.json` 约定文件，平台按 locale 自动发现，插件无需注册代码。
- **Chrome/WebExtensions**：`_locales/<locale>/messages.json` 目录约定。
- **Lingui**：每包 catalog + `catalogsMergePath` 编译期合并成每 locale 单文件。

用户已选择 **B：直接引入 i18next**，把 core 现有 i18n 引擎替换为 i18next 薄封装，彻底统一；导出格式采用 i18next 原生 `resources`，用户拷走后可直接 `i18next.init({ resources: bundle })`。插件包沿用现有 `registerPluginMessages`，底层映射到 i18next namespace。

## 目标

- 保持 core 现有全部 i18n 导出 API 的签名与行为不变，所有包调用链零改动或最小改动。
- 内置 zh-CN / en-US / th-TH 三语种，键完全对齐。
- 帮助文档、canvas 硬编码映射表、echarts 插件包均支持泰语。
- 提供 `npm run i18n:bundle`，导出标准 i18next resources（JSON + ESM）。
- 四个 demo 配置面板加“泰语”单选项。

## 非目标 / 反目标

- 不做翻译质量校对（用户明确“全部按 AI 翻译”），不引入 TMS/Crowdin。
- 不引入 Lingui / react-intl / vue-i18n 等框架绑定（本项目零框架 Custom Elements）。
- 不改变 template JSON 契约与打印管线。
- 不引入后端插件、语言探测插件（探测逻辑沿用现有 `navigator.language`）。

## 约束

- i18next 默认插值 `{{name}}`、点号分层、`escapeValue:true` 均与本项目不兼容：现有文案用 `{name}` 插值、key 含点（`toolbar.save`）、部分文案含 HTML（如 `toolbarOverflow.k488` 的 `<span>`）。配置必须显式关闭/改写。
- 现有引擎的语义需保持：`t` 未命中回退 zh-CN 源文本；`createTranslator(locale)` 绑定 locale 不受全局切换影响；`registerPluginMessages` 强制 key 以 `pluginId.` 开头；`setLocale(null)` 回退系统探测；`subscribe` 在语言变化时通知；`getMissingKeys` 收集缺失键。
- core 是发布包，新增 i18next 为运行时依赖（i18next 本身零外部依赖）。
- 单次写入 ≤500 行；大文件拆分。

## 方案对比与选择

| 方案 | 做法 | 取舍 | 结论 |
|---|---|---|---|
| A 只借数据契约 | 保留自研引擎，另写导出器生成 i18next 兼容对象 | 改动小，但运行时两套逻辑，用户明确要“不再自造” | 否决 |
| **B 引入 i18next 薄封装** | core 引擎改为 i18next `createInstance` 封装，保持 API 不变 | 彻底统一；调用链基本不动；需处理插值/点号/HTML 配置 | **采用** |
| C 新建 `@worm-print-platform/i18n` 包 | 所有语言源迁到单包 | 跨包依赖、发布、兼容镜像改动面过大 | 否决 |

## 详细设计

### 1. i18next 实例与兼容配置

文件：`packages/core/src/i18n/engine.ts`（重写），新增 `packages/core/src/i18n/i18n-instance.ts`（实例初始化）。

使用 `createInstance()` 创建实例（不污染全局单例），`init({ ..., initImmediate: false })` 保证内联 resources 同步可用。配置：

```
resources: { 'zh-CN': { core: zhCN }, 'en-US': { core: enUS }, 'th-TH': { core: thTH } }
lng: detect()                     // navigator.language → normalizeLocale，默认 zh-CN
fallbackLng: 'zh-CN'
ns: ['core'], defaultNS: 'core'
keySeparator: false               // 关键：key 含点，必须当扁平键
nsSeparator: false                // key 不含冒号前缀，namespace 仅靠 ns 数组检索
interpolation: { prefix: '{', suffix: '}', escapeValue: false }
returnNull: false, returnEmptyString: false
saveMissing: true, missingKeyHandler: (...) => 收集到 missing Set
initImmediate: false
```

`normalizeLocale` 扩展：`/^th([-_]|$)/i → 'th-TH'`，与现有 `en* → en-US` 同构。

### 2. 现有 API → i18next 映射（保持签名）

| 现有 API | i18next 实现 |
|---|---|
| `t(key, params)` | `instance.t(key, params)` |
| `translate(locale, key, params)` | `instance.getFixedT(locale)(key, params)` |
| `createTranslator(locale)` | `instance.getFixedT(locale)`（原生支持绑定 locale） |
| `getLocale()` | 内部维护的显式 locale，未设置时为探测值；与 `instance.resolvedLanguage` 对齐 |
| `setLocale(locale\|null)` | `instance.changeLanguage(locale ? normalizeLocale(locale) : detect())`，同步通知 |
| `resetLocale()` | `setLocale(null)` |
| `subscribe(fn)` | `instance.on('languageChanged', fn)`，返回 `off` |
| `registerLocale(locale, messages)` | `addResourceBundle(locale, 'user', messages, true, true)`，返回 `removeResourceBundle` |
| `mergeLocale(locale, messages)` | 同上（deep + overwrite 即“覆盖同键”语义） |
| `registerPluginMessages(locale, pluginId, messages)` | 保留前缀校验；`addResourceBundle(locale, pluginId, messages, true, true)`，并把 `pluginId` 追加到 `instance.options.ns`，使 `t('echarts.kinds.k84')` 能跨 namespace 命中 |
| `getMissingKeys()` | 内部 Set（`missingKeyHandler` 收集） |
| `clearLocales()` | 移除 `user` 与各 plugin namespace 的 bundle，保留 `core` 内置 |
| `formatNumber/formatDate` | 不变（`Intl.*`，与引擎无关） |

注意：`getFixedT` 在 i18next `init` 之前可用，但 `t` 在 init 前返回空串；由于内联 resources + `initImmediate:false`，模块加载时即完成 init。

### 3. 泰语语言资源（全部 AI 直译）

- `packages/core/src/i18n/messages/th-TH.ts`（主包 ~106 键）
- `packages/core/src/i18n/messages/shell-th.ts`（~571 键）
- `packages/core/src/i18n/messages/expr-th.ts`（~69 键）
- `packages/core/src/i18n/messages/th-TH.ts` 汇总 `...shellTh`、`...exprTh`，形状对齐 en-US/zh-CN
- `packages/canvas/src/shell/help-content/th-TH/`：6 个章节文件（`getting-started/features/advanced-settings/faq/shortcuts/changelog`），`help-content/index.ts` 的 locale 选择逻辑加 `th-TH`
- `marketplace/plugins/echarts/src/i18n/th-TH.ts`，`ui.ts` 的 `locales` 加 `'th-TH'`
- `packages/canvas/src/shell/label-translation.ts`：现有 `SOURCE_EN` 重构成按 locale 分支的 `SOURCE_EN` / `SOURCE_TH`，`translateConstantLabel(label, locale)` 对 `th-*` 用泰语表
- `packages/canvas/src/shell/property-tip-translation.ts`：新增 `TH` 映射，`localizedPropertyTip(key, lang)` 对 `th-*` 返回泰语
- `packages/core/src/i18n/messages/th-TH.ts` 等需保证占位符 `{name}`、`\n` 与英文包逐一对齐

### 4. 键奇偶校验

`packages/core/scripts/gen-locale-keys.mjs` 的 `bundleFiles` 从两组扩展到三组：
`['zh-CN.ts','shell-zh.ts','expr-zh.ts']`、`['en-US.ts','shell-en.ts','expr-en.ts']`、`['th-TH.ts','shell-th.ts','expr-th.ts']`；
`checkParity` 改为三方两两一致（zh↔en、zh↔th）。`locale-keys.json` 仍由 zh 派生，内容不变（键集合相同）。

### 5. 可导出 bundle（采用 i18next resources 原生结构）

- core 新增 `getResources(locale?)`：从实例 `services.resourceStore.data` 取聚合对象；传 locale 时返回该语言的 `{ namespace: messages }`，不传返回全量 `{ locale: { namespace: messages } }`。
- 新增仓库根脚本 `scripts/export-locale-bundle.mjs`（npm script `i18n:bundle`）：
  - 读取 core 三语种 messages、canvas 帮助文档、两张硬编码映射表、echarts 插件语言包
  - 输出 `dist/i18n/resources.json`（标准 i18next resources）与 `dist/i18n/resources.js`（`export const resources = {...}`）
  - namespace 约定：`core`（语义包）、`help`（帮助文档，结构化为 key→HTML）、`constants`（中文常量→各语文本）、`propertyTips`（属性 key→各语文本）、`echarts`（插件）
- 用户产物用法：`i18next.init({ resources: bundle, keySeparator: false, interpolation: { prefix:'{', suffix:'}', escapeValue:false } })`，与本仓配置一致。

### 6. Demo 语言选项

四个 demo（vue3/vue2/react/jquery）配置面板的语言单选组增加：
`<input ... value="th-TH">泰语</input>`（react/jquery 对应写法）。
`applyDisplayConfig` 已有 `el.lang = langMode === 'auto' ? undefined : langMode`，无需改动逻辑。

### 7. 测试

- 重写 `packages/core/src/i18n/__tests__/engine.spec.ts`：验证新引擎下全部既有语义（插值、fallback、createTranslator 绑定、插件前缀校验、missing 收集、subscribe、clearLocales、setLocale(null) 探测回退、th-TH 归一化）。
- 新增 `packages/core/src/i18n/__tests__/bundle.spec.ts`：`getResources('th-TH')` 含 core/help/constants/propertyTips/echarts 各 namespace，且 th 键集合与 en 一致。
- `packages/canvas/src/shell/__tests__/help-i18n.spec.ts`：加 `getHelpSections('th-TH')` 返回泰语章节且结构与 zh/en 一致。
- `packages/canvas/src/shell/__tests__/i18n-shell.spec.ts`：加英文/泰文切换断言。
- `marketplace/plugins/echarts/src/__tests__/i18n.test.ts`：加 `'th-TH'` locale 存在且键与 en 一致。
- 脚本 `npm run i18n:keys --check`、`npm run i18n:bundle` 纳入验收。

### 8. 包边界与发布

- `packages/core/package.json` 增加 `dependencies.i18next`。
- `tsup.config.ts` 若需 external 处理按现有约定（i18next 作为运行时依赖 external，由宿主安装）。
- 其余包不直接依赖 i18next，继续用 `@worm-print-platform/core/i18n` 的兼容 API。

## 风险与缓解

| 风险 | 缓解 |
|---|---|
| i18next 点号分层误解析 key | `keySeparator: false` |
| HTML 文案被转义 | `interpolation.escapeValue: false` |
| 插值语法不兼容 | `prefix:'{'`、`suffix:'}'` |
| init 异步导致首帧取不到词 | 内联 resources + `initImmediate: false` |
| 插件命名空间未被检索 | 注册时把 pluginId 加入 `ns` |
| 泰语 AI 翻译术语不统一 | 用户已接受；同 key 复用同一译法，脚本校验 key 对齐 |
| 帮助文档长文本翻译量大 | 按 6 文件分批写入，每文件 ≤500 行 |

## 实施者已定细节（builder check 自行拍板，无需再问用户）

- **`setLocale(null)` / `resetLocale()` 必须同步通知**：i18next 在语言未变化时可能不触发 `languageChanged`。薄封装在 `explicit` 变更时主动调用一次 `notify(locale)`，不依赖事件作为唯一通知源；`changeLanguage` 仅用于切换 resources 解析语言。
- **`clearLocales()` 需跟踪已注册插件命名空间**：内部维护 `registeredPluginIds: Set<string>`，`registerPluginMessages` 时记录，`clearLocales` 时逐个 `removeResourceBundle(locale, pluginId)` 并清空集合，同时保留 `core` 内置 bundle。
- **`getMissingKeys()` 口径**：i18next `saveMissing` 在命中 fallback 时也可能上报。薄封装在 `missingKeyHandler` 中判断该 key 是否同时不存在于 fallback（`zh-CN`）语言包，只有两边都缺才计入，保持现有语义。
- **`Translate` 类型兼容**：`createTranslator`/`t` 对外仍暴露现有 `(key, params?) => string` 类型；在薄封装内部对 i18next `TFunction` 做一层包装（参数转换 + 返回 `String`），避免把 i18next 的重载签名泄漏到公共 API。
- **bundle 脚本的资源提取**：不新增 tsx/ts-node 依赖。`core` 语义包与 `echarts` 插件语言包直接动态 `import` 其构建后的 ESM（`dist/`），帮助文档与两张映射表用与 `gen-locale-keys.mjs` 同构的源码正则提取（读取 `Record` 字面量块）。脚本前置于 `npm run build` 之后执行。

## 留给实施者的细节

- 具体泰语译文由实施时 AI 直译产出，需逐文件核对占位符与 HTML 标签不被破坏。
- i18next 版本取当前稳定版，锁定到 `package-lock.json`。
- 若 `getFixedT` 与 `subscribe` 在 i18next 版本间行为差异，以测试为准做最小适配。
