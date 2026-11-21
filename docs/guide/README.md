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


---

## 三、多语言配置与自定义

本文档描述 worm-print-platform 的完整多语言体系，含**内核引擎、宿主接入、插件多语言设置、非语义文案、帮助文档、导出复用**六部分。适用于设计器（`@worm-print-platform/canvas`）、渲染/诊断管线（`@worm-print-platform/core`）、服务端（render）与桌面客户端（client）。

### 3.1 目标与总体架构

- **一套引擎**：不重复造轮子。core 直接依赖 `i18next`，在其上做一层**对外 API 完全兼容的薄封装**（`@worm-print-platform/core/i18n`）。各包只依赖 core 的 i18n 子路径，不直接接触 i18next。
- **三种内置语言**：`zh-CN`（源文本，缺省）、`en-US`、`th-TH`（泰语，AI 直译）。缺键一律回退 `zh-CN` 源文本，绝不显示裸 key 或空白。
- **分层覆盖**：用户自定义包 > 插件包 > 内置包（对应 i18next 命名空间 `user` > 各插件 id > `core`，按 ns 数组顺序命中）。
- **插件自描述语言包**：插件注册 UI 时声明自己的 `locales`，引擎自动按插件 id 前缀纳入统一资源池。
- **可导出复用**：一键把全部内置资源（core / 帮助 / 常量 / 属性说明 / 插件）合并成**标准 i18next resources**，用户拷到自己项目即可用。

```
                     ┌─────────────────────────────────────────┐
                     │  @worm-print-platform/core/i18n          │
  t() / createTranslator() / setLocale() / registerLocale() ...
                     │  i18next 实例（薄封装 engine.ts）        │
                     └───────────────┬─────────────────────────┘
                                     │ resourceStore
              ┌──────────────────────┼──────────────────────┐
         user ns（宿主）        plugin ns（各插件）          core ns（内置）
      registerLocale()    registerPluginMessages()      messages/*.ts
                                     │
                  ┌──────────────────┴──────────────────┐
           帮助文档 help     常量/属性说明       Bundle 导出
          help-content/    *-translation.ts    i18n:bundle
```

### 3.2 内核引擎

#### 3.2.1 语言归一与探测

`normalizeLocale(input)` 规则（`i18n-instance.ts`）：
- 非字符串 / 空串 → `zh-CN`
- `/^en([-_]|$)/i` → `en-US`；`/^th([-_]|$)/i` → `th-TH`
- 其余（如 `ja-JP`）原样保留，靠缺键回退显示中文

`detectLocale()` 取 `navigator.language` 并归一，异常回退 `zh-CN`。未显式设 `lang` 的实例跟随全局 locale。

#### 3.2.2 i18next 关键配置（不要随意改）

| 配置 | 值 | 原因 |
| --- | --- | --- |
| `keySeparator` | `false` | 本项目 key 含点（`toolbar.save`），必须当扁平键，否则被当嵌套路径 |
| `nsSeparator` | `false` | 不用 `ns:key` 前缀语法，命名空间靠 ns 数组检索 |
| `interpolation` | `{ prefix:'{', suffix:'}', escapeValue:false }` | 兼容现有 `{name}` 插值；文案含 HTML（如工具栏"更多"）不能被转义 |
| `fallbackLng` | `zh-CN` | 缺键回退中文源文本 |
| `defaultNS` | `core` | 内置资源所在命名空间 |

#### 3.2.3 对外 API（`@worm-print-platform/core/i18n`，主入口亦 re-export）

- 状态：`setLocale(locale|null)`、`resetLocale()`、`getLocale()`、`subscribe(listener)`、`normalizeLocale(input)`
- 翻译：`t(key, params?)`、`translate(locale, key, params?)`、`createTranslator(locale)`
- 注入：`registerLocale(locale, messages)`、`mergeLocale(locale, partial)`、`registerPluginMessages(locale, pluginId, messages)`
- 诊断：`getMissingKeys()`、`clearLocales()`、`getResources(locale?)`
- 类型：`Locale`、`Translate`、`LocaleMessages`、`CustomLocaleMessages`、`PluginLocaleMessages<Id>`
- 格式化：`formatNumber(value, locale, options)`、`formatDate(value, locale)`

插值用法：`t('toolbar.save')`；`t('diagnostic.position', { pos: 3 })` 对应文案 `位置 {pos}: ...`。

### 3.3 语言包组织

