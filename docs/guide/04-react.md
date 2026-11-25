# React 18 接入（React 18 Integration）

[← 返回目录](./README.md) | ← 上一篇：[Vue 2.7 接入](./03-vue2.md) | 下一篇：[jQuery / 原生 JS 接入](./05-jquery.md) →

> 目标：在 React 18 工程里用零框架主入口 `<print-designer>` 接出「设计器 → 预览 → 打印」。
> 可运行完整示例：`demos/apps/react`（9335）。React 把未知标签按原生元素渲染，无编译期配置；差异全在运行期——property 注入与 `addEventListener`。

## 1. 前置条件（Prerequisites）

- 已完成 [01](./01-getting-started.md)；一个 React 18 工程（函数组件 + hooks）。
- `npm install @worm-print-platform/canvas @worm-print-platform/core`，同号同批并锁文件。

## 2. 步骤（Steps）

### 2.1 一次性注册（`src/main.jsx`）

```jsx
import { registerAll } from '@worm-print-platform/canvas'
registerAll() // 全局一次，注册 <print-designer>；React 无 isCustomElement 这类编译配置
```

### 2.2 组件内挂载与注入（可直接复制运行）

```jsx
import { useRef, useEffect } from 'react'
import { createDefaultTemplate } from '@worm-print-platform/canvas'

function PrintDesignerHost({ fields, template, printData, onSave }) {
  const designerRef = useRef(null)
  const handlersRef = useRef({ onSave, printData })   // 事件只注册一次，读 ref 取最新 props
  handlersRef.current = { onSave, printData }

  useEffect(() => {
    const el = designerRef.current
    if (!el) return
    // 对象 / 数组 / 函数只能赋 property；JSX 的 template={obj} 会被字符串化为 [object Object]
    el.fields = fields
    el.template = template ?? createDefaultTemplate()
    el.uploadImage = async file => {
      // TODO: 换成你的上传接口，返回可访问 URL
      return URL.createObjectURL(file)
    }

    // JSX 的 onSave 不会绑定 CustomEvent，必须 addEventListener，cleanup 成对解绑
    const handleSave = e => handlersRef.current.onSave?.(JSON.parse(e.detail))
    el.addEventListener('save', handleSave)
    return () => el.removeEventListener('save', handleSave)
    // 依赖留空：state 走 ref 桥接，避免频繁重绑（StrictMode dev 双跑 effect 也不重复）
  }, [])

  return <print-designer ref={designerRef} is-edit="true" show-help="true" />
}
```

> `fields` / `template` / `printData` 由父组件按业务提供（见 01 宿主最小清单）。若后续需更新模板，用新的 `template` 对象重新赋 `el.template`，不要复用旧引用。

**样式**：`print-designer` 默认 `display:inline`，容器不给块级宽高会整体塌陷：

```css
.print-host print-designer { display: block; width: 100%; height: 100%; }
```

Shadow DOM 内联注入样式，普通用法无需引 CSS；只有 light DOM 形态才 `import '@worm-print-platform/canvas/style.css'`。

### 2.3 出纸（Printing）

**A 浏览器打印**：

```js
import { renderHtmlPages, browserCodeRenderer } from '@worm-print-platform/core/browser'

const rendered = await renderHtmlPages(
  JSON.parse(el.getTemplateJson()), printData, location.origin, browserCodeRenderer)
const frame = previewRef.current            // 你的预览 iframe
const doc = frame.contentWindow.document
doc.open(); doc.write(rendered.html); doc.close()
frame.contentWindow.print()
```

**B 服务端 PDF / C 静默打印**：`PrintClient` 从 `@worm-print-platform/core/client` 导入，`printHtml(rendered)` 直送本机客户端（`127.0.0.1`，与浏览器同机）；PDF 走后端代理（见 01）。完整后端契约见技能 `references/server-render.md`、`references/silent-print.md`。

## 3. 验证（Verification）

```bash
npm run build   # 通过（含 TypeScript 项目先 typecheck）
npm run dev     # 保存 → 重新打开回填 → 预览渲染真实数据 → 打印
```

## 4. 排错（Troubleshooting）

| 症状 | 原因 / 处理 |
| --- | --- |
| JSX 传对象后变 `[object Object]` | 对象/函数入参在 `useEffect` 里赋 property；JSX 属性会被 React 字符串化 |
| 保存事件重复触发 | `StrictMode` dev 双跑 effect；`addEventListener` 必须在 cleanup 里 `removeEventListener` |
| 事件里读到旧 state | 一次性注册的处理器用 `useRef` 桥接读最新值（见 2.2 的 `handlersRef`） |
| 读不到 fields | `fields` 没有 getter，读回看 `el.store.fields`；`el.template` getter 返回当前画布 JSON |
| 预览 iframe 拿不到节点 | 条件渲染时等 DOM 提交后再取 `ref.current` 写 HTML；Esc 关闭的 `keydown` 打开时绑、关闭时解绑 |
| 事件 detail 解析错 | `save`/`preview` 的 detail 是 JSON 字符串需 parse；`dblclick-element` / `dblclick-cell` 不要 parse |
| 保存后未回填 | 用新 template 对象赋 `el.template`；导出前先 `validateTemplate()` |

## 5. AI 工具集成提示词（场景差异）

通用门控/安装/验收模板见 [01 §5](./01-getting-started.md#5-ai-提示词模板唯一模板源)，本场景额外约束：

```text
【宿主框架】React 18（函数组件 + hooks），构建器按项目现状。
- 入口一次性 registerAll()；无编译期自定义元素配置。
- JSX 只写字符串 attribute（is-edit="true" 等）；fields/template/uploadImage 等对象与函数
  在 useEffect 里经 ref 赋 property，JSX 属性传对象会被字符串化。
- 事件一律 addEventListener + cleanup 解绑（StrictMode 双跑防护）；一次性处理器用 useRef 桥接读最新 state。
- save/preview detail 是 JSON 字符串；dblclick-* detail 不要 parse。
【验收】类型检查/构建通过；保存→回填→预览→打印链路跑通；不虚构 API（无 setTemplateMeta、back；JSX 的 onSave 不绑定 CustomEvent）。
```

[← 返回目录](./README.md) | ← 上一篇：[Vue 2.7 接入](./03-vue2.md) | 下一篇：[jQuery / 原生 JS 接入](./05-jquery.md) →
