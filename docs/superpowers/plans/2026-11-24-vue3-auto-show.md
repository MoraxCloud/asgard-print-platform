# Vue3 Demo 页内自动演示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 Vue3 demo 访客点击一次「自动演示」即可在页面内观看面单、价签拼版、资产标签及真实出纸预览，并支持暂停、继续、停止、静音、循环和进入前状态恢复。

**Architecture:** 在 `demos/apps/vue3/src/auto-show/` 内实现独立步骤表、Vue 组合式状态机和覆盖层组件；`App.vue` 只新增一次 `useAutoShow` 调用和一个 `<AutoShowOverlay>`。状态机只使用宿主已有公开动作，不访问 `print-designer.store`，停止时等待在途预览结束后关闭预览并恢复快照。

**Tech Stack:** Vue 3、Vite、原生 Custom Elements、Web Audio（`Audio`）、Node.js、Playwright、`edge_tts`（仅手动生成配音）。

**Spec:** `docs/superpowers/specs/2026-11-24-vue3-auto-show-design.md`

## Global Constraints

- 范围仅 `demos/apps/vue3` 与新增 `demos/scripts/verify-auto-show.mjs`；不改 `packages/canvas` 宿主契约，不改其余三个宿主 demo。
- `App.vue` 只增加一个组合式函数调用和一个组件；自动演示模块必须可整目录删除。
- 不修改 `src/styles/demo-ui.css`；新增样式只放 `src/auto-show/auto-show.css`。
- 不访问 `designer.store`，不引入编辑类动作、弹幕、TTS 运行时、AI 对话或 5.4MB 视频。
- 默认静音；`?auto=1` 自动启动也必须静音；`?loop=1` 配合 `auto` 循环。
- 停止后恢复 `templateData`、`fields`、`activeData`、`currentSample`、`batchEnabled`、`customDataActive`，并调用 `syncDesigner()`。
- 预览必须等待 `openPreview()` 完成后再开始停留计时；停止必须处理在途 `openPreview()`，不能留下预览层。
- 字幕与控制条 `z-index: 10002`；`prefers-reduced-motion: reduce` 时关闭缩略图位移动画。
- 所有文本、注释和验收输出使用简体中文；文件 UTF-8 无 BOM。
- 本会话只实现和验证，不创建提交、不推送、不修改用户已有未提交文件。

---

### Task 1: 步骤表、配音生成器与资产校验

**Files:**
- Create: `demos/apps/vue3/src/auto-show/steps.js`
- Create: `demos/apps/vue3/scripts/generate-auto-show-voice.mjs`
- Create: `demos/apps/vue3/scripts/generate-auto-show-voice.test.mjs`
- Create: `demos/apps/vue3/public/auto-show/voice/manifest.json`
- Create: `demos/apps/vue3/public/auto-show/voice/{intro,express,preview,tiling,asset}.mp3`

**Interfaces:**
- Produces: `AUTO_SHOW_STEPS`，每项包含 `id/kind/label/hold/text/voice`，`tiling` 项另含 `sampleId: 'price-label'`。
- Produces: `VOICE_LINES`，5 项 `{ key, text }`，key 为 `intro/express/preview/tiling/asset`。
- Produces: `manifest.json`，包含 `provider/voice/generatedAt/lines`，每个 line 包含 `key/text/file/sha256/bytes`。

- [ ] **Step 1: 新建步骤表与配音清单**

`steps.js` 使用以下固定顺序和时长；开场三张缩略图各 1400ms，总计 4200ms：

