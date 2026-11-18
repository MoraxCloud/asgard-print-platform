---
name: making-douyin-videos
description: Use when 要在 worm-print-platform 创作、重跑或验收抖音讲解视频、口播剧本、字幕、封面与发布文案，或需要排查多音字误读、字幕遮挡、封面裁切和标签数量问题。普通代码改动及与视频交付无关的图片工作不适用。
---

# 抖音讲解视频与封面交付

## 目标

用本技能自带的同一套流水线、卡片、封面模板和真实默认剧本出片。横屏用于真实操作，竖屏用于机制讲解；不得另画一套封面或凭记忆重写样式。

- 技能源文件：`assets/pipeline/`。历史 `.video/` 只作参考，不是新片源文件。
- 产物只写运行目录；`.video/` 与 `.video-*/` 均已忽略，不进入包源码和文档。
- 取图判读前先说明来源、用途和问题并取得用户同意；未同意时只做 DOM、FFmpeg、FFprobe 等量测。
- TTS、录屏、整链重跑耗时或耗额度，执行前说明；不得自动上传抖音。

## 1. 准备独立运行目录

在仓库根目录执行：

```bash
node .agents/skills/making-douyin-videos/scripts/bootstrap.mjs --target .video-skill
npm install
npm run build -w @worm-print-platform/core
npx playwright install chromium
python3 -m pip install pypinyin edge-tts
```

`npx playwright install chromium` 在新机器必跑（渲染封面/卡片走仓库根的 playwright，缓存缺对应版本会直接报错）。

目标目录必须为空；不得覆盖已有 `.video/`。Playwright 使用仓库根依赖，FFmpeg 优先使用 demos/apps/vue3 静态包、再回退系统命令。横屏实录另起 demo（端口 9331 由 demos/apps/vue3/vite.config.js 固定）：

```bash
npm run dev:demos:vue3
```

## 2. 复制并改写真实剧本

默认示例不是免审查的事实来源，发布前必须重新核对版本、数字和源码行号。

| 链路 | 默认剧本与卡片 | 新片做法 |
| --- | --- | --- |
| 横屏 1920×1080 | `.video-skill/script.json` | 复制为 `script-<key>.json`，改 `scenes[].voiceover/steps` |
| 竖屏 1080×1920 | `.video-skill/portrait/script.json` + `cards-mcp-agent.html` | 复制为 `portrait/script-<key>.json` 与 `cards-<key>.html`，同步改 `cards` 字段 |

先读 [剧本写作与字段](references/script-authoring.md)。剧本必须有 key（`script-<key>.json`，key 即目录里的主题名）；无 key 的 `script.json` 只作样例与自检，不出片。台词、录屏步骤、卡片、封面和 `douyin` 文案必须围绕同一主题；事实给源码或实测出处，未发布就写未发布。

**出片后整理（一支视频一个自足目录）**：首跑时剧本在根目录，出片后把该片的专属剧本（及竖屏专属卡片 HTML）移入它的「日期-主题」产物目录，使剧本与成片同目录、整个目录拷走即交付。横屏卡片剧本 `cards` 字段改成相对 `portrait/` 的路径（如 `out/<日期>-<key>/cards-<key>.html`）。重跑时用绝对路径指定产物目录内的剧本：`VIDEO_SCRIPT=$PWD/out/<日期>-<key>/script-<key>.json npm run video`（竖屏同理传绝对路径给 `video:portrait`），路径解析仍按剧本文件名取 key、按 `out-registry.json` 定位产物目录，不换目录。流水线工具与默认样例剧本保持原位不动。

## 3. 先过读音与排版，再合成

多音字和字幕规则见 [多音字与字幕](references/polyphone-and-subtitles.md)。核心闭环：

`pypinyin 上下文识别 → read/accept 人工语义确认 → 同音字只替换 TTS 文本 → display 原文进字幕 → 听审片段复核`。

无唯一同音替换字时改措辞或 `keep` 加听审，不得声称 ASR 已证明读音正确。

