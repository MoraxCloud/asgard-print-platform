# 自定义语言包（外挂整语言）与三端加载 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 宿主提供一份扁平键 JSON 即可让浏览器设计器、render 服务、桌面客户端显示完整自定义语言（帮助正文除外），并修复 `messages` 多实例互相覆盖的问题。

**Architecture:** core 拥有 `core`/`constants`/`propertyTips` 三个内置命名空间，中文文案只存资源 JSON；core 常量改用 `labelKey`/`tipKey`，canvas 删除两张映射表改走 `t()`。`createTranslator(locale, messages?)` 为每个 `messages` 对象创建独立 i18next 实例承载用户包、缺键回退全局。新增零依赖 CLI `@worm-print-platform/i18n` 导出骨架/校验/更新；市场 CLI 安装时把插件语言资源同步到 `.worm-print/i18n/`。render/client 增加语言包文件加载入口。

**Tech Stack:** TypeScript、i18next（core 现有依赖）、vitest、happy-dom、tsup、npm workspaces。

**Spec:** `docs/superpowers/specs/2026-11-21-custom-language-pack-design.md`

## Global Constraints

- 引擎配置不变：`keySeparator: false`、`nsSeparator: false`、`interpolation { prefix:'{', suffix:'}' , escapeValue:false }`、`fallbackLng:'zh-CN'`、`returnEmptyString:false`。
- 命名空间检索链：`['user', ...registeredPluginIds, 'constants', 'propertyTips', 'core']`。
- 用户语言包：扁平点号键 JSON，键自带命名空间前缀（如 `constants.border.none`），无 `_meta`、无嵌套对象。
- 插件语言包：必须提供 `zh-CN`；`en-US`/`th-TH` 可选；键必须以插件 id 为前缀。
- core 不得引入 `node:fs`；文件读取只在 render/client/CLI 中做。
- 帮助弹窗正文与页签本期不动：`getHelpSections` 静态 zh/en/th，自定义语言回退中文；仅外壳标题/关闭接入实例 translator。
- 加载失败 warn + 回退内置语言，不阻塞启动。
- 单次文件写入 ≤500 行；UTF-8 无 BOM；提交信息用简体中文；默认在 master 分支开发。
- 既有发布包本期不升版本号；新包 `@worm-print-platform/i18n` 固定 0.1.0。

## PR / Task 映射

- PR① 引擎与资源：Task 1–5
- PR② CLI 与市场同步：Task 6–9
- PR③ 三端加载与文档：Task 10–13

## File Structure

```
packages/core/src/i18n/
  i18n-instance.ts            # 内置三命名空间 resources
  engine.ts                   # lookup、scoped translator
  locales/constants-*.json    # constants 三语真源（新建）
  locales/propertyTips-*.json # propertyTips 三语真源（新建）
  __tests__/namespaces.spec.ts# 新建
packages/core/src/designer/utils/default-config.ts   # PAPER_PRESETS labelKey/group
packages/core/src/designer/utils/element-border-edit.ts # BORDER_LINE_STYLES labelKey、提示 key
packages/core/src/render/watermark.ts                # 密度 presets labelKey
packages/core/src/designer/utils/property-search.ts  # PROPERTY_REGISTRY tipKey
packages/canvas/src/shell/*.ts                       # 调用点改 t()
packages/i18n/                                       # 新 CLI 包
  src/{cli,discover,template,validate,update}.ts
packages/marketplace/src/{install,types}.ts          # 同步语言资源
services/render/src/server.ts                        # WORM_PRINT_LOCALE_FILE
clients/client/src/main/{config,index,locale-pack}.ts# locale/localePack 加载
clients/client/scripts/copy-locales.mjs              # 新建
docs/guide/{06-i18n,07-plugin-install,08-plugin-dev}.md
scripts/{gen-locale-keys,export-locale-bundle}.mjs   # 改造/新增
```

## Review Focus

1. **含点键被当嵌套**：`t('constants.borderStyle.none')` 必须命中（`keySeparator:false`）。
2. **中文文案双真源漂移**：迁移后常量文件里不得再有中文显示文案；`rg "'无'|常用纸张" packages/core/src/designer` 应为空。
3. **messages 泄漏全局**：实例 `el.messages` 后 `t('toolbar.save')` 全局值不变。
4. **空串回退**：`update` 写入的空串在运行时回退 zh-CN（依赖 `returnEmptyString:false`）。
5. **市场安装漏语言资源**：`.worm-print/i18n/echarts/zh-CN.json` 必须存在且与插件包一致。
6. **客户端 asar 路径**：打包后 `out/locales` 可读，缺目录时跳过。

---

### Task 1: core 命名空间与内置资源

**Files:**
- Modify: `packages/core/tsconfig.json`（加 `"resolveJsonModule": true`）
- Modify: `packages/core/package.json`（加 `wormPrint` 声明）
- Create: `packages/core/src/i18n/locales/constants-{zh-CN,en-US,th-TH}.json`
- Create: `packages/core/src/i18n/locales/propertyTips-{zh-CN,en-US,th-TH}.json`
- Modify: `packages/core/src/i18n/i18n-instance.ts`
- Modify: `packages/core/src/i18n/engine.ts`（`lookupNamespaces`）
- Test: `packages/core/src/i18n/__tests__/namespaces.spec.ts`

**Interfaces:**
- Produces: `getResources()` 返回的每个 locale 含 `core`/`constants`/`propertyTips` 三个命名空间；`lookupNamespaces()` 顺序固定为 `['user', ...plugins, 'constants', 'propertyTips', 'core']`。

**映射表（迁移用，Task 2 的 labelKey 必须与此一致）：**

- 边框线型：`无/实线/虚线/点线/双线` → `constants.borderStyle.none|solid|dashed|dotted|double`
- 纸张预设标签（13 个）：`PAPER_PRESETS` 每项 label → `constants.paper.<PRESET_KEY>.label`（如 `constants.paper.A4.label`、`constants.paper.DOT_FULL.label`）
- 纸张分组：`常用纸张/针式打印纸/标签纸/小票纸/连续纸` → `constants.paper.group.common|dotMatrix|labels|receipt|continuous`
- 水印密度：`密/中（默认）/疏` → `constants.watermark.density.dense|medium|loose`（`label-translation.ts` 里带尺寸后缀的三条旧键不再使用，删除）
- `内容` → `constants.label.content`
- 4 条边框长提示按 `label-translation.ts` 出现顺序 → `constants.hint.border.apply|pending|multi|mixed`
- 属性说明 18 条：`propertyTips.<属性 key>`，键为 `ap-long-text-indent`、`ap-img-fit`、`ap-img-object-position`、`ap-img-fit-scale`、`ap-rotate`、`fl-columns`、`fl-row-height`、`fl-gap-x`、`fl-auto-span`、`fl-max-span`、`fl-layout-mode`、`fl-padding-top`、`fl-padding-right`、`fl-padding-bottom`、`fl-padding-left`、`cd-bar-quiet-zone`、`cd-bar-height`、`cd-quiet-zone`

- [ ] **Step 1: 写失败测试**

`packages/core/src/i18n/__tests__/namespaces.spec.ts`：

```ts
import { afterEach, describe, expect, it } from 'vitest'
import { clearLocales, getResources, resetLocale, setLocale, t } from '../index.js'

afterEach(() => { resetLocale(); clearLocales() })

describe('内置命名空间', () => {
  it('三语都含 constants 与 propertyTips', () => {
    for (const lng of ['zh-CN', 'en-US', 'th-TH']) {
      const res = getResources(lng)
      expect(res.constants['constants.borderStyle.none']).toBeTruthy()
      expect(res.propertyTips['propertyTips.ap-img-fit']).toBeTruthy()
    }
  })

  it('含点语义键可命中', () => {
    setLocale('en-US')
    expect(t('constants.borderStyle.none')).toBe('None')
  })

  it('clearLocales 不清内置命名空间', () => {
    clearLocales()
    expect(getResources('zh-CN').constants).toBeTruthy()
    expect(getResources('zh-CN').propertyTips).toBeTruthy()
  })
})
```

- [ ] **Step 2: 运行确认 RED**

Run: `npm test -w @worm-print-platform/core -- --run src/i18n/__tests__/namespaces.spec.ts`
Expected: FAIL（`constants` 为 undefined）。

- [ ] **Step 3: 写资源 JSON**

每个文件形如：

```json
{
  "constants": {
    "constants.borderStyle.none": "无",
    "constants.paper.A4.label": "A4 210×297mm",
    "constants.paper.group.common": "常用纸张",
    "constants.watermark.density.dense": "密",
    "constants.label.content": "内容",
    "constants.hint.border.apply": "线型 / 宽度 / 颜色即时生效……"
  }
}
```

`propertyTips-*.json` 形如 `{ "propertyTips": { "propertyTips.ap-img-fit": "..." } }`。

