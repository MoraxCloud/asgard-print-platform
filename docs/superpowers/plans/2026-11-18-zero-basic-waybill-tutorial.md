# 零基础教学 · 快递面单从零到交付 · 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按设计文档产出一支横屏教学片，让零基础观众跟做交付一张 100×150mm、23 元素、绑真实运单字段的快递面单，终点到预览出纸 + 保存。

**Architecture:** 复用 `.video-skill` 横屏整链（配音→多音字门禁→封面→片尾卡→实录→合成→音画同步→四封面→文案→验收）。新增一份带 key 的剧本、步骤清单与可导入模板 JSON；先在 FAST 模式校准依赖真实 DOM 的步骤，再整链出片。

**Tech Stack:** Node + Playwright（录屏）、edge-tts（配音）、FFmpeg（合成）、`making-douyin-videos` 流水线脚本。

**Spec:** `docs/superpowers/specs/2026-11-18-zero-basic-waybill-tutorial-design.md`

## Global Constraints

- 产物 key `waybill-tutorial`，目录 `out/<YYYY-MM-DD>-waybill-tutorial/`（日期取首跑日，由 `paths.mjs` 登记 `out-registry.json`，重跑不换目录）；剧本首跑在 `.video-skill/` 根，出片后移入该目录并用绝对路径重跑。
- 视频 1920×1080、≤180s，预算 ~159s；字幕横屏每行 20 字、最多两行；台词按句号断句成独立短句。
- 23 元素逐类吻合现成 `express-waybill`：文本 15 / 条码 1 / 长文 2 / 横线 4 / 二维码 1；字段绑定代表：运单号、查件二维码、收件人、目的地代码。
- 片尾口播与 `endcard-tail-light.png` 与其余三支逐字一致；封面 `coverTitle` 4–7 字；抖音文案恰好 5 不重复标签。
- 台词里的尺寸/字段数/元素数出自 `demos/apps/vue3/src/templates.js` 的 `express-waybill`，发布前重核。
- 素材卡名取 `element-definitions.ts` 的 label：文本、条形码、二维码、长文、横线；字段行按中文名拖（如「运单号」）。
- 路径前提已验证：加载面单→清空→画布 0 元素、字段树保留 26 项。

## Review Focus

- 「从空白起步但字段现成」：若清空后字段树丢失，教学前提崩塌 → Task 3 的 FAST 实跑首步断言画布 0 元素 + 字段行仍含运单号。
- 23 元素坐标重叠（尤其二维码压分隔线/打印时间，历史 bug `53361e9`）→ Task 3 二维码落点避开hline，Task 5 抽帧复核预览层二维码/条码无遮挡。
- 码类绑定未真出图 → Task 3 `measureBarcode`/`measureQr` 从 SVG 反解几何断言，Task 5 预览层复核。
- 时长超 180s（23 次 dragCard 最易膨胀）→ Task 3 记录每步耗时，Task 5 成片时长断言。
- 片尾/字幕口径漂移 → Task 5 `verify.mjs` + 片尾口播逐字比对。

---

### Task 1: 编写教学剧本

**Files:**
- Create: `.video-skill/script-waybill-tutorial.json`

**Interfaces:**
- Produces: 完整剧本，供 Task 2/3/4 读取；key `waybill-tutorial`。

- [ ] **Step 1: 写 11 场景口播与步骤骨架**

按 spec 的场景表写 `scenes[]`。每场 `name`、`voiceover`（按句号断句：一句一个完整意思，密集英文/数字如 `100×150`、`{waybill.no}` 单独成句）、`steps`（先写动作类型与选择器，不含精确坐标/期望值——那些在 Task 3 校准）。场景顺序：钩子→设纸型→区块①②③④⑤→属性→预览出纸→保存→cta。cta 场景口播逐字复制第二支剧本 `out/2026-11-17-batch-print/script-batch-print.json` 的 cta 场景。

- [ ] **Step 2: 填封面与抖音文案**

`coverTitle`「拖出面单」(4 字)；`coverSub`「空白起步 · 五区块 · 绑字段出纸」；`coverVerdict` 用 `<s>` 划除写法；三张卡 num 分别为 23 / 100×150 / 26。`douyin` 填 5 标题候选、简介、恰好 5 不重复标签、置顶评论、`sources`（尺寸/字段数/元素数给 `templates.js` 行号与实测命令）。

- [ ] **Step 3: 过门禁**

Run:
```bash
cd .video-skill
python3 polyphone.py "$PWD/script-waybill-tutorial.json" /tmp/poly.json /tmp/poly.md
node -e "const {validateDouyin}=await import('./douyin-copy.mjs');validateDouyin(JSON.parse(require('fs').readFileSync('script-waybill-tutorial.json')))" 2>/dev/null || true
```
Expected: 多音字判定通过；若报风险字未认，按提示补 `read`/`accept` 后重跑至通过。

- [ ] **Step 4: Commit**

```bash
git add .video-skill/script-waybill-tutorial.json
```
（注：`.video-skill/` 被 gitignore，此 commit 仅作本地标记；不强制。）

### Task 2: 编写配套交付物

**Files:**
- Create: `.video-skill/out/2026-11-18-waybill-tutorial/跟做步骤清单.md`
- Create: `.video-skill/out/2026-11-18-waybill-tutorial/min-waybill-template.json`

**Interfaces:**
- Consumes: Task 1 剧本的 5 区块划分与代表字段。
- Produces: 观众对照物，随成片同目录拷贝。

- [ ] **Step 1: 写步骤清单**

按 5 区块列出：每块元素类型与数量、绑定字段、建议落点（用相对位置描述，如上/左/居中）、纸型 100×150mm。末尾给「做完自检」清单：23 元素、4 个代表字段、预览有 1 页、已保存 JSON。

