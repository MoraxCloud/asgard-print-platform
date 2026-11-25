# Vue3 demo 页内自动演示 · 设计稿

- 日期：2026-11-24
- 范围：`demos/apps/vue3`（仅 Vue3 宿主示例）
- 状态：待确认

## 背景与目标

`demos/live-show` 目前用 Playwright 从外部驱动 Vue3 demo，完成「模板视频 → 面单 → 出纸预览 → 价签拼版 → 资产标签 → 预览」的自动演示。它适合直播彩排与录制，但线上 Pages 的访客打开 demo 后无法使用：没有 Node、没有 Playwright、也没有 9340 控制台。

目标：把这条循环搬进 Vue3 demo 页面内，访客打开 demo 就能点一次「自动演示」，完整看到三类模板与真实出纸效果；现场展台也能切换为循环播放。

## 非目标

- 不替代 `demos/live-show` 的直播/录制链路，不搬假光标、监视器截图和无人值守录像。
- 不在本轮加入弹幕、语音识别、任意 TTS 或 AI 对话。
- 不在本轮加入「改文字 / 绑定字段 / 居中 / 纸型 / 撤销」等编辑类动作；这些动作需要访问 `print-designer` 的私有 `store`，留到后续有公开 API 时再做。
- 不引入 5.4MB 的 `template-loop.webm`；开场改用现有示例缩略图轮播。
- 不改 `packages/canvas` 的宿主契约，不改其余三个宿主 demo。

## 约束

- Vue3 demo 是「宿主集成样板」，README 承诺「抄进自己项目只需四处」。自动演示必须是独立、可删的模块，`App.vue` 只增加一次调用和一个组件。
- 公开 demo 可能被访客直接打开：默认静音、可随时停止、停止后恢复进入前的模板，不能把画布留在半成品状态。
- 浏览器自动播放策略：音频只能在用户手势后播放；FAB 点击即手势，`?auto=1` 自动启动时默认静音。
- 现有 demo 样式同源约束：不改 `demo-ui.css`，自动演示的样式放在自己的 CSS 文件。
- `prefers-reduced-motion` 下关闭位移动画，只保留内容切换。

## 方案与取舍

- **方案 A（已选）**：页内独立模块 + 预生成配音 + 缩略图开场。资产约 250KB，公开 demo 可直接用，样板主链路干净。
- **方案 B**：完整复刻直播观感，保留 webm 视频与 5 条配音。资产约 5.6MB，构建产物明显变大；画面与直播一致，但公开 demo 不值得为此背视频。
- **方案 C**：demo 里只放按钮打开 9340 控制台或 iframe。线上 Pages 没有 Node/Playwright，不满足公开访客，排除。

## 行为设计

### 入口

- 右下角悬浮按钮「自动演示」，默认可见，样式与 live-show 的 FAB 同源（蓝色胶囊 + 状态点）。
- 演示中 FAB 隐藏，底部中央出现控制条；结束后 FAB 恢复。
- 可选 URL 参数：`?auto=1` 进入页面自动开始（静音），`?loop=1` 配合 `auto` 循环播放。用于展台无人值守。

### 演示步骤

与 `demos/live-show/intents.mjs` 的 `LOOP_STEPS` 对齐，文案改为公开 demo 口径：

1. 开场：三张示例缩略图轮播（快递电子面单 / 价签打印 / 资产/设备标签），约 4.2s。
2. 加载「快递电子面单」，停留 2.2s。
3. 打开真实出纸预览，停留 3.5s。
4. 加载「价签打印」并开启批量打印，打开拼版预览（32 枚标签），停留 5s。
5. 关闭预览，加载「资产/设备标签」，停留 2.2s。
6. 打开真实出纸预览，停留 3.5s。

每步同时显示字幕；声音开启时播放该步配音。预览动作会等 `openPreview` 渲染完成再开始计时，避免固定 sleep 撞上慢机器。

### 状态机

`idle → intro/running → paused ⇄ running → finished → idle`

- `start()`：保存快照，进入 intro，播放第一步。
- `pause()/resume()`：冻结当前停留计时与音频；进行中的异步动作（如 `openPreview`）先完成，再停在下一步之前。
- `stop()`：取消计时与音频，关闭预览，恢复快照，回到 idle。
- 一轮结束：默认停留 0.8s 后自动 `stop()`；循环模式下回到第 2 步继续，不再重复开场。
- 重复点击 FAB 不会启动第二轮；演示中 FAB 不可见。
- 演示中用户打开示例库/打印弹窗不强制中断；下一次动作会覆盖画布，属预期。

### 结束与恢复

开始前快照：`templateData`、`fields`、`activeData`、`currentSample`、`batchEnabled`、`customDataActive`。

停止或一轮结束后：

1. 关闭预览层。
2. 还原上述引用并 `syncDesigner()`。
3. 恢复 `batchEnabled`，避免把「批量打印」开关留给访客。

### 声音

