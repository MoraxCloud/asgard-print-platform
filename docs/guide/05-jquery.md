# jQuery / 原生 JS 接入（No-Bundler Integration）

[← 返回目录](./README.md) | ← 上一篇：[React 18 接入](./04-react.md) | 下一篇：[多语言配置与自定义](./06-i18n.md) →

> 目标：在无打包器的静态页面里用 UMD 产物直挂 `<print-designer>`，接出「设计器 → 预览 → 打印」。
> 可运行完整示例：`demos/apps/jquery`（9334，无打包器）。业务代码用 `window.WormPrintCanvas` 全局 + jQuery 操作 DOM。

## 1. 前置条件（Prerequisites）

- 已完成 [01](./01-getting-started.md)；一个可运行的静态站点（无打包器、无 bare import）。
- 能从 npm 包取出 UMD 产物并放到站点静态目录（等价于从制品库取件）。

## 2. 步骤（Steps）

### 2.1 拷两份静态文件

```bash
npm install @worm-print-platform/canvas
# UMD 脚本与 CSS 都来自 canvas 包 dist：./browser 导出 dist/canvas.js，./style.css 导出 dist/canvas.css
cp node_modules/@worm-print-platform/canvas/dist/canvas.js  static/vendor/worm-print-canvas.js
cp node_modules/@worm-print-platform/canvas/dist/canvas.css static/vendor/worm-print-canvas.css
```

> 路径口径（以 `packages/canvas/package.json` 的 `exports` 为准）：`canvas.js` 是 `./browser` 子路径的 UMD 产物（也是包根 `default`），`canvas.css` 是 `./style.css` 导出指向的 `dist/canvas.css`。不要凭子路径去猜 CSS 文件名；产物名以安装版本的实际 `dist/` 内容为准。

`canvas.js` 是 UMD，已内联 core 与码制库，挂出全局 `window.WormPrintCanvas`；除 `registerAll / createDefaultTemplate / PrintDesignerElement` 外还带 `renderHtmlPages / browserCodeRenderer / PrintClient / WormPrintError / getPaperDimensions / getByPath` 等出纸与几何入口——直挂宿主所有能力都从这个全局取。

### 2.2 页面引用（顺序即加载顺序）

```html
<link rel="stylesheet" href="/static/vendor/worm-print-canvas.css" />
<!-- body 末尾 -->
<script src="/static/vendor/worm-print-canvas.js"></script>
<script src="/src/app.js"></script>
```

### 2.3 注册、挂载、注入、监听（`src/app.js`，可直接复制运行）

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
el.template = WormPrintCanvas.createDefaultTemplate() // 保存后回填时换成你的模板对象
el.uploadImage = async file => {
  // TODO: 换成你的上传接口，返回可访问 URL；此处用本地 URL 占位
  return URL.createObjectURL(file)
}

// jQuery 包了一层事件对象：e.detail 是 undefined，必须取 e.originalEvent.detail
$(el).on('save', e => {
  const elements = JSON.parse(e.originalEvent.detail)
  // TODO: 提交 elements 到你的模板接口，元信息分开存储
})
```

**样式**：`print-designer` 默认 `display:inline`，不给块级宽高设计器整体塌陷：

```css
.demo-container print-designer { display: block; width: 100%; height: 100%; }
```

Shadow DOM 不需要外链 CSS；`worm-print-canvas.css` 是 light DOM 兜底与 `:host` 基线，照抄时一并引入无害。

### 2.4 出纸（Printing）

```js
// A 浏览器打印：全局自带同构渲染（core 执行器已内联）
const rendered = await WormPrintCanvas.renderHtmlPages(
  JSON.parse(el.getTemplateJson()), printData, location.origin, WormPrintCanvas.browserCodeRenderer)
const frame = document.getElementById('preview-frame')
const doc = frame.contentWindow.document   // 写进预览 iframe
doc.open(); doc.write(rendered.html); doc.close()
frame.contentWindow.print()

// C 静默打印：直送本机客户端（127.0.0.1，与浏览器同机；BUSY 由宿主排队重试）
new WormPrintCanvas.PrintClient({ timeoutMs: 20000 }).printHtml(rendered)
```

B 服务端 PDF：同源 `/render-api/*` 由宿主后端代理到 `services/render` 并注入密钥，前端不持密钥（见 01）。

## 3. 验证（Verification）

- 页面无需构建直接打开可用：设计器渲染、块级宽高正常、无控制台报错。
- 保存 → 重新打开回填 → 预览渲染真实数据 → 浏览器打印；B/C 按 01 验收点追加。

## 4. 排错（Troubleshooting）

| 症状 | 原因 / 处理 |
| --- | --- |
| 设计器塌陷 / 看不到 | 自定义元素默认 `display:inline`，补块级宽高 CSS |
| 读不到 fields | `fields` 没有 getter，读回看 `el.store.fields`；`el.template` getter 返回当前画布 JSON |
| `e.detail` 是 undefined | jQuery 事件取 `e.originalEvent.detail`；原生 `addEventListener` 才是 `e.detail` |
| `[hidden]` 不生效 | 宿主样式把遮罩写成 `display:flex` 会盖掉 `[hidden]` 的 UA 规则；切换 `hidden` 时同步一行内联 `display` |
| 报 bare import / 模块解析错 | 无打包器 ⇒ `src/*.js` 只能相对路径互引，能力全从 `WormPrintCanvas` 全局取，npm 包名不得出现在业务代码 |
| 事件 detail 解析错 | `save`/`preview` 的 detail 是 JSON 字符串需 parse；`dblclick-*` 不要 parse |
| 保存后未回填 | 用新 template 对象赋 `el.template`；导出前先 `el.validateTemplate()` |

## 5. AI 工具集成提示词（场景差异）

通用门控/安装/验收模板见 [01 §5](./01-getting-started.md#5-ai-提示词模板唯一模板源)，本场景额外约束：

```text
【宿主形态】jQuery / 原生 JS 浏览器直挂，无打包器，无 bare import。
- 从 @worm-print-platform/canvas 主入口产物取 canvas.js + 包导出 style.css 拷进静态目录；
  页面 <link> + <script> 引入，能力全部从 window.WormPrintCanvas 全局取，业务代码不出现 npm 包名。
- WormPrintCanvas.registerAll() 全局一次；对象/函数入参赋 property，字符串开关写 attribute。
- jQuery 事件用 $(el).on(...) 且取 e.originalEvent.detail；原生监听用 e.detail。
- 自定义元素补块级宽高 CSS。
【验收】页面无构建直接打开可用；保存→回填→预览→打印链路跑通；不虚构 API（无 setTemplateMeta、back；fields 读回用 el.store.fields）。
```

[← 返回目录](./README.md) | ← 上一篇：[React 18 接入](./04-react.md) | 下一篇：[多语言配置与自定义](./06-i18n.md) →