取值规则：zh 从 core 常量 / `label-translation.ts` / `property-tip-translation.ts` 的现有中文取；en/th 从同两文件的 `SOURCE_EN`/`SOURCE_TH`/`EN`/`TH` 对应行取；拉丁纸张标签三语相同。JSON 里不要保留中文键。为避免手抄 40×2 条，可写一个一次性转换脚本：以「原中文文案 → 语义键」映射表为输入，读取两张映射表输出 JSON；脚本用完即删，不提交。

- [ ] **Step 4: 接入实例并扩展 lookup**

`i18n-instance.ts`：`import constantsZh from './locales/constants-zh-CN.json' with { type: 'json' }`（其余同理），`resources` 改为：

```ts
resources: {
  'zh-CN': { core: zhCN, constants: constantsZh.constants, propertyTips: propsZh.propertyTips },
  'en-US': { core: enUS, constants: constantsEn.constants, propertyTips: propsEn.propertyTips },
  'th-TH': { core: thTH, constants: constantsTh.constants, propertyTips: propsTh.propertyTips },
}
```

`engine.ts` 的 `lookupNamespaces()` 改为：

```ts
function lookupNamespaces(): string[] {
  return ['user', ...registeredPluginIds, 'constants', 'propertyTips', 'core']
}
```

`packages/core/package.json` 增加（CLI 靠它发现 core 的语言资源）：

```json
"wormPrint": { "id": "core", "i18n": { "dir": "dist/i18n", "base": "zh-CN" } }
```

- [ ] **Step 5: 运行确认 GREEN 并构建**

Run: `npm test -w @worm-print-platform/core -- --run src/i18n/__tests__/namespaces.spec.ts`
Expected: PASS
Run: `npm run build -w @worm-print-platform/core`
Expected: 成功，`packages/core/dist/i18n/index.js` 含 `constants`。

- [ ] **Step 6: 提交**

```bash
git add packages/core/src/i18n packages/core/tsconfig.json
git commit -m "feat(core): 内置 constants/propertyTips 命名空间与资源"
```

---

### Task 2: 语义键迁移（core 常量 + canvas 调用点）

**Files:**
- Modify: `packages/core/src/designer/utils/default-config.ts`
- Modify: `packages/core/src/designer/utils/element-border-edit.ts`
- Modify: `packages/core/src/render/watermark.ts`
- Modify: `packages/core/src/designer/utils/property-search.ts`
- Modify: `packages/canvas/src/shell/{panels,property-panel,table-props,binding,watermark,page-extras,crop-anchor}.ts`
- Delete: `packages/canvas/src/shell/label-translation.ts`
- Delete: `packages/canvas/src/shell/property-tip-translation.ts`
- Modify: `packages/canvas/src/shell/__tests__/i18n-shell.spec.ts`（删除旧函数引用，改断言新取词 + 法语属性台）
- Modify: 相关 core/canvas 测试

**Interfaces:**
- Produces: `PaperPreset = { width: number; height: number; continuous?: boolean; labelKey: string; group: PaperGroupId }`；`BORDER_LINE_STYLES: readonly { value: BorderLineStyle; labelKey: string }[]`；`WATERMARK_DENSITY_PRESETS: Record<'dense'|'medium'|'loose', { width: number; height: number; labelKey: string }>`；`PROPERTY_REGISTRY` 项 `tipKey?: string`；`propertyTip(key)` 仍返回中文（兼容）。

- [ ] **Step 1: 写失败测试**

core：在 `paper-presets.spec.ts` 增加：

```ts
expect(PAPER_PRESETS.A4.labelKey).toBe('constants.paper.A4.label')
expect(PAPER_PRESETS.LABEL_80X60.group).toBe('labels')
expect(isLabelPaperSize('LABEL_80X60')).toBe(true)
```

canvas 新建 `packages/canvas/src/shell/__tests__/i18n-constants.spec.ts`：

```ts
import { afterEach, expect, it } from 'vitest'
import { setLocale, resetLocale } from '@worm-print-platform/core/i18n'
import { PAPER_PRESETS, BORDER_LINE_STYLES, WATERMARK_DENSITY_PRESETS, t } from '@worm-print-platform/core'

afterEach(() => resetLocale())

it('常量 labelKey 在英文下取到英文', () => {
  setLocale('en-US')
  expect(t(PAPER_PRESETS.DOT_FULL.labelKey)).toBe('Full sheet 241×279.4mm')
  expect(t(BORDER_LINE_STYLES[1].labelKey)).toBe('Solid')
  expect(t(WATERMARK_DENSITY_PRESETS.dense.labelKey)).toBe('Dense')
})
```

- [ ] **Step 2: 运行确认 RED**

Run: `npm test -w @worm-print-platform/core -- --run src/designer/utils/__tests__/paper-presets.spec.ts`
Run: `npm test -w @worm-print-platform/canvas -- --run src/shell/__tests__/i18n-constants.spec.ts`
Expected: FAIL（`labelKey` 不存在 / 取到 key）。

- [ ] **Step 3: 改 core 数据结构**

`default-config.ts`：

```ts
export type PaperGroupId = 'common' | 'dotMatrix' | 'labels' | 'receipt' | 'continuous'
export const LABEL_PAPER_GROUP: PaperGroupId = 'labels'
export interface PaperPreset {
  width: number; height: number; continuous?: boolean
  labelKey: string; group: PaperGroupId
}
// 例：A4: { width: 210, height: 297, labelKey: 'constants.paper.A4.label', group: 'common' }
// LABEL_PAPER_GROUP 逻辑改为 group === 'labels'
```

`element-border-edit.ts`：

```ts
export type BorderLineStyle = 'none' | 'solid' | 'dashed' | 'dotted' | 'double'
export const BORDER_LINE_STYLES: readonly { value: BorderLineStyle; labelKey: string }[] = [
  { value: 'none', labelKey: 'constants.borderStyle.none' },
  { value: 'solid', labelKey: 'constants.borderStyle.solid' },
  { value: 'dashed', labelKey: 'constants.borderStyle.dashed' },
  { value: 'dotted', labelKey: 'constants.borderStyle.dotted' },
  { value: 'double', labelKey: 'constants.borderStyle.double' },
]
export const ELEMENT_BORDER_APPLY_HINT_KEY = 'constants.hint.border.apply'
```

`watermark.ts`（core）：三档改为 `labelKey: 'constants.watermark.density.dense|medium|loose'`。

`property-search.ts`：每个 `items` 项把 `tip` 换成 `tipKey: 'propertyTips.<key>'`（18 条）；`propertyTip()` 改为：

```ts
export function propertyTip(key: string): string {
  for (const group of PROPERTY_REGISTRY) {
    const hit = group.items.find(item => item.key === key)
    if (hit?.tipKey) return translate('zh-CN', hit.tipKey)
  }
  return ''
}
```

- [ ] **Step 4: 改 canvas 调用点并删表**

- `panels.ts`：`translateConstantLabel(PAPER_PRESETS[...].label, ctx.lang)` → `tr(ctx, PAPER_PRESETS[...].labelKey)`；分组显示改为 `tr(ctx, 'constants.paper.group.' + preset.group)`。
- `property-panel.ts` / `table-props.ts` / `binding.ts` / `watermark.ts` / `page-extras.ts` / `crop-anchor.ts`：所有 `translateConstantLabel(x.label, lang)` → `tr(ctx, x.labelKey)`；`localizedPropertyTip(key, lang)` → `tr(ctx, 'propertyTips.' + key)`；长提示引用 `ELEMENT_BORDER_APPLY_HINT_KEY` 与 `'constants.hint.border.pending|multi|mixed'`；`ELEMENT_BORDER_APPLY_HINT` 的字面量导入替换。
- 删除 `label-translation.ts`、`property-tip-translation.ts`。
- 重写 `packages/canvas/src/shell/__tests__/i18n-shell.spec.ts`：保留原 `mountWithSelected` 辅助函数（见当前文件 30–50 行），删除 `translateConstantLabel`/`localizedPropertyTip` 导入，改为：

```ts
it('法语实例属性台出现法语线型', async () => {
  const shadow = await mountWithSelected('fr-FR', 'table')
  const el = document.querySelector('print-designer') as PrintDesignerElement
  el.messages = { 'constants.borderStyle.solid': 'Solide' }
  await frame()
  expect(shadow.textContent).toContain('Solide')
})
```

- core/canvas 现有断言中凡引用中文 label 的，改为断言 `labelKey` 或 `t(labelKey)`。
- 帮助正文回退断言（本期帮助出范围的锁）：

```ts
import { getHelpSections } from '../help-content'
it('自定义语言帮助正文回退中文', () => {
  expect(getHelpSections('fr-FR')[0].content).toMatch(/[\u4e00-\u9fff]/)
})
```

- [ ] **Step 5: 全量验证**

Run: `npm run typecheck -w @worm-print-platform/canvas && npm test -w @worm-print-platform/core && npm test -w @worm-print-platform/canvas`
Expected: PASS（`rg "translateConstantLabel|localizedPropertyTip" packages/canvas/src` 无结果）。

