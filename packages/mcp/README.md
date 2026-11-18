<p align="center">
  <strong>@worm-print-platform/mcp</strong><br>
  <em>桌面客户端 MCP 协议实现（私有包）</em>
</p>

> 本包不发布到 npm，随桌面客户端打包。

`worm-print-platform` 桌面客户端内部的 MCP（Model Context Protocol）工具库。为宿主 AI Agent（Claude Desktop / Cursor / OpenCode 等）提供实时读写画布、模板生成校验、视觉回读与参考图比对的能力。

## 架构位置

```
宿主浏览器页面（demo / 业务页）
  └─ @worm-print-platform/core/client SDK
        └─ WebSocket（127.0.0.1:17521）
              └─ Electron 客户端 WS 服务
                    └─ 同一回环端口的 /mcp（MCP Streamable HTTP）
                          └─ @worm-print-platform/mcp
                                ├─ createDesktopPrintMcpServer(serverHandler, opts)
                                ├─ createTemplateSessionTools(sessionBridge)
                                ├─ createRenderTools(renderBridge)
                                ├─ createImageTools(imageReaderBridge)
                                └─ analyzeGeometry / toMillimeters
```

## 主要导出

| 导出 | 说明 |
| --- | --- |
| `createDesktopPrintMcpServer(serverHandler, opts)` | 组装 MCP Streamable HTTP 服务器（12 个工具：模板会话 5 + 渲染 3 + 图像 4） |
| `createTemplateSessionTools(sessionBridge)` | `print_list_open_templates` / `print_get_open_template` / `print_patch_open_template` / `print_apply_open_template` / `print_preview_template` |
| `createRenderTools(renderBridge)` | `print_render_preview` / `print_compare_with_reference` / `print_analyze_reference_image` |
| `createImageTools(imageReaderBridge)` | `print_read_pixel` / `print_read_color_ramp` 等图像分析工具 |
| `analyzeGeometry(bitmap)` | 从参考图推导版面几何（元素框、线位、颜色区） |

## 暴露给 AI Agent 的 12 个工具

| 类别 | 工具 | 说明 |
| --- | --- | --- |
| 模板会话 | `print_list_open_templates` | 列出当前浏览器中已 `attachTemplate` 签到的模板 |
| | `print_get_open_template` | 读取实时画布模板（返回快照 + 稳定 revision） |
| | `print_patch_open_template` | 局部 patch 修改，revision 冲突拒绝 |
| | `print_apply_open_template` | 整体替换，含结构校验与封禁元素拒绝 |
| | `print_preview_template` | 本地渲染 PNG 自评（不上传，但模板内远程资源会取回） |
| 渲染比对 | `print_compare_with_reference` | 与参考图逐线比对：内容区位置 → 线位 → 线长 |
| | `print_analyze_reference_image` | 从参考图推导几何（绝对路径读本地图片） |
| 图像分析 | `print_read_pixel` / `print_read_color_ramp` 等 | 像素级分析辅助 |

## 边界

- 本包只导出工具定义与组装函数，**不启动任何 transport**（WebSocket / HTTP 由 Electron 客户端主进程装配）。
- 安全由客户端主进程负责：默认仅绑定 `127.0.0.1`，鉴权恒为 `Authorization: Bearer <配对 token>`，Host 必须匹配 `127.0.0.1:<端口>`（防 DNS rebinding）。
- 模板会话的 revision 机制与封禁元素校验复用 `@worm-print-platform/contract`。

## 开发

```bash
npm run build   # tsup → dist/
npm test        # vitest
```

## 相关链接

- [根 README 三条打印链路](https://github.com/worm-longliu/worm-print-platform/blob/main/README.md#三条打印链路)
- [桌面客户端](../../clients/client/README.md)
- [contract 契约校验](../contract/README.md)
- [MCP 协议](https://modelcontextprotocol.io/)

## License

[MIT](../../LICENSE)