```js
export const INTRO_SLIDE_MS = 1400

export const VOICE_LINES = [
  { key: 'intro', text: '欢迎来到打印模板设计器。接下来依次展示快递面单、价签拼版和资产标签。' },
  { key: 'express', text: '已为你加载快递电子面单。画布、字段和出纸效果都来自真实模板。' },
  { key: 'preview', text: '现在打开真实出纸预览。这里只展示纸张，不会连接实体打印机。' },
  { key: 'tiling', text: '可以。价签打印会把三十二枚标签拼到一张 A4 纸上，我现在打开真实预览。' },
  { key: 'asset', text: '已为你加载资产/设备标签。画布、字段和出纸效果都来自真实模板。' },
]

export const AUTO_SHOW_STEPS = [
  { id: 'intro', kind: 'intro', label: '开场', hold: 4200, text: VOICE_LINES[0].text, voice: 'intro', sampleIds: ['express-waybill', 'price-label', 'asset-tag'] },
  { id: 'express-waybill', kind: 'load-sample', label: '快递电子面单', hold: 2200, text: VOICE_LINES[1].text, voice: 'express', sampleId: 'express-waybill' },
  { id: 'express-preview', kind: 'preview', label: '面单预览', hold: 3500, text: VOICE_LINES[2].text, voice: 'preview' },
  { id: 'price-tiling', kind: 'tiling', label: '价签拼版', hold: 5000, text: VOICE_LINES[3].text, voice: 'tiling', sampleId: 'price-label' },
  { id: 'asset-tag', kind: 'load-sample', label: '资产标签', hold: 2200, text: VOICE_LINES[4].text, voice: 'asset', sampleId: 'asset-tag' },
  { id: 'asset-preview', kind: 'preview', label: '资产标签预览', hold: 3500, text: VOICE_LINES[2].text, voice: 'preview' },
]
```

文件顶部只保留一行必要注释：`// 文案与顺序对照 demos/live-show/intents.mjs 的 LOOP_STEPS，直播侧改动时人工同步。`

- [ ] **Step 2: 编写配音生成器**

脚本从 `steps.js` 读取 `VOICE_LINES`，先执行 `python3 -c "import edge_tts"`；未安装时输出 `未安装 edge_tts，请先执行 python3 -m pip install edge-tts` 并非零退出。每条使用 `spawn('python3', ['-m', 'edge_tts', '--voice', 'zh-CN-YunxiNeural', '--text', text, '--write-media', outFile])`，25 秒超时；生成后计算 SHA-256 和字节数，写入 `public/auto-show/voice/<key>.mp3` 与 `manifest.json`。`file` 字段只写文件名，例如 `intro.mp3`。

- [ ] **Step 3: 先写资产校验测试并确认失败**

创建 `generate-auto-show-voice.test.mjs`：

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { VOICE_LINES } from '../src/auto-show/steps.js'

const ROOT = dirname(fileURLToPath(import.meta.url))
const VOICE_DIR = join(ROOT, '..', 'public', 'auto-show', 'voice')

