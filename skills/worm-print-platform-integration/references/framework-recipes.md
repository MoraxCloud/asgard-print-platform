# 框架接入要点

所有宿主消费的是同一个 `<print-designer>`，差异只有两处：编译期要不要放行未知标签、对象入参在哪一帧赋 property。可运行工程见 `demos/apps/{vue3,vue2,react,jquery}`。

## Vue 2.7

- `main.js`：`registerAll()` + `Vue.config.ignoredElements = ['print-designer']`（否则报 `Unknown custom element`、画面空壳）+ `new Vue({ render: h => h(App) }).$mount('#app')`；用 `@vitejs/plugin-vue2`，runtime-only 构建即可。
- 模板里只放字符串 attribute（`is-edit="true"`）；`fields`、`template`、函数在 `mounted` / 数据变化后通过 `$refs.designer` 赋 property。
- `structuredClone` 会抛 `DataCloneError`（Vue 2 深度响应式 Proxy）：模板/数据深拷贝统一 `JSON.parse(JSON.stringify(...))`。
- 宿主单根节点（Vue 2 不支持多根 fragment）；`v-if` 预览 iframe 要 `$nextTick()` + `requestAnimationFrame()` 两层才拿得到节点。
- `beforeDestroy` 移除事件监听、停止 MCP 会话。
- 弹层样式用全局 `<style src="./styles/demo-ui.css">`，不要加 `scoped`（命不中子组件的 `.thumb-*`）。

## React 18

- `main.jsx`：`registerAll()` 一次 + 引宿主样式。无 `isCustomElement` 编译配置，未知标签按原生元素渲染。
- 用 `ref` 取 element，在 `useEffect` 里注入 property 并 `addEventListener('save', handler)`；effect 返回清理函数解绑。JSX 的 `onSave` 不会绑定 CustomEvent。
- `template={obj}` 会被 React 字符串化成 `[object Object]`，必须 `el.template = obj`。
- 一次性注册的处理器要读最新 state 用 `useRef` 桥接（如 demo 的 `printDataRef`），避免每次渲染重绑。
- StrictMode dev 双跑 effect，漏解绑会重复保存。
- 预览 iframe 条件渲染：等 DOM 提交（`await nextFrame()`）后再取 `ref.current` 写 HTML；Esc 关闭的 `keydown` 打开时绑、关闭时解绑。

## Vue 3（NPM）

- `@vitejs/plugin-vue` 配 `template.compilerOptions.isCustomElement: tag => tag.startsWith('print-')`（runtime-only 构建下 `app.config.compilerOptions.isCustomElement` 不生效）。
- `onMounted` 里赋 property、`addEventListener`；`onUnmounted` 解绑。Vue 3 宿主请改用 `@worm-print-platform/canvas/vue3` 正式门面（组件写法，原 `@worm-vue3-print/canvas` 项目迁移零业务改动）。

## jQuery / 原生 JavaScript

- 直挂：`WormPrintCanvas.registerAll()` 后直接操作 element property 与 `addEventListener`。
- jQuery 的 `$(el).on('save', …)` 包了一层事件对象：`e.detail` 是 `undefined`，要取 `e.originalEvent.detail`；双击同理。
- 弹层显隐用 `hidden` 属性时注意宿主样式里 `.print-mask` 等是 `display:flex`，作者样式会盖掉 `[hidden]` 的 UA 规则，需在切 `hidden` 的同时同步内联 `display`。
- 页面或组件销毁时 `removeEventListener` 并关闭 `PrintClient`。

## 换模板与读回

四种宿主都通过 `el.template = 新对象` 重载画布（必须新引用）。保存后再次打开时重新赋值，不假设宿主响应式数据与 Shadow DOM 内部 store 自动双向同步。`fields` 改后也要重新赋值。