- [ ] **Step 6: 提交**

```bash
git add packages/core/src packages/canvas/src
git commit -m "refactor(i18n): 常量与属性说明改用语义键"
```

---

### Task 3: scoped translator 与 messages 隔离

**Files:**
- Modify: `packages/core/src/i18n/engine.ts`
- Modify: `packages/core/src/i18n/__tests__/engine.spec.ts`
- Modify: `packages/canvas/src/print-designer.ts`
- Modify: `packages/canvas/src/shell/help-modal.ts`
- Test: `packages/canvas/src/__tests__/messages-isolation.spec.ts`（新建）

**Interfaces:**
- Produces: `createTranslator(locale: Locale, messages?: CustomLocaleMessages): Translate`；`HelpModalOptions` 增 `t?: Translate`；`el.messages` 不再写全局 `user` 层。

- [ ] **Step 1: 写失败测试**

`engine.spec.ts` 增加：

```ts
import { createTranslator, t, setLocale, resetLocale } from '../index.js'

it('scoped translator 优先 messages，缺键回退全局', () => {
  resetLocale(); setLocale('zh-CN')
  const tr = createTranslator('fr-FR', { 'toolbar.save': 'Enregistrer' })
  expect(tr('toolbar.save')).toBe('Enregistrer')
  expect(tr('toolbar.preview')).toBe('预览') // 回退全局 zh-CN
})

it('不同 messages 的 translator 互不影响', () => {
  const a = createTranslator('fr-FR', { 'toolbar.save': 'A' })
  const b = createTranslator('fr-FR', { 'toolbar.save': 'B' })
  expect(a('toolbar.save')).toBe('A')
  expect(b('toolbar.save')).toBe('B')
})
```

canvas `packages/canvas/src/__tests__/messages-isolation.spec.ts`：

```ts
// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { resetLocale, t } from '@worm-print-platform/core/i18n'
import { definePrintDesigner, type PrintDesignerElement } from '../index.js'

afterEach(() => { resetLocale(); document.body.replaceChildren() })

it('el.messages 不泄漏到全局 translator', async () => {
  definePrintDesigner()
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  const el = document.createElement('print-designer') as PrintDesignerElement
  host.appendChild(el)
  await new Promise<void>(r => requestAnimationFrame(() => r()))
  el.messages = { 'toolbar.save': 'Enregistrer' }
  expect(t('toolbar.save')).not.toBe('Enregistrer')
})
```

- [ ] **Step 2: 运行确认 RED**

Run: `npm test -w @worm-print-platform/core -- --run src/i18n/__tests__/engine.spec.ts`
Expected: FAIL（`createTranslator` 不接收第二参数 / 隔离断言失败）。

- [ ] **Step 3: 实现 scoped translator**

`engine.ts` 增加：

```ts
import { createInstance } from 'i18next'

const scopeInstances = new WeakMap<CustomLocaleMessages, I18nInstance>()

function scopedInstance(messages: CustomLocaleMessages): I18nInstance {
  let inst = scopeInstances.get(messages)
  if (!inst) {
    inst = createInstance()
    inst.init({
      resources: {}, lng: 'zh-CN', fallbackLng: false, ns: ['user'], defaultNS: 'user',
      keySeparator: false, nsSeparator: false,
      interpolation: { prefix: '{', suffix: '}', escapeValue: false },
      returnNull: false, returnEmptyString: false, initImmediate: false,
    })
    scopeInstances.set(messages, inst)
  }
  return inst
}

export function createTranslator(locale: Locale, messages?: CustomLocaleMessages): Translate {
  const normalized = normalizeLocale(locale)
  const globalFixed = instance.getFixedT(normalized, lookupNamespaces())
  if (!messages) return (key, params) => asString(params ? globalFixed(key, params) : globalFixed(key), key)
  const scoped = scopedInstance(messages)
  scoped.addResourceBundle(normalized, 'user', messages as Record<string, string>, true, true)
  const fixed = scoped.getFixedT(normalized, 'user')
  return (key, params) => {
    const local = params ? fixed(key, params) : fixed(key)
    if (typeof local === 'string' && local !== '' && local !== key) return local
    return asString(params ? globalFixed(key, params) : globalFixed(key), key)
  }
}
```

- [ ] **Step 4: 改 print-designer 与 help-modal**

`print-designer.ts`：删除 `registerLocale` 导入与 `disposeMessages`；`messages` setter：

```ts
set messages(v: CustomLocaleMessages | undefined) {
  this._messages = v
  this.repaint()
}
```

`ctx` 与 `paint()`/`help` 渲染处统一改 `createTranslator(this.lang, this._messages)`；`lang` setter 删除消息层重注册逻辑，仅设值 + 重绘。

`help-modal.ts`：`HelpModalOptions` 增 `t?: Translate`；`renderHelpModal` 内 `const t = opts.t ?? createTranslator(opts.locale ?? 'zh-CN')`。

- [ ] **Step 5: 运行确认 GREEN**

