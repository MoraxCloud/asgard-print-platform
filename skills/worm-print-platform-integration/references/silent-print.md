# 静默打印（桌面客户端链路）对接指南

链路 C = 浏览器页面 + 本机桌面打印客户端 + 物理打印机，实现**无打印对话框**的静默出纸（收银小票、热敏/标签、针式多联、批量无感打印）。

```
宿主 Web 页面
   │  @worm-print-platform/core/browser（renderHtmlPages 两遍渲染 + 连续纸纸长推导）
   │  @worm-print-platform/core/client（SDK：端口探测/重连/超时/鉴权）
   ▼  WebSocket（仅绑定 127.0.0.1）
桌面打印客户端（Electron，clients/client）
   ├─ WsServer  握手鉴权 → 协议帧分发
   ├─ PrintEngine（串行锁，并发返回 BUSY）
   └─ 隐藏窗口 webContents.print 静默出纸（core/browser 同构渲染）
```

- 推荐链路 `print.submitHtml`：渲染在宿主页面内完成，客户端只负责静默出纸；core 升级无需重发客户端。
- 兼容链路 `print.submit`：客户端装配 core 打印管线本地渲染（存量接入保留）。
- 客户端默认从 `127.0.0.1:17521` 起监听，端口被占用则 +1；SDK 从同一起点逐端口探测握手（APP_ID 仍为 `worm-print-client`）。

## 1. 前置条件

1. 工位电脑已安装并运行桌面打印客户端。客户端仅监听回环地址，浏览器必须与客户端在同一台电脑。
2. 浏览器侧 SDK 随 core 提供，无需单独安装（需已安装 `@worm-print-platform/core`）。

SDK 为 core 子路径导入，框架无关（纯 TypeScript，无 Vue/React 依赖）：

```ts
import { PrintClient } from '@worm-print-platform/core/client'
```

## 2. 浏览器侧接入

### 连接、枚举、打印

```ts
import { PrintClient, WormPrintError } from '@worm-print-platform/core/client'

const client = new PrintClient()
client.onStatusChange((s) => {
  // 'disconnected' | 'connecting' | 'connected'，用于 UI 提示客户端在线状态
})

await client.connect()                          // 自动探测端口并握手；未启动抛 CLIENT_NOT_RUNNING
const printers = await client.listPrinters()    // [{ name, isDefault, status }]

await client.print(templateJson, printData, {
  printerName: printers[0]?.name,               // 缺省走系统默认打印机
  copies: 1,
  // paperName: '…',                              // 驱动纸型名（针式打印机优先）
  // paperSize: { width: 58000 },                 // 微米覆盖项；连续纸不必传 height
  // landscape, color, margins, pageRanges, baseUrl, fontBaseUrl, timeoutMs
}, templateName)
```

`print()` 完整签名：

```ts
client.print(
  templateJson: Record<string, unknown>,        // core 模板 JSON（getTemplateJson() 产物）
  printData?: Record<string, unknown> | Array<Record<string, unknown>>,
  options?: {
    printerName?: string; copies?: number; paperName?: string;
    paperSize?: { width?: number; height?: number };  // 微米
    landscape?: boolean; color?: boolean;
    margins?: { top; bottom; left; right };            // 微米
    pageRanges?: Array<{ from; to }>;
    baseUrl?: string; fontBaseUrl?: string; timeoutMs?: number;
  },
  templateName?: string,
): Promise<{ jobId: string }>
```

### 推荐：浏览器预渲染后直提交（`printHtml`）

渲染前移到宿主页面，客户端只做出纸（core 升级不必重发客户端）：

```ts
import { renderHtmlPages, browserCodeRenderer } from '@worm-print-platform/core/browser'
import type { PrintTemplateData } from '@worm-print-platform/core'

const rendered = await renderHtmlPages(
  templateJson as PrintTemplateData,
  printData,
  baseUrl,                  // 相对路径图片基址
  browserCodeRenderer,
)
await client.printHtml(
  rendered,                 // { html, paperMm, continuous, pageCount }
  { printerName: printers[0]?.name, copies: 1 /* color/pageRanges/timeoutMs */ },
  templateName,
)
```

`printHtml` 的 options 仅允许 `printerName/copies/paperName/color/pageRanges/timeoutMs`；纸张/方向/边距已固化进 HTML，传 `paperSize/margins/landscape` 会被客户端以 `INVALID_REQUEST` 拒绝；HTML 载荷上限 20MB。连续纸高度由浏览器侧探针推导（`rendered.continuous=true` 时 `paperMm.height` 即推导值），无需额外参数。

### 连续纸（热敏/标签）

模板 `paperSize: 'CONTINUOUS'`（默认 80mm 宽）时，无需传 `paperSize.height`：客户端把单页最终 HTML 载入离屏窗口，由**真实浏览器布局探针**推导出纸高度，再写入最终 HTML 的 `@page`、`.print-page` 与出纸尺寸。仅在驱动对自定义纸高有步进/舍入时用逃生门显式覆盖：

```ts
await client.print(templateJson, data, { paperSize: { width: 58000, height: 180000 } }) // 58×180mm
```

长度单位一律为**微米 μm**（1mm = 1000μm）。

### 打印配置缓存建议

打印机、份数、纸张等配置由宿主系统维护，客户端不持久化业务打印配置。建议按模板存浏览器：`localStorage.setItem('print:cfg:' + templateId, JSON.stringify({ printerName: '热敏-80', copies: 1 }))`。

