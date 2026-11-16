# 打印链路

三条链路吃同一份 `templateJson + printData + baseUrl`，三端产出一致（core 同构渲染）。

## 浏览器打印（链路 A）

- NPM 宿主：`import { renderHtmlPages, browserCodeRenderer } from '@worm-print-platform/core/browser'`，渲染进 iframe 后 `iframe.contentWindow.print()`。
- 浏览器直挂：`WormPrintCanvas.renderHtmlPages(template, data, baseUrl, WormPrintCanvas.browserCodeRenderer)`，全局已内联 core 执行器。
- 预览和实际打印必须用同一份 `templateJson + printData + baseUrl`；`renderHtmlPages` 返回的 `warnings`（出纸裁切预估）可在预览层展示，不阻断打印。

## 服务端 PDF（链路 B）

部署独立 `services/render` 微服务，宿主后端持有 `RENDER_API_KEY` 并代理 `/render/pdf`（注入 `x-render-key`）。前端不保存渲染密钥，不虚构 core 内的 PDF 服务。细节见 [服务端渲染](server-render.md)。

## 桌面客户端静默打印（链路 C）

- NPM 宿主从 `@worm-print-platform/core/client` 导入 `PrintClient`；直挂宿主用 `WormPrintCanvas.PrintClient`。
- 浏览器与桌面客户端必须同机，客户端只绑定 `127.0.0.1`。
- 推荐 `printHtml`：先用 `renderHtmlPages` 在浏览器渲染，再把结果直送客户端静默出纸（core 升级无需重发客户端）；`print()` 为兼容通道。
- `BUSY` 由宿主排队重试，客户端不提供离线补打队列。细节见 [静默打印](silent-print.md)。

链路 A 的浏览器渲染结果与链路 C 的 `printHtml` 输入是同一个 `renderHtmlPages` 产物——宿主自绘预览层时用一份渲染结果即可同时支撑「浏览器打印」和「静默打印」两个按钮。