```
packages/core/src/i18n/messages/
  zh-CN.ts / en-US.ts / th-TH.ts       主包（诊断/校验/服务/数据表等 + 汇总 shell/expr）
  shell-zh.ts / shell-en.ts / shell-th.ts   设计器外壳 UI 文案
  expr-zh.ts  / expr-en.ts  / expr-th.ts    表达式编辑器 UI 文案
packages/core/src/i18n/locale-keys.json     语义键清单（由 zh 包派生）
packages/canvas/src/shell/help-content/
  zh-CN/ | en-US/ | th-TH/                 帮助文档六章节
packages/canvas/src/shell/
  label-translation.ts        中文常量 → 各语文案（纸张/线型/内容等）
  property-tip-translation.ts 属性 key → 各语说明
marketplace/plugins/echarts/src/i18n/
  zh-CN.ts / en-US.ts / th-TH.ts            图表插件语言包
```

`th-TH.ts` 形如：

```ts
import { shellTh } from './shell-th.js'
import { exprTh } from './expr-th.js'
export const thTH: Partial<LocaleMessages> = {
  'toolbar.save': 'บันทึก',
  ...shellTh,
  ...exprTh,
}
```

**键三方对齐**：`npm run i18n:keys -w @worm-print-platform/core` 从 zh 派生 `locale-keys.json`，`npm run i18n:check` 以及 `locale-keys.spec.ts` 校验 zh / en / th 键集合完全一致（当前 core 746 键、echarts 145 键）。

### 3.4 宿主接入

#### 3.4.1 Web Component（`<print-designer>`）

| 契约 | 说明 |
| --- | --- |
| `lang` attribute / property | 界面语言 BCP47，如 `en-US` / `th-TH`；缺省探测系统语言 |
| `messages` property（仅对象） | 自定义语言包，覆盖内置与插件译文 |
| `setLocale(locale)` 方法 | 运行时切换并立即重绘 |
| 未设 `lang` 的实例 | 跟随 core 全局 locale；显式设置的不受全局变化影响 |

```html
<print-designer lang="th-TH"></print-designer>
<script>
  const el = document.querySelector('print-designer')
  el.messages = { 'toolbar.save': 'บันทึกเอง' }  // 覆盖个别文案
  el.setLocale('zh-CN')                          // 运行时切换
</script>
```

Vue 3 门面（`@worm-print-platform/canvas/vue3`）提供同名 `lang` / `messages` props。四个演示宿主（vue2/vue3/react/jquery）的配置弹窗均含「跟随系统 / 简体中文 / English / ไทย」四档。

#### 3.4.2 全局（无宿主 UI 时）

```ts
import { setLocale } from '@worm-print-platform/core/i18n'
setLocale('th-TH')   // 全局切换，所有未显式 lang 的实例跟随
```

render 服务读 `WORM_PRINT_LOCALE`（默认 `zh-CN`）后 `setLocale`；桌面客户端主进程用 Electron `app.getLocale()` 设置。

### 3.5 插件多语言设置方案（重点）

插件语言走**自描述 + 前缀命名空间**：插件声明自己的语言包，core 引擎统一注册与检索，宿主/用户包可覆盖。

#### 3.5.1 契约：`ElementUI.i18nId` + `ElementUI.locales`

```ts
import { defineElementUI, registerElementUI } from '@worm-print-platform/plugin-kit'
import type { PluginLocaleMessages } from '@worm-print-platform/core/i18n'

const zh: PluginLocaleMessages<'myplugin'> = { 'myplugin.title': '我的插件' }
const en = { 'myplugin.title': 'My Plugin' }
const th = { 'myplugin.title': 'ปลั๊กอินของฉัน' }

registerElementUI(defineElementUI({
  types: ['myElement'],
  renderCanvas: () => '',
  i18nId: 'myplugin',                       // 命名空间 id = 键前缀
  locales: { 'zh-CN': zh, 'en-US': en, 'th-TH': th },
}))
```

#### 3.5.2 注册链路与校验

`registerElementUI()` 内部（`plugin-kit/src/registry.ts`）对每个 locale 调 `registerPluginMessages(locale, pluginId, messages)`：

1. **前缀强校验**：所有键必须以 `${i18nId}.` 开头，否则抛错（编译期 `PluginLocaleMessages<Id>` + 运行时双保险）。
2. **命名空间注册**：`instance.addResourceBundle(locale, pluginId, messages, true, true)`，pluginId 加入 `registeredPluginIds`，进入检索链 `['user', ...plugins, 'core']`。
3. **生命周期**：`registerElementUI` 返回一个 dispose 句柄，注销插件时自动 `removeResourceBundle` 清理其命名空间，不泄漏。

