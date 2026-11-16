# React 18 接入打印设计器

> 操作方法 + AI 集成提示词。可运行完整示例：`demos/apps/react`（9335）。
> React 走零框架主入口 `<print-designer>` 自定义元素：未知标签按原生元素渲染，
> 无编译期配置；差异全在运行期——property 注入与 `addEventListener`。

## 1. 安装

```bash
npm install @worm-print-platform/canvas @worm-print-platform/core
```

`canvas` 与 `core`、`plugin-kit` 同号同批发版，显式装同版本并提交锁文件。

## 2. 最小接入

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

## 3. 出纸

- **A 浏览器打印**：`import { renderHtmlPages, browserCodeRenderer } from '@worm-print-platform/core/browser'`
  渲染进 iframe → `iframe.contentWindow.print()`。
- **B 服务端 PDF / C 静默打印**：`PrintClient` 从 `@worm-print-platform/core/client` 导入，
  `printHtml(rendered)` 直送本机客户端（`127.0.0.1`，与浏览器同机）；PDF 走后端代理。

## 4. React 必知约定（漏了必踩坑）

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

## 5. AI 工具集成提示词（复制给 AI 编程工具即可）

对应技能：**`worm-print-platform-common`**（安装方法见 [README](./README.md#技能安装方法提示词第-0-步的通用说明)）。

```text
【第 0 步 · 门控：未完成禁止改代码】
1. 安装接入技能：从 https://github.com/worm-longliu/worm-print-platform 仓库取
   skills/worm-print-platform-common 整个目录，复制到你的技能目录并重载
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