test('五条公开演示配音与步骤文案一致且资产完整', async () => {
  const manifest = JSON.parse(await readFile(join(VOICE_DIR, 'manifest.json'), 'utf8'))
  assert.equal(manifest.provider, 'edge-tts')
  assert.equal(manifest.voice, 'zh-CN-YunxiNeural')
  assert.equal(manifest.lines.length, 5)
  for (const expected of VOICE_LINES) {
    const line = manifest.lines.find(item => item.key === expected.key)
    assert.equal(line?.text, expected.text)
    assert.equal(line.file, `${expected.key}.mp3`)
    const audio = await readFile(join(VOICE_DIR, line.file))
    assert.ok(audio.length > 10000)
    assert.equal(audio.length, line.bytes)
    assert.equal(createHash('sha256').update(audio).digest('hex'), line.sha256)
  }
})
```

- [ ] **Step 4: 运行测试确认红态**

Run: `node --test demos/apps/vue3/scripts/generate-auto-show-voice.test.mjs`
Expected: 因 `steps.js` 或配音目录不存在而失败。

- [ ] **Step 5: 生成配音并跑绿**

Run: `node demos/apps/vue3/scripts/generate-auto-show-voice.mjs`
Run: `node --test demos/apps/vue3/scripts/generate-auto-show-voice.test.mjs`
Expected: 1/1 通过，5 个 mp3 与 manifest 均存在。

---

### Task 2: 可取消、可暂停的自动演示状态机

**Files:**
- Create: `demos/apps/vue3/src/auto-show/useAutoShow.js`

**Interfaces:**
- Consumes: `{ designer, samples, applySample, openPreview, closePreview, currentTemplateJson, batchEnabled, snapshot, syncDesigner }`。
- `snapshot()` 返回以 Vue ref 为值的对象：`{ templateData, fields, activeData, currentSample, batchEnabled, customDataActive }`。
- Produces: 响应式对象，包含 `status/stepIndex/introSlideIndex/soundEnabled/loopEnabled/currentStep/currentText/introSamples/isActive`。
- Produces: `start/pause/resume/stop/toggleSound/toggleLoop`。

- [ ] **Step 1: 明确状态机测试入口**

在 Task 4 的 Playwright 脚本中先用 `data-status`、`data-step-id` 和按钮 `aria-pressed` 观测状态；本任务不引入额外运行时依赖。状态机至少覆盖：重复启动被忽略、暂停冻结剩余时长、继续不重置、停止取消等待、在途预览完成后才恢复、循环从第 2 步继续、声音失败自动静音。

- [ ] **Step 2: 实现步骤动作与快照**

- `start()` 仅在 `status === 'idle'` 时执行；递增 `runToken`，深拷贝快照值，设置 `status='running'`、`stepIndex=0`、`soundEnabled=false`。
- 动作分派：`intro` 不碰画布；`load-sample` 先 `closePreview()` 再 `applySample()`；`preview` 调 `openPreview(currentTemplateJson())`；`tiling` 先关预览、加载 `price-label`、`batchEnabled.value=true`，再打开预览。
- 所有动作通过同一个 `pendingAction` 跟踪；动作开始后等待完成，再进入当前步骤停留计时。

- [ ] **Step 3: 实现可取消计时**

`wait(ms, token)` 每 100ms 检查一次：token 不一致立即返回 `false`；暂停时不计 elapsed；恢复后从剩余时间继续。使用 `performance.now()` 累计，避免暂停后重置整个停留时长。`stop()` 首先递增 token，使所有等待和动作循环退出。

- [ ] **Step 4: 实现暂停、继续与停止**

- `pause()` 仅允许 running → paused，并暂停当前音频。
- `resume()` 仅允许 paused → running，并恢复当前音频。
- `stop()` 使用 `status='stopping'` 作为内部短暂状态，停止音频、递增 token、等待 `pendingAction` 完成后关闭预览、恢复快照、调用 `syncDesigner()`，最后回到 idle。
- 快照对 `templateData/fields/activeData` 使用 `structuredClone`；`currentSample` 保留原引用；所有 ref 通过 `.value` 恢复。
- `onBeforeUnmount()` 调用 `stop()`；`onMounted()` 在 `nextTick()` 后检查 `?auto=1`，此时 `App.vue` 的首次 `applySample()` 已完成。

- [ ] **Step 5: 实现声音、循环和开场轮播**

- 每个步骤按 `voice` key 构造 `${import.meta.env.BASE_URL}auto-show/voice/<key>.mp3`，用 `new Audio()` 播放；默认不创建音频。
- `toggleSound()` 开启时从当前步骤配音开头播放，关闭时立即停止；`play()` 失败则 `soundEnabled=false`，不中断演示。
- 开场按 `INTRO_SLIDE_MS` 切换三张缩略图，暂停时同样冻结。
- 一轮结束后非循环模式停留 800ms 再 `stop()`；循环模式直接 `stepIndex=1`，不重复开场。
- `loopEnabled` 初值来自 `?loop=1`，控制条可随时切换。

- [ ] **Step 6: 语法检查**

Run: `node --check demos/apps/vue3/src/auto-show/useAutoShow.js`
Expected: 退出码 0。

---

### Task 3: 覆盖层组件、样式与 App.vue 集成

**Files:**
- Create: `demos/apps/vue3/src/auto-show/AutoShowOverlay.vue`
- Create: `demos/apps/vue3/src/auto-show/auto-show.css`
- Modify: `demos/apps/vue3/src/App.vue`
- Modify: `demos/apps/vue3/README.md`

**Interfaces:**
- Consumes: `useAutoShow` 返回的响应式对象。
- Produces: `[data-test="auto-show-fab"]`、`[data-test="auto-show-intro"]`、`[data-test="auto-show-subtitle"]`、`[data-test="auto-show-controls"]`。
- 控制按钮：`[data-action="pause"]`、`[data-action="sound"]`、`[data-action="loop"]`、`[data-action="stop"]`。
- 覆盖层根节点带 `data-status` 与 `data-step-id`，供验收脚本断言。

- [ ] **Step 1: 先实现组件结构与可访问语义**

组件直接复用 `../SampleThumb.vue` 绘制三张开场缩略图，不生成新图片资产。结构要求：

```vue
<button v-if="autoShow.status === 'idle'" data-test="auto-show-fab" aria-label="开始自动演示" @click="autoShow.start">
  <i aria-hidden="true"></i><span>自动演示</span>
