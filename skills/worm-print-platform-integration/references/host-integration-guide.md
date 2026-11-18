# 全栈宿主集成指南

面向「任意前端宿主 + 任意后端」的完整接入方案。设计器库只提供画布与渲染组件，**所有业务后端（模板存储、字段元数据、业务数据组装、PDF 代理）都由宿主实现**。本指南给出最小集合与可直接套用的骨架。前端示例提供两种形态：原生 DOM + `<print-designer>`（原生 JS / React / Vue 2），与 **Vue 3 门面组件** `@worm-print-platform/canvas/vue3`（Vue 3 宿主首选，原 `@worm-vue3-print/canvas` 项目迁移后代码不变）。两条链路的出纸代码完全一致。

## 1. 整体架构与三条链路

```
                    ┌─────────────── 宿主后端（自建）───────────────┐
模板管理/设计器页面 ─►  模板 CRUD、设计器初始化(模板+字段树+示例数据)
业务页面「打印」按钮 ─►  渲染数据端点：取模板 elements + 按单据组装 printData
                    └───────────────┬───────────────────────────┬────┘
                                    │ {templateJson, printData, │
                                    │  baseUrl}                  │ 代理 POST /render/pdf（注入 X-Render-Key）
                                    ▼                            ▼
                ┌──────────── 浏览器侧渲染 / 出纸 ──────────┐    services/render 微服务
                │ 链路 A：core/browser renderHtmlPages       │    （Playwright 两遍渲染 → PDF）
                │         → iframe → contentWindow.print()   │
                │ 链路 B：同源代理 → 渲染服务 PDF            │
                │ 链路 C：@worm-print-platform/core/client   │
                │         → WebSocket 127.0.0.1              │
                └──────────────┬───────────────────────────┘
                               ▼
              桌面打印客户端（Electron，clients/client，本机运行）
               core/browser 渲染 → webContents.print 静默出纸
```

- 链路 A（浏览器打印）：后端只返回数据包，前端用 core 同构渲染并调浏览器打印。零额外基础设施。
- 链路 B（服务端 PDF）：后端把同一数据包转发给 `services/render` 微服务，拿回 PDF 字节流。用于电子存档、下载、批量，见 [服务端渲染](server-render.md)。
- 链路 C（桌面客户端静默打印）：数据包与链路 A 完全一致；前端经 `@worm-print-platform/core/client` 直连本机客户端，由客户端复用 `core/browser` 渲染并静默出纸（无打印对话框）。见 [静默打印](silent-print.md)。
- 三者可并存：预览弹窗里「打印」走 A，「下载 PDF」按需走 B，工位出纸按钮走 C。

## 2. 数据库：模板表（必须自建）

模板 JSON（elements）与宿主元信息分开存储。最小字段设计（类型以 PostgreSQL 表述，MySQL 等价改写）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | BIGINT | 是 | 主键，宿主主键策略自定 |
| `name` | VARCHAR(200) | 是 | 模板名称（宿主元信息） |
| `business_type` | VARCHAR(100) | 是 | 业务类型标识，如 `order_info`；模板与业务单据、字段树的关联键，需有枚举/字典约束 |
| `elements` | TEXT | 是 | 设计器 `getTemplateJson()` 序列化结果；存 JSON 字符串，**不要拆表、不要二次结构化** |
| `paper_config` | TEXT | 否 | 纸张配置 JSON；elements 中已含 paperSize 时可省 |
| `remark` | VARCHAR(500) | 否 | 备注 |
| `is_default` | BOOLEAN | 是 | 是否该业务类型的默认模板，默认 false |
| `tenant_id` | BIGINT | 否 | 多租户才需要 |
| `deleted` | BOOLEAN | 是 | 逻辑删除标记，默认 false |
| `create_time` / `update_time` | TIMESTAMP | 是 | 审计时间 |

约束：同一业务类型（多租户再加租户维度）仅允许一个默认模板，用部分唯一索引或应用层事务保证。

要点：新建模板时 `elements` 不要留空，用前端 `createDefaultTemplate()` 序列化后写入，保证未进设计器也能渲染。字段元数据是否建表可选（见第 4 节）。

## 3. 后端需要提供的功能（路由/风格不限）

不规定具体 API 设计，宿主按自己的框架与命名风格实现即可。