- [ ] **Step 2: 写可导入最小模板**

从 `express-waybill` 提取结构骨架（paperSize CUSTOM、customWidth 100、customHeight 150、margins、fields 26 项、elements 23 项带 options），另存为 `min-waybill-template.json`，保留 `{waybill.no}` 等表达式与码类 options。用 node 脚本导出，避免手写错：
```bash
node --input-type=module -e "import('./demos/apps/vue3/src/templates.js').then(({SAMPLES})=>{const w=SAMPLES.find(s=>s.id==='express-waybill');require('fs').writeFileSync('.video-skill/out/2026-11-18-waybill-tutorial/min-waybill-template.json',JSON.stringify({paperSize:w.template.paperSize,customWidth:w.template.customWidth,customHeight:w.template.customHeight,margins:w.template.margins,fields:w.fields,elements:w.template.elements},null,2))})"
```
Expected: 文件存在，JSON 合法，elements 长度 23。

### Task 3: FAST 模式校准步骤

**Files:**
- Modify: `.video-skill/script-waybill-tutorial.json`（填入精确坐标与期望值）

**Interfaces:**
- Consumes: Task 1 剧本骨架。
- Produces: 校准后的步骤参数，供 Task 4 整链使用。

- [ ] **Step 1: 生成配音与时间轴（FAST 校准前置）**

```bash
cd .video-skill
VIDEO_SCRIPT="$PWD/script-waybill-tutorial.json" npm run video:voice
VIDEO_SCRIPT="$PWD/script-waybill-tutorial.json" npm run video:polyphone-audio
```
Expected: `out/<日期>-waybill-tutorial/voice/` 与 `timings.json` 生成。

- [ ] **Step 2: FAST 实跑录屏，逐场景核对**

```bash
VIDEO_FAST=1 VIDEO_SCRIPT="$PWD/script-waybill-tutorial.json" npm run video:record
```
Expected: 11 场景全跑通，无 `✗`/异常退出。对每个步骤按以下校准并写回剧本：
- `dragCard`：卡片名用 Task 1 的 label；字段行中文名；`target` 为 `.hiprint-printPaper`；`xRatio/yRatio` 按 spec 区块落点，二维码 `yRatio` 避开面单横线（参考 `53361e9` 的 top 52/height 18 避让）。
- `measureCount`：每区块后断言画布累计元素数（3/9/14/18/23）。
- `measureBarcode`/`measureQr`/`measureText`：选择器与期望值从实际 SVG/DOM 反解后写入；`measureQr` 读 `.print-element.type-qrcode img`，`measureBarcode` 读 `.print-element.type-barcode .print-barcode svg`。
- 设纸型：用 `measureCss`/`measureBox` 对 `.hiprint-printPaper` 断言宽 100mm / 高 150mm（按 conv 的 mm 换算写期望）。
- 保存动作：在 `download`（导出模板）与 `@save` 事件断言之间实测选一个可观测的，写入步骤。
- 记录每步实际耗时；若预估超 180s，优先压缩区块口播字数（保留句号断句），不砍元素。

- [ ] **Step 3: 重跑 FAST 确认全绿**

```bash
VIDEO_FAST=1 VIDEO_SCRIPT="$PWD/script-waybill-tutorial.json" npm run video:record
```
Expected: 全场景通过，元素计数 23 对齐，耗时 <180s。

### Task 4: 整链出片

**Files:**
- Modify: 剧本（若 Task 3 后续微调）；产物目录由流水线生成。

**Interfaces:**
- Consumes: Task 3 校准后的剧本。

- [ ] **Step 1: 整链重跑**

```bash
cd .video-skill
VIDEO_SCRIPT="$PWD/script-waybill-tutorial.json" npm run video
```
注意 TTS 外部 503 时整链带退避重试（参考第二/三支做法）。Expected: 全流程通过，`video:check` 同步校验通过，`video:verify` 全绿。

- [ ] **Step 2: 抽帧复核画面**

用 FFmpeg（优先 `demos/apps/vue3/node_modules/@ffmpeg-installer/darwin-x64/ffmpeg`）在预览出纸场景抽帧，确认：23 元素可见、运单号条码与查件二维码出图、目的地大字加框、二维码无遮挡。Expected: 画面与 spec 一致。

### Task 5: 整理交付与登记

**Files:**
- Modify: `.video-skill/series-roadmap.md`、`todo.md`
- Move: `.video-skill/script-waybill-tutorial.json` → 产物目录

**Interfaces:**
- Consumes: Task 2 配套物、Task 4 成片。

- [ ] **Step 1: 归置剧本到产物目录**

把剧本移入 `out/<日期>-waybill-tutorial/`，改 `cards` 等路径为相对，用绝对路径重跑一次 `video:verify` 确认不换目录仍全绿。

- [ ] **Step 2: 登记**

在 `series-roadmap.md` 加「零基础教学 · 快递面单」行与出片记录；在 `todo.md` 标记该任务完成。Expected: 文档反映成片时长、目录、验收状态。

- [ ] **Step 3: 片尾一致性终检**

比对成片 cta 口播与第二/三支逐字一致，`endcard-tail-light.png` 与其余三支同源。Expected: 一致。

## Self-Review 结果

- Spec coverage：场景表→Task1；配套物→Task2；路径前提/坐标/码类/时长→Task3；出片→Task4；登记与片尾→Task5。无遗漏。
- Review Focus 五项均在 Task 3/5 有对应断言或复核。
- 未知项（measure 精确参数、保存动作二选一、每步耗时）按 writing-plans 原则留给-implementer 在 FAST 实跑中按可观测结果确定，非决策空白。