</button>
<section v-else class="auto-show-layer" :data-status="autoShow.status" :data-step-id="autoShow.currentStep?.id">
  <div v-if="autoShow.currentStep?.kind === 'intro'" data-test="auto-show-intro">
    <SampleThumb v-for="(sample, index) in autoShow.introSamples" :key="sample.id" :class="{ on: index === autoShow.introSlideIndex }" :template="sample.template" :data="sample.data" />
  </div>
  <div data-test="auto-show-subtitle" aria-live="polite">{{ autoShow.currentText }}</div>
  <div v-if="autoShow.status !== 'finished'" data-test="auto-show-controls">
    <button data-action="pause" :aria-label="autoShow.status === 'paused' ? '继续演示' : '暂停演示'" @click="autoShow.status === 'paused' ? autoShow.resume() : autoShow.pause()">
      {{ autoShow.status === 'paused' ? '继续' : '暂停' }}
    </button>
    <button data-action="sound" :aria-pressed="autoShow.soundEnabled" aria-label="切换声音" @click="autoShow.toggleSound">声音{{ autoShow.soundEnabled ? '开' : '关' }}</button>
    <button data-action="loop" :aria-pressed="autoShow.loopEnabled" aria-label="切换循环播放" @click="autoShow.toggleLoop">循环{{ autoShow.loopEnabled ? '开' : '关' }}</button>
    <button data-action="stop" aria-label="停止演示" @click="autoShow.stop">停止</button>
  </div>
</section>
```

- [ ] **Step 2: 实现独立样式**

`auto-show.css` 所有类名以 `auto-show-` 开头。FAB 复用 live-show 的蓝色胶囊：`right:24px;bottom:24px;min-height:46px;padding:0 18px;background:#2f6fed;border-radius:24px`。控制条与字幕固定底部中央，整体 `z-index:10002`。移动端断点 `640px`：控制条改为两行、缩短按钮间距，字幕相应抬高。缩略图使用透明度与轻微位移；`@media (prefers-reduced-motion: reduce)` 中将位移和过渡关闭，只保留内容切换。

- [ ] **Step 3: 在 App.vue 增加一次调用和一个组件**

在 `script setup` 增加：

```js
import { useAutoShow } from './auto-show/useAutoShow'
import AutoShowOverlay from './auto-show/AutoShowOverlay.vue'
```

在 `previewVisible` 相关初始化与监听完成后增加：

```js
const autoShow = useAutoShow({
  designer: designerRef,
  samples: SAMPLE_LIBRARY,
  applySample,
  openPreview,
  closePreview: () => { previewVisible.value = false },
  currentTemplateJson,
  batchEnabled,
  syncDesigner,
  snapshot: () => ({ templateData, fields, activeData, currentSample, batchEnabled, customDataActive }),
})
```

在根 `.demo-app` 内、配置弹窗之后增加 `<AutoShowOverlay :auto-show="autoShow" />`。不改顶栏、示例库、自定义数据弹窗和三条打印链路。

- [ ] **Step 4: 更新 README**

在「抄进自己项目只需要四处」表格后增加一行：`自动演示是 Vue3 demo 专属模块，位于 src/auto-show/，可整目录删除；删除同时移除 App.vue 中的 useAutoShow 调用与 AutoShowOverlay 组件。`

- [ ] **Step 5: 构建验证**