Run: `npm test -w @worm-print-platform/core -- --run src/i18n/__tests__/engine.spec.ts && npm test -w @worm-print-platform/canvas -- --run src/__tests__/messages-isolation.spec.ts`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add packages/core/src/i18n packages/canvas/src
git commit -m "fix(canvas): messages 改为实例级 scoped translator"
```

---

### Task 4: 键清单、bundle 导出与 core 产物

**Files:**
- Modify: `packages/core/scripts/gen-locale-keys.mjs`
- Create: `packages/core/scripts/gen-i18n-json.mjs`
- Modify: `packages/core/package.json`（build 链）
- Modify: `scripts/export-locale-bundle.mjs`
- Modify: `packages/core/src/i18n/__tests__/bundle.spec.ts`

**Interfaces:**
- Produces: `packages/core/dist/i18n/{zh-CN,en-US,th-TH}.json`（`{ ns: { key: value } }`）；根 `dist/i18n/resources.json` 新结构。

- [ ] **Step 1: 写失败测试**

`bundle.spec.ts` 增加：

```ts
it('getResources 的每个 locale 都含三个内置命名空间', () => {
  for (const lng of ['zh-CN', 'en-US', 'th-TH']) {
    const res = getResources(lng)
    expect(Object.keys(res).sort()).toEqual(['constants', 'core', 'propertyTips'])
  }
})
```

- [ ] **Step 2: 改造 `gen-locale-keys.mjs`**

在现有 TS 解析之外，追加 JSON 资源解析：

```js
import { readdirSync } from 'node:fs'
const LOCALES_DIR = resolve(HERE, '../src/i18n/locales')
const jsonKeys = (ns, locale) => {
  const file = resolve(LOCALES_DIR, `${ns}-${locale}.json`)
  const obj = JSON.parse(readFileSync(file, 'utf8'))[ns]
  return Object.keys(obj)
}
// 三语 parity：core（现有 TS 解析结果）+ constants + propertyTips 合并后比较
```

生成 `locale-keys.json` 时把三个命名空间的键合并排序。

- [ ] **Step 3: 新增 `gen-i18n-json.mjs`**

```js
// 构建后从 dist 读取 getResources，写出 dist/i18n/<locale>.json
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const mod = await import(pathToFileURL(resolve(ROOT, 'dist/i18n/index.js')).href)
const resources = mod.getResources()
mkdirSync(resolve(ROOT, 'dist/i18n'), { recursive: true })
for (const [locale, nss] of Object.entries(resources)) {
  writeFileSync(resolve(ROOT, `dist/i18n/${locale}.json`), JSON.stringify(nss, null, 2) + '\n', 'utf8')
}
```

`packages/core/package.json` 的 `build` 改为：`npm run i18n:keys && tsup && node scripts/gen-i18n-json.mjs && node scripts/copy-styles.mjs && node ../../scripts/inject-license-banner.mjs dist`。

- [ ] **Step 4: 改根 bundle 导出**

`scripts/export-locale-bundle.mjs`：读取 `packages/core/dist/i18n/*.json`、`marketplace/plugins/echarts/dist/i18n/*.json`，帮助段继续用现有 `parseHelpSection` 解析 `packages/canvas/src/shell/help-content/*`；输出：

```js
{ [locale]: { core, help, constants, propertyTips, echarts } }
```

`help` 保持旧嵌套结构；在脚本头注释写明「help 为静态内容，不参与运行时」。

- [ ] **Step 5: 验证**

Run: `npm run build -w @worm-print-platform/core && ls packages/core/dist/i18n`
Expected: 三个 JSON 文件。
Run: `npm run i18n:bundle`
Expected: 根 `dist/i18n/resources.json` 含新结构。脚本在找不到某插件 `dist/i18n` 时打印 warn 并跳过该插件（Task 5 完成后重跑一次即为完整输出，不得报错退出）。
Run: `npm test -w @worm-print-platform/core`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add packages/core/scripts packages/core/package.json scripts/export-locale-bundle.mjs packages/core/src/i18n/__tests__
git commit -m "build(core): 输出 dist/i18n 资源并更新 bundle 导出"
```

---

### Task 5: echarts 语言包产出与契约字段

**Files:**
- Create: `marketplace/plugins/echarts/src/i18n/{zh-CN,en-US,th-TH}.json`（由现有 TS 转换）
- Modify: `marketplace/plugins/echarts/src/ui.ts`（改 JSON import）
- Delete: `marketplace/plugins/echarts/src/i18n/{zh-CN,en-US,th-TH}.ts`
- Create: `marketplace/plugins/echarts/scripts/gen-i18n-dist.mjs`
- Modify: `marketplace/plugins/echarts/package.json`、`packages/echarts/package.json`
- Modify: `marketplace/plugins/echarts/scripts/sync-compat.mjs`
- Test: `marketplace/plugins/echarts/src/__tests__/i18n.test.ts`

**Interfaces:**
- Produces: `marketplace/plugins/echarts/dist/i18n/*.json`；两个包 `wormPrint.i18n = { dir: 'dist/i18n', base: 'zh-CN' }`。

- [ ] **Step 1: 转换脚本（一次性）**

在仓库根执行：

```bash
node --input-type=commonjs - <<'NODE'
const { readFileSync, writeFileSync } = require('node:fs')
const map = { 'zh-CN': 'echartsZhCN', 'en-US': 'echartsEnUS', 'th-TH': 'echartsThTH' }
for (const [locale, name] of Object.entries(map)) {
  const src = readFileSync(`marketplace/plugins/echarts/src/i18n/${locale}.ts`, 'utf8')
  const start = src.indexOf('{'); const end = src.lastIndexOf('}')
  const body = src.slice(start + 1, end)
  const re = /(?:'([^']+)'|"([^"]+)")\s*:\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/g
  const obj = {}
  for (const m of body.matchAll(re)) obj[m[1] ?? m[2]] = (m[3] ?? m[4]).replace(/\\(["'\\])/g, '$1')
  writeFileSync(`marketplace/plugins/echarts/src/i18n/${locale}.json`, JSON.stringify({ echarts: obj }, null, 2) + '\n')
}
NODE
rm marketplace/plugins/echarts/src/i18n/{zh-CN,en-US,th-TH}.ts
```

- [ ] **Step 2: 改 import 与构建**

`ui.ts`：

```ts
import zh from './i18n/zh-CN.json'
import en from './i18n/en-US.json'
import th from './i18n/th-TH.json'
// 使用 zh.echarts / en.echarts / th.echarts 作为 locales 值
```

新增 `scripts/gen-i18n-dist.mjs`：

```js
import { cpSync, mkdirSync } from 'node:fs'
mkdirSync('dist/i18n', { recursive: true })
cpSync('src/i18n', 'dist/i18n', { recursive: true })
```

`marketplace/plugins/echarts/package.json` 的 `build` 末尾追加 `&& node scripts/gen-i18n-dist.mjs`，并加：

```json
"wormPrint": { "id": "echarts", "i18n": { "dir": "dist/i18n", "base": "zh-CN" } }
```

（保留原有 `wormPrint` 其他字段，合并写入。）

`packages/echarts/package.json` 同步加同形 `wormPrint` 字段；`sync-compat.mjs` 在复制 dist 后：

```js
const next = { ...compatPkg, wormPrint: { ...compatPkg.wormPrint, ...pluginPkg.wormPrint } }
writeFileSync(join(compatDir, 'package.json'), JSON.stringify(next, null, 2) + '\n')
```

- [ ] **Step 3: 测试**

`i18n.test.ts` 增加：

```ts
import zh from '../i18n/zh-CN.json'
it('语言资源含 zh-CN 且键以 echarts. 开头', () => {
  expect(Object.keys(zh.echarts).length).toBeGreaterThan(100)
  for (const key of Object.keys(zh.echarts)) expect(key.startsWith('echarts.')).toBe(true)
})
```

- [ ] **Step 4: 验证**

Run: `npm run build -w @worm-print-platform/plugin-echarts && ls marketplace/plugins/echarts/dist/i18n`
Expected: 三个 JSON。
Run: `npm test -w @worm-print-platform/plugin-echarts && npm test -w @worm-print-platform/echarts`
Expected: PASS
Run: `node -e "const p=require('./packages/echarts/package.json');console.log(p.wormPrint.i18n)"`
Expected: `{ dir: 'dist/i18n', base: 'zh-CN' }`

- [ ] **Step 5: 提交**

```bash
git add marketplace/plugins/echarts packages/echarts
git commit -m "feat(echarts): 产出 dist/i18n 语言资源与 wormPrint.i18n 契约"
```

---

### Task 6: CLI 包骨架、资源发现与 template

**Files:**
- Create: `packages/i18n/package.json`
- Create: `packages/i18n/tsconfig.json`
- Create: `packages/i18n/tsup.config.ts`
- Create: `packages/i18n/src/{types,discover,template,cli}.ts`
- Test: `packages/i18n/src/__tests__/{discover,template}.spec.ts`

**Interfaces:**
- Produces: `discover(root?: string): LocalePackage[]`；`buildTemplate(pkgs: LocalePackage[]): Record<string, string>`；`run(argv: string[], deps?: { cwd?: string; out?: (line: string) => void }): number`。

```ts
// src/types.ts
export interface LocalePackage {
  /** 插件 id / core */
  id: string
  base: string
  /** locale → { 命名空间 → 扁平键值 } */
  locales: Map<string, Record<string, Record<string, string>>>
  /** 来源，用于告警 */
  origin: string
}
```

- [ ] **Step 1: 建包骨架**

`packages/i18n/package.json`：

```json
{
  "name": "@worm-print-platform/i18n",
  "version": "0.1.0",
  "type": "module",
  "description": "worm-print-platform 语言包工具：导出翻译骨架、校验与增量更新。",
  "license": "MIT",
  "publishConfig": { "access": "public" },
  "bin": { "worm-print-i18n": "./dist/cli.js" },
  "main": "./dist/cli.js",
  "files": ["dist"],
  "engines": { "node": ">=18" },
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "pretest": "npm run typecheck",
    "test": "vitest run"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "tsup": "^8.0.0",
    "typescript": "~5.9.3",
    "vitest": "^5.0.0"
  }
}
```

`tsconfig.json` 沿 `packages/skills` 同款（`target ES2022`、`module NodeNext`、`strict`、`include ["src"]`）；`tsup.config.ts`：

```ts
import { defineConfig } from 'tsup'
export default defineConfig({ entry: ['src/cli.ts'], format: ['esm'], target: 'node18', dts: true, clean: true, shims: true })
```

- [ ] **Step 2: 写失败测试（发现与排序）**

`src/__tests__/discover.spec.ts`：

```ts
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { discover } from '../discover.js'

function writeJson(path: string, value: unknown) {
  mkdirSync(join(path, '..'), { recursive: true })
  writeFileSync(path, JSON.stringify(value))
}

it('优先读统一目录，再补 node_modules，同 id 统一目录优先', () => {
  const root = mkdtempSync(join(tmpdir(), 'wpi18n-'))
  writeJson(join(root, '.worm-print/i18n/echarts/zh-CN.json'), { echarts: { 'echarts.a': '统一目录' } })
  writeJson(join(root, 'node_modules/@worm-print-platform/core/package.json'), {
    name: '@worm-print-platform/core',
    wormPrint: { id: 'core', i18n: { dir: 'dist/i18n', base: 'zh-CN' } },
  })
  writeJson(join(root, 'node_modules/@worm-print-platform/core/dist/i18n/zh-CN.json'), { core: { 'toolbar.save': '保存' } })
  const pkgs = discover(root)
  expect(pkgs.map(p => p.id).sort()).toEqual(['core', 'echarts'])
  expect(pkgs.find(p => p.id === 'echarts')!.locales.get('zh-CN')!.echarts['echarts.a']).toBe('统一目录')
})
```

`src/__tests__/template.spec.ts`：

```ts
import { expect, it } from 'vitest'
import { buildTemplate } from '../template.js'

it('按 core → constants → propertyTips → 插件排序', () => {
  const keys = Object.keys(buildTemplate([
    { id: 'echarts', base: 'zh-CN', origin: 'x', locales: new Map([['zh-CN', { echarts: { 'echarts.z': 'z' } }]]) },
    { id: 'core', base: 'zh-CN', origin: 'x', locales: new Map([['zh-CN', {
      core: { 'toolbar.save': '保存' }, constants: { 'constants.b': 'b' }, propertyTips: { 'propertyTips.a': 'a' },
    }]]) },
  ]))
  expect(keys).toEqual(['toolbar.save', 'constants.b', 'propertyTips.a', 'echarts.z'])
})
```

- [ ] **Step 3: 实现 `discover.ts`**

```ts
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { LocalePackage } from './types.js'

const readJson = (file: string) => JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>

