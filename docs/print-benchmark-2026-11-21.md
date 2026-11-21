# 三端打印压测报告（2026-11-21）

## 压测口径

三端指的是 README 中列出的三条链路：

- **A · 浏览器打印**：core 同构渲染进 iframe → `contentWindow.print()`
- **B · 服务端 PDF**：`services/render` 微服务（Playwright Headless Chromium）
- **C · 静默打印**：本机 Electron 客户端 `PrintClient.printHtml()`

可自动化且可复现的口径 = **「数据 → 可打印产物」的核心渲染时间**：

- A 端：`renderHtmlPages()`（浏览器内两遍分页渲染 → HTML），在真实 Chrome（Playwright 打开的 vue3 demo 页面）中调用
- B 端：`POST /render/pdf`（render 服务，Playwright Chromium → PDF），端到端计时
- C 端：`renderHtmlPages()`（与 A 同源，见 `print-client.ts:119`）+ `encodeRequest()` 协议帧编码；**本地 WebSocket 传输与物理打印依赖客户端/硬件，本环境不可测**，其耗时不计入

> 说明：物理打印时间（走纸/打印头）依赖具体打印机，不属于软件压测范畴；三端共有的、可比较的是渲染准备时间。

## 测试环境

- Node v24.20.0；macOS；系统 Chrome（`/Applications/Google Chrome.app`）
- render 服务：`npm run dev:render`（:3001，`x-render-key: dev-render-key`，单请求超时 30s）
- 模板：A4、10mm 四边边距、1 个文本元素（`压测第 {idx} 份`）
- 数据：`printData = [{idx:1}, ...]`，份数分别为 20/50/100/500/1000
- 预热：首次请求含浏览器冷启动，A/B 端正式数据均为预热后测量

## 压测结果

### A · 浏览器打印（renderHtmlPages，真实 Chrome）

| 份数 | 结果 | 渲染耗时 | HTML 大小 | 页数 |
|---|---|---|---|---|
| 20 | OK | 17 ms | 9 KB | 20 |
| 50 | OK | 33 ms | 20 KB | 50 |
| 100 | OK | 60 ms | 37 KB | 100 |
| 500 | OK | 258 ms | 178 KB | 500 |
| 1000 | **FAIL** | — | — | 超出 500 份上限 |

### B · 服务端 PDF（/render/pdf，Playwright Chromium）

| 份数 | 结果 | 端到端耗时 | PDF 大小 |
|---|---|---|---|
| 20 | OK | 822 ms | 30.2 KB |
| 50 | OK | 1,325 ms | 51.2 KB |
| 100 | OK | 2,375 ms | 86.2 KB |
| 500 | OK | 10,181 ms | 368.9 KB |
| 1000（单次） | **FAIL 400** | — | 超出 500 份上限 |
| 1000（分批 2×500） | OK | 20,235 ms（两批各 ~10.1s） | 329 + 330 KB |

### C · 静默打印（协议层，本地传输/物理打印不可测）

| 份数 | 渲染耗时（同源 A 端） | 协议帧编码 | 帧大小 |
|---|---|---|---|
| 20 | ~17 ms | 0.0039 ms | 1.6 KB |
| 50 | ~33 ms | 0.0060 ms | 3.6 KB |
| 100 | ~60 ms | 0.0197 ms | 7.0 KB |
| 500 | ~258 ms | 0.0284 ms | 34.4 KB |
| 1000 | 受 500 上限约束 | 0.0492 ms | 68.6 KB |

协议帧编码为微秒级，不是瓶颈；C 端瓶颈在渲染（同 A）与本地传输/打印（硬件相关）。

## 关键发现

1. **500 份是硬上限**：`MAX_BATCH_COPIES = 500`（`packages/core/src/print/normalize-print-data.ts`），A/B/C 三端一次请求均不能超过 500 份。1000 张必须分批（2×500），B 端实测总耗时 ~20.2s。
2. **性能量级**：
   - A 端（浏览器内存渲染）：500 份 258 ms，线性增长，非常快
   - B 端（服务端 PDF）：500 份 ~10.2 s，含 Chromium 排版 + PDF 合成，是主要成本
   - 单份成本：A ~0.5ms/份，B ~20ms/份
3. **B 端未触及 30s 超时**：500 份 10.2s，距 30s 超时尚有余量；但若单份内容更复杂（多页/表格分页/图表），1000 份分两批仍有超时风险需关注。
4. **C 端协议层无性能问题**：`encodeRequest` 微秒级，HTML 帧 1.6~68.6 KB，远低于 WebSocket 常规限制。
5. **启动期 i18n 警告**：render 服务启动打印 `missing key: echarts.plugin.k14x (locale=en-US)`（模块级常量在默认 locale 取词），不影响渲染结果，但建议后续处理。

## 建议

- 超过 500 份的业务：在业务层分片（每片 ≤500），逐片渲染/发送；B 端注意单片内容复杂度避免 30s 超时
- 超大批量（千张以上）优先 A 端浏览器渲染或 C 端本地静默打印，避免 B 端服务端 PDF 的累积耗时
- 如需提升单次上限，需修改 `MAX_BATCH_COPIES` 并评估各端超时/内存预算
