# Vue 3 接入打印设计器

> 操作方法 + AI 集成提示词。可运行完整示例：`demos/apps/vue3`（9331）。
> Vue 3 是一等支持路径：`@worm-print-platform/canvas/vue3` 正式门面与原 `@worm-vue3-print/canvas`
> 组件同形，原项目只换依赖与 import，模板、事件、ref 调用、业务逻辑一行不动。

## 1. 安装

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

## 2. 最小接入（组件门面写法，无需 isCustomElement / 无需引 CSS）

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

## 3. 出纸

- **A 浏览器打印**：预览层「打印」按钮调 `previewRef.print()`（门面已封装同构渲染 + `contentWindow.print()`）。
- **B 服务端 PDF**：部署 `services/render` 微服务，后端代理 `/render/pdf` 并注入密钥；前端不持密钥。
- **C 静默打印**：`import { PrintClient } from '@worm-print-platform/core/client'`，`connect()` 后
  `printHtml(rendered)` 直送本机客户端出纸（客户端绑定 `127.0.0.1`，须与浏览器同机）。

## 4. Vue 3 必知约定

1. 模板 JSON 与宿主元信息分离存储；`save` 的 `json` 只含画布 elements。
2. `getTemplateJson()` 绕过拼版校验——保存/导出前先调 `validateTemplate()`。
3. 换模板重载用新的 `initial-template` 引用（或元素形态的 `el.template = 新对象`），不要复用旧引用。
4. 需要读当前画布 JSON 时用 `designerRef.value.getTemplateJson()`。
5. 迁移自 `@worm-vue3-print/canvas` 的项目：`import type` 也可直接换到 `/vue3`，无需改任何类型引用。

## 5. AI 工具集成提示词（复制给 AI 编程工具即可）

对应技能：**`worm-print-platform-integration`**（安装方法见 [README](./README.md#技能安装方法提示词第-0-步的通用说明)；
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