function readLocales(dir: string): Map<string, Record<string, Record<string, string>>> {
  const out = new Map<string, Record<string, Record<string, string>>>()
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json')) continue
    out.set(name.slice(0, -5), readJson(join(dir, name)) as Record<string, Record<string, string>>)
  }
  return out
}

function fromPackage(dir: string, pkg: { wormPrint?: { id?: string; i18n?: { dir?: string; base?: string } } }): LocalePackage | null {
  const i18n = pkg.wormPrint?.i18n
  if (!i18n?.dir) return null
  return { id: pkg.wormPrint?.id ?? dir, base: i18n.base ?? 'zh-CN', locales: readLocales(join(dir, i18n.dir)), origin: dir }
}

export function discover(root = process.cwd()): LocalePackage[] {
  const merged = new Map<string, LocalePackage>()
  const unifiedRoot = join(root, '.worm-print/i18n')
  if (existsSync(unifiedRoot)) {
    for (const name of readdirSync(unifiedRoot)) {
      const dir = join(unifiedRoot, name)
      merged.set(name, { id: name, base: 'zh-CN', locales: readLocales(dir), origin: dir })
    }
  }
  const nm = join(root, 'node_modules')
  if (existsSync(nm)) {
    for (const name of readdirSync(nm)) {
      const dirs = name.startsWith('@') ? readdirSync(join(nm, name)).map(s => join(nm, name, s)) : [join(nm, name)]
      for (const dir of dirs) {
        const pkgFile = join(dir, 'package.json')
        if (!existsSync(pkgFile)) continue
        const pkg = readJson(pkgFile) as { name?: string; wormPrint?: { id?: string; i18n?: { dir?: string; base?: string } } }
        if (!pkg.wormPrint?.i18n) continue
        const id = pkg.wormPrint.id ?? pkg.name ?? dir
        if (merged.has(id)) continue // 统一目录 / 先发现的优先
        merged.set(id, fromPackage(dir, pkg)!)
      }
    }
  }
  return [...merged.values()]
}
```

- [ ] **Step 4: 实现 `template.ts` 与 `cli.ts`**

```ts
// template.ts
import type { LocalePackage } from './types.js'
const NS_ORDER = ['core', 'constants', 'propertyTips']

export function buildTemplate(pkgs: LocalePackage[], base = 'zh-CN'): Record<string, string> {
  const rows: Array<{ ns: string; id: string; key: string; value: string }> = []
  for (const pkg of pkgs) {
    const locales = pkg.locales.get(base)
    if (!locales) throw new Error(`缺少基准语言 ${base}：${pkg.id}（${pkg.origin}）`)
    for (const [ns, messages] of Object.entries(locales)) {
      for (const [key, value] of Object.entries(messages)) rows.push({ ns, id: pkg.id, key, value })
    }
  }
  const rank = (ns: string, id: string) => ns === 'core' ? 0 : ns === 'constants' ? 1 : ns === 'propertyTips' ? 2 : 3
  rows.sort((a, b) => rank(a.ns, a.id) - rank(b.ns, b.id)
    || (a.ns === b.ns && a.id !== b.id ? a.id.localeCompare(b.id) : 0)
    || a.key.localeCompare(b.key))
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}
```

`cli.ts` 的公共骨架：

```ts
import { pathToFileURL } from 'node:url'

export interface RunDeps { cwd?: string; out?: (line: string) => void }

export function run(argv: string[], deps: RunDeps = {}): number {
  const cwd = deps.cwd ?? process.cwd()
  const out = deps.out ?? ((line: string) => process.stdout.write(`${line}\n`))
  const [command, ...rest] = argv
  const outputFile = (() => { const i = rest.indexOf('-o'); return i >= 0 ? rest[i + 1] : undefined })()
  const dir = (() => { const i = rest.indexOf('--dir'); return i >= 0 ? rest[i + 1] : undefined })()
  if (command === 'template') {
    const template = buildTemplate(discover(dir ?? cwd))
    const text = `${JSON.stringify(template, null, 2)}\n`
    if (outputFile) writeFileSync(resolve(cwd, outputFile), text, 'utf8')
    else out(text.trimEnd())
    return 0
  }
  out(`未知命令：${command ?? '(空)'}`)
  return 2
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(run(process.argv.slice(2)))
}
```

后续 Task 7/8 在同一 `run()` 中追加 `validate`/`update` 分支。

- [ ] **Step 5: 验证**

Run: `npm install`（workspace 识别新包）→ `npm run build -w @worm-print-platform/i18n`
Expected: `packages/i18n/dist/cli.js` 生成。
Run: `npm test -w @worm-print-platform/i18n`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add packages/i18n
git commit -m "feat(i18n): 新增语言包 CLI 与骨架导出"
```

---

### Task 7: CLI validate

**Files:**
- Create: `packages/i18n/src/validate.ts`
- Modify: `packages/i18n/src/cli.ts`
- Test: `packages/i18n/src/__tests__/validate.spec.ts`

**Interfaces:**
- Produces: `validatePack(pack: unknown, base: Record<string, string>, opts?: { strict?: boolean }): Issue[]`；CLI `validate <file> [--strict]` 退出码 0/1/2。

```ts
export interface Issue { level: 'error' | 'warn'; key?: string; message: string }
const PLACEHOLDER = /\{([A-Za-z_][\w]*)\}/g
const placeholders = (s: string) => [...s.matchAll(PLACEHOLDER)].map(m => m[1]).sort()
```

- [ ] **Step 1: 写失败测试**

```ts
import { expect, it } from 'vitest'
import { validatePack } from '../validate.js'

const base = { 'toolbar.save': '保存', 'diagnostic.position': '位置 {pos}' }

it('合法包零错误', () => {
  expect(validatePack({ 'toolbar.save': 'Enregistrer', 'diagnostic.position': 'Position {pos}' }, base)).toEqual([])
})
it('缺键/空值/占位符/多余/嵌套/_meta', () => {
  const issues = validatePack({
    'diagnostic.position': 'Position', 'extra.key': 'x', 'empty.key': '', _meta: { x: 1 }, nested: { a: 'b' },
  }, base)
  expect(issues.some(i => i.level === 'error' && i.key === 'toolbar.save')).toBe(true)   // 缺键
  expect(issues.some(i => i.level === 'error' && i.key === 'empty.key')).toBe(true)       // 空值
  expect(issues.some(i => i.level === 'error' && i.key === 'diagnostic.position')).toBe(true) // 占位符
  expect(issues.some(i => i.level === 'warn' && i.key === 'extra.key')).toBe(true)        // 多余
  expect(issues.some(i => i.level === 'error' && i.key === '_meta')).toBe(true)
  expect(issues.some(i => i.level === 'error' && i.key === 'nested')).toBe(true)
})
```

- [ ] **Step 2: 实现**

```ts
export function validatePack(pack: unknown, base: Record<string, string>, opts: { strict?: boolean } = {}): Issue[] {
  const issues: Issue[] = []
  if (typeof pack !== 'object' || pack === null || Array.isArray(pack)) {
    return [{ level: 'error', message: '语言包必须是扁平 JSON 对象（键 → 字符串）' }]
  }
  const entries = Object.entries(pack as Record<string, unknown>)
  for (const [key, value] of entries) {
    if (key === '_meta') { issues.push({ level: 'error', key, message: '不允许 _meta，语言包必须是纯扁平键' }); continue }
    if (typeof value !== 'string') { issues.push({ level: 'error', key, message: '值必须是字符串（不支持嵌套对象）' }); continue }
    if (value.trim() === '') { issues.push({ level: 'error', key, message: '译文为空' }) }
    const expected = placeholders(base[key] ?? '')
    if (expected.length && placeholders(value).join() !== expected.join()) {
      issues.push({ level: 'error', key, message: `占位符不一致：期望 {${expected.join('},{')}}` })
    }
  }
  for (const key of Object.keys(base)) {
    if (!(key in (pack as Record<string, unknown>))) issues.push({ level: 'error', key, message: '缺少键' })
  }
  for (const [key] of entries) {
    if (key !== '_meta' && !(key in base)) issues.push({ level: opts.strict ? 'error' : 'warn', key, message: '多余键' })
  }
  return issues
}
```

- [ ] **Step 3: 接到 CLI**

`validate`：读文件 → `buildTemplate(discover(cwd))` 作为 base → `validatePack()`；逐条打印 `ERROR/WARN key: message`；`strict` 透传；有 error 返回 1，读文件失败返回 1，缺少参数返回 2。

- [ ] **Step 4: 验证**

Run: `npm test -w @worm-print-platform/i18n`
Expected: PASS
Run: `npm run build -w @worm-print-platform/i18n && node packages/i18n/dist/cli.js validate /tmp/none.json; echo $?`
Expected: 非 0 且提示文件不存在。

- [ ] **Step 5: 提交**

```bash
git add packages/i18n
git commit -m "feat(i18n): CLI validate 校验缺失/多余/空值/占位符"
```

