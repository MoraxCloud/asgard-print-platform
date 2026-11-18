# Demo 显示配置弹窗设计

日期：2026-11-18
状态：已实施（显隐 + 主题预设，四宿主落地并复核通过）

> 需求变更记录：
> 1. 原「把顶部全部操作搬进弹窗」方案作废，改为**新增一个独立配置按钮**，只放显示配置。
> 2. 弹窗初版含主题色配置；后按需求从示例中移除配色控件，只保留预览 / 保存按钮显隐。
> 3. 再次按需求**加回主题预设**：弹窗新增「主题」单选组，提供亮色 / 暗色 / 跟随系统三档，默认跟随系统。仅暴露 `theme` 预设，不暴露 `themeConfig` 色值输入。
> 设计器本体的 `theme` / `themeConfig` 参数能力保留，可通过传参换肤（见「配置能力介绍」）。

## 背景与意图

四个宿主 demo 当前把 `:show-preview="true"` 等设计器入参写死在模板里，保存按钮显隐与主题预设尚未在 demo 暴露。需要在顶部增加一个配置入口，让使用者能在页面上直接切换这些显示项。配色控件曾一度移除，现按需求加回三档主题预设，用于演示设计器的换肤能力。

## 目标

- 顶部新增一个「配置」按钮，位置在打印输出按钮附近、不占用原有操作。
- 点开一个弹窗，包含：
  1. 预览按钮显隐（对应 `showPreview`）
  2. 保存按钮显隐（对应 `showSave`）
  3. 主题预设单选：`auto` 跟随系统 / `light` 亮色 / `dark` 暗色，默认跟随系统（对应 `theme`）
- 现有顶部 7 类操作、三个弹窗、宿主切换与状态标识一律不动。

## 非目标

- 不暴露 `themeConfig` 色值输入、颜色选择器与「重置配色」按钮——只演示三档预设换肤，不演示自定义令牌。
- 不搬运导出 / 导入 / 清空 / 加载示例 / 自定义字段 / 批量打印 / 打印输出到新弹窗。
- 不改动 `topbar-overflow.js` 的折叠链与现有顶部 DOM。
- 不改动设计器本体的接口或行为。

## 弹窗内容（最终）

两段设置：

- **按钮显隐**：两个复选框，默认都开，与当前 demo 行为一致。
  - 预览按钮：`showPreview`
  - 保存按钮：`showSave`
- **主题**：三个单选，默认「跟随系统」。亮色 = `light`，暗色 = `dark`，跟随系统 = `auto`。

所有变化即时写回 `<print-designer>` 的对应 property：Vue 用 state + watch，React 用 state + effect，jQuery 用 `el.xxx = ...`。主题也走 property（`el.theme = mode`），字符串值由 setter 同步到 attribute，`auto` 随系统 `prefers-color-scheme` 实时变化。无需重新加载模板。隐藏只影响按钮出图：`save()` 方法与 `save` / `preview` 事件照常可用（设计器既有语义）。

## 方案取舍

- **单选组（采用）**：三档互斥，复用现有 `.config-section / .config-label / .config-row / .config-row input` 样式，无新增 CSS；原生可访问，和显隐复选框同构。
- 下拉选择：省空间，但要新增触发器 / 菜单样式与交互，与现有弹窗风格不一致。
- 只改 vue3：破坏四宿主行为一致，不采用。

## 配置能力介绍（供宿主参考）

demo 的「配置」弹窗是宿主自定义显示配置的一个参考实现。设计器侧可用的配置项来自版本化契约（当前 1.2.0，机器可读真源在 `packages/canvas/src/host-contract.ts`）：

