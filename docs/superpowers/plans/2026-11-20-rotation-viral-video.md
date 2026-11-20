# 整页旋转爆款视频 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用已实现的整页旋转能力,出一条竖屏 1080×1920、45 秒内的抖音爆款视频,展示横版设计稿经 90° 整页旋转后竖向 A4 出纸,设计稿横竖混合但出纸方向统一竖向。

**Architecture:** 复用 `.video-skill` 竖屏流水线(静态卡片 HTML → PNG → 配音 → 合成)。新建一份竖屏剧本 `script-rotation-viral.json` + 专属卡片 `cards-rotation-viral.html`,在卡片内用静态绘制呈现「横版设计稿 297×210 旋转 90° → 竖向 A4 210×297」的对比。流水线本身不改(竖屏是静帧渲染,不支持真录屏嵌视频)。

**Tech Stack:** Node/Playwright 卡片截图、edge-tts 配音、ffmpeg 合成、ECharts/HTML 静态绘制。

**Spec:** `docs/superpowers/specs/2026-11-20-rotation-viral-video-design.md`

## Global Constraints

- 出纸方向全片统一竖向:横版稿 `outputRotation: 90` 填入竖向 A4,竖版稿 `0°`;依据 `css-builder.test.ts:164-188`(外层 `@page 210mm 297mm`、转子 297×210、`translate(210mm,0) rotate(90deg)`)。
- 竖屏 1080×1920,fps 30,`coreTop 240 / coreBottom 1680 / rightFrom 1100`,字幕 `fontsize 56 / marginV 340 / lineWidth 24 / maxLines 2`(与体检报告重制一致)。
- 版本口径 v1.6.0;封面只改 `cover*`;恰 5 标题(每条 ≤30 字)、5 不重复标签;片尾统一 CTA 逐字采用 `endcard-tail.md`。
- 多音字门禁:上下文改判用 `scene.read`(两字词),风险多读字用 `script.accept`(单字),注解词必须在台词出现。
- 不上传抖音;发布由用户人工完成,上传前预览平台裁切与读音。
- 产物目录 `portrait/out/2026-11-20-rotation-viral/`,首跑自动登记 `out-registry.json` key `portrait/rotation-viral`。

## Review Focus

- 横版设计稿设 90° 是否真的竖向出纸(片中核心结论),出纸方向是否会随稿源方向漂移 → Task 2 卡片 `preview` body 用静态图明确「横版稿→竖向纸」。
- 横版稿与竖版稿画面混合时观众是否误以为出纸方向也混合 → Task 2 卡片叠字「不管怎么排,出纸都竖向」。
- 静帧卡片是否把「297×210 旋转 90° 填入 210×297」画对(长宽互换而非拉伸/补边) → Task 2 的 body 绘制断言。
- 口播时长是否压在 45 秒内 → Task 3 配音后核对 `timings.json` 总时长。
- 字幕两行、每行 ≤24 字、片尾 CTA 逐字 → Task 6 `video:verify`。

---

### Task 1: 竖屏剧本 script-rotation-viral.json

**Files:**
- Create: `.video-skill/portrait/script-rotation-viral.json`

**Interfaces:**
- Consumes: 设计文档的事实口径;`script-health-report-remake.json` 的字段结构。
- Produces: 6 个场景 `body` 键供 Task 2 的卡片使用;标题供流水线各步。

- [ ] **Step 1: 写剧本,6 场景,body 键 `hook / pain / rotate / preview / edge / cta`**