---

### Task 8: CLI update

**Files:**
- Create: `packages/i18n/src/update.ts`
- Modify: `packages/i18n/src/cli.ts`
- Test: `packages/i18n/src/__tests__/update.spec.ts`

**Interfaces:**
- Produces: `updatePack(pack: Record<string, string>, base: Record<string, string>, opts?: { prune?: boolean }): { next: Record<string, string>; added: string[]; removed: string[] }`。

- [ ] **Step 1: 写失败测试**

```ts
import { expect, it } from 'vitest'
import { updatePack } from '../update.js'

const base = { 'a.one': '一', 'a.two': '二' }

it('补新键为空串、保留已有译文', () => {
  const r = updatePack({ 'a.one': 'Un' }, base)
  expect(r.next).toEqual({ 'a.one': 'Un', 'a.two': '' })
  expect(r.added).toEqual(['a.two'])
})
it('--prune 删除多余键', () => {
  const r = updatePack({ 'a.one': 'Un', 'old.key': 'x' }, base, { prune: true })
  expect(r.next).toEqual({ 'a.one': 'Un', 'a.two': '' })
  expect(r.removed).toEqual(['old.key'])
})
```

- [ ] **Step 2: 实现**

```ts
export function updatePack(pack: Record<string, string>, base: Record<string, string>, opts: { prune?: boolean } = {}) {
  const next: Record<string, string> = {}
  const added: string[] = []
  const removed: string[] = []
  for (const key of Object.keys(base)) {
    if (key in pack) next[key] = pack[key]
    else { next[key] = ''; added.push(key) }
  }
  for (const key of Object.keys(pack)) {
    if (!(key in base)) { if (opts.prune) removed.push(key); else next[key] = pack[key] }
  }
  return { next, added, removed }
}
```

CLI 写回时按 template 排序（复用 `buildTemplate` 的 key 顺序）：先 `Object.keys(buildTemplate(...))` 得到顺序，再按序取 `next` 的键。

- [ ] **Step 3: 验证**

Run: `npm test -w @worm-print-platform/i18n`
Expected: PASS
Run: 手工 e2e：临时目录放 `.worm-print/i18n/demo/zh-CN.json` → `template` 出骨架 → 填一条 → `update` → `validate` 应报未填空值。

- [ ] **Step 4: 提交**

```bash
git add packages/i18n
git commit -m "feat(i18n): CLI update 增量对齐骨架"
```

---

### Task 9: 市场 CLI 同步语言资源

**Files:**
- Modify: `packages/marketplace/src/types.ts`
- Modify: `packages/marketplace/src/install.ts`
- Test: `packages/marketplace/src/install.test.ts`

**Interfaces:**
- Produces: `ManifestEntry.i18n?: { base: string; locales: string[] }`；安装后 `.worm-print/i18n/<id>/<locale>.json` 存在。

- [ ] **Step 1: 写失败测试**

`install.test.ts` 增加（复用现有 fixture 目录，补 `package.json` 与 `dist/i18n/zh-CN.json`）：

```ts
it('安装同步语言资源到 .worm-print/i18n/<id>', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'mp-i18n-'))
  const repo = makeLocalRepoWithI18n() // 直接写 package.json / plugin.json / dist/i18n/zh-CN.json
  await installPlugin({ name: 'echarts', source: 'local', repo, cwd, force: true })
  expect(existsSync(join(cwd, '.worm-print/i18n/echarts/zh-CN.json'))).toBe(true)
  expect(readManifest('.worm-print/plugins', cwd).plugins.echarts.i18n?.locales).toEqual(['zh-CN'])
})
it('卸载清理语言资源目录', async () => {
  // 安装后 removePlugin，断言 .worm-print/i18n/echarts 不存在
})
```

- [ ] **Step 2: 实现同步**

`install.ts` 顶部补 `readdirSync, readFileSync, renameSync` 导入；新增：

```ts
function syncLocaleResources(sourceDir: string, pluginTarget: string, id: string) {
  const pkgFile = join(sourceDir, 'package.json')
  if (!existsSync(pkgFile)) return undefined
  const i18n = (JSON.parse(readFileSync(pkgFile, 'utf8')) as { wormPrint?: { i18n?: { dir?: string; base?: string } } }).wormPrint?.i18n
  if (!i18n?.dir) return undefined
  const from = join(sourceDir, i18n.dir)
  if (!existsSync(from)) throw new MarketError('INVALID_PLUGIN', `声明了 wormPrint.i18n 但目录不存在：${i18n.dir}`)
  const root = dirname(pluginTarget) // .worm-print/plugins → .worm-print
  const to = join(dirname(root), 'i18n', id)
  const tmp = `${to}.tmp`
  rmSync(tmp, { recursive: true, force: true })
  cpSync(from, tmp, { recursive: true })
  rmSync(to, { recursive: true, force: true })
  renameSync(tmp, to)
  const locales = readdirSync(from).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5))
  return { base: i18n.base ?? 'zh-CN', locales }
}
```

在 `copyFiles()` 后调用 `const i18n = syncLocaleResources(fetched.sourceDir, target, id)`，并把它写进 `upsertManifestEntry` 的条目。`removePlugin()` 中在 `rmSync` 插件目录后追加：

```ts
rmSync(join(dirname(absPath(dir, cwd)), 'i18n', id), { recursive: true, force: true })
```

`types.ts` 的 `ManifestEntry` 加：

```ts
i18n?: { base: string; locales: string[] }
```

- [ ] **Step 3: 验证**

Run: `npm test -w @worm-print-platform/marketplace`
Expected: PASS（含新增用例）。

- [ ] **Step 4: 提交**

```bash
git add packages/marketplace
git commit -m "feat(marketplace): 安装时同步插件语言资源"
```

---

### Task 10: render 加载语言包文件

**Files:**
- Create: `services/render/src/locale-pack.ts`
- Modify: `services/render/src/server.ts`
- Test: `services/render/src/i18n.test.ts`

**Interfaces:**
- Produces: `loadLocalePack(filePath: string, locale: string): boolean`（成功 true，失败 warn + false）；环境变量 `WORM_PRINT_LOCALE_FILE`。加载器放在独立文件，避免单测 import `server.ts` 触发 `app.listen`。

- [ ] **Step 1: 写失败测试**

`i18n.test.ts` 增加（顶部 `import { loadLocalePack } from './locale-pack.js'`）：

```ts
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

it('加载合法语言包后诊断变法语', () => {
  const dir = mkdtempSync(join(tmpdir(), 'render-i18n-'))
  const file = join(dir, 'fr-FR.json')
  writeFileSync(file, JSON.stringify({ 'service.printData.emptyArray': 'Les données sont vides' }))
  setLocale('fr-FR')
  expect(loadLocalePack(file, 'fr-FR')).toBe(true)
  expect(() => normalizePrintData([])).toThrow('Les données sont vides')
})
it('非法文件 warn 且返回 false', () => {
  expect(loadLocalePack('/definitely/missing.json', 'fr-FR')).toBe(false)
})
```

- [ ] **Step 2: 实现**

```ts
// locale-pack.ts
import { readFileSync } from 'node:fs'
import { registerLocale } from '@worm-print-platform/core/i18n'

export function loadLocalePack(filePath: string, locale: string): boolean {
  try {
    const raw: unknown = JSON.parse(readFileSync(filePath, 'utf8'))
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new Error('语言包必须是扁平对象')
    const pack: Record<string, string> = {}
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value !== 'string') throw new Error(`键 ${key} 的值必须是字符串`)
      pack[key] = value
    }
    registerLocale(locale, pack)
    console.log(`[i18n] 已加载语言包 ${filePath} (${locale})`)
    return true
  } catch (err) {
    console.warn(`[i18n] 语言包加载失败: ${filePath}: ${(err as Error).message}`)
    return false
  }
}
```

`server.ts` 顶部：

```ts
import { normalizeLocale, registerLocale, setLocale, t } from '@worm-print-platform/core/i18n'
import { loadLocalePack } from './locale-pack.js'

const LOCALE = normalizeLocale(process.env.WORM_PRINT_LOCALE ?? 'zh-CN')
setLocale(LOCALE)
const LOCALE_FILE = process.env.WORM_PRINT_LOCALE_FILE
if (LOCALE_FILE) loadLocalePack(LOCALE_FILE, LOCALE)
```

（替换原第 11–12 行的 setLocale 与注释。）

- [ ] **Step 3: 验证**

