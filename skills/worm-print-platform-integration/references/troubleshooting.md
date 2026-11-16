# 常见问题排查

先区分安装方式：NPM 包、`file:` 构建产物、Vite 源码别名、浏览器 UMD 直挂。定位方式各不相同。

## 设计器渲染为空白或高度塌陷

1. `<print-designer>` 默认 `display:inline`，宿主必须给块级宽高：`.host print-designer { display:block; width:100%; height:100% }`，父容器也要有确定高度。这是最高频问题。
2. Shadow DOM 形态样式由组件内联注入，不需要引 CSS；只有把设计器渲染进 light DOM 时才引 `@worm-print-platform/canvas/style.css`。
3. 检查 `registerAll()` 是否在元素挂载前调用过（全局一次）。Vue 3 宿主还需 `@vitejs/plugin-vue` 配 `isCustomElement: tag => tag.startsWith('print-')`；Vue 2.7 需 `Vue.config.ignoredElements = ['print-designer']`；React 无需编译配置。

## 对象/函数入参不生效

1. `fields`、`template`、`fonts`、`designData`、`uploadImage` 等对象/数组/函数只能赋 **property**，写进 attribute 会被字符串化成 `[object Object]` 或丢失函数。
2. 字符串开关 `is-edit="true"`、`show-help="true"` 才写 attribute。
3. 改字段、切示例、导入或清空模板后，显式再次赋 property（宿主自己调 sync 函数），不要监听元素本身猜注入时机。
4. `fields` 只有 setter，读回用 `el.store.fields`；`el.template` getter 返回当前画布 JSON 字符串。

## TypeScript 找不到导出或类型

1. 从 `@worm-print-platform/canvas` 主入口导入 `registerAll` / `PrintDesignerElement` / `createDefaultTemplate` 等，不要深路径引 `dist/`。
2. `/vue3` 门面的组件与类型从 `@worm-print-platform/canvas/vue3` 导入。
3. 检查包 `types`/`exports` 可解析；core、canvas、plugin-kit 版本是否一致（同号同批发版，不要只锁两个）。
4. `file:` / 源码方式先在仓库根 `npm run build`，确保各包 `dist` 与源码一致；改了 core / plugin-kit 源码要重建对应包，否则下游看到旧声明或 `ERR_MODULE_NOT_FOUND`。

## 源码别名不生效

1. `resolve.alias` 中更具体的 CSS / 子路径（`canvas/vue3`、`canvas/style.css`）必须排在包名 `@worm-print-platform/canvas` 之前。
2. 确认路径指向 `packages/canvas/src/index.ts`、`packages/core/src/index.ts`、`packages/plugin-kit/src/index.ts`。
3. Vite `server.fs.allow` 允许读取 monorepo 目录。
4. 本仓没有 `native-controls.css` 子路径（拆仓前旧入口），不要引用。

## 事件相关

- `save` / `preview` 的 `event.detail` 是模板 JSON 字符串，要 `JSON.parse`；`dblclick-element` 的 detail 是元素 id 字符串、`dblclick-cell` 是 `{ elementId, r, c, cellId }` 对象，这两个**不要** `JSON.parse`。
- React 用原生 `addEventListener` 且在 effect cleanup 里 `removeEventListener`；JSX 的 `onSave` 不会绑定 CustomEvent。StrictMode dev 双跑，漏解绑会重复保存。
- 事件都是 `bubbles + composed`，可在宿主外层委托监听。
- 不存在的 API：`back` 事件、`setTemplateMeta` 方法（用无类型 ref + 可选链调用会静默失效）。返回导航与模板元信息属宿主业务层，自己维护。

## 表格没有数据

1. 表格元素 `options.dataSource` 是否等于字段容器 `fieldKey`（如 `goods`）。
2. `printData.goods` 是否为数组。
3. 明细列表达式必须完整路径，如 `{goods.name}`。
4. 表格分页由 `options.tablePagination.enabled` 控制。

## 表格下方元素预览/出纸时落进表格里

1. 现象：设计稿里表格下方的文本、签栏，预览或出纸时出现在表格数据中间；设计器画布上看位置又是对的。
2. 根因：表格只认领 `top ≥ 表格设计底部`（设计底部 = `options.top + max(height, tableRows 行高合计)`）
   且横向相交的元素进**跟随区**（随数据展开、切片移页整体下移）。`dataSource` 表的 `height` 只按静态
   行高合计声明时，设计器画布按预览数据展开会**回写更大的实测 height**，设计底部随之后移，下方元素
   掉出跟随区 → 按设计坐标绝对定位 → 落进真实数据展开区。宿主直渲与设计器保存后渲染两条链路由此不一致。