Run: `npm run build --prefix demos/apps/vue3`
Expected: Vite 构建成功，配音资产复制到 `dist/auto-show/voice/`。

---

### Task 4: Playwright 冒烟验收

**Files:**
- Create: `demos/scripts/verify-auto-show.mjs`

**Interfaces:**
- Consumes: Task 1–3 的页面选择器和 `demos/apps/vue3/src/templates.js`。
- Produces: 独立验收脚本，末行输出通过数与失败数；失败退出码非 0。

- [ ] **Step 1: 先写完整验收脚本并确认红态**

复用 `verify-demo.mjs` 的 `createRequire`、`chromium.launch`、`pageerror/console.error` 收集和可见性判断方式。页面加载后先把当前示例手动切成 `asset-tag`，记录业务徽章与批量开关，再执行：

1. FAB 可见，声音与循环默认关闭。
2. 点击 FAB 后出现开场缩略图和字幕。
3. 自动进入 `express-waybill` 并打开真实预览。
4. 暂停后步骤不变，继续后进入 `price-tiling`。
5. 价签步骤批量开关打开，按钮文本包含 `32 份`，模板 `tiling.enabled` 为真，预览 iframe 有纸面。
6. 自动进入 `asset-tag`，随后打开资产标签预览。
7. 停止后 FAB 恢复、预览关闭、业务徽章恢复为 `asset-tag`、批量开关恢复。
8. 循环按钮可切换；新增 `?auto=1&loop=1` 页面自动启动且静音，并至少观察到一次从 `asset-preview` 回到 `express-waybill`。
9. 390×844 视口下控制条位于视口内；`reducedMotion: 'reduce'` 下缩略图无位移动画。
10. 全程无页面脚本错误。

- [ ] **Step 2: 运行红态**

Run: `node demos/scripts/verify-auto-show.mjs http://localhost:9331/`
Expected: FAB 不存在，脚本失败并明确指出缺少 `[data-test="auto-show-fab"]`。

- [ ] **Step 3: 实现并迭代到绿态**

Run: `node demos/scripts/verify-auto-show.mjs http://localhost:9331/`
Expected: 所有断言通过；如预览 32 枚断言不稳定，以「32 份批量数据 + 拼版模板 + 非空真实预览」三项同时成立作为判据，不使用固定 sleep 代替渲染完成等待。

---

### Task 5: 原验收回归、构建复核与交付检查

**Files:**
- Verify: `demos/scripts/verify-demo.mjs`
- Verify: `demos/apps/vue3/README.md`
- Verify: `git diff`

- [ ] **Step 1: 原 Vue3 demo 回归**

Run: `node demos/scripts/verify-demo.mjs http://localhost:9331/`
Expected: 仍为 `32/32 通过`，不修改该脚本。

- [ ] **Step 2: 自动演示回归与构建**

Run: `node demos/scripts/verify-auto-show.mjs http://localhost:9331/`
Run: `npm run build --prefix demos/apps/vue3`
Expected: 自动演示全部通过，构建成功。

- [ ] **Step 3: 浏览器人工核对**

用浏览器实际点击 FAB，核对：默认静音、开启声音可播放、停止后恢复进入前模板、移动端控制条不遮挡主要操作、 reduced-motion 下无缩略图位移。若环境无法输出声音，记录为未验证项，不宣称通过。

- [ ] **Step 4: 差异审查**

Run: `git status --short`
Run: `git diff -- demos/apps/vue3/src/App.vue demos/apps/vue3/README.md`
Run: `git diff --stat`
Expected: 只出现本计划文件与自动演示相关文件；用户已有的 `marketplace.js` 和 RFID 设计稿保持不动。

- [ ] **Step 5: 规格覆盖自查**

逐项核对：入口与 URL 参数、六步流程、真实预览等待、状态机、快照恢复、5 条配音与 manifest、默认静音与失败降级、开场动效与 reduced-motion、z-index、README 可删除说明、两个 Playwright 脚本、原构建与 32 项回归。任何缺失项继续实现，不将测试通过当作未覆盖需求的替代证据。
