# Demo 配置弹窗增加设计器语言设置 — 设计

## 意图与原因

4 组 demo（vue3/vue2/react/jquery）顶部的「配置」弹窗目前只能配置按钮显隐、字段显示（vue3）、主题，无法配置打印模板设计器的界面语言。设计器本体已在本次会话中完成 i18n（暴露 `lang` / `messages` property 与 `setLocale()` 方法），但 demo 没有暴露入口，用户只能在浏览器控制台调用。本变更把语言配置做成和配置弹窗里「主题」并列的一项，让 demo 使用者能直接切换中/英。

## 目标

- 4 组 demo 的配置弹窗各增加一个「语言」配置段，三档 radio：跟随系统 / 简体中文 / English。
- 切换后设计器界面即时更新（工具栏、面板、帮助文档等）。
- 与现有主题配置风格一致（同一组 CSS 类、同样的写回模式）。

## 非目标 / 反目标

- 不改变配置弹窗自身的文案语言（「显示配置」「主题」「按钮显隐」等仍是中文）——它们属于 demo 宿主 UI，不是设计器 UI。
- 不修改设计器（canvas/core）代码——`lang` API 已就位。
- 不增加新的语言包或翻译——仅使用已内置的 zh-CN / en-US。
- 不把 `lang` 写成 attribute（我刚修复过 `lang` attribute 的递归 bug，写回统一走 property）。

## 约束

- 4 组 demo 各自独立实现，无共享配置模块；改动需分别落到各 demo。
- 配置弹窗样式以 `apps/vue3/src/styles/demo-ui.css` 为唯一源，由 `npm run styles:demos` 同步到另三组，四份需保持 MD5 一致 —— 本次不新增样式类，复用现有 `.config-section/.config-label/.config-row` 即可，无需动样式。
- 写回统一走 property：`el.lang = 'zh-CN' | 'en-US' | undefined`（auto 时清空，让设计器按 `navigator.language` 探测并回退中文）。不调用 `setAttribute('lang', ...)`。
- `el.lang = undefined` 会触发设计器 setter 清空 `_lang` 并移除 attribute（已由 `print-designer.ts` 的 setter 实现保证）。

## 已定方案（你在对话中选择）

**三档 radio，与「主题」同款 UI**：
- 「跟随系统」（值 `auto`，默认）→ 清空 `el.lang`
- 「简体中文」（值 `zh-CN`）→ `el.lang = 'zh-CN'`
- 「English」（值 `en-US`）→ `el.lang = 'en-US'`

被否决的方案：两档 radio（缺跟随系统档）；select 下拉（与现有 radio 风格不一致）。

## 实现分解（留给实施者）

1. **vue3** `demos/apps/vue3/src/App.vue`：新增 `const langMode = ref('auto')`；配置弹窗主题段后新增「语言」section（3 个 radio `name="config-lang"`）；`applyDisplayConfig()` 增加 `el.lang = langMode.value === 'auto' ? undefined : langMode.value`；`watch` 数组加入 `langMode`；`onMounted` 已调用 `applyDisplayConfig`。
2. **vue2** `demos/apps/vue2/src/App.vue`：`data()` 加 `langMode: 'auto'`；弹窗加同名 radio 段；`applyDisplayConfig()` 加同样的 `el.lang` 赋值；watch 加 `'langMode': 'applyDisplayConfig'`；`mounted` 已调用。
3. **react** `demos/apps/react/src/components/ConfigDialog.jsx`：增加 `langMode/setLangMode` props 与「语言」radio 段；`App.jsx` 增加 `useState('auto')`、传给 ConfigDialog、`useEffect` 依赖与写回加 `el.lang`。
4. **jquery** `demos/apps/jquery/index.html`：弹窗加 radio 段（`name="config-lang"`，auto 默认 checked）；`app.js` 的 `state` 加 `langMode: 'auto'`，新增 change 绑定写 `state.langMode` 并调用 `applyDisplayConfig()`，后者加 `el.lang = state.langMode === 'auto' ? undefined : state.langMode`。
5. **验证脚本** `demos/scripts/verify-config-dialog.mjs`：增加语言切换断言——打开弹窗、点选「English」radio、断言 `el.lang === 'en-US'` 且设计器 shadow DOM 里某个按钮文案变英文（如「保存」→「Save」）、点选「跟随系统」断言 `el.lang === ''`（getter 返回空表示未显式设置）、零页面错误。顺带修正该脚本现有的 checkbox 数量断言（Vue3 实际 4 个，脚本写死 2 个）——这是与本次改动直接相关的存量错误。

## 规格来源

本设计基于本会话已完成的 i18n 实施（spec `docs/superpowers/specs/2026-11-20-designer-i18n-design.md`），设计器 `lang` API 见 `packages/canvas/src/host-contract.ts`（契约版本 1.4.0）。