#### 3.5.3 插件内部取词（关键陷阱）

**不要在模块加载期把译文求值成常量**——那会冻结为当时的语言，切语言后不更新。两种正确写法：

- **控件文本**：渲染时调 core `t('myplugin.key')`（全局 locale）。当前 canvas 未向插件上下文注入实例 translator，多实例不同语言的插件面板跟随全局 locale。
- **导出常量（如 label / notes）**：存 **key**，用 getter 取词：

```ts
export const MY_KINDS = [{
  type: 'myElement',
  labelKey: 'myplugin.kind',
  get label() { return t(this.labelKey) },   // 每次读取按当前语言取词
}]
```

echarts 插件即采用此模式（`CHART_ELEMENT_UI.locales` + getter label/notes），保证 zh/en/th 切换即时生效。

#### 3.5.4 用户包覆盖插件译文

`CustomLocaleMessages` 允许写任意键，用户可覆盖插件译文：
```ts
mergeLocale('en-US', { 'myplugin.title': 'Custom Title' })
```

#### 3.5.5 图表插件语言包现状

`marketplace/plugins/echarts/src/i18n/{zh-CN,en-US,th-TH}.ts` 各 145 键，涵盖 UI 文案、十类图表名称、标签预设/位置、notes 说明。`CHART_ELEMENT_UI` 通过 `i18nId:'echarts'` + `locales` 声明；构建产物同步到兼容镜像 `packages/echarts/dist/`。

**键命名语义化**（对齐百度 ECharts 的 `series.typeNames.bar` 风格，无纯编号后缀）：

| 功能域 | 前缀 | 示例 |
| --- | --- | --- |
| 属性面板 | `echarts.panel.*` | `panel.hint.dataBinding`、`panel.label.color` |
| 图表类型名 | `echarts.series.typeNames.*` | `series.typeNames.bar`、`series.typeNames.gauge` |
| 数据标签 | `echarts.label.*` | `label.formatter.value`、`label.position.bar.top`（按图表类型分段，一一对应） |
| optionMeta 字段 | `echarts.meta.*` | `meta.chartOption`、`meta.valueFields` |
| 图表说明 notes | `echarts.notes.*` | `notes.bar`、`notes.gauge` |

插件 `locales` 与所有引用点（`ui.ts`/`label.ts`/`kinds.ts`/`plugin.ts`）统一使用语义 key；旧编号 key 已全量替换。宿主若用 marketplace CLI 安装的插件副本，升级后须重装副本，否则旧副本仍用旧 key。

> 注意：宿主若用 marketplace CLI 安装的插件副本（`.worm-print/plugins/echarts/`），升级 core/插件后需**重新安装副本**（`worm-print-marketplace install echarts --source local --repo <repo> --force`），否则旧副本无语言包会显示裸 key（canvas 对未注册语言包已加兜底：回退元素定义自带 label）。

### 3.6 非语义文案（硬编码常量）的多语言

部分文案是 core/canvas 模块级常量（中文源文本），无法走语义键。方案是**按 locale 分支的映射表**：

- `label-translation.ts`：`translateConstantLabel(label, locale)` —— 中文源 → en/th 文案（纸张预设、线型、水印密度、"内容"、边框说明等）。
- `property-tip-translation.ts`：`localizedPropertyTip(key, lang)` —— 属性 key → en/th 说明（18 条）。
- canvas 素材台 `ELEMENT_LABEL_KEYS`：`type → 语义 key`（内置元素 + 图表插件类型），渲染时 `tr(key)`；当插件语言包缺失（`tr` 返回 key 本身）时回退元素定义的 label。

新增常量文案时，须在三张表（zh 源 / en / th）同步补齐，否则对应语言显示中文源。

### 3.7 帮助文档多语言

`packages/canvas/src/shell/help-content/` 按语言拆 `zh-CN/`、`en-US/`、`th-TH/` 三目录，各六章节（getting-started / features / advanced-settings / shortcuts / faq / changelog），章节 id 一致。`getHelpSections(locale)` 按 locale 选择，`en-*`/`th-*` 走对应目录，其余回退中文。编辑时保留 HTML 标签与占位符不变。

### 3.8 Bundle 导出（给用户拷到自己项目）