**模板管理**：分页列表（可按名称、业务类型筛选，列表只返回元信息不带 elements）、新建（元信息 + 初始 elements）、更新（设计器保存通常只提交 `{id, elements}`，元信息修改走同一功能）、详情（按 id 返回含 elements 的完整模板供编辑回填）、删除（逻辑删除，删默认模板时把同业务类型其他模板提升为默认）、业务类型字典、默认模板查询与设置、设计器初始化聚合（一次拿齐模板详情 + 字段树 + 可选示例数据）。

聚合返回形态（字段名示意，契约需保持）：

```json
{
  "template": { "id": "...", "name": "...", "businessType": "order_info", "elements": "{...JSON字符串...}", "remark": "" },
  "fields": [ { "fieldKey": "order.no", "fieldLabel": "单号", "fieldType": "string", "sortOrder": 1 } ],
  "printData": [ { "order": { "no": "SO-001" }, "goods": [] } ]
}
```

`printData` 可为空数组（前端预览回退 `DEFAULT_DEMO_DATA`），建议返回一份与字段树匹配的示例数据。

**渲染数据组装（链路 A 核心功能）**：按「模板 id + 业务单据 id」产出渲染数据包——取 elements 并 `JSON.parse` 成对象作为 `templateJson`，按业务单据组装 `printData`，需要时给 `baseUrl`（把相对路径图片拼成渲染环境可访问的绝对地址）。`printData` 兼容单对象与对象数组（数组=一次多份，每份独立分页）。返回 `{templateJson: Object, printData: Object|Object[], baseUrl?: string}`。

**链路 B 额外功能**：PDF 代理，入参与渲染数据一致，组装好后转发 `services/render` 并注入 `X-Render-Key`，原样返回 `application/pdf`；需支持设计器免保存场景（前端直接给 `templateJson`，后端配 demo 数据透传）。

**链路 C 额外功能**：无，与链路 A 共用「渲染数据组装」。打印机、份数、纸张等配置由宿主前端按模板维护，随请求下发；出纸由本机客户端完成，客户端不持久化业务打印配置。

## 4. 业务字段元数据（fields）的三种来源

1. **前端常量**：业务类型少、字段稳定时最简单。
2. **配置表**：建 `sys_print_business_field(business_type, field_key, field_label, field_type, sort_order)`，提供管理界面。
3. **注解反射（推荐，多业务类型）**：在打印数据 VO 上标注解，后端反射生成字段树，保证「字段定义」与「实际打印数据结构」永远一致。

注解反射模式（以 Java 为例）：

```java
public class OrderPrintVO {
    @PrintField(label = "单号", order = 1)
    private String orderNo;                    // → fieldKey "orderNo"
    @PrintField(label = "开单时间", type = "date", order = 2, pattern = "yyyy-MM-dd HH:mm")
    private LocalDateTime createTime;
    @PrintField(label = "商品明细", type = "list", order = 10)
    private List<Goods> goods;                 // type="list" 标记数据源，反射递归展开
    public static class Goods {
        @PrintField(label = "商品名称", order = 1)
        private String name;                   // → fieldKey "goods.name"
        @PrintField(label = "数量", type = "number", order = 2)
        private BigDecimal qty;
    }
}
```

递归收集带注解字段，嵌套对象用 `前缀.字段名` 拼路径，`type="list"` 取集合泛型元素类继续递归，按 `order` 升序。新增业务类型 = 新增枚举值 + 一个 VO + 一个绑定。

## 5. 前端五个必备片段

### 5.1 新建/编辑模板弹窗（元信息 + 初始 elements）

```js
import { createDefaultTemplate } from '@worm-print-platform/canvas'
const payload = {
  name: form.name,
  businessType: form.businessType,
  remark: form.remark,
  elements: JSON.stringify(createDefaultTemplate()), // 必须给默认可渲染 JSON，不要留空
}
await saveTemplate(payload)
```

### 5.2 设计器页（正确接线示例）

**形态一：原生 `<print-designer>`（原生 JS / React / Vue 2 及任意框架）**

```html
<div class="designer-host" style="height:100%">
  <print-designer id="designer" is-edit="true" show-help="true"></print-designer>
</div>
```

