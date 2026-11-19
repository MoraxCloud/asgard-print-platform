# 统一片尾 CTA 口径

后续所有视频的**片尾 CTA 口播**统一为本文「规范口播」方案：感谢关注，引导观众在评论区留下建议与需求、参与讨论。CTA 之前的场景不再复述开源仓库信息。
画面卡沿用既有版式（仓库信息展示不变），只按主题换配色：横屏用浅色版 `endcard-tail-light.png`，深色版 `endcard-tail-dark.png` 供需要时替换。

## 规范口播（后续所有视频逐字一致）

> MIT 开源，仓库叫 worm-print-platform。感谢大家的关注。可以在评论区留下您的建议和需求，欢迎大家讨论。
断句规则：按句号切成每句一条字幕，用词不变，仅将原分号改为句号。本方案断为三句，首句「MIT 开源，仓库叫 worm-print-platform。」与末句字幕排两行。

## 配套约束

- `cta` 场景的 `showImage.ms` 按配音实测时长设置：`video:voice` 生成的 `timings.json` 中该场景 `duration` 即口播秒数，`ms` 取其毫秒值并留少量余量。health-report 的 CTA 口播实测 12.1s、录制 12.6s。
- `timings.json` 由 `voiceover.mjs` 依据 TTS 实测时长生成，手工改文案或时间戳只是临时对齐；重跑配音会覆盖，须以脚本 `voiceover` 为准。
- 画面卡沿用既有版式（含仓库信息），与新口播不做逐字对应；这是有意取舍，不为单支视频改版式或自绘封面。

## 规范画面文案（浅/深两版逐字一致）

- 眉题：开源 · 跨框架可视化打印模板设计器
- 标题：worm-print-platform
- 版本条：现状与入口 · npm v1.5.2 · 2026-11-17 发布
- 三行要点：
  - core · plugin-kit · canvas · echarts 四个发布包同号发布
  - 桌面客户端安装包挂 GitHub / Gitee Releases
  - 仓库 MIT 开源，Vue3 / Vue2 / React / jQuery 四宿主示例整份照抄
- 系列：系列后面逐条拆 **渲染管线 · 设计器内核 · 静默打印**
- 行动：从这条序章开始看，**欢迎提 issue**
- 二维码区：抖音 · 虫子编程 / 关注更新 · 要接你的场景提 issue 聊
- 品牌区：GitHub + Gitee 官方标识 / MIT 开源 · GitHub / Gitee 双源同步

## 版本与日期依据

- 根 `package.json` 版本 `1.5.2`；`CHANGELOG.md` V1.5.1（2026-11-16）为首个 GitHub Release，桌面客户端安装包随该版发布。
- npm `@worm-print-platform/core@1.5.2` 发布时刻 `2026-11-17T14:11:43Z`，git tag `v1.5.2` 为 `2026-11-17 20:08 +0800`。
- V1.5.3 仍标注「待发布」，不写入片尾口径。

## 资源与生成

| 文件 | 作用 |
| --- | --- |
| `endcard-tail.html` | 片尾卡源模板，`?theme=light`（默认）/ `?theme=dark` 切换主题，文案不变 |
| `render-endcard-tail.mjs` | 按 `VIDEO_SCRIPT` 的 OUT_DIR 渲染浅/深两张 PNG |
| `assets/douyin-qr.png` | 从仓库根 `douyin.png` 裁出的二维码圆图（浅底），避免深色海报方块破坏浅色卡 |
| `assets/gitee-logo-light.svg` | Gitee 官方标识的深色字标变体，官方 SVG 字标为白色，浅底需替换 |
| `out/<日期>-<key>/endcard-tail-light.png` | 横屏片尾卡（浅色，1600×900 @2x） |
| `out/<日期>-<key>/endcard-tail-dark.png` | 同文案深色版（1600×900 @2x） |

重渲染：

```bash
cd .video-skill
VIDEO_SCRIPT=$PWD/out/2026-11-17-batch-print/script-batch-print.json npm run video:endcard
# 整链 npm run video 已在 video:record 前自动执行这一步
```

## 状态与后续

- health-report 已按新 CTA 口径重跑配音、录屏、合成、字幕、封面并通过 `verify.mjs`；其余旧片仍是旧片尾，不强制回改。
- 三支横屏剧本最后新增 `cta` 场景，以 `showImage` 展示浅色片尾卡；第二支旧 `endcard-batch-print.png` 深色片尾已从剧本摘除，文件保留作历史素材。
- 序章 `script-prologue.json` 与 `cards-prologue.html` 的 cta 文案仍为旧口径；**新 CTA 方案以本文「规范口播」为准，后续视频统一采用**，旧片不强制回改。
- 下次合成前必须重跑 TTS、多音字听审与音画同步校验；「发布」读 fā、「挂」读 guà 等需人工听审确认，不以台账自动通过代替。