Run: `npm test -w @worm-print-platform/render -- --run src/i18n.test.ts`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add services/render
git commit -m "feat(render): 支持 WORM_PRINT_LOCALE_FILE 加载语言包"
```

---

### Task 11: client 配置与语言包加载

**Files:**
- Modify: `clients/client/src/main/config.ts`
- Create: `clients/client/src/main/locale-pack.ts`
- Create: `clients/client/scripts/copy-locales.mjs`
- Modify: `clients/client/src/main/index.ts`
- Modify: `clients/client/package.json`、根 `package.json`（pack 脚本）
- Test: `clients/client/src/main/config.test.ts`、`clients/client/src/main/locale-pack.test.ts`

**Interfaces:**
- Produces: `AppConfig.locale: string`、`AppConfig.localePack: string`；`resolveLocalePackPath(opts): string | null`；`loadLocalePack(filePath: string, locale: string): string | null`（返回错误信息）。

- [ ] **Step 1: 写失败测试**

`config.test.ts`：

```ts
it('locale/localePack 缺省为空串，非法类型回落默认', () => {
  expect(DEFAULT_CONFIG.locale).toBe('')
  expect(DEFAULT_CONFIG.localePack).toBe('')
  const cfg = parseConfig({ locale: 'fr-FR', localePack: ' packs/fr-FR.json ' })
  expect(cfg.locale).toBe('fr-FR')
  expect(cfg.localePack).toBe('packs/fr-FR.json')
  expect(parseConfig({ locale: 1, localePack: {} }).locale).toBe('')
})
```

`locale-pack.test.ts`：

```ts
it('显式绝对路径优先，其次 app 内置 out/locales，最后 null', () => {
  expect(resolveLocalePackPath({ locale: 'fr-FR', localePack: '/abs/fr.json', userDataDir: '/u', appDir: '/a' })).toBe('/abs/fr.json')
  expect(resolveLocalePackPath({ locale: 'fr-FR', localePack: 'sub/fr.json', userDataDir: '/u', appDir: '/a' })).toBe('/u/sub/fr.json')
  expect(resolveLocalePackPath({ locale: 'fr-FR', localePack: '', userDataDir: '/u', appDir: '/a' })).toBe(null)
})
it('合法文件返回 null，非法返回错误信息', () => {
  const dir = mkdtempSync(join(tmpdir(), 'client-i18n-'))
  const file = join(dir, 'fr-FR.json'); writeFileSync(file, JSON.stringify({ 'toolbar.save': 'Enregistrer' }))
  expect(loadLocalePack(file, 'fr-FR')).toBe(null)
  writeFileSync(file, '{"a":1}'); expect(loadLocalePack(file, 'fr-FR')).not.toBe(null)
})
```

- [ ] **Step 2: 扩展配置**

`config.ts`：`AppConfig` 加 `locale: string`、`localePack: string`；`DEFAULT_CONFIG` 各 `''`；`parseConfig` 返回：

```ts
locale: typeof src.locale === 'string' ? src.locale.trim() : '',
localePack: typeof src.localePack === 'string' ? src.localePack.trim() : '',
```

- [ ] **Step 3: 实现加载器**

```ts
// locale-pack.ts
import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { registerLocale } from '@worm-print-platform/core/i18n'

export function resolveLocalePackPath(opts: { locale: string; localePack: string; userDataDir: string; appDir: string }): string | null {
  if (opts.localePack) return isAbsolute(opts.localePack) ? opts.localePack : join(opts.userDataDir, opts.localePack)
  const bundled = join(opts.appDir, 'out', 'locales', `${opts.locale}.json`)
  return existsSync(bundled) ? bundled : null
}