`npm run i18n:bundle`（前置 `npm run build`）运行 `scripts/export-locale-bundle.mjs`，产出标准 i18next resources：

```
dist/i18n/resources.json   与   dist/i18n/resources.js   （export const resources）
结构：{ [locale]: { core, help, constants, propertyTips, echarts } }
当前：zh-CN / en-US / th-TH 三语种；core 746、echarts 145 键
```

用户项目零改动接入：

```ts
import i18next from 'i18next'
import { resources } from './resources.js'
i18next.init({
  resources,
  lng: 'th-TH',
  fallbackLng: 'zh-CN',
  keySeparator: false,
  nsSeparator: false,
  interpolation: { prefix: '{', suffix: '}', escapeValue: false },
})
```

导出脚本从 core dist 取 `getResources()` 得到 core 命名空间，从源码正则提取帮助/常量/属性说明/插件包，避免新增构建依赖。

### 3.9 新增语言 / 补齐翻译 SOP

1. 新建 `messages/{locale}.ts`、`shell-{locale}.ts`、`expr-{locale}.ts`，键与 zh 完全一致（占位符 `{name}`、HTML 标签原样保留）。
2. 主包汇总 `...shellX`、`...exprX`，并在 `i18n-instance.ts` 的 `resources` 注册、按需在 `normalizeLocale` 加别名（如 `/^ja([-_]|$)/ → 'ja-JP'`）。
3. 帮助文档加 `help-content/{locale}/` 六章节并在 `index.ts` 的 `getHelpSections` 加分支。
4. 两张常量映射表补对应语言分支；插件 `locales` 加该语言。
5. demo 配置面板加单选项；导出脚本 `LOCALES` 数组加该 locale。
6. 运行校验：`npm run i18n:keys` + `npm run i18n:check` + 全量 `npm test`。

### 3.10 校验与排查工具

- `npm run i18n:keys -w @worm-print-platform/core`：生成键清单。
- `npm run i18n:check -w @worm-print-platform/core`：校验清单与语言包一致（三方 parity）。
- `node scripts/check-hardcoded-zh.mjs <dir...>`：扫描目录残留硬编码中文 UI 文案（跳过注释与语言包）。
- `getMissingKeys()`：开发模式缺键 `console.warn`，仅当 fallback 也缺才计入。
- 回归测试：`relational-reshape` 压测、`i18n.spec.ts`、`help-i18n.spec.ts`、core 的 `locale-keys.spec.ts` / `engine.spec.ts` / `bundle.spec.ts`。

### 3.11 保持不变的业务语义

- **人民币大写**（`toUpperCaseAmount`）始终输出中文大写金额，不随 locale 变化。
- 打印 HTML 的 `<html lang>` 由 `GenerateOptions.documentLang` 控制（默认 `zh-CN`），**不随 UI 语言变化**——文档语言属于模板内容。
- 关系型数据整形工具 `reshapeRelationalData`（`packages/core/src/print/relational-reshape.ts`）与多语言无关，用于将「主表+从表」业务数据转换为打印契约要求的文档型数据。


---

## 四、插件安装与配置

插件市场让第三方能力以**独立插件包**的形式接入打印设计器。索引与插件源码常驻本仓 `marketplace/`，
不创建独立仓库；安装器 `@worm-print-platform/marketplace` 支持从 npm / GitHub / Gitee 三种来源安装，
**不指定版本时取最新稳定版**。

> 完整方案与验证记录见 [plugin-marketplace-plan.md](../plugin-marketplace-plan.md)。

### 4.1 安装插件

```bash
npx @worm-print-platform/marketplace list
npx @worm-print-platform/marketplace install echarts
npx @worm-print-platform/marketplace install echarts@1.0.0 --source npm
npx @worm-print-platform/marketplace remove echarts
```

#### 4.1.1 命令

| 命令 | 说明 |
| --- | --- |
| `list` | 列出 CLI 内置索引中的插件 |
| `install <名称>[@版本]` | 安装单个插件；缺省版本取最新稳定版 |
| `remove <名称>` | 卸载插件（删除目录与清单条目） |

#### 4.1.2 选项

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `--source npm\|github\|gitee\|auto\|local` | `auto` | 安装来源；`auto` 按 npm → GitHub → Gitee 顺序回退 |
| `--dir <路径>` | `.worm-print/plugins` | 插件落盘根目录 |
| `--repo <路径或URL>` | — | 本地市场目录（离线开发）或自定义 git 仓库地址 |
| `--force` | false | 目标已存在时覆盖安装 |
| `-h, --help` | — | 帮助 |
| `-v, --version` | — | 版本 |

