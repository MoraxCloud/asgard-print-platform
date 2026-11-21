# worm-print-platform 使用文档

> 面向把 worm-print-platform 当作**打印插件**集成进自己系统的宿主开发者。本文是一份完整、自包含的使用文档，覆盖四类框架接入、多语言、插件安装配置与插件开发。

## 目录

- [一、开始之前](#一开始之前)
- [二、基础接入（按框架）](#二基础接入按框架)
- [三、多语言配置与自定义](#三多语言配置与自定义)
- [四、插件安装与配置](#四插件安装与配置)
- [五、插件开发](#五插件开发)
- [六、迁移与故障排查附录](#六迁移与故障排查附录)

---

## 一、开始之前

### 1.1 三条打印链路速记

三条链路吃同一份 `templateJson + printData + baseUrl`，可单选可并存：

- **A 浏览器打印**：core 同构渲染进 iframe → `contentWindow.print()`，零额外基础设施（各框架文档默认接入）。
- **B 服务端 PDF**：部署 `services/render` 微服务，后端持密钥代理，产出可下载 PDF。
- **C 桌面客户端静默打印**：本机 Electron 客户端（`127.0.0.1:17521`）+ `PrintClient.printHtml()`，无对话框直接出纸。

细节见 integration 技能的 `references/server-render.md` 与 `references/silent-print.md`。

### 1.2 配套技能与 AI 提示词（AI agent 接入用）

> 所有命令块都支持快捷复制（点击代码块右上角的复制按钮即可）。默认安装目录为 `.agents/skills/<技能名>/`（OpenAI 规范位置）。

技能以仓库为源，通过命令行安装器安装到当前项目（推荐），也可从仓库源码手动取用（离线回退）。

| 技能 | 覆盖范围 | 适用文档 |
| --- | --- | --- |
| `worm-print-platform-integration` | 全形态宿主集成：NPM 宿主的 `canvas/vue3` 组件门面与 `<print-designer>` 契约、浏览器直挂 / 无打包器与 Vue 2 / React / jQuery、三条打印链路、全栈宿主最小清单、宿主 MCP、故障排查 | 四份文档共用 |
| `worm-print-platform-mcp` | 桌面 MCP 工具：AI 实时读写画布、模板生成校验、视觉回读与参考图比对 | 可选增强，任何框架 |

#### 1.2.1 方式 A：npx 安装器（推荐）

在**当前项目根目录**逐条执行（`<技能名>` 见上表）。默认 Gitee 优先（国内网络快），网络不通时自动回退 GitHub：

**Gitee 优先（推荐，国内网络快）**：

```bash
npx @worm-print-platform/skills worm-print-platform-integration --repo https://gitee.com/liulong_oschina/worm-print-platform.git --force
npx @worm-print-platform/skills worm-print-platform-mcp           --repo https://gitee.com/liulong_oschina/worm-print-platform.git --force
```

**GitHub 自动回退**：

```bash
# 不带 --repo 时默认 GitHub 优先、失败自动回退 Gitee
npx @worm-print-platform/skills worm-print-platform-integration --force
npx @worm-print-platform/skills worm-print-platform-mcp           --force
```

**自定义安装目录**（可选，指定 `--dir`）：

```bash
# 常见目标目录：
#   Claude Code  → .claude/skills
#   Qoder        → .qoder/skills
#   用户级       → ~/.agents/skills
#   其他任意路径 → 绝对路径

npx @worm-print-platform/skills worm-print-platform-integration \
  --repo https://gitee.com/liulong_oschina/worm-print-platform.git \
  --dir .claude/skills --force
```

参数速查：

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `<技能名>` | 必填，单个技能名（如 `worm-print-platform-integration`） | — |
| `--repo <地址>` | 仓库地址（GitHub / Gitee 均可，或 `owner/repo` 简写） | 双源：GitHub 优先、失败自动回退 Gitee |
| `--dir <目录>` | 技能根目录，技能装到 `<目录>/<技能名>/` | `.agents/skills`（OpenAI 规范位置） |
| `--force` | 目标目录已存在时覆盖（默认拒绝并报错） | 否 |
| `-h, --help` | 显示帮助 | — |
| `-v, --version` | 显示版本 | — |

完整参数见 `npx @worm-print-platform/skills --help`。

#### 1.2.2 方式 B：仓库源码手动取用（离线回退）

无 npm / git 环境时，从 [GitHub](https://github.com/worm-longliu/worm-print-platform) 或
[Gitee](https://gitee.com/liulong_oschina/worm-print-platform) 仓库的 `skills/<技能名>/`
目录手动下载整个目录，放到所用 AI 编程工具的技能目录并重载。
安装器不可用或网络受限时，提示词降级为「完整阅读该目录下 `SKILL.md` 与 `references/`
全部文档」，门控效果等价。

#### 1.2.3 给 AI Agent 的提示词片段（可整段复制）

把下面这段直接粘给 AI 编程工具，它会先装规范再动手：

```
请先在项目根目录执行以下命令安装 worm-print-platform 的官方技能规范，再开始接入开发：

npx @worm-print-platform/skills worm-print-platform-integration --repo https://gitee.com/liulong_oschina/worm-print-platform.git --force

默认安装到 .agents/skills/worm-print-platform-integration/（OpenAI 规范位置）。
若 Gitee 网络不通，去掉 --repo 参数即可自动回退 GitHub；
需要其他技能目录（如 .claude/skills / .qoder/skills）时加 --dir 指定。
安装完成后，请完整阅读该目录下的 SKILL.md 与 references/ 全部文件。
```


---

## 二、基础接入（按框架）


### 2.1 Vue 3

> 操作方法 + AI 集成提示词。可运行完整示例：`demos/apps/vue3`（9331）。
> Vue 3 是一等支持路径：`@worm-print-platform/canvas/vue3` 正式门面与原 `@worm-vue3-print/canvas`
> 组件同形，原项目只换依赖与 import，模板、事件、ref 调用、业务逻辑一行不动。

#### 1. 安装

```bash
# 新 Vue 3 项目
npm install @worm-print-platform/canvas @worm-print-platform/core

# 原 @worm-vue3-print/canvas 项目：卸旧装新，import 路径替换为 /vue3，业务代码不改
npm uninstall @worm-vue3-print/canvas @worm-vue3-print/core
npm install @worm-print-platform/canvas @worm-print-platform/core
```

- `canvas` 与 `core`、`plugin-kit` 同号同批发版，显式装同版本并提交锁文件。
- `vue` 是 `/vue3` 子路径的 optional peer，项目里已有则无需额外操作。
- 可选图表插件：`npm i @worm-print-platform/echarts`，`import '@worm-print-platform/echarts/ui'` 即注册。

#### 2. 最小接入（组件门面写法，无需 isCustomElement / 无需引 CSS）

```vue
<template>
  <PrintDesigner
    ref="designerRef"
    :initial-template="template"
    :fields="fields"
    :is-edit="true"
    :upload-image="uploadImage"
    @save="onSave"
    @preview="onPreview"
  />
  <Teleport to="body">
    <div v-if="previewVisible" class="preview-mask" @click.self="previewVisible = false">
      <PrintHtmlPreview
        ref="previewRef"
        :template-json="previewTemplate"
        :print-data="printData"
        base-url="/files"
        @rendered="pageCount = $event"
        @error="previewError = $event"
      />
      <button type="button" @click="previewRef?.print()">打印</button>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { PrintDesigner, PrintHtmlPreview, createDefaultTemplate } from '@worm-print-platform/canvas/vue3'

const designerRef = ref(null)
const template = ref(createDefaultTemplate())
const fields = ref([
  { fieldKey: 'order.no', fieldLabel: '单号', fieldType: 'string', sortOrder: 1 },
  { fieldKey: 'goods', fieldLabel: '商品明细', fieldType: 'list', sortOrder: 2 },
])
const uploadImage = async file => uploadToServer(file) // 返回可访问 URL

function onSave(json) {
  // json 是模板 JSON 字符串：与模板元信息（名称/业务类型/备注）分开持久化
  persist(JSON.parse(json))
}
function onPreview() {
  previewVisible.value = true // 预览数据用 el 旁路：designerRef.value.getTemplateJson()
}
</script>
```

组件契约（完整口径见技能 `references/integration-api.md`）：

- `PrintDesigner` props：`initial-template / initial-elements / fields / is-edit / upload-image / show-help / show-preview / show-save / fonts / design-data`；
  事件 `save(json)` / `preview()`；ref 方法 `getTemplateJson() / validateTemplate() / getGeometryWarnings()`。
  `show-preview` / `show-save` 控制工具栏「预览 / 保存」按钮显隐，默认显示，隐藏不影响 `save()` 与事件旁路。
- `PrintHtmlPreview` props：`template-json / print-data / base-url / font-base-url / renderers`；
  事件 `rendered / error`；ref 方法 `print / rerender / setViewZoom`。
- 不存在 `back` 事件与 `setTemplateMeta` 方法——返回导航与模板元信息都是宿主业务层。

#### 3. 出纸

- **A 浏览器打印**：预览层「打印」按钮调 `previewRef.print()`（门面已封装同构渲染 + `contentWindow.print()`）。
- **B 服务端 PDF**：部署 `services/render` 微服务，后端代理 `/render/pdf` 并注入密钥；前端不持密钥。
- **C 静默打印**：`import { PrintClient } from '@worm-print-platform/core/client'`，`connect()` 后
  `printHtml(rendered)` 直送本机客户端出纸（客户端绑定 `127.0.0.1`，须与浏览器同机）。

#### 4. Vue 3 必知约定

1. 模板 JSON 与宿主元信息分离存储；`save` 的 `json` 只含画布 elements。
2. `getTemplateJson()` 绕过拼版校验——保存/导出前先调 `validateTemplate()`。
3. 换模板重载用新的 `initial-template` 引用（或元素形态的 `el.template = 新对象`），不要复用旧引用。
4. 需要读当前画布 JSON 时用 `designerRef.value.getTemplateJson()`。
5. 迁移自 `@worm-vue3-print/canvas` 的项目：`import type` 也可直接换到 `/vue3`，无需改任何类型引用。

#### 5. AI 工具集成提示词（复制给 AI 编程工具即可）

对应技能：**`worm-print-platform-integration`**（安装方法见 [README](README.md#一开始之前)；
若需 AI 实时读写画布，另装 `worm-print-platform-mcp`）。

```text
【第 0 步 · 门控：未完成禁止改代码】
1. 安装集成技能：从 https://github.com/worm-longliu/worm-print-platform 仓库取
   skills/worm-print-platform-integration 整个目录，复制到你的技能目录并重载
   （Qoder：~/.qoder/skills/；Claude Code：~/.claude/skills/；或项目级同名目录）。
   无法安装时降级：完整阅读该目录下 SKILL.md 与 references/ 全部文档后再动手。
2. 完成后输出「已读规范确认」：逐个列出文件路径 + 与本任务相关的 3 条以上约束。
3. 阅读本项目的 AGENTS.md / README / 构建配置，确认 Vue 版本、构建器与包管理器。
4. 任一文档缺失或读不懂，先提问，禁止臆测 API。

【集成要求】
- 宿主框架：Vue 3（SFC + <script setup>）。
- 安装 @worm-print-platform/canvas @worm-print-platform/core（同版本、提交锁文件）。
- 设计器与预览组件从 @worm-print-platform/canvas/vue3 正式门面导入
  （PrintDesigner / PrintHtmlPreview），无需 isCustomElement 配置、无需引 CSS、
  无需手动赋 property。若项目原本用 @worm-vue3-print/canvas：只换依赖与 import，
  模板、事件、ref 调用、业务逻辑一律不动。
- 业务字段按 PrintBusinessField 契约（fieldKey/fieldLabel/fieldType/sortOrder）
  由【后端接口 / 本地常量】提供。
- 模板 JSON 与模板元信息（名称/业务类型/备注/默认标记）分开存储。
- 复用项目现有请求封装、UI 组件库与代码风格，不引入额外 UI 依赖。
- 可选打印链路：A 浏览器打印（默认）/ B 服务端 PDF / C 桌面客户端静默打印 / 并存，
  按技能 references/server-render.md、references/silent-print.md 落地。

【验收标准】
- 类型检查 / 构建通过；设计器保存模板 JSON 后再次打开能回填。
- 最小链路跑通：设计 → 保存 → 预览渲染真实业务数据 → 浏览器打印
  （链路 B：后端代理返回可下载 application/pdf；链路 C：本机客户端静默出纸）。
- 只使用技能文档列出的 props / 事件 / ref 方法，不虚构 API
  （不存在 setTemplateMeta、back 事件）。
```

### 2.2 Vue 2.7

> 操作方法 + AI 集成提示词。可运行完整示例：`demos/apps/vue2`（9332，SFC + Options API）。
> Vue 2 走零框架主入口 `<print-designer>` 自定义元素：`registerAll()` 注册一次，
> 字符串开关写 attribute，对象/函数赋 property，事件用 `@save` 等 v-on 绑定 CustomEvent。

#### 1. 安装

```bash
npm install @worm-print-platform/canvas @worm-print-platform/core
npm install -D @vitejs/plugin-vue2
```

`canvas` 与 `core`、`plugin-kit` 同号同批发版，显式装同版本并提交锁文件。
（webpack 宿主同理，无打包器限制；vue@2.7 runtime-only 构建即可，不需要 esm 编译版。）

#### 2. 最小接入

**一次性配置（`src/main.js`）**

```js
import { registerAll } from '@worm-print-platform/canvas'
import Vue from 'vue'
import App from './App.vue'

registerAll() // 全局一次，注册 <print-designer>
Vue.config.ignoredElements = ['print-designer'] // 不声明会报 Unknown custom element、画面空壳
new Vue({ render: h => h(App) }).$mount('#app')
```

**组件内挂载与注入（Options API）**

```vue
<template>
  <div class="demo-app"> <!-- Vue 2 不支持多根 fragment，内容放单根节点内 -->
    <print-designer ref="designer" is-edit="true" show-help="true"></print-designer>
  </div>
</template>

<script>
import { createDefaultTemplate } from '@worm-print-platform/canvas'

export default {
  mounted() {
    const el = this.$refs.designer
    // 对象 / 数组 / 函数只能赋 property，写 attribute 会被字符串化
    el.fields = [
      { fieldKey: 'order.no', fieldLabel: '单号', fieldType: 'string', sortOrder: 1 },
      { fieldKey: 'goods', fieldLabel: '商品明细', fieldType: 'list', sortOrder: 2 },
    ]
    el.template = createDefaultTemplate()
    el.uploadImage = async file => uploadToServer(file)
    // 事件也可用 addEventListener；用 @save 等 v-on 绑定 CustomEvent 同样生效
    el.addEventListener('save', e => this.persist(JSON.parse(e.detail)))
  },
  beforeDestroy() {
    // 解绑事件监听、关闭 MCP 会话（若有）
  },
  methods: {
    persist(json) { /* 模板 JSON 与元信息分开存储 */ },
  },
}
</script>
```

**样式**：`print-designer` 默认 `display:inline`，容器不给块级宽高会整体塌陷：

```css
.demo-app print-designer { display: block; width: 100%; height: 100%; }
```

Shadow DOM 内联注入样式，普通用法无需引 CSS；只有 light DOM 形态才
`import '@worm-print-platform/canvas/style.css'`。

#### 3. 出纸

- **A 浏览器打印**：`import { renderHtmlPages, browserCodeRenderer } from '@worm-print-platform/core/browser'`
  渲染进 iframe → `iframe.contentWindow.print()`。
- **B 服务端 PDF / C 静默打印**：`PrintClient` 从 `@worm-print-platform/core/client` 导入，
  `printHtml(rendered)` 直送本机客户端（`127.0.0.1`，与浏览器同机）；PDF 走后端代理。

#### 4. Vue 2 必知约定（漏了必踩坑）

1. `Vue.config.ignoredElements = ['print-designer']` 必须声明（`main.js`，一次）。
2. 对象/函数入参只能赋 property；`fields` 没有 getter，读回看 `el.store.fields`。
3. 模板/数据深拷贝用 `JSON.parse(JSON.stringify(...))`——Vue 2 响应式 Proxy 会让 `structuredClone` 抛 `DataCloneError`。
4. `v-if` 控制的预览 iframe：`await this.$nextTick()` 再 `await requestAnimationFrame(...)` 两层后才拿得到节点。
5. 宿主组件单根节点；弹层全部放根内。
6. 宿主样式不要加 `scoped`（命不中子组件节点）。
7. 事件 `detail` 口径：`save`/`preview` 是模板 JSON 字符串（需 `JSON.parse`）；
   `dblclick-element` 的 detail 是元素 id 字符串本身、`dblclick-cell` 是
   `{ elementId, r, c, cellId }` 对象，均不要 parse。
8. `getTemplateJson()` 绕过拼版校验，保存/导出前先 `validateTemplate()`。

#### 5. AI 工具集成提示词（复制给 AI 编程工具即可）

对应技能：**`worm-print-platform-integration`**（安装方法见 [README](README.md#一开始之前)）。

```text
【第 0 步 · 门控：未完成禁止改代码】
1. 安装接入技能：从 https://github.com/worm-longliu/worm-print-platform 仓库取
   skills/worm-print-platform-integration 整个目录，复制到你的技能目录并重载
   （Qoder：~/.qoder/skills/；Claude Code：~/.claude/skills/；或项目级同名目录）。
   无法安装时降级：完整阅读该目录下 SKILL.md 与 references/ 全部文档后再动手。
2. 完成后输出「已读规范确认」：逐个列出文件路径 + 与本任务相关的 3 条以上约束。
3. 阅读本项目的 AGENTS.md / README / 构建配置，确认 Vue 2 版本、构建器与包管理器。
4. 任一文档缺失或读不懂，先提问，禁止臆测 API。

【集成要求】
- 宿主框架：Vue 2.7（SFC + Options API），构建器按项目现状。
- 安装 @worm-print-platform/canvas @worm-print-platform/core（同版本、提交锁文件）。
- main.js 一次性：registerAll() + Vue.config.ignoredElements = ['print-designer']。
- 模板里只写字符串 attribute（is-edit="true"、show-help="true"）；
  fields / template / uploadImage 等对象与函数在 mounted 后经 $refs 赋 property。
- 模板/数据深拷贝一律 JSON.parse(JSON.stringify(...))，不用 structuredClone。
- 业务字段按 PrintBusinessField 契约（fieldKey/fieldLabel/fieldType/sortOrder）
  由【后端接口 / 本地常量】提供；模板 JSON 与元信息分开存储。
- 复用项目现有请求封装、UI 组件库与代码风格，不引入额外 UI 依赖。
- 打印链路：A 浏览器渲染进 iframe 后 contentWindow.print()（默认）；
  B/C 按需加，参考技能 references/printing.md。

【验收标准】
- 构建通过；设计器保存模板 JSON 后再次打开能回填。
- 最小链路跑通：设计 → 保存 → 预览渲染真实业务数据 → 浏览器打印。
- 只使用技能文档列出的 attribute / property / 方法 / 事件，不虚构 API
  （不存在 setTemplateMeta、back 事件；fields 无 getter，读回用 el.store.fields）。
```

### 2.3 React 18

> 操作方法 + AI 集成提示词。可运行完整示例：`demos/apps/react`（9335）。
> React 走零框架主入口 `<print-designer>` 自定义元素：未知标签按原生元素渲染，
> 无编译期配置；差异全在运行期——property 注入与 `addEventListener`。

#### 1. 安装

```bash
npm install @worm-print-platform/canvas @worm-print-platform/core
```

`canvas` 与 `core`、`plugin-kit` 同号同批发版，显式装同版本并提交锁文件。

#### 2. 最小接入

**一次性注册（`src/main.jsx`）**

```jsx
import { registerAll } from '@worm-print-platform/canvas'
registerAll() // 全局一次，注册 <print-designer>；React 无 isCustomElement 这类编译配置
```

**组件内挂载与注入**

```jsx
function PrintDesignerHost({ fields, template }) {
  const designerRef = useRef(null)
  const printDataRef = useRef(printData) // 一次性注册的处理器读 ref 取最新 state

  useEffect(() => {
    const el = designerRef.current
    // 对象 / 数组 / 函数只能赋 property；JSX 的 template={obj} 会被字符串化成 [object Object]
    el.fields = fields
    el.template = template
    el.uploadImage = async file => uploadToServer(file)

    // JSX 的 onSave 不会绑定 CustomEvent，必须 addEventListener，cleanup 成对解绑
    const onSave = e => persist(JSON.parse(e.detail))
    el.addEventListener('save', onSave)
    return () => el.removeEventListener('save', onSave)
  }, []) // 依赖留空，state 走 ref 桥接，避免频繁重绑

  return <print-designer ref={designerRef} is-edit="true" show-help="true" />
}
```

**样式**：`print-designer` 默认 `display:inline`，容器不给块级宽高会整体塌陷：

```css
.print-host print-designer { display: block; width: 100%; height: 100%; }
```

Shadow DOM 内联注入样式，普通用法无需引 CSS；只有 light DOM 形态才
`import '@worm-print-platform/canvas/style.css'`。

#### 3. 出纸

- **A 浏览器打印**：`import { renderHtmlPages, browserCodeRenderer } from '@worm-print-platform/core/browser'`
  渲染进 iframe → `iframe.contentWindow.print()`。
- **B 服务端 PDF / C 静默打印**：`PrintClient` 从 `@worm-print-platform/core/client` 导入，
  `printHtml(rendered)` 直送本机客户端（`127.0.0.1`，与浏览器同机）；PDF 走后端代理。

#### 4. React 必知约定（漏了必踩坑）

1. 对象/函数入参只能赋 property（`useEffect` 里赋）；JSX 属性会被 React 字符串化。
2. `fields` 没有 getter，读回看 `el.store.fields`；`el.template` getter 返回当前画布 JSON。
3. 事件必须 `addEventListener` 且在 effect cleanup 里 `removeEventListener`；
   `StrictMode` dev 双跑 effect，漏解绑会重复保存。
4. 一次性注册的处理器要读最新 state：用 `useRef` 桥接，事件只注册一次。
5. 预览 iframe 条件渲染：等 DOM 提交后再取 `ref.current` 写 HTML；Esc 关闭的 `keydown`
   打开时绑、关闭时解绑。
6. 模板/数据深拷贝用 `JSON.parse(JSON.stringify(...))`，别塞进会被 `structuredClone`
   处理的响应式包装。
7. 事件 `detail` 口径：`save`/`preview` 是模板 JSON 字符串（需 `JSON.parse`）；
   `dblclick-element` 的 detail 是元素 id 字符串本身、`dblclick-cell` 是
   `{ elementId, r, c, cellId }` 对象，均不要 parse。
8. `getTemplateJson()` 绕过拼版校验，保存/导出前先 `validateTemplate()`。

#### 5. AI 工具集成提示词（复制给 AI 编程工具即可）

对应技能：**`worm-print-platform-integration`**（安装方法见 [README](README.md#一开始之前)）。

```text
【第 0 步 · 门控：未完成禁止改代码】
1. 安装接入技能：从 https://github.com/worm-longliu/worm-print-platform 仓库取
   skills/worm-print-platform-integration 整个目录，复制到你的技能目录并重载
   （Qoder：~/.qoder/skills/；Claude Code：~/.claude/skills/；或项目级同名目录）。
   无法安装时降级：完整阅读该目录下 SKILL.md 与 references/ 全部文档后再动手。
2. 完成后输出「已读规范确认」：逐个列出文件路径 + 与本任务相关的 3 条以上约束。
3. 阅读本项目的 AGENTS.md / README / 构建配置，确认 React 版本、构建器与包管理器。
4. 任一文档缺失或读不懂，先提问，禁止臆测 API。

【集成要求】
- 宿主框架：React 18（函数组件 + hooks），构建器按项目现状。
- 安装 @worm-print-platform/canvas @worm-print-platform/core（同版本、提交锁文件）。
- 入口一次性 registerAll()；无编译期自定义元素配置。
- JSX 只写字符串 attribute（is-edit="true"、show-help="true"）；
  fields / template / uploadImage 等对象与函数在 useEffect 里经 ref 赋 property，
  JSX 属性传对象会被字符串化成 [object Object]。
- 事件一律 addEventListener + cleanup 解绑（StrictMode 双跑防护）；
  一次性注册的处理器用 useRef 桥接读最新 state。
- 业务字段按 PrintBusinessField 契约（fieldKey/fieldLabel/fieldType/sortOrder）
  由【后端接口 / 本地常量】提供；模板 JSON 与元信息分开存储。
- 复用项目现有请求封装、UI 组件库与代码风格，不引入额外 UI 依赖。
- 打印链路：A 浏览器渲染进 iframe 后 contentWindow.print()（默认）；
  B/C 按需加，参考技能 references/printing.md。

【验收标准】
- 类型检查 / 构建通过；设计器保存模板 JSON 后再次打开能回填。
- 最小链路跑通：设计 → 保存 → 预览渲染真实业务数据 → 浏览器打印。
- 只使用技能文档列出的 attribute / property / 方法 / 事件，不虚构 API
  （不存在 setTemplateMeta、back 事件；fields 无 getter，读回用 el.store.fields；
  JSX 的 onSave 不绑定 CustomEvent）。
```

### 2.4 jQuery / 原生 JS

> 操作方法 + AI 集成提示词。可运行完整示例：`demos/apps/jquery`（9334，无打包器）。
> 直挂形态：插件不进 `import`，页面挂一个 `<link>` + 一个 `<script>`，
> 业务代码用 `window.WormPrintCanvas` 全局 + jQuery 操作 DOM。

#### 1. 安装（拷两份静态文件）

无打包器 ⇒ 无 bare import。从 `@worm-print-platform/canvas/browser` 对应的产物拿
`canvas.js` 与 `canvas.css` 放进宿主静态目录（真实项目等价于「从制品库下载这两个文件」）：

```bash
npm install @worm-print-platform/canvas
cp node_modules/@worm-print-platform/canvas/dist/canvas.js  static/vendor/worm-print-canvas.js
cp node_modules/@worm-print-platform/canvas/dist/canvas.css static/vendor/worm-print-canvas.css
```

`canvas.js` 是 UMD，已内联 core 与码制库，挂出全局 `window.WormPrintCanvas`，除
`registerAll / createDefaultTemplate / PrintDesignerElement` 外还带
`renderHtmlPages / browserCodeRenderer / PrintClient / WormPrintError /
getPaperDimensions / getByPath` 等出纸与缩略图入口——直挂宿主所有能力都从这个全局取。

#### 2. 最小接入

**head / body 引用（顺序即加载顺序）**

```html
<link rel="stylesheet" href="/static/vendor/worm-print-canvas.css" />
<!-- body 末尾 -->
<script src="/static/vendor/worm-print-canvas.js"></script>
<script src="/src/app.js"></script>
```

**注册元素、挂载、注入、听事件（`src/app.js`）**

```js
WormPrintCanvas.registerAll() // 全局只调用一次

const host = document.getElementById('host')
host.innerHTML = '<print-designer id="designer" is-edit="true" show-help="true"></print-designer>'
const el = document.getElementById('designer')

// 对象 / 数组 / 函数只能赋 property（setAttribute 会字符串化）
el.fields = [
  { fieldKey: 'order.no', fieldLabel: '单号', fieldType: 'string', sortOrder: 1 },
  { fieldKey: 'goods', fieldLabel: '商品明细', fieldType: 'list', sortOrder: 2 },
]
el.template = template           // 对象；读回当前画布用 el.getTemplateJson()
el.uploadImage = file => upload(file)

// jQuery 包了一层事件对象：e.detail 是 undefined，必须取 e.originalEvent.detail
$(el).on('save', e => persist(JSON.parse(e.originalEvent.detail)))
```

**样式**：`print-designer` 默认 `display:inline`，不给块级宽高设计器整体塌陷：

```css
.demo-container print-designer { display: block; width: 100%; height: 100%; }
```

Shadow DOM 不需要外链 CSS；`worm-print-canvas.css` 是 light DOM 兜底与 `:host` 基线，照抄时一并引入无害。

#### 3. 出纸

```js
// A 浏览器打印：全局自带同构渲染（core 执行器已内联）
const rendered = await WormPrintCanvas.renderHtmlPages(
  JSON.parse(el.getTemplateJson()), data, location.origin, WormPrintCanvas.browserCodeRenderer)
const doc = frame.contentWindow.document   // 写进预览 iframe（doc.open/write/close）
doc.open()
doc.write(rendered.html)
doc.close()
frame.contentWindow.print()

// C 静默打印：直送本机客户端（127.0.0.1，与浏览器同机；BUSY 由宿主排队重试）
new WormPrintCanvas.PrintClient({ timeoutMs: 20000 }).printHtml(rendered)
```

B 服务端 PDF：同源 `/render-api/*` 由宿主后端代理到 `services/render` 并注入密钥，
前端不持密钥。

#### 4. 直挂必知约定（漏了必踩坑）

1. 自定义元素默认 `display:inline`：不给块级宽高会塌陷，务必带上面的 CSS。
2. `fields` 没有 getter，读回看 `el.store.fields`；`el.template` getter 返回当前画布 JSON。
3. jQuery 事件对象要取 `e.originalEvent.detail`；原生 `addEventListener` 则是 `e.detail`。
4. 弹层显隐用 `hidden` 属性时，若宿主样式把遮罩写成 `display:flex`，作者样式会盖掉
   `[hidden]` 的 UA 规则——切 `hidden` 的同时同步一行内联 `display`。
5. 无打包器 ⇒ `src/*.js` 只能相对路径互引，npm 包名一律不出现，能力全从 `WormPrintCanvas` 取。
6. 页面销毁时 `removeEventListener` 并关闭 `PrintClient`。
7. 事件 `detail` 口径：`save`/`preview` 是模板 JSON 字符串（需 `JSON.parse`）；
   `dblclick-element` 的 detail 是元素 id 字符串本身、`dblclick-cell` 是
   `{ elementId, r, c, cellId }` 对象，均不要 parse。
8. `getTemplateJson()` 绕过拼版校验，保存/导出前先 `el.validateTemplate()`。

#### 5. AI 工具集成提示词（复制给 AI 编程工具即可）

对应技能：**`worm-print-platform-integration`**（安装方法见 [README](README.md#一开始之前)）。

```text
【第 0 步 · 门控：未完成禁止改代码】
1. 安装接入技能：从 https://github.com/worm-longliu/worm-print-platform 仓库取
   skills/worm-print-platform-integration 整个目录，复制到你的技能目录并重载
   （Qoder：~/.qoder/skills/；Claude Code：~/.claude/skills/；或项目级同名目录）。
   无法安装时降级：完整阅读该目录下 SKILL.md 与 references/ 全部文档后再动手。
2. 完成后输出「已读规范确认」：逐个列出文件路径 + 与本任务相关的 3 条以上约束。
3. 阅读本项目的目录结构与部署方式（静态目录 / 反向代理 / 模板引擎），确认无打包器直挂形态。
4. 任一文档缺失或读不懂，先提问，禁止臆测 API。

【集成要求】
- 宿主形态：jQuery / 原生 JS 浏览器直挂，无打包器，无 bare import。
- 从 @worm-print-platform/canvas/browser 产物取 canvas.js + canvas.css 拷进宿主静态目录
  （或按项目惯例从制品库取件），页面 <link> + <script> 引入，能力全部从
  window.WormPrintCanvas 全局取，npm 包名不得出现在业务代码里。
- WormPrintCanvas.registerAll() 全局一次；对象/函数入参一律赋 property，
  字符串开关（is-edit="true" 等）写 attribute。
- jQuery 事件用 $(el).on(...) 且取 e.originalEvent.detail；原生监听用 e.detail。
- 自定义元素补块级宽高 CSS（默认 display:inline 会塌陷）。
- 业务字段按 PrintBusinessField 契约（fieldKey/fieldLabel/fieldType/sortOrder）
  由【后端接口 / 页面常量】提供；模板 JSON 与元信息分开存储。
- 复用项目现有请求封装与样式风格，不引入构建器与额外 UI 依赖。
- 打印链路：A WormPrintCanvas.renderHtmlPages 渲染进 iframe 后
  contentWindow.print()（默认）；C 静默打印用 WormPrintCanvas.PrintClient.printHtml；
  B 服务端 PDF 只请求同源代理路径，密钥由后端注入，前端不保存密钥。

【验收标准】
- 页面无构建直接打开可用；设计器保存模板 JSON 后再次打开能回填。
- 最小链路跑通：设计 → 保存 → 预览渲染真实业务数据 → 浏览器打印。
- 只使用全局 WormPrintCanvas 上真实存在的入口与 <print-designer> 真实契约，
  不虚构 API（不存在 setTemplateMeta、back 事件；fields 无 getter，读回用
  el.store.fields；jQuery 侧必须取 originalEvent.detail）。
```