### 竖屏整链

```bash
cd .video-skill
VIDEO_SCRIPT=script-<key>.json npm run video:portrait
```

顺序：配音门禁 → 听审片段 → 卡片 → 几何检查 → 合成与烧录字幕 → 字幕墨量检查 → 四比例封面 → 五标签文案 → 总验收。

### 横屏整链

```bash
cd .video-skill
VIDEO_SCRIPT=script-<key>.json npm run video
```

顺序：配音门禁 → 听审片段 → 片头 → **片尾卡渲染（`video:endcard`）** → 实录 → 合成 → 音画同步 → 四比例封面 → 五标签文案 → 总验收。需要讲解卡片时先运行 `VIDEO_SCRIPT=script-<key>.json npm run video:panels`。剧本末尾用 `showImage` 引用统一片尾卡时，`video:endcard` 会先把浅/深两版渲染进本片 OUT_DIR；单独重跑某一步前也要确认该 PNG 已存在。

只改台词必须重跑配音及其后续步骤；只改卡片可跳过 TTS，但仍须重跑排版、合成和验收。不得静默重跑历史成片。

## 4. 抖音交付硬约束

- 字幕：短条、最多两行；竖屏默认每行 16 字、56px、`MarginV=340`，横屏默认每行 20 字。均为项目经验值，不称平台官方安全区。
- 封面风格冻结：`cover-douyin.html` 打样单版式（品牌行、三层叠印标题、副标题、样张、结论划除行、角标）是项目固定风格，出片只改剧本 `cover*` 字段；不得换版式、另做模板或自绘封面。
- 片尾介绍统一：后续所有视频的片尾 CTA 口播以 [统一片尾 CTA 口径](references/endcard-tail.md) 的「规范口播」为唯一方案（MIT 开源仓库名 + 感谢关注 + 评论区留下建议与需求、讨论），CTA 之前的场景不再复述开源仓库信息；画面卡沿用既有版式，横屏用浅色版 `endcard-tail-light.png`（浅色 demo 界面适配），深色版为备选；不得为单支视频另写片尾文案或自绘版式。文案、主题与重渲染见该文档。
- 必交 `cover-douyin-4x3.png`（1440×1080）和 `cover-douyin-3x4.png`（1080×1440）；保留 16:9、9:16 母版。裁切规则不得改成拉伸或补边。
- 文案：自动生成 `douyin-copy.md`，含 5 条标题候选、简介、**恰好 5 个不重复标签**、置顶评论和勿上传的口径出处。
- 产物目录：一支视频一个「日期-主题」目录（横屏 `.video-skill/out/<YYYY-MM-DD>-<key>/`，竖屏 `portrait/out/` 同规则），日期取首次出片日，首跑自动登记 `out-registry.json`、重跑同片不换目录。成片、SRT、时间轴、多音字台账与听审文件、四张封面、文案全部落该目录；发布时整个目录拷走即交付单元。清单与判据见 [封面与验收](references/delivery.md)。
- 封面风格冻结：`cover-douyin.html` 打样单版式（品牌行、三层叠印标题、副标题、样张、结论划除行、角标）是项目固定风格，出片只改剧本 `cover*` 字段；不得换版式、另做模板或自绘封面。

## 5. 验收与停手条件

整链末尾运行 `verify.mjs`，检查视频参数、四封面尺寸、字幕原文与两行约束、多音字文件和五标签文案。竖屏另保留反面对照：临时抬高 `coreTop` 或换左右等宽卡片，检查必须变红，再恢复并重跑全绿。

禁止：

- 用“看着没撞”替代量测，或用 `-ss` 抽单帧断言整段字幕存在。
- 把同音替换字写进画面或 SRT，跳过未认下的多音字继续出片。
- 自绘封面、改变现有裁切分割、交付少于或多于 5 个标签。
- 把经验安全区称为抖音官方规范，把 `private` / 待发布能力写成已发布。
- 用整链测试代替人工听审；最终读音与平台裁切仍需用户上传前预览确认。