#### 4.1.3 版本规则

- `<名称>` 可以是索引短 id（如 `echarts`）或完整 npm spec（如 `@worm-print-platform/plugin-echarts@1.0.0`）。
- 未带 `@版本` 即取**最新稳定版**：
  - npm 源：取 `dist-tags.latest`，若为预发布则改取最高非预发布版本；
  - GitHub / Gitee 源：列 `refs/tags/plugins/<id>/v*`，取最高非预发布 tag；无 tag 时回退默认分支并标记非稳定。
- 预发布（带 `-rc` / `-beta` / `-alpha` / `-next` / `-dev` 等后缀）不会被当作最新稳定版。
- 确定性错误（插件不存在、版本不存在、元数据不一致）**不会触发换源**；仅网络/克隆失败才回退。

#### 4.1.4 安装结果

插件落到 `<dir>/<id>/`，宿主清单写到 `<dir>` 同级的 `plugins.json`：

```json
{
  "schemaVersion": 1,
  "plugins": {
    "echarts": {
      "version": "1.0.0",
      "entry": "dist/marketplace.js",
      "kinds": ["barChart", "lineChart"],
      "exportFormats": [],
      "npmName": "@worm-print-platform/plugin-echarts",
      "source": { "mode": "npm" },
      "stable": true,
      "installedAt": "…"
    }
  }
}
```

### 4.2 宿主加载

插件入口是副作用模块，`import` 即注册；core 与 plugin-kit 的 `Symbol.for` 注册表保证跨副本单实例。

```js
// 静态 import（demo 用法）
import '../.worm-print/plugins/echarts/dist/marketplace.js'

// 或按清单动态加载
Object.values(import.meta.glob('../.worm-print/plugins/*/dist/marketplace.js', { eager: true }))
```

宿主构建工具建议对 `@worm-print-platform/core`、`@worm-print-platform/plugin-kit` 做 `dedupe`。

---

## 五、插件开发

### 5.1 插件作者指南

#### 5.1.1 元素插件

沿用 `defineElementPlugin` / `registerElementPlugin`（core）与 `defineElementUI` / `registerElementUI`
（plugin-kit），与内置元素同权。官方样板见 `packages/echarts` 与 `marketplace/plugins/echarts`。

#### 5.1.2 导出插件（Excel / Word 等）

导出能力不是新元素类型，而是与渲染结果对接的输出类插件。core 提供第二契约：

```ts
import { defineExportPlugin, registerExportPlugin } from '@worm-print-platform/core'

registerExportPlugin(defineExportPlugin({
  id: 'plugin-excel',
  version: '1.0.0',
  formats: ['xlsx'],
  async export(input, options) {
    // input.pages：渲染后的分页 HTML 与纸型尺寸
    // input.template / input.printData：模板与打印数据
    // 在浏览器侧生成文件 blob，返回 { filename, blob }
    return { filename: '报表.xlsx', blob: new Blob() }
  },
}))
```

宿主 UI 按已注册的 `formats` 自动生成「导出 Excel」「导出 Word」菜单项，调用 `export()` 后触发下载。
注意：渲染结果导出是「所见即所得」但结构化差——HTML 表格转单元格、文档排版的还原由插件自身负责。

#### 5.1.3 插件包协议

- `package.json` 带 `wormPrint` 元数据：`{ id, version, entry, kinds, exportFormats, peerDeps }`。
- `plugin.json` 放插件目录，字段与索引条目一致（id / version / npmName / entry / kinds / exportFormats / files）。
- `dist/` 必须预构建并提交；单文件 ESM；external 仅 core 与 plugin-kit，其余依赖内联。
- 插件包**可独立发布到 npm**（包名建议 `@worm-print-platform/plugin-<id>`）。

#### 5.1.4 收录与发版

1. 在本仓 `marketplace/plugins/<id>/` 开发，更新 `marketplace/marketplace.json` 索引条目，走 PR 审核。
2. 发版时同步三处版本：`marketplace.json`、`plugin.json`、`package.json`（含 `wormPrint.version`）。
3. 维护者 `npm publish` 插件包，并在本仓打 tag `plugins/<id>/vX.Y.Z` 供 GitHub / Gitee 源解析。

#### 5.1.5 示例：百度图表（唯一源码真源）

