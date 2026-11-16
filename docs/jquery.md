# jQuery / 原生 JS 接入打印设计器（浏览器直挂）

> 操作方法 + AI 集成提示词。可运行完整示例：`demos/apps/jquery`（9334，无打包器）。
> 直挂形态：插件不进 `import`，页面挂一个 `<link>` + 一个 `<script>`，
> 业务代码用 `window.WormPrintCanvas` 全局 + jQuery 操作 DOM。

## 1. 安装（拷两份静态文件）

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

## 2. 最小接入

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

## 3. 出纸

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

## 4. 直挂必知约定（漏了必踩坑）

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

## 5. AI 工具集成提示词（复制给 AI 编程工具即可）

对应技能：**`worm-print-platform-integration`**（安装方法见 [README](./README.md#技能安装方法提示词第-0-步的通用说明)）。

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