### 安全配对

客户端默认关闭安全开关（开箱即用，仅绑定回环）。共享电脑/不可信网页可开启安全开关：客户端生成随机配对 token 在配置窗口展示，宿主页面调用一次 `client.pair(token)`（token 存 localStorage，后续自动携带）。未配对或 token 错误被客户端拒绝（`UNAUTHORIZED`）；白名单非空时还校验浏览器 `Origin`。

### 自动重连

- 断线后 SDK 固定退避重连，客户端重启后自动恢复。
- 断线期间请求以 `CLIENT_NOT_RUNNING` 拒绝；客户端**不做离线排队**，宿主侧重试。

## 3. 错误码

捕获 `WormPrintError`，按 `err.code` 程序化处理（`core/client` 的 protocol 模块定义）：

| code | 来源 | 含义 |
|---|---|---|
| `CLIENT_NOT_RUNNING` | SDK | 未发现/断开客户端，或连接被关闭 |
| `CLIENT_TIMEOUT` | SDK | 请求超时未响应 |
| `INVALID_REQUEST` | 客户端 | 请求格式/字段校验失败 |
| `UNAUTHORIZED` | 客户端 | 安全开关开启后 token/Origin 校验失败 |
| `PRINTER_NOT_FOUND` | 客户端 | 指定打印机不存在 |
| `PRINTER_OFFLINE` | 客户端 | 打印机离线/不可用 |
| `BUSY` | 客户端 | 已有任务打印中（客户端串行，不排队）→ 宿主延时重试 |
| `RENDER_TIMEOUT` | 客户端 | 模板渲染超时（默认 30s） |
| `PRINT_FAILED` | 客户端 | 系统打印接口返回失败 |
| `INTERNAL` | 客户端 | 其他内部错误 |
| `SESSION_NOT_FOUND` / `SESSION_DISCONNECTED` | 客户端 | 模板会话失效（MCP 通道） |
| `REVISION_CONFLICT` | 客户端 | 模板写回 revision 冲突（MCP 通道） |
| `INVALID_TEMPLATE` | 客户端 | 模板结构/封禁元素校验失败（MCP 通道） |

```ts
try {
  await client.print(template, data, opts)
} catch (e) {
  if (e instanceof WormPrintError && e.code === 'BUSY') {
    // 提示稍后重试，或宿主侧入队
  }
}
```

## 4. 宿主清单要点

- 前端：取到 `{templateJson, printData, baseUrl}` 后可直连本机客户端静默打印，无需后端参与出纸（与链路 A 数据包一致）；打印配置随任务下发。
- 后端：链路 C 与链路 A 共用「渲染数据组装」，无额外职责。
- 高并发工位：客户端单任务串行，宿主前端负责排队/重试（`BUSY`）。

## 5. 客户端部署与分发

客户端是 monorepo 内私有工作区包 `clients/client`（包名 `@worm-print-platform/client`，Electron，**不发布 npm**），产物命名为 `WormPrintClient-<版本>-<系统>-<架构>.<ext>`。安装包通常挂在仓库 GitHub Releases（点击下载无需登录），按工位系统取对应 `.dmg`（mac-x64 / mac-arm64）、`.exe`（win-x64）、`.deb`（linux-amd64）、`.rpm` / `.AppImage`（linux-x86_64），并用同页 `SHA256SUMS.txt` 校验；Gitee 附件单文件上限 100MB，安装包超限只走 GitHub。首次打开需绕过系统拦截（macOS `xattr -dr com.apple.quarantine /Applications/WormPrintClient.app`；Windows SmartScreen「更多信息」→「仍要运行」）。

只有需要改造客户端或内网离线定制时才从源码构建：

```bash
npm run pack:client          # build 依赖后 electron-builder --mac --win
npm run pack:client:linux    # Docker 容器内交叉构建 deb / rpm / AppImage，需已启动 Docker
npm run pack:client:dir      # 绿色目录版（免安装）
```

- 产物默认无签名 + Electron 默认图标；分发前需补 `build/` 图标资源与签名证书。
- 客户端闭环说明、WebSocket 协议、连续纸纸长策略、配置/日志/任务记录文件位置见 `clients/client` 内 README（仅源码阅读，不是技能运行依赖）。

## 6. 常见排查

- **`CLIENT_NOT_RUNNING`**：客户端未启动/端口探测失败；确认同机运行（仅回环）。
- **`UNAUTHORIZED`**：开启安全开关后未 `pair(token)`，或 Origin 不在白名单。
- **`PRINTER_NOT_FOUND`**：先 `listPrinters()` 拿真实名称。
- **`BUSY`**：上一任务未完成，宿主延时重试。
- **中文/样式与预览不一致**：模板字体需在客户端所在电脑已安装（回退字体改变测量高度，进而影响分页/纸长）。
- **连续纸末尾留白/裁切**：驱动对自定义纸高有步进/舍入时，用 `paperSize.height` 显式覆盖；纸宽用 `width`。
- **方向与预览不一致 / 纸型不对**：core 出纸旋转烤进内容流，产物 PDF 永远正确；差异只可能出在出纸参数或驱动侧（当前客户端走 Chromium 原生打印，按 core 算出的 `paperMm` 声明纸张，单位微米，由驱动校验）。详细取证（CUPS `media` / DEVMODE / 保留生成的 PDF）见源包排查文档，排查前先确认「保留生成的 PDF」产物本身正确，再区分是渲染问题还是驱动问题。