- **按钮显隐**：`showPreview` / `showSave`，布尔，默认显示，置 `false` 隐藏。
- **主题配色**：`theme`（`auto` / `light` / `dark` 预设）+ `themeConfig`（色值覆盖对象，**必须赋 property**）。优先级为参数覆盖 > 显式预设 > 系统 `prefers-color-scheme` > CSS 令牌 > 内置浅色；深色预设只改设计器外壳，纸张 / 画布背景 / 标尺 / 手柄保持原值，预览所见即所得不变。
- 宿主可在自己的页面提供配置入口（如本 demo 的顶部按钮弹窗），把上述状态写回元素 property。完整参数说明见 integration 技能的 [接入 API](../skills/worm-print-platform-integration/references/integration-api.md) §2。

## 约束

- 四个 demo 是独立 npm 工程，需分别实现，保持行为一致：vue3 / vue2 在 `App.vue`，react 在 `App.jsx` + `src/components/ConfigDialog.jsx`，jquery 在 `index.html` + `src/app.js`。
- 设计器入参口径：字符串开关走 attribute，对象/函数走 property；布尔开关也统一走 property 写入，避免 Vue 2 把 `false` 渲染成移除属性（见复核记录）。
- 新弹窗样式沿用各 demo 现有 `.demo-*` 命名与样式文件（`src/styles/demo-ui.css`），以 vue3 为唯一源，`npm run styles:demos` 同步其余三份。

## 验收

- 四个 demo 顶部各多出一个「配置」按钮，原有顶部操作与三个弹窗照常可用。
- 配置弹窗含预览显隐、保存显隐两个开关，以及主题三档单选（亮色 / 暗色 / 跟随系统，默认跟随系统），切换即时生效；无 `themeConfig` 色值输入。
- 切换主题后设计器外壳随预设变化，纸张 / 画布背景 / 标尺 / 手柄保持原值（设计器既有语义）；选回「跟随系统」时 `theme` 回落 `auto`。
- 保存 / 预览按钮隐藏后，`save()` 方法与 `save` / `preview` 事件仍照常可用（设计器既有语义）。
- 四个 demo 行为一致；`npm run build` 通过。

## 复核记录（2026-11-18）

以 Playwright 实际打开四个 demo（vue3:9331 / vue2:9332 / react:9335 / jquery:9334）逐项点检：

- 初版（含配色）：每 demo 13 项共 52 项通过，零页面错误。期间发现 vue2 缺陷——取消勾选「预览」后 `show-preview` 变成 `null`；根因是模板 `:show-preview="showPreview"` 绑定与 property setter 冲突（Vue 2 对自定义元素一律 `setAttribute`，`false` 被渲染为移除属性，且响应式更新在 setter 之后覆盖）。修复：移除 vue2 模板的 `:show-preview` 绑定，显隐统一走 property setter（提交 `f88dc3e`）。
- 终版（配色移除后）：每 demo 9 项共 36 项通过，零页面错误。验收项：弹窗打开、显隐开关数=2、无主题预设/颜色输入/重置配色按钮/主题色文案、取消预览与保存分别写回 `show-preview` / `show-save` 为 `false`、完成按钮关闭弹窗。
- 主题预设加回后：每 demo 9 项共 36 项通过，零页面错误。新增验收项：主题单选数=3、值为 auto/dark/light、默认 auto、三档切换分别写回 `theme` 属性与 property、显隐开关仍为 2、完成按钮关闭弹窗。
- 主题专项量测（vue3）：深色外壳 `rgb(24,26,32)`、浅色外壳 `rgb(243,245,249)`；纸张保持 `rgb(255,255,255)`、画布区保持 `rgb(230,233,240)`，实测外壳变色而纸面相关背景不变（标尺 / 手柄属设计器既有语义，未单独量测）。`colorScheme=dark` + auto 时外壳与浅色系统不同且 `theme` 属性保持 `auto`；主题切换后 `show-preview` / `show-save` 仍为 `true`。
- `npm run styles:demos` 四份 `demo-ui.css` 同 MD5 `d46f61e6`；`npm run build` 通过。
- 回归脚本固化为 `demos/scripts/verify-config-dialog.mjs`（需先起四 demo）：先写成失败用例跑红（四宿主主题单选数均为 0），落地后跑绿（每宿主 9 项 + 边界量测 6 项全过）。