- 5 条配音（开场 / 面单 / 预览 / 拼版 / 资产标签）随 demo 一起提交，放在 `public/auto-show/voice/`，附 `manifest.json`（文案 → 文件名）。
- 默认静音；控制条提供「声音」开关。打开时从当前步骤配音开头播放，关闭时立即停止。
- 音频播放失败（策略或解码）只降级为静音，不打断演示。

### 动效与可访问性

- 开场缩略图用淡入 + 轻微位移；`prefers-reduced-motion: reduce` 时只做透明度切换。
- 控制条按钮带 `aria-label`，字幕区 `aria-live="polite"`。
- 字幕与按钮层级高于预览层（`z-index` 10002），避免被 `.preview-mask`（9999）盖住。

## 技术设计

### 新增文件

```
demos/apps/vue3/src/auto-show/
  steps.js            # 步骤定义、文案、示例 id、配音清单
  useAutoShow.js      # 状态机：计时、暂停、循环、快照/恢复、音频
  AutoShowOverlay.vue # FAB、开场缩略图、字幕、控制条
  auto-show.css       # 仅本功能使用的样式
demos/apps/vue3/scripts/generate-auto-show-voice.mjs  # 可选：重新生成配音
demos/apps/vue3/public/auto-show/voice/               # 5 条 mp3 + manifest.json（入库）
demos/scripts/verify-auto-show.mjs                    # Playwright 冒烟验收
```

### `App.vue` 改动

只增加：

```js
const autoShow = useAutoShow({
  designer: designerRef,
  samples: SAMPLE_LIBRARY,
  applySample,
  openPreview,
  closePreview: () => { previewVisible.value = false },
  currentTemplateJson,
  batchEnabled,
  snapshot: () => ({ templateData, fields, activeData, currentSample, customDataActive }),
})
```

模板里加 `<AutoShowOverlay :auto-show="autoShow" />`。不改现有顶栏、弹窗和三条打印链路。

### 动作适配

| 步骤动作 | 实现 |
| --- | --- |
| `intro` | 仅控制层显示，无画布操作 |
| `load-sample` | 先关预览，再 `applySample(samples.find(id))` |
| `preview` | `openPreview(currentTemplateJson())` |
| `tiling` | 先关预览，`applySample(price-label)`，`batchEnabled = true`，再 `openPreview(...)` |

不访问 `designer.store`，不依赖 canvas 私有面。

### 计时

`useAutoShow` 内部用可取消的 `wait(ms)`：

- 每 100ms 检查 `paused / cancelled`；
- `pause` 只冻结剩余时长，不重置；
- `stop` 通过递增 `runToken` 取消所有挂起等待；
- 音频元素与计时共用同一个 `runToken`。

## 资产与生成

- 配音文案以 `steps.js` 为准，生成脚本读取同文件，调用 `python3 -m edge_tts`（与 live-show 同一引擎、`zh-CN-YunxiNeural`），输出到 `public/auto-show/voice/` 并重写 `manifest.json`。
- 生成脚本只在文案变更时手动运行；`edge_tts` 不是运行时依赖，未安装时脚本给出明确提示。
- 音频文件入库，避免每次 `npm run dev` 依赖 Python。

## 验证

1. `npm run build --prefix demos/apps/vue3` 通过。
2. `node demos/scripts/verify-demo.mjs http://localhost:9331/` 仍为原断言数全通过（不改该脚本）。
3. 新增 `node demos/scripts/verify-auto-show.mjs http://localhost:9331/`，断言：
   - FAB 可见；
   - 点击后进入演示、字幕出现、开场缩略图出现；
   - 自动切到「快递电子面单」并打开预览；
   - 自动切到「价签打印」、批量开关打开、预览 32 枚标签；
   - 暂停/继续/停止可用；
   - 停止后预览关闭、示例恢复为进入前的示例、批量开关恢复；
   - 循环开关可切换；
   - 全程无页面脚本错误。
4. 手动检查：静音默认、开声音可播放、移动端宽度下控制条不遮挡关键按钮、`prefers-reduced-motion` 下无位移。

## 风险与后续

- **样板污染**：模块独立、`App.vue` 只加一个调用；README 增加一行「自动演示是 Vue3 demo 专属模块，可整目录删除」。其余宿主不同步。
- **文案漂移**：步骤与 `live-show/intents.mjs` 的 `LOOP_STEPS` 各自维护；在 `steps.js` 注释里标明对照位置，直播侧改动时人工同步。
- **私有 `store`**：本轮不使用，规避宿主契约风险；后续若要演示编辑动作，先给 canvas 补公开编程式 API。
- **音频体积**：5 条约 250KB，入库；若后续文案频繁变化，再考虑构建期生成。

## 待定项（实现时自行决定）

- 控制条具体间距与移动端断点，按现有 demo 视觉微调。
- 开场缩略图轮播每张停留时长，按实际观感在 1.2–1.5s 间定。
- 停止后是否弹一条轻提示「演示已结束」，按是否需要解释恢复行为决定。