```js
import { registerAll, createDefaultTemplate } from '@worm-print-platform/canvas'
import { getDesignerData, updateTemplate } from '@/api/print'
registerAll()

const el = document.getElementById('designer')
let templateData = createDefaultTemplate()
let fields = []
let printData = []
let templateId = ''

function syncDesigner() {
  el.fields = fields
  el.template = templateData
}
el.addEventListener('save', e => {
  if (!templateId) return // 元信息应先在弹窗创建落库，设计器只更新 elements
  updateTemplate({ id: templateId, elements: e.detail })
})
el.addEventListener('preview', e => openPreview(e.detail)) // detail = 当前画布 JSON

async function load(id) {
  templateId = id
  const res = await getDesignerData(id)
  const json = JSON.parse(res.data.template.elements || '{}')
  if (json.paperSize) templateData = json // 仅有效模板覆盖默认值
  fields = res.data.fields
  printData = res.data.printData ?? []
  syncDesigner()
}
```

注意：父容器必须有确定高度（自定义元素默认 `display:inline`，需要块级宽高，否则画布塌陷）；对象/函数只能赋 property；不要调用不存在的 `setTemplateMeta`；模板名称/类型等元信息显示在宿主自己的 header，不写进设计器实例。

React 宿主把上面 `syncDesigner()` 放进 `useEffect`，并把 `el.addEventListener` 与对应 `removeEventListener` 成对登记（React StrictMode dev 会双跑）。

**自定义打印/预览业务时隐藏工具栏按钮**：宿主接管打印与预览逻辑（自己的按钮、弹窗、出纸链路）时，把设计器工具栏的「预览 / 保存」按钮藏掉，避免两套入口并存：原生写 `el.showPreview = false` / `el.showSave = false`（或声明式 `show-preview="false"` / `show-save="false"`），Vue 3 门面写 `:show-preview="false"` / `:show-save="false"`。两个开关独立、默认显示（契约 1.1.0 起）。隐藏只影响按钮出图：`save()` 方法、`save` / `preview` 事件照常可用，宿主仍可在自己的业务流程里调 `el.save()` 触发校验与保存事件。

**形态二：Vue 3 门面组件（Vue 3 宿主；原 `@worm-vue3-print/canvas` 项目迁移后写法不变）**

```vue
<template>
  <PrintDesigner
    ref="designerRef"
    :initial-template="templateData"
    :fields="fields"
    :is-edit="!!templateId"
    :upload-image="uploadImage"
    @save="handleSave"
    @preview="handlePreview"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { PrintDesigner, createDefaultTemplate } from '@worm-print-platform/canvas/vue3'
import type { PrintBusinessField, TemplateData } from '@worm-print-platform/canvas/vue3'
import { updateTemplate, getDesignerData } from '@/api/print'

const route = useRoute()
const templateId = String(route.params.id || '')
const designerRef = ref<InstanceType<typeof PrintDesigner>>()
const templateData = ref<TemplateData>(createDefaultTemplate())
const fields = ref<PrintBusinessField[]>([])
const printData = ref<Record<string, any>[]>([])

async function handleSave(json: string) {
  if (!templateId) return // 元信息（名称/类型）应先在弹窗创建落库，设计器只更新 elements
  await updateTemplate({ id: templateId, elements: json })
}

function handlePreview() {
  // ref.getTemplateJson() 返回对象；配合 printData 或 DEFAULT_DEMO_DATA 打开预览弹窗（见 5.4）
  const tpl = designerRef.value?.getTemplateJson()
  openPreview({ templateJson: tpl, printData: printData.value, baseUrl: location.origin })
}

onMounted(async () => {
  if (!templateId) return
  const res = await getDesignerData(templateId)
  const json = JSON.parse(res.data.template.elements || '{}')
  if (json.paperSize) templateData.value = json // 仅在是有效模板时覆盖默认值
  fields.value = res.data.fields
  printData.value = res.data.printData ?? []
})
</script>
```

门面形态无需 `registerAll()`、无需手动赋 property、无需引样式、无需 `isCustomElement` 配置——这些正是门面替宿主做的事。`initial-template` 赋新引用即可重载画布（设计器按引用变化记录一次历史，撤销可回退）。从 `@worm-vue3-print/canvas` 迁来的项目除 import 路径外逐字保留原代码。

### 5.3 业务打印按钮（选模板 → 取数 → 预览）

