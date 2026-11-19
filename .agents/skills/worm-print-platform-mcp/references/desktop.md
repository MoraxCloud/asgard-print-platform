# 桌面客户端接入

## 链路组成

1. 工位电脑运行桌面客户端（`clients/client`，包名 `@worm-print-platform/client`，不发布 npm），在设置页开启「AI 助手」。
2. 浏览器设计器通过 `@worm-print-platform/core/client` 连接桌面客户端，处理 `template.get` / `template.apply` 并调用 `attachTemplate` 签到。真实参考实现见 `demos/shared/template-session.ts`。
3. AI Agent 所在 MCP 客户端使用设置页生成的本机 HTTP 配置。

默认配置示例如下，实际端口和 token 以设置页为准：

```json
{
  "mcpServers": {
    "worm-print-platform": {
      "url": "http://127.0.0.1:17521/mcp",
      "headers": { "Authorization": "Bearer <设置页展示的配对 token>" }
    }
  }
}
```

浏览器页面只连接本机桌面客户端。AI Agent 的每次写回经桌面客户端转发到已签到页面，不直接访问宿主业务服务。MCP server 内部名为 `worm-print-platform-client`；工具由宿主注入组合（纯计算工具 `TOOLS` + 模板会话工具 + 视觉回读 + 参考图工具），本包只导出工具库与 `createDesktopPrintMcpServer`，不启动 transport、不调用模型、不读模型密钥。

## 工具边界

纯计算工具只接收内存中的参数和 `templateJson`，不读取本地模板文件、不访问渲染服务。会话工具读写的是仍打开且已签到的页面；页面关闭或客户端退出后会话失效，不落盘。

视觉回读与比对（`print_preview_template`、`print_compare_with_reference`）在客户端本地渲染，结果不上传，但模板里引用的远程图片/字体 URL 与 `file://` 资源会由渲染内核真实取回，注解为 `openWorldHint: true`——宿主需要把这视为可能触网的只读操作。`print_analyze_reference_image` 只按绝对路径读本地图片，不访问网络。

## 浏览器接入要点

- `template.get` 返回当前模板、字段、打印数据、模板名称和根据当前内容计算的 revision。
- `template.apply` 先核对 `baseRevision`，再校验模板形状与封禁元素（`findBlockedElementPaths`，来自 `@worm-print-platform/core/designer`），通过后写回设计器并重新读取实际结果。
- 页面卸载时调用 `detachTemplate`，取消状态监听并关闭连接。
- 各宿主的完整接入骨架（含浏览器直挂的 API 来源与只读限制）：见 integration 技能的 [宿主 MCP 集成](../worm-print-platform-integration/references/mcp-host-integration.md)，可运行代码见 `demos/shared/template-session.ts`。