3. 修复：① 表格 `height` 按**画布展开态**声明（≈ 表头 + data 行高 × 画布预览行数 + 小计/合计行高，
   可从画布回写值取）；② 下方元素 `top` ≥ 设计底部 + 1~2mm 间隙。两条链路以回写后的 height 为准核对。
4. 边界：刻意层叠覆盖（水印、角标、骑缝章）依赖的正是绝对定位，属例外；`print_inspect_layout`
   静态体检不判真实行高展开后的重叠，用附足量样例数据的预览验证。

## 图片不显示

1. 相对路径需 `baseUrl` 拼接（服务端渲染另可给 `fontBaseUrl`）；检查浏览器 Network 请求。
2. 图片上传必须由宿主实现 `uploadImage` 并返回可访问 URL。
3. 服务端渲染确认 `baseUrl` 对渲染进程可访问，图片服务允许被读取。

## 水印在预览/PDF 正常，打印到纸上被放大/错位/平铺错乱

1. 现象：画布、浏览器预览、服务端 PDF 都正常，只有**打印出纸**后水印异常（放大约 3 倍、位置偏移、只铺零星几块）。
2. 根因：水印若用 CSS 平铺背景实现，Chromium 打印/PDF 后端编译成 PDF 平铺图案，PDF 查看器解释正常，但打印 RIP 按设备空间平铺、忽略图案矩阵。
3. 修复规则：水印必须写成显式矢量瓦片——core 的 `resolveWatermarkLayout` 算网格、`renderWatermarkLayerHtml` 逐块输出 `<svg class="watermark-tile">`；禁止改回 `background-repeat` 平铺背景。
4. 判据：`printToPDF` 正常、出纸异常 = 表达方式问题，换浏览器/服务端渲染都救不了（三链路共用同一份 core HTML）。验证可用 `pdftoppm -r 100` 转 PNG 量瓦片周期。

## 静默打印报 BUSY / PDF 生成超时

1. 现象：提交后长时间无响应，重试全部返回 `[BUSY]`，随后日志出现 PDF 超时。
2. 常见根因：`webContents.printToPDF` 只保留 Promise 形式，旧回调写法永不触发；或 `PrintToPDFOptions.pageSize` 单位是**英寸**（`webContents.print` 才是微米），直接传微米值得到荒诞纸张。
3. 处置：任务失败/超时必须释放串行锁，`BUSY` 只在任务真正进行中返回；宿主导入 `@worm-print-platform/core/client` 用当前 SDK，不复制旧协议实现。客户端版本过旧时升级，或改用浏览器打印/服务端 PDF。
4. 验证：保留生成的 PDF，`pdfinfo` 看页面尺寸、`pdftoppm` 转 PNG 看内容。

## 出纸方向/纸型与预览不一致

1. core 出纸旋转（`outputRotation`）烤进内容流并交换页面长宽，产物 PDF 永远正确；方向不一致只可能出在出纸参数或驱动侧。
2. 客户端当前走 Chromium 原生打印（无界面开关），按 core 算出的 `paperMm` 声明自定义纸张（微米）交驱动校验；驱动不接受会自行夹回（如回滚 A4），这是驱动改判，不是渲染错。
3. 排查前先勾「保留生成的 PDF」，确认产物本身尺寸/方向正确，再区分渲染问题与驱动问题；虚拟打印机（Microsoft Print to PDF、导出为 WPS PDF）行为不确定，别拿它当对照机。

## 预览分页与最终输出不一致

1. 三端必须用同一份 `templateJson`、`printData`、`baseUrl`（及字体基址）。
2. 检查字体/图片是否加载完成；分页前会等待，但有兜底超时。
3. 比较第一遍测量结果和 `paginate` 输入，不要只看最终 HTML。
4. 服务端 PDF 由 `services/render` 负责（workspace 软链同仓库 core）；先确认它与浏览器使用一致的 core 代码。

## 模板重新进入设计器后是空白