```js
const props = { businessType: 'order_info', orderId: 'SO-001' }
async function handlePrint() {
  const tplRes = await pageTemplate({ businessType: props.businessType, current: 1, size: 100 })
  const templateId = await pickTemplate(tplRes.data.records) // 宿主选择交互
  const res = await renderData({ templateId, businessType: props.businessType, orderId: props.orderId })
  openPreview(res.data) // {templateJson, printData, baseUrl}；链路 B 才显示「下载 PDF」
}
```

### 5.4 预览弹窗与出纸

预览弹窗宿主自建（全屏容器 z-index 需高于 UI 库弹层）。三条链路封装：

```js
import { renderHtmlPages, browserCodeRenderer } from '@worm-print-platform/core/browser'
import { PrintClient } from '@worm-print-platform/core/client'

async function buildPreview({ templateJson, printData, baseUrl }) {
  const rendered = await renderHtmlPages(templateJson, printData, baseUrl, browserCodeRenderer)
  writeHtmlToFrame(previewIframe, rendered.html) // 含 warnings 可展示
  return rendered
}
// 链路 A
function printBrowser() { previewIframe.contentWindow.print() }
// 链路 C（浏览器已渲染，直送预渲染 HTML 给本机客户端）
async function printSilent(rendered) {
  const client = new PrintClient()
  await client.connect()
  await client.printHtml(rendered, { printerName: '热敏-80', copies: 1 })
}
```

链路 B 下载 PDF：前端请求同源代理端点（如 `/render-api/render/pdf`），`responseType:'blob'` 接收后 `a.download`，密钥由代理注入，不进前端 bundle。

**Vue 3 门面形态**：预览层直接用门面的 `PrintHtmlPreview` 组件，不必自己写 iframe 封装——

```vue
<PrintHtmlPreview
  ref="previewRef"
  :template-json="previewTemplate"
  :print-data="printData"
  base-url="/files"
  @rendered="(pageCount, copies) => pageCountText = `${pageCount} 页 × ${copies} 份`"
  @error="previewError = $event"
/>
<button type="button" @click="previewRef?.print()">打印</button>
```

组件内部就是 `renderHtmlPages` + iframe + 缩放档位，渲染警告（出纸裁切预估）以顶部提示条展示；`ref.print()` 走链路 A，链路 C 仍用 `PrintClient.printHtml()`，链路 B 代理端点同上。

### 5.5 图片上传适配器（可选）

设计器图片元素上传时注入 `uploadImage: (file: File) => Promise<string>`，返回可直接访问的 URL；复用宿主现有上传接口。服务端渲染时该 URL（或模板相对路径 + `baseUrl`）必须能被渲染微服务访问到。

## 6. printData 组装规则（后端最易错处）

- printData 结构必须与字段树 `fieldKey` 严格对应：`orderNo` → `printData.orderNo`；`goods.name` → `printData.goods[i].name`。
- 明细表格：`fieldType:'list'` 字段（如 `goods`）在 printData 中必须是**数组**；表格行 `dataSource` 指向该字段名；明细列表达式写完整路径 `{goods.name}`。
- 无点且作为前缀的字段记录（如 `goods` 与 `goods.name`）用于字段树分组，需一并返回。
- 图片字段给可访问 URL；相对路径配合 `baseUrl`。
- 一次打印多份：传对象数组，每份独立分页（SVG 字体基址另可用 `fontBaseUrl`）。

## 7. 落地顺序建议

1. 建模板表 + CRUD + 业务类型字典；前端做列表页与新建弹窗（先用 `createDefaultTemplate`）。
2. 做设计器页，跑通「新建 → 进设计器 → 保存 elements → 重新进入回填」。
3. fields 先用前端常量跑通字段树，再接后端（推荐注解反射）。
4. 做渲染数据组装 + 业务打印按钮 + 预览弹窗，用真实单据跑通链路 A。
5. 需要电子存档 PDF 时部署 `services/render`，后端加链路 B 代理与「下载 PDF」按钮。
6. 需要工位静默出纸时分发客户端，前端经 `@worm-print-platform/core/client` 加「静默打印」按钮走链路 C。

## 宿主 MCP（可选）

需要 AI 读取或修改当前设计器画布时，宿主页面还需通过 `@worm-print-platform/core/client` 注册 `template.get/apply` 并向桌面客户端签到；写回必须携带 `baseRevision` 并处理冲突。真实可运行骨架见 `demos/shared/template-session.ts`，说明见 [宿主 MCP 集成](mcp-host-integration.md)。所有 MCP 模板操作都围绕已签到的实时会话执行。