按 `script-health-report-remake.json` 结构完整填写:`title / voice / rate / cards / video / subtitle / cover* / scenes / read / accept / douyin`。场景口播:
  - `hook`:「横着排的表格,竖向打出来,不用重排。整页旋转,一次看懂。」
  - `pain`:「出纸方向不对,以前只能把内容重排一遍,表格图表全拆了。」
  - `rotate`:「页面属性里,内容旋转角度选 90 度。设计稿是横版 297 乘 210,整页旋转九十度。」
  - `preview`:「纸张换成竖向 A4,210 乘 297。长宽互换,内容不缩放、不裁切。竖着排的稿子,角度设为零,同样竖向出纸。」
  - `edge`:「连续纸和小票纸没有整页旋转概念。整页旋转只改出纸方向。」
  - `cta`:逐字「MIT 开源,仓库叫 worm-print-platform。感谢大家的关注。可以在评论区留下您的建议和需求,欢迎大家讨论。」

- [ ] **Step 2: 填 cover 与 douyin 字段**

`coverTitle`「竖向出纸」(4字);`coverVerdict`「横版设计,<s>重排内容</s> 整页旋转竖向出纸」;`coverCards` 三张数字卡(297×210 / 90° / 210×297,单位 mm/度);`coverVersion` v1.6.0。`douyin.titles` 5 条 ≤30 字,`tags` 5 个不重复(打印模板/整页旋转/前端开发/开源项目/Vue3),`sources` 写 `css-builder.test.ts:164-188` 等出处。

- [ ] **Step 3: 填 read / accept**

`read`(两字词):`["模板","keep",...]`、`["旋转","keep",...]`、`["长宽","chang2",...]`。`accept`(单字):`["载","zai4"]`、`["还","hai2"]`、`["都","dou1"]`、`["着","zhe"]`、`["设","she4"]`、`["角","jiao3"]`、`["纸","zhi3"]`、`["大","da4"]`。注解词必须在台词出现,否则 polyphone.py 报过期。

- [ ] **Step 4: 校验 JSON 可解析**

Run: `node -e "JSON.parse(require('fs').readFileSync('.video-skill/portrait/script-rotation-viral.json','utf8')); console.log('ok')"`
Expected: `ok`

---

### Task 2: 卡片 HTML cards-rotation-viral.html

**Files:**
- Create: `.video-skill/portrait/cards-rotation-viral.html`

**Interfaces:**
- Consumes: Task 1 的 6 个 `body` 键与 `idx` 查询参数(由 `cards.mjs:26` 传入)。
- Produces: 6 张静态卡片,每张对应一个场景 body。

- [ ] **Step 1: 复制体检报告卡片作骨架**

`cp .video-skill/portrait/cards-health-report-remake.html .video-skill/portrait/cards-rotation-viral.html`,保留深色背景、青绿强调、顶部品牌行、底部留白与 `padding: 240px 168px 520px 72px`,不动几何避让。

- [ ] **Step 2: 实现 6 个 body 分支的静态绘制**

按 `?body=<键>` 切换:`hook` 横版表格缩略 + 大字「横排的表格,竖向打」;`pain` 拆散的表格与重排叉号;`rotate` 横版稿 297×210 矩形 + 90° 旋转箭头(angle 标注);`preview` 左右分栏——左「横版稿 297×210 旋转 90°」,右「竖向 A4 210×297」,中间箭头,底部叠字「不管怎么排,出纸都竖向」(Review Focus 的横竖混合不误导断言);`edge` 连续纸小票示意图 + 「无整页旋转」;`cta` 片尾浅色卡占位。横版稿矩形必须画成 297:210 横长竖短,竖向纸画成 210:297 竖长横短,不得等比例缩放成同向。

- [ ] **Step 3: 本地渲染 6 张卡片检查**

先用 Task 3 生成的 `timings.json`(可借体检报告现有 timings 临时跑),Run:
`cd .video-skill && VIDEO_SCRIPT=script-rotation-viral.json npm run video:portrait:cards`
Expected: 输出 `cards/scene-0.png` … `scene-5.png`,六张非空。取图判读前先说明来源与用途并取得用户同意(技能约束);未同意时只做文件存在与非空检查。

---

### Task 3: 配音与多音字门禁