1. 回填前先 `JSON.parse(elements)`，并判断 `json.paperSize` 存在才赋给 `el.template`，否则保留 `createDefaultTemplate()`（损坏/空 elements 会拖垮画布）。
2. 新建模板时 elements 不要留空，服务端存 `JSON.stringify(createDefaultTemplate())`。
3. 确认父容器有确定高度。

## render 微服务相关（服务端 PDF）

- **401 UNAUTHORIZED**：`x-render-key` 与 `RENDER_API_KEY` 不一致；密钥只在服务端/代理层注入。
- **504 RENDER_TIMEOUT**：超过服务端 30s；复杂模板先排查图片/字体加载，宿主读取超时 ≥30s（建议 40s）。
- **PDF 中文方块/分页错位**：渲染容器缺中文字体，装 `fonts-noto-cjk`。
- **图片不显示/403**：渲染进程访问不到图片地址；相对路径用正确 `baseUrl`，内网/鉴权图片要保证渲染环境可达。
- **浏览器起不来**：确认 `PLAYWRIGHT_CHROME_PATH`、Linux 已装 Chromium 与 `libnss3 libatk-bridge2.0-0 libx11-xcb1`，容器用 `--no-sandbox`（已默认）。
- **前端跨域/密钥泄露**：浏览器不要直连 3001；dev 用 Vite proxy 注入密钥，生产用宿主后端反代，见 `demos/apps/vue3/vite.config.js`。
- 先用 `GET /health` 判断服务与浏览器池状态。

## 静默打印客户端相关（链路 C）

- **`CLIENT_NOT_RUNNING`**：SDK 探测不到客户端；确认同机运行（仅 `127.0.0.1`），重启期间 SDK 自动重连。
- **`UNAUTHORIZED`**：未 `client.pair(token)` 或 Origin 不在白名单。
- **`PRINTER_NOT_FOUND`**：`printerName` 不在枚举列表；先 `client.listPrinters()` 拿真实名称。
- **`PRINTER_OFFLINE` / `PRINT_FAILED`**：打印机脱机/缺纸/驱动异常。
- **`BUSY`**：单任务串行；宿主延时重试或自己排队，客户端不排队。
- **静默出纸与预览分页不一致**：模板字体需在客户端电脑已安装；同一份 `templateJson + printData + baseUrl`、同一 core 版本。
- **连续纸末尾多走纸/裁切**：驱动对自定义纸高有步进/舍入时用 `paperSize.height`（微米）显式覆盖。
- **macOS 首次打不开客户端**：绿色版未签名，首次右键 → 打开。

## 浏览器直挂（UMD）相关

- **找不到 core 导出 / 解析不了 bare import**：直挂没有打包器，用全局 `WormPrintCanvas` 暴露的 `renderHtmlPages` / `PrintClient` / `getPaperDimensions` 等，不要尝试解析裸包名；`src/*.js` 之间只用相对路径互引。
- **MCP 写回受限**：UMD 未导出 `findBlockedElementPaths`，直挂宿主拿不到时 MCP 写回保持只读（只处理 `template.get`），见 [宿主 MCP 集成](mcp-host-integration.md)。
- **jQuery 事件 detail 是 undefined**：`.on('save', e => …)` 包了一层，取 `e.originalEvent.detail`。

## 生产风险

canvas 当前为实验性质；选型前评估，Vue 3 项目可考虑成熟方案，非 Vue 3 宿主接入时先跑通最小链路再上量。

## MCP 实时会话

- **MCP 客户端看不到会话工具**：确认桌面客户端已开启 AI 助手、配置地址与 token 来自设置页，浏览器页面已完成模板会话签到（见 `demos/shared/template-session.ts`）。
- **列表中没有当前页面**：页面 `PrintClient` 是否连接并 `attachTemplate`；页面关闭后会话立即失效。
- **写回 `REVISION_CONFLICT`**：重新读取快照和 revision，协调差异后再写，不强制覆盖。
- **写回后快照不一致**：Custom Element 用 `el.loadTemplate(新引用)` 后立即 `getTemplateJson()` 重读；`/vue3` 门面赋 `:initial-template` 新引用并 `await nextTick()` 后从 `ref.getTemplateJson()` 重读，不回显请求对象。
- **卸载后仍收到请求**：卸载时 detach、取消状态监听并 close。
- **模型密钥疑似暴露**：MCP 配对 token 不是模型密钥；模型调用与密钥只能留在宿主服务端或用户自己的 MCP 客户端。