`marketplace/plugins/echarts/` 是百度图表插件的唯一源码真源：十类图表描述符、SSR 渲染器、页面执行器
与设计器 UI 均在此目录。构建脚本 `npm run build` 从同一源码同时产出：

- `@worm-print-platform/plugin-echarts`：市场主口径，根入口 `dist/marketplace.js` 一次 import 注册插件与 UI；
- `@worm-print-platform/echarts`：兼容镜像，保留原包名与全部子路径（`.`、`/kit`、`/ui`、`/node`、`/browser`、
  `/browser/executor.iife`）及原根入口行为，供存量依赖方零改动使用。

两个包均可单独 `npm publish`，README 为同一份市场口径文档（构建时同步到兼容包）。插件 id
`@worm-print-platform/echarts` 保持不变，避免既有模板的 `plugins` 声明被 contract 判为 MISSING_PLUGIN。

### 5.2 信任边界

市场不做沙箱。信任来自 PR 审核 + npm 版本锁定；插件代码在宿主进程内运行，等同于普通 npm 依赖。

---

## 六、迁移与故障排查附录

### 6.1 从 @worm-vue3-print 迁移（摘要）

老仓库 `@worm-vue3-print` 的用户迁移目标是**业务代码零改动**，只换依赖与 import。核心包名映射：

| 旧（worm-vue3-print） | 新（worm-print-platform） |
| --- | --- |
| `@worm-vue3-print/core` | `@worm-print-platform/core`（子路径 `/designer` `/browser` `/client` 保持，另增 `/node`） |
| `@worm-vue3-print/canvas`（Vue 3 组件） | `@worm-print-platform/canvas/vue3`（模板、事件、ref、业务逻辑一行不动；样式内置，删掉 `style.css` 的 import） |
| `@worm-vue3-print/common`（零框架） | `@worm-print-platform/canvas`（UMD 由 `common.js/common.css` 改为 `canvas.js/canvas.css`，全局 `window.WormPrintCommon` → `window.WormPrintCanvas`） |
| `@worm-vue3-print/echarts` + `echarts-common` | `@worm-print-platform/echarts`（一行 `import '@worm-print-platform/echarts/ui'` 替代两步） |
| `@worm-vue3-print/plugin-kit` | `@worm-print-platform/plugin-kit`（契约与注册表同名同形） |

三条迁移路径：

- **路径 A · Vue 3 组件用户**：换依赖 → import 与类型来源集中到 `/vue3` 子路径 → 换可选图表扩展包。
- **路径 B · 零框架用户**：NPM 接入改包名；UMD 直挂替换两份静态文件并改全局名；依赖 `<print-designer>` / property 注入 / CustomEvent 的业务代码不动。
- **路径 C · 源码 / 工作区引入用户**：`plugin-kit` / `echarts` 全部改为 npm 正式包，删掉 Vite `resolve.alias` 与 `tsconfig.paths` 的旧别名。

完整映射表、逐条 diff、行为差异 15 条清单与 AI 迁移提示词见 [migration-worm-vue3-print.md](../migration-worm-vue3-print.md)。

### 6.2 故障排查 FAQ

- **插件装了不生效**：确认 `dist/` 已预构建、入口副作用模块已被 `import`（静态 import 或按清单动态加载），构建工具对 `@worm-print-platform/core` 与 `@worm-print-platform/plugin-kit` 做了 `dedupe`；CLI 重装副本后旧副本可能残留，需带 `--force` 重装。
- **切换语言后译文不更新**：不要在模块加载期把译文求值成常量——那会冻结为当时的语言。控件文本在渲染时调 `t()`；导出常量存 key、用 getter 每次读取取词。
- **跨副本注册失效**：core 与 plugin-kit 用 `Symbol.for` 全局注册表保证单实例；若出现"注册了却找不到"，检查是否打包出多份 core / plugin-kit，并做 `dedupe`。
- **打印不出纸**：按三条链路分别排查——浏览器打印确认 iframe 已加载且调用 `contentWindow.print()`；服务端 PDF 确认 `services/render` 已部署且后端持密钥代理；静默打印确认本机客户端已启动且监听 `127.0.0.1:17521`。

更完整的诊断步骤、常见报错与环境检查见 integration 技能的 [troubleshooting.md](../../skills/worm-print-platform-integration/references/troubleshooting.md)；服务端 PDF 与静默打印分别见同目录的 `server-render.md` 与 `silent-print.md`。
