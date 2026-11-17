# @worm-print-platform/canvas

> **设计器权威实现**：Vue 3 / Vue 2.7 / React / jQuery / 无框架宿主统一消费本包（宿主示例见仓库 `demos/`）。
> 样式、图标与主题令牌的单一来源在 `core/src/styles`，本包从共享源派生；
> 元素能力位（core）与元素定义（本包）走统一注册表，内置 11 类元素与第三方插件同权。
> 宿主接入契约见 [「宿主契约」](#宿主契约) 与 `src/host-contract.ts`；Vue 3 宿主可用 `/vue3` 兼容门面沿用原组件写法。

打印模板可视化设计器的 **通用宿主适配形态**：任意框架、或完全没有框架的宿主都能直接接入，
实现为零框架原生 Custom Element + Shadow DOM，**不依赖 Vue / React 等任何框架运行时**，
作为设计器的权威实现，同时向 Vue 3、Vue 2、React、jQuery 及任意无框架宿主提供同一套能力。

- 设计器能力与逐项验收状态见 [PARITY.md](./PARITY.md)
- 样式与图标从 **`core/src/styles` 共享源**派生（`gen-styles.mjs` 剥 `[data-v-*]` 后补主题令牌、
  `gen-icons.mjs` 读共享 `icon-manifest.json`）；`gen-styles.mjs --check` 做漂移检测
- 运行时体积：`dist/index.js` 368.28 kB（gzip 106.68 kB），零框架依赖
- 浏览器直挂形态：`dist/canvas.js`（UMD，core 与码制库已内联）+ `dist/canvas.css`，见下节

## 安装

```bash
npm i @worm-print-platform/canvas @worm-print-platform/core
```

`canvas` 与主线同号发布正式版，安装直接取 `latest`（当前主线 `1.5.1`），不需要 `@next`；`core` 装同版本即可，出纸链路也要直接用它。本包是设计器的**权威实现**、后续维护迭代的稳定主版本，四个宿主示例工程均已接入；`/vue3` 门面为 Vue 3 宿主提供组件写法（vue 为可选 peer）。注意 `plugin-kit` 是本包的运行时依赖，1.5.x 起各包同号同批发版，安装时不要只锁 `core` + `canvas` 两个版本号。

本页包含三种 NPM 宿主的最小接入示例：[Vue 3](#vue-3) · [Vue 2.7](#vue-27) · [React 18](#react-18)；无打包器宿主见下文「浏览器直挂」。

四种宿主形态各自的依赖与插件（本包零框架运行时，宿主框架按需装）：

| 宿主 | 安装 | 框架插件 |
|---|---|---|
| Vue 3 | `npm i @worm-print-platform/canvas @worm-print-platform/core vue` | `@vitejs/plugin-vue`，须配 `isCustomElement` |
| Vue 2.7 | `npm i @worm-print-platform/canvas @worm-print-platform/core vue@2.7` | `@vitejs/plugin-vue2` |
| React 18 | `npm i @worm-print-platform/canvas @worm-print-platform/core react react-dom` | `@vitejs/plugin-react`，无需自定义元素配置 |
| jQuery / 无打包器 | 取本包 `dist/canvas.js` + `dist/canvas.css` 直挂 | 无，见下节 |

## 浏览器直挂（jQuery / 无打包器宿主）

`vite.bundle.config.ts` 额外产出两个文件，子路径 `@worm-print-platform/canvas/browser` 指向它们：

- `dist/canvas.js`（499.07 kB / gzip 154.83 kB）：UMD，把 `@worm-print-platform/core` 与条形码、二维码库
  全部内联，并挂出全局 `window.WormPrintCanvas`。除了本包 `index` 的那套 API
  （`registerAll` / `createDefaultTemplate` / `DesignerStore` / `PrintDesignerElement`），
  还一并挂出出纸要用的 `renderHtmlPages` / `browserCodeRenderer` / `PrintClient` / `WormPrintError`，
  以及宿主自绘模板缩略图所需的纸张几何工具 `getPaperDimensions` / `isContinuousPaperSize` / `getByPath`
  —— 直挂宿主拿不到裸包名 `@worm-print-platform/core`，没有这些入口就无法在同一个 `<script>` 里
  完成「浏览器渲染 → 打印 / 静默打印」
- `dist/canvas.css`：即 `src/styles/designer.css`（由 `gen-styles.mjs` 从 core 共享源派生，含 `:host` 块级基线）。
  Shadow DOM 形态用不到它——样式由组件内联注入；只有把设计器渲染进 **light DOM** 时才需要引它，
  公开子路径为 `@worm-print-platform/canvas/style.css`（打包器 `import '@worm-print-platform/canvas/style.css'`，
  无打包器则复制成文件后 `<link>`），不要深路径引 `dist/`

```html
<link rel="stylesheet" href="/vendor/worm-print-canvas.css" />
<script src="/vendor/worm-print-canvas.js"></script>
<script>
  WormPrintCanvas.registerAll()
  const el = document.querySelector('print-designer')
  el.fields = fields                 // 数组/对象只能赋 property
  el.template = templateJson
  el.uploadImage = file => uploadToServer(file)
  el.addEventListener('save', e => persist(e.detail))
  const out = await WormPrintCanvas.renderHtmlPages(
    JSON.parse(el.getTemplateJson()), data, location.origin, WormPrintCanvas.browserCodeRenderer)
</script>
```

两个硬约束：自定义元素默认 `display:inline`，宿主必须给它块级宽高，否则设计器整体塌陷；
`fields` 没有 getter，读回要看 `el.store.fields`。

完整可运行的直挂宿主示例见 `demos/apps/jquery`（含 `sync-assets.mjs` 如何从包 dist 取这两个文件、
以及 `/render-api` 透传的 40 行静态服务器）；Vue 3 / Vue 2 / React 三种 NPM 接入形态见下文
「在 Vue 3 / Vue 2 / React 中使用」，可运行工程在 `demos/apps/vue3`、`demos/apps/vue2`、`demos/apps/react`。

## 使用

```js
import { registerAll } from '@worm-print-platform/canvas'
registerAll()   // 注册 <print-designer>，按需调用，不自动污染全局
```

```html
<print-designer id="d" style="height:100%"></print-designer>
```

```js
const d = document.getElementById('d')
d.fields = [{ fieldKey: 'orderNo', fieldLabel: '单号' }]   // 也接受 JSON 字符串
d.template = templateJson
d.addEventListener('save', e => save(e.detail))            // e.detail 为模板 JSON
d.addEventListener('preview', e => preview(e.detail))
d.getTemplateJson()
d.validateTemplate()      // 拼版/多页配置校验，宿主旁路导出前调用
d.loadTemplate(json)
d.save()
```

出纸链路不需要设计器，直接走 `@worm-print-platform/core`（浏览器渲染 / print-render 服务端 /
桌面静默打印），三条链路与 `/vue3` 门面宿主完全一致。

## 宿主契约

`<print-designer>` 的接入面是**版本化**的，定义在 `src/host-contract.ts`，宿主不必再从散文里抄：

```ts
import {
  PRINT_DESIGNER_CONTRACT_VERSION, getHostContract,
  PRINT_DESIGNER_PARTS, PRINT_DESIGNER_THEME_TOKENS,
} from '@worm-print-platform/canvas'
import type { PrintDesignerEventMap, PrintDesignerCustomEvent } from '@worm-print-platform/canvas'

// 运行时自检（自定义元素的静态属性与实例方法都能读）
PrintDesignerElement.contractVersion === PRINT_DESIGNER_CONTRACT_VERSION
el.getHostContract() === getHostContract()

// 事件 detail 有类型：不要把 dblclick-element 的 detail 当 JSON 解析
el.addEventListener('save', (e) => {
  const ev = e as PrintDesignerCustomEvent<'save'>   // ev.detail: string
})
```

| 面 | 内容 |
|---|---|
| attribute | `template` · `fields` · `name` · `fonts` · `design-data`（另有 `is-edit` / `show-help` 两个布尔开关） |
| property | `template` · `fields` · `fonts` · `designData` · `isEdit` · `showHelp` · `uploadImage` · `uploadDesignBackground` |
| 方法 | `getTemplateJson()` · `loadTemplate()` · `save()` · `validateTemplate()` · `getGeometryWarnings()` |
| 事件（`bubbles + composed`） | `save` / `preview` → 模板 JSON 字符串；`help` → 无载荷；`dblclick-element` → 元素 id 字符串；`dblclick-cell` → `{ elementId, r, c, cellId? }` |

`getTemplateJson()` 在自定义元素上返回**字符串**（`/vue3` 门面转回对象）；它绕过拼版校验，
宿主旁路导出前要先调 `validateTemplate()`。事件全部 `bubbles: true, composed: true`，可穿透 Shadow DOM。

**定制外观**：外壳 8 个 `::part` 挂钩（`container` / `toolbar` / `format-bar` / `left-panel` /
`canvas-area` / `property-panel` / `status-bar` / `page-tabs`）允许有限定制：

```css
print-designer::part(toolbar) { border-bottom-width: 2px }
print-designer { --pd-accent: #0a7d4b }   /* 主题令牌，完整清单见 core/styles/theme.css */
```

主题令牌有 52 个 `--pd-*`，权威定义在 `@worm-print-platform/core/styles/theme.css`；不要写死颜色到
Shadow DOM 内部选择器。契约版本遵守语义化：删/改 attribute、方法或事件形状升 MAJOR，
新增可选项升 MINOR；`src/__tests__/host-contract.spec.ts` 会把声明面与运行时逐项对拍，漂移即红。

**扩展元素**：内置 11 类与第三方插件走同一张注册表，见下节与「统一元素注册表」。

## 统一元素注册表

内置元素与插件**同权**：`registerElementDefinition()` 可覆盖内置的素材卡标签/图标/属性分组/双击字段，
`registerElementRenderer()` 可替换画布内容渲染；注销句柄只撤销自己那一版，内置类型会自动回落基线。
core 的 `registerElementCapabilities()` 则统一六处类型白名单（页眉页脚放行、旋转、文字溢出、
元素级边框、绑定声明、出厂默认值），插件在 `defineElementPlugin({ kinds: [{ capabilities }] })` 里
声明即自动生效：

```ts
import { registerElementDefinition, registerElementRenderer } from '@worm-print-platform/canvas'

const release = registerElementDefinition({
  type: 'signature', label: '手写签名', icon: 'PenLine',
  material: true, propertyGroup: 'general', dblEditableField: 'src', group: '扩展',
})
registerElementRenderer('signature', (el) => { /* 返回 HTML 字符串或 Node */ })
// release() 后素材卡与渲染一并回到内置基线
```

两处注册表都挂在 `globalThis` 固定 Symbol 上，与 core / plugin-kit 一致，避免多打包副本漂移；
注册态变化会通知已挂载的设计器即时重绘。

## 自定义元素插件（图表等）

设计器只保留通用机制，具体元素由独立插件包提供。宿主 `import` 一次插件入口即可让素材卡、
画布、属性台「自定义属性」页签与出纸同时生效；元素语义来自 `@worm-print-platform/core/designer`
的插件描述符，设计器 UI 来自 `@worm-print-platform/plugin-kit` 的框架无关 `ElementUI` 契约，
一份 UI 同时服务本包主入口与 `/vue3` 门面。

```js
import { registerAll } from '@worm-print-platform/canvas'
import '@worm-print-platform/echarts/ui'   // 官方图表插件（/ui 入口）；换成自己的插件包同理
registerAll()

const d = document.querySelector('print-designer')
d.fields = [{ fieldKey: 'trend', fieldLabel: '趋势数据', fieldType: 'list', sortOrder: 1 }]
// 设计态示例数据：单个业务对象、对象数组或 design-data attribute 的 JSON 串都可以；
// 单对象自动归一成数组信封。未注入时插件回落到 core 的 DEFAULT_DEMO_DATA。
d.designData = { trend: [{ name: '一月', value: 12 }, { name: '二月', value: 28 }] }
```

`data`（数组信封）会传给插件的画布与属性台渲染函数，`fields` 传给属性台渲染函数，
图表类插件据此按真实业务数据画预览、按业务字段生成数据源下拉。未注册 UI 的插件不会出现在素材台。
写自己的插件见 `packages/plugin-kit/README.md`。

## Vue 3 兼容门面（`/vue3`）

Vue 3 宿主使用 `/vue3` 门面即可沿用组件写法（props / 事件 / `ref`），底层复用零框架的本包，
模板、事件回调、`ref` 方法调用与业务逻辑一行不动。原本消费 `@worm-vue3-print/canvas` 的项目只需改依赖与 import：

```diff
- "@worm-vue3-print/canvas": "..."
+ "@worm-print-platform/canvas": "..."
```
```diff
- import { PrintDesigner, PrintHtmlPreview, ... } from '@worm-vue3-print/canvas'
- import type { TemplateData } from '@worm-vue3-print/canvas'
+ import { PrintDesigner, PrintHtmlPreview, ... } from '@worm-print-platform/canvas/vue3'
+ import type { TemplateData } from '@worm-print-platform/canvas/vue3'
```

可选扩展包同步换：旧 `echarts` / `echarts-common` 插件 → `@worm-print-platform/echarts`（UI 入口为 `/ui`）。
monorepo 源码消费的宿主还需把 Vite `resolve.alias` 与 `tsconfig.paths`
里的旧 canvas 条目指向 `packages/canvas/src/vue3/index.ts`，并补 `canvas` / `plugin-kit` 两条。

`vue` 是本子路径的 **optional peer**：不用 `/vue3` 时主入口仍是零框架、零 Vue 依赖。
设计器样式由元素自己注入 Shadow DOM，预览组件样式由门面幂等注入，宿主都不需要额外引 CSS。

### 门面负责的契约转换

| Vue 组件侧（`/vue3` 门面口径） | Custom Element 侧 | 门面动作 |
|---|---|---|
| `:initial-template` `:fields` `:fonts` 与函数型 `:upload-image` | `el.template` `el.fields` `el.fonts` `el.uploadImage` | 显式赋 property，绕开 `setAttribute` 把对象 / 函数字符串化 |
| `@save="onSave"` 首参是 JSON 字符串 | `CustomEvent('save')`，json 在 `detail` | 解 `detail` 再 emit |
| `@preview` | `CustomEvent('preview')` | 转无参 emit |
| `ref.getTemplateJson()` 返回对象 | `getTemplateJson()` 返回 JSON 字符串 | `JSON.parse` |
| `ref.validateTemplate()` / `getGeometryWarnings()` | 同名同语义 | 直接代理 |

props 变化会重新注入（与门面组件写法一致）；卸载时摘除事件监听。

### 已提供的导出

`PrintDesigner`、`PrintHtmlPreview`、`renderHtmlPages`、`browserCodeRenderer`、
`createDefaultTemplate`、`toRuntimePool`、`DEFAULT_DEMO_DATA`、`getDemoData`、
`provideToolbarOverflow` / `useToolbarOverflow` / `emptyToolbarOverflow` /
`createOverflowUnitDirective` / `TOOLBAR_OVERFLOW` / `moreSlotId`，
以及 `@worm-print-platform/core/designer` 的全量类型与 `PrintFontDeclaration`。
`InstanceType<typeof PrintDesigner>` / `InstanceType<typeof PrintHtmlPreview>` 含 expose 方法，
TS 宿主沿用原写法即可通过 `vue-tsc`。

### 能力边界（换包前请确认）

- **Vue 专属元素扩展注册表不提供**：`registerElementExtension` / `resolveElementPropertyTab`
  等属于旧 Vue 组件形态的契约。自定义元素改走 `@worm-print-platform/plugin-kit`
  （`defineElementUI` / `registerElementUI`），官方图表用 `@worm-print-platform/echarts/ui`，见上一节。
- `initialElements`：本包没有独立元素池，门面在未提供 `initialTemplate` 时把它并入
  当前模板第一页的 `elements`；与旧组件形态的「单独覆盖元素层」略有差别。
- **样式、图标与主题令牌的单一来源在 `core/src/styles`**：`gen-styles.mjs` / `gen-icons.mjs`
  从共享源派生；`/vue3` 门面与 Vue 3 宿主消费同一份主题令牌，本包不依赖任何外部构建产物。
  因此本仓构建顺序是 core → plugin-kit → canvas，宿主接入互不阻塞。
- **本包是设计器权威实现与稳定主版本**；`/vue3` 门面是 Vue 3 宿主的一等接入方式（沿用组件写法，
  底层复用同一份零框架设计器）。新接入的宿主按宿主框架选用本包主入口或 `/vue3` 门面。

## 在 Vue 3 / Vue 2 / React 中使用

三种宿主消费的是**同一个 `<print-designer>` 自定义元素**，差异只有两处：编译期要不要放行未知标签、
对象入参在哪一帧赋 property。下面代码取自 `demos/apps/{vue3,vue2,react}` 三个可运行工程，
已剥掉示例库与弹层等 demo 噪音。

### Vue 3

> Vue 3 宿主可用原生 `<print-designer>` 接入本节写法，与 Vue 2 / React 共用同一套注入代码；
> 需要沿用组件写法（props / 事件 / `ref`）时用 `/vue3` 门面，见上一节。

```js
// vite.config.js —— SFC 编译期就要声明 print-* 是自定义元素，否则被当未注册组件
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue({
    template: { compilerOptions: { isCustomElement: tag => tag.startsWith('print-') } },
  })],
})
```

```js
// main.js
import { createApp } from 'vue'
import { registerAll } from '@worm-print-platform/canvas'

registerAll()                        // 全应用调一次，不自动污染全局
createApp(App).mount('#app')
```

```vue
<template>
  <print-designer ref="designerRef" is-edit="true" show-help="true"
    @save="onSave" @preview="onPreview" @dblclick-cell="onDblclickCell" />
</template>

<script setup>
import { onMounted, ref } from 'vue'

const designerRef = ref(null)

/** 对象/函数入参只能赋 property（模板绑定会走 setAttribute 被字符串化） */
function syncDesigner() {
  const el = designerRef.value
  el.fields = fields.value
  el.template = template.value
  el.fonts = fontsOf(template.value)   // 可选：字体声明；demo 的 fontsOf() 取各页 /fonts 并按 family 去重
}
const onSave = e => persist(JSON.parse(e.detail))

onMounted(() => {
  const el = designerRef.value
  el.uploadImage = uploadToServer
  el.uploadDesignBackground = uploadToServer
  syncDesigner()
})
</script>
```

- **runtime-only 构建下 `app.config.compilerOptions.isCustomElement` 不生效**，配置必须落在 `@vitejs/plugin-vue` 里；
  只有自带运行时编译器的宿主才用 `app.config` 那条。

### Vue 2.7

```js
// main.js
import Vue from 'vue'
import { registerAll } from '@worm-print-platform/canvas'

registerAll()
// 必须声明，否则报 Unknown custom element、画面是个空壳
Vue.config.ignoredElements = ['print-designer']

new Vue({ render: h => h(App) }).$mount('#app')
```

```vue
<template>
  <print-designer ref="designer" is-edit="true" show-help="true"
    @save="onSave" @preview="onPreview" @dblclick-cell="onDblclickCell" />
</template>

<script>
export default {
  data: () => ({ fields: [], templateData: null }),
  mounted() {
    const el = this.$refs.designer
    el.uploadImage = this.uploadImage            // 函数只能赋 property
    el.uploadDesignBackground = this.uploadImage
    this.syncDesigner()
  },
  methods: {
    syncDesigner() {
      const el = this.$refs.designer
      if (!el) return
      el.fields = this.fields                    // 数组只能赋 property
      el.template = this.templateData            // 对象同上
    },
    onSave(e) { persist(JSON.parse(e.detail)) },  // e.detail 为模板 JSON 字符串
  },
}
</script>
```

- **`structuredClone` 会抛 `DataCloneError`**：Vue 2 把 `data` 里的对象深度响应式化成 Proxy，
  模板/数据深拷贝统一用 `JSON.parse(JSON.stringify(...))`。
- 宿主页面是**单根节点**（Vue 2 不支持多根 fragment，预览层与弹层都得写在根节点内）；
  `v-if` 控制的预览 iframe 要 `$nextTick()` + `requestAnimationFrame()` 两层才拿得到节点。
- Vue 2 侧专属坑的完整清单见 `demos/apps/vue2/README.md`（共 7 条）。

### React 18

React 没有 `isCustomElement` 这类编译配置：未知标签 `print-designer` 直接按原生元素渲染，
所以只剩运行期两条约定。

```jsx
// main.jsx
import { registerAll } from '@worm-print-platform/canvas'

registerAll()   // 一次即可；设计器样式在组件 Shadow DOM 内，宿主不必引 css
```

```jsx
// App.jsx
import { useEffect, useRef, useState } from 'react'

export default function App() {
  const designerRef = useRef(null)
  const [fields, setFields] = useState([])
  const [templateData, setTemplateData] = useState(null)

  function syncDesigner(nextFields, nextTemplate) {
    const el = designerRef.current
    if (!el) return
    el.fields = nextFields                  // JSX 里 template={obj} 会被字符串化成 [object Object]
    el.template = nextTemplate
  }

  useEffect(() => {
    const el = designerRef.current
    el.uploadImage = uploadToServer         // 函数同样只能赋 property
    el.uploadDesignBackground = uploadToServer
    syncDesigner(fields, templateData)      // 挂载后统一注入；换模板/换字段后再调一次

    const onSave = e => persist(JSON.parse(e.detail))
    el.addEventListener('save', onSave)     // JSX 的 onSave 不会绑定 CustomEvent
    return () => el.removeEventListener('save', onSave)   // StrictMode dev 双跑，漏解绑会重复注册
  }, [])

  return <print-designer ref={designerRef} is-edit="true" show-help="true" />
}
```

- 事件只注册一次：处理器要读最新 state 时用 `useRef` 桥接（demo 里的 `printDataRef`），
  把 state 放进 effect 依赖会导致频繁重绑。

### 三宿主共通的三条

1. **对象与函数只能赋 property**；字符串开关（`is-edit="true"`、`show-help="true"`）写在模板 / JSX 属性上即可。
   `fields` 只有 setter（读回看 `el.store.fields`），`template` 的 getter 返回当前画布 JSON。
   改字段/换模板后要**显式再调一次注入函数**（三个 demo 都在切示例、导入模板、清空、自定义字段四处调用），
   不去 `watch` element 本身。
2. **元素默认 `display:inline`，宿主必须给块级宽高**，否则设计器整体塌陷：
   `.容器 print-designer { display: block; width: 100%; height: 100% }`。
3. **事件是 CustomEvent**，载荷在 `event.detail`：`save` / `preview` 是模板 JSON 字符串；
   `dblclick-element` 就是元素 id 字符串本身、`dblclick-cell` 是 `{ elementId, r, c, cellId }` 对象，
   后两者**不要** `JSON.parse`。旁路取模板用 `getTemplateJson()`，它绕过拼版校验，
   保存/导出前要先调 `validateTemplate()`。

## 本包两种接入形态的边界

| | `/vue3` 门面 | 本包主入口 |
|---|---|---|
| 运行时 | Vue 3（可选 peer） | 无框架 |
| 宿主注入 | props / 事件 / `ref` | element property / attribute + CustomEvent |
| 样式 | 门面幂等注入，无需引样式文件 | 内置 Shadow DOM（`?inline`）；light DOM 形态引 `@worm-print-platform/canvas/style.css` |
| 适用 | 沿用组件写法的 Vue 3 项目 | Vue 3 / Vue 2 / React / jQuery / 原生 |

两种形态消费同一份共享样式与能力表；新接入的宿主按宿主框架选用 `/vue3` 门面或本包主入口。