**Files:**
- Output: `.video-skill/portrait/out/2026-11-20-rotation-viral/` 下 `voice/`、`polyphone.*`、`timings.json`

- [ ] **Step 1: 跑配音**

Run: `cd .video-skill && VIDEO_SCRIPT=script-rotation-viral.json npm run video:portrait:voice`
Expected: 多音字判定通过,逐句合成完成,打印总时长。

- [ ] **Step 2: 核对总时长 ≤45s**

Run: `node -e "const t=require('./.video-skill/portrait/out/2026-11-20-rotation-viral/timings.json'); console.log(t.scenes.reduce((s,x)=>s+x.duration,0).toFixed(1)+'s')"`
Expected: ≤45;若超过,精简 Task 1 的 voiceover 后重跑本任务(只改台词必须重跑配音)。

- [ ] **Step 3: 跑听审片段**

Run: `cd .video-skill && VIDEO_SCRIPT=script-rotation-viral.json npm run video:portrait:polyphone-audio`
Expected: 生成 `polyphone-audio.m4a`,列出需人工听审句数。

---

### Task 4: 卡片渲染与排版几何检查

**Files:**
- Output: `cards/scene-*.png`

- [ ] **Step 1: 正式渲染卡片**

Run: `cd .video-skill && VIDEO_SCRIPT=script-rotation-viral.json npm run video:portrait:cards`
Expected: 6 张 PNG 全部生成。

- [ ] **Step 2: 排版几何检查**

Run: `cd .video-skill && VIDEO_SCRIPT=script-rotation-viral.json npm run video:portrait:check`
Expected: 全绿;再按技能做一次必然变红的反面对照(临时抬高 `coreTop`),确认判据有效后恢复并重跑全绿。

---

### Task 5: 合成、字幕、封面、文案

- [ ] **Step 1: 合成竖屏成品**

Run: `cd .video-skill && VIDEO_SCRIPT=script-rotation-viral.json npm run video:portrait:compose`
Expected: `portrait.mp4` 生成,1080×1920。

- [ ] **Step 2: 字幕墨量检查**

Run: `cd .video-skill && VIDEO_SCRIPT=script-rotation-viral.json npm run video:portrait:subs`
Expected: 全绿;中部成簇无墨必须查 ASS 事件。

- [ ] **Step 3: 四比例封面**

Run: `cd .video-skill && VIDEO_SCRIPT=script-rotation-viral.json npm run video:portrait:cover`
Expected: 16:9 / 9:16 / 3:4 / 4:3 四张全绿,越裁切带则改 `coverCards` 文案(不动模板坐标)。

- [ ] **Step 4: 五标签文案**

Run: `cd .video-skill && VIDEO_SCRIPT=script-rotation-viral.json npm run video:portrait:copy`
Expected: `douyin-copy.md` 生成,恰 5 标签。

---

### Task 6: 总验收与交付

- [ ] **Step 1: 跑 verify**

Run: `cd .video-skill && VIDEO_SCRIPT=script-rotation-viral.json npm run video:portrait:verify`
Expected: 全绿(视频参数、四封面尺寸、SRT 与时间轴、多音字原文、五标签文案)。

- [ ] **Step 2: 人工听审与交付说明**

列出 `polyphone-audio.m4a` 的待听审句数,请用户逐句听审确认读音(代理不得声称 ASR 已证明正确)。说明两平台均横竖屏成片的实际参数、版本口径 v1.6.0、发布由用户人工完成、上传前预览裁切与读音。

- [ ] **Step 3: 提交设计文档与计划**

设计文档与计划文件是入库文档(`.video-skill` 产物目录被忽略不入库),随本任务提交:
`git add docs/superpowers/specs/2026-11-20-rotation-viral-video-design.md docs/superpowers/plans/2026-11-20-rotation-viral-video.md && git commit -m "docs: 新增整页旋转爆款视频设计与出片计划"`