export function loadLocalePack(filePath: string, locale: string): string | null {
  try {
    const raw: unknown = JSON.parse(readFileSync(filePath, 'utf8'))
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new Error('语言包必须是扁平对象')
    const pack: Record<string, string> = {}
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value !== 'string') throw new Error(`键 ${key} 的值必须是字符串`)
      pack[key] = value
    }
    registerLocale(locale, pack)
    return null
  } catch (err) {
    return `[i18n] 语言包加载失败: ${filePath}: ${(err as Error).message}`
  }
}
```

- [ ] **Step 4: 改启动顺序**

`index.ts`：删除文件顶部的 `setLocale(normalizeLocale(app.getLocale()))`；在 `const logger = new Logger(...)` 之后、打印引擎初始化之前插入：

```ts
const locale = normalizeLocale(configStore.current.locale || app.getLocale())
setLocale(locale)
const packPath = resolveLocalePackPath({
  locale, localePack: configStore.current.localePack,
  userDataDir: userData, appDir: app.getAppPath(),
})
if (packPath) {
  const error = loadLocalePack(packPath, locale)
  if (error) logger.warn(error)
} else if (configStore.current.locale || configStore.current.localePack) {
  logger.warn(`[i18n] 未找到语言包：locale=${locale} localePack=${configStore.current.localePack || '(空)'}`)
}
```

`app.getAppPath()` 在打包后是 asar 根，`out/locales` 位于其下。

- [ ] **Step 5: 打包复制脚本**

`clients/client/scripts/copy-locales.mjs`：

```js
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(import.meta.dirname, '../../..')
const src = resolve(repoRoot, 'locales')
const dest = resolve(import.meta.dirname, '../out/locales')
if (!existsSync(src)) { console.log('[copy-locales] 未发现 locales/，跳过'); process.exit(0) }
mkdirSync(dest, { recursive: true })
cpSync(src, dest, { recursive: true, filter: f => f.endsWith('.json') })
console.log('[copy-locales] 已复制 locales/ 到 out/locales')
```

`clients/client/package.json` 的 `pack:dir` 改为 `"electron-vite build && node scripts/copy-locales.mjs && electron-builder --dir"`；根 `package.json` 的 `pack:client:prepare` 末尾追加 `&& node clients/client/scripts/copy-locales.mjs`（保证 `pack:client`/`pack:client:mac`/`pack:client:win` 都执行）。

- [ ] **Step 6: 验证**

Run: `npm test -w @worm-print-platform/client`
Expected: PASS
Run: `npm run build -w @worm-print-platform/client && node clients/client/scripts/copy-locales.mjs`
Expected: 无 locales/ 时打印跳过；有 locales/ 时 `clients/client/out/locales/*.json` 存在。

- [ ] **Step 7: 提交**

```bash
git add clients/client package.json
git commit -m "feat(client): config 支持 locale/localePack 并打包 locales 目录"
```

---

### Task 12: 文档、根脚本与验收

**Files:**
- Modify: `docs/guide/06-i18n.md`
- Modify: `docs/guide/07-plugin-install.md`
- Modify: `docs/guide/08-plugin-dev.md`
- Create: `packages/i18n/README.md`
- Modify: `package.json`（build/test/publish:npm 加新包）
- Modify: `AGENTS.md`（发布包清单、目录说明）
- Modify: `packages/core/src/i18n/__tests__/docs.spec.ts`（关键词）

**Interfaces:**
- Produces: 文档与 `docs.spec.ts` 一致；根脚本包含 `@worm-print-platform/i18n`。

- [ ] **Step 1: 更新 docs.spec 关键词**

```ts
for (const token of [
  'registerLocale', 'mergeLocale', 'PluginLocaleMessages', 'lang', 'messages', 'i18nId',
  'documentLang', 'locale-keys.json', 'worm-print-i18n', 'wormPrint.i18n',
  'WORM_PRINT_LOCALE_FILE', 'localePack', 'constants.borderStyle', 'propertyTips',
]) {
  expect(doc).toContain(token)
}
```

- [ ] **Step 2: 重写 06-i18n.md**

保留原有章节结构，按以下口径改写：3.2.3 API 增 `createTranslator(locale, messages?)` 并标注 `el.messages` 实例隔离；3.3 语言包组织改为 `dist/i18n/*.json` + JSON 资源源；3.6 改为「常量与属性说明已迁入 i18next」；3.7 标注帮助弹窗正文不做自定义语言；3.8 bundle 新结构；3.9 拆成「内置语言开发 SOP」与「外挂语言包」两条路径；新增小节：`worm-print-i18n template/validate/update` 工作流、市场安装同步 `.worm-print/i18n`、三端加载（render env / client config + locales / 浏览器两种配方）、多实例语义与已知限制。

- [ ] **Step 3: 更新 07 / 08 与 README**

07：安装后语言资源同步、升级/重装要求。08：插件必须提供 `zh-CN`、`wormPrint.i18n` 声明、`dist/i18n/<locale>.json` 结构、`i18nId` 一致性。README：命令、发现顺序、退出码、生成/校验/更新工作流。

- [ ] **Step 4: 根脚本与 AGENTS.md**

根 `package.json`：`build` 在 core 之后加 `npm run build -w @worm-print-platform/i18n`；`test` 加 `npm run test -w @worm-print-platform/i18n`；`publish:npm` 加该包（发版时生效，脚本本次只补位）。`AGENTS.md` 发布包清单加第 8 个包，目录说明加 `packages/i18n`。

- [ ] **Step 5: 全量验收**

Run: `npm run verify:i18n:full`
Expected: build + 全量 test + bundle + 验证脚本全部通过。
Run: `npm run i18n:check -w @worm-print-platform/core`
Expected: 退出码 0。

- [ ] **Step 6: 提交**

```bash
git add docs packages/i18n/README.md package.json AGENTS.md packages/core/src/i18n/__tests__
git commit -m "docs(i18n): 补充外挂语言包工作流与三端加载说明"
```

---

### Task 13: 测试夹具与一键验证脚本

**Files:**
- Create: `fixtures/i18n/fr-FR.json`
- Create: `scripts/verify-i18n.mjs`
- Modify: `package.json`（`verify:i18n` / `verify:i18n:full`）
- Test: 运行脚本本身

**Interfaces:**
- Produces: `npm run verify:i18n`（假定已 build）、`npm run verify:i18n:full`（build + test + 校验），失败退出码 1，逐项打印 ✓/✗。

- [ ] **Step 1: 写夹具**

`fixtures/i18n/fr-FR.json`（覆盖 core / constants / propertyTips / 插件四类，并带一个占位符）：

```json
{
  "toolbar.save": "Enregistrer",
  "diagnostic.position": "Position {pos}",
  "constants.borderStyle.solid": "Trait plein",
  "propertyTips.ap-img-fit": "Ajustement de l'image dans la zone",
  "echarts.panel.chart": "Graphique"
}
```

- [ ] **Step 2: 写验证脚本**

`scripts/verify-i18n.mjs`：

```js
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const cli = join(root, 'packages/i18n/dist/cli.js')
const failures = []

const check = (name, fn) => {
  try { fn(); console.log(`✓ ${name}`) }
  catch (err) { console.error(`✗ ${name}: ${err.message}`); failures.push(name) }
}
const runCli = (args) => execFileSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' })
const expectExit = (args, code) => {
  try { runCli(args) } catch (err) { if (err.status === code) return }
  throw new Error(`期望退出码 ${code}：${args.join(' ')}`)
}

check('构建产物齐全', () => {
  for (const file of [
    'packages/core/dist/i18n/zh-CN.json',
    'packages/core/dist/i18n/en-US.json',
    'packages/core/dist/i18n/th-TH.json',
    'marketplace/plugins/echarts/dist/i18n/zh-CN.json',
    'packages/echarts/dist/i18n/zh-CN.json',
    'dist/i18n/resources.json',
  ]) if (!existsSync(join(root, file))) throw new Error(`缺少 ${file}`)
})

const dir = mkdtempSync(join(tmpdir(), 'verify-i18n-'))
const templateFile = join(dir, 'template.json')
runCli(['template', '-o', templateFile])
const template = JSON.parse(readFileSync(templateFile, 'utf8'))
const fixture = JSON.parse(readFileSync(join(root, 'fixtures/i18n/fr-FR.json'), 'utf8'))
const pack = { ...template, ...fixture }
const packFile = join(dir, 'fr-FR.json')
writeFileSync(packFile, JSON.stringify(pack, null, 2) + '\n')

check('template 覆盖四类键', () => {
  for (const key of Object.keys(fixture)) if (!(key in template)) throw new Error(`template 缺少 ${key}`)
})
check('合法包 validate 通过', () => { runCli(['validate', packFile, '--strict']) })
check('缺键被拦截', () => {
  const bad = { ...pack }; delete bad['toolbar.save']
  writeFileSync(join(dir, 'missing.json'), JSON.stringify(bad)); expectExit(['validate', join(dir, 'missing.json')], 1)
})
check('多余键 --strict 被拦截', () => {
  const bad = { ...pack, 'extra.key': 'x' }
  writeFileSync(join(dir, 'extra.json'), JSON.stringify(bad)); expectExit(['validate', '--strict', join(dir, 'extra.json')], 1)
})
check('空值被拦截', () => {
  const bad = { ...pack, 'toolbar.save': '' }
  writeFileSync(join(dir, 'empty.json'), JSON.stringify(bad)); expectExit(['validate', join(dir, 'empty.json')], 1)
})
check('占位符丢失被拦截', () => {
  const bad = { ...pack, 'diagnostic.position': 'Position' }
  writeFileSync(join(dir, 'placeholder.json'), JSON.stringify(bad)); expectExit(['validate', join(dir, 'placeholder.json')], 1)
})
check('嵌套/_meta 被拦截', () => {
  const bad = { ...pack, nested: { a: 'b' } }
  writeFileSync(join(dir, 'nested.json'), JSON.stringify(bad)); expectExit(['validate', join(dir, 'nested.json')], 1)
  const meta = { ...pack, _meta: { x: 1 } }
  writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta)); expectExit(['validate', join(dir, 'meta.json')], 1)
})
check('bundle 结构含五个命名空间', () => {
  const bundle = JSON.parse(readFileSync(join(root, 'dist/i18n/resources.json'), 'utf8'))
  for (const ns of ['core', 'help', 'constants', 'propertyTips', 'echarts']) {
    if (!bundle['zh-CN']?.[ns]) throw new Error(`resources.json 缺少 zh-CN.${ns}`)
  }
})

const suites = [
  ['@worm-print-platform/core', 'src/i18n/__tests__/namespaces.spec.ts'],
  ['@worm-print-platform/core', 'src/i18n/__tests__/engine.spec.ts'],
  ['@worm-print-platform/canvas', 'src/shell/__tests__/i18n-shell.spec.ts'],
  ['@worm-print-platform/canvas', 'src/__tests__/messages-isolation.spec.ts'],
  ['@worm-print-platform/render', 'src/i18n.test.ts'],
  ['@worm-print-platform/client', 'src/main/locale-pack.test.ts'],
  ['@worm-print-platform/marketplace', 'src/install.test.ts'],
  ['@worm-print-platform/i18n', ''],
]
for (const [pkg, file] of suites) {
  check(`${pkg} ${file || '全部'}`, () => {
    execFileSync('npm', ['test', '-w', pkg, '--', '--run', ...(file ? [file] : [])], { cwd: root, stdio: 'inherit' })
  })
}

if (failures.length) { console.error(`\n验证失败：${failures.length} 项`); process.exit(1) }
console.log('\n语言包验证全部通过')
```

- [ ] **Step 3: 接入 npm 脚本**

根 `package.json`：

```json
"verify:i18n": "node scripts/verify-i18n.mjs",
"verify:i18n:full": "npm run build && npm test && npm run i18n:bundle && node scripts/verify-i18n.mjs"
```

- [ ] **Step 4: 运行**

Run: `npm run verify:i18n:full`
Expected: 全部 ✓，退出码 0。

- [ ] **Step 5: 提交**

```bash
git add fixtures scripts/verify-i18n.mjs package.json
git commit -m "test(i18n): 新增语言包夹具与一键验证脚本"
```

---

## 测试验证方案

### 分层

| 层 | 内容 | 位置 / 命令 |
|---|---|---|
| L1 单元 | 命名空间、scoped translator、CLI 三个子命令、常量/属性说明取词、help 回退、messages 隔离、marketplace 同步、render/client 加载器 | 各包 `vitest`，文件见各 Task |
| L2 构建/契约 | `dist/i18n` 产物存在、`i18n:check` 三语 parity、bundle 五命名空间结构 | `npm run build`、`npm run i18n:check -w @worm-print-platform/core`、`npm run i18n:bundle` |
| L3 端到端（进程内） | 浏览器 happy-dom 属性台法语 + 帮助正文中文；render 诊断法语 + 非法文件降级；client config/内置 locales 两条路径 | Task 2/3/10/11 的测试文件 |
| L4 打包/人工 | `electron-builder --dir` 后 `out/locales` 存在；Docker render 挂载语言包；demo 手动切语言（可选） | `npm run pack:client:dir`、人工 |

### 回归矩阵

| 场景 | 命令 / 用例 | 期望 |
|---|---|---|
| 内置三语不回归 | `npm run i18n:check -w @worm-print-platform/core` | 退出码 0 |
| 帮助仍中文 | `getHelpSections('fr-FR')` 断言 | 正文含中文 |
| 多实例隔离 | `messages-isolation.spec.ts` | 全局 t 不变；两个 translator 各自命中 |
| 空串回退 | `createTranslator('fr-FR', {'toolbar.save':''})` | 返回全局 zh-CN 文案 |
| 旧市场安装 | `.worm-print/plugins.json` 无 i18n 条目 | CLI 输出重装提示，不阻断 |
| 插件缺 zh-CN | 临时包声明 en-US only | template 报错并列出该包 |
| 客户端无 locales/ | `copy-locales.mjs` | 打印跳过，退出 0 |
| bundle 破坏式变化 | `verify-i18n.mjs` 五命名空间断言 | 通过 |
| 打印文档语言不受影响 | 全量 `npm test`（render parity） | 通过 |

### 验收证据（DoD）

1. `npm run verify:i18n:full` 全绿（含 build + 全量 test + bundle + 脚本校验）。
2. `fixtures/i18n/fr-FR.json` 走完 template → 合并 → validate --strict 流程。
3. 三端冒烟测试文件在 CI 中各有 1 条以上断言。
4. 手工项（打包/ Docker）在 PR 描述里贴命令与输出摘要；无则为未完成，不得宣称「三端完成」。
