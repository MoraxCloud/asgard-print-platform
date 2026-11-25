# 桌面客户端「打印后写 EPC」通用写卡层设计

日期：2026-11-24
状态：待审批

## 背景与目标

场景已经确认：宿主 Web 系统提交一次打印，客户端出纸成功后，**自动用本机连接的射频写卡器把 EPC 写进刚打出的标签芯片**，写卡结果随打印响应回给宿主。

「通用」的含义也已确认：不同品牌/协议的串口写卡器各有指令集，程序要能**自动识别并匹配对应驱动**，而不是写死某一型号。

目标：

1. 打印成功后自动写 EPC，与打印共用同一把串行锁，不串扰。
2. 通过 USB VID/PID 自动匹配写卡器驱动，支持一种驱动服务多个 VID/PID。
3. 驱动可插拔：新增品牌只需加一个驱动实现 + 一条 VID/PID 映射，不改写卡流程。
4. 写卡结果（成功/失败/原因）并入打印响应与任务记录，宿主可据此决定是否重打。
5. 无写卡器、写卡失败、超时都不影响「纸已经打出来」这一事实，不误报成打印失败。

## 非目标

- 不做独立写卡工具、设置页手动写卡入口（v1 只做「自动跟随打印」）。
- 不做读卡、不做标签芯片类型探测（HF/UHF、ISO15693/14443A/EPC Gen2 一律不判别）。
- 不实现任何真实厂商的指令集——当前没有协议文档，第一版只交付框架 + 1 个**示例驱动**（含可注入的模拟串口后端）。真实驱动拿到协议后再接。
- 不新增 MCP 工具。
- 不支持批量打印（`printData` 为数组）的逐份写卡，见「限制」。

## 约束

- 客户端是 Electron 44 + Node 22 + TypeScript，测试用 vitest（node + happy-dom，不依赖真机）。
- 当前客户端**零原生依赖**；串口枚举与读写必须引入原生模块，这是本设计最大的打包风险。
- `SerialGate` 保证同一时刻一个打印任务；写卡必须在出纸成功后、锁释放前完成。
- 分层边界：client 只依赖 core（+ echarts/contract/mcp）。新硬件层是 client 内部实现，不得反向依赖 core 的渲染逻辑。
- 配置必须向后兼容：旧 `config.json` 缺新字段时按关闭/默认处理。
- 协议类型改动（core/client）必须可选字段，旧宿主行为不变。

## 方案（Approaches）

- **A 客户端内建通用写卡层（本设计采用）**：在 `clients/client/src/main/rfid/` 建驱动接口、注册表、串口发现、写卡服务，挂进 `PrintEngine`。链路最短、改动集中；代价是引入串口原生模块及 Electron 重编译。
- **B 独立辅助进程**：串口放单独 Node 进程，客户端经本地 IPC 调用，Electron 保持零原生依赖；代价是多进程生命周期管理、调试复杂。
- **C marketplace 插件包**：与现有插件体系一致、第三方可扩展；代价是脚手架重，更适合第二阶段。

选 A 的理由：需求是客户端内建能力，A 的改动面最小、端到端最可验证；原生模块的打包成本一次性解决，之后加驱动只是注册映射。C 可作为后续把驱动生态外置的演进方向，与 A 的驱动接口不冲突。

已排除：Web Serial API（`navigator.serial`）——需要用户手势选端口，无法静默按 VID/PID 自动匹配，与自动跟随打印冲突。

## 详细设计

### 1. 数据契约

EPC 来源优先级：

1. 打印请求 payload 顶层的可选 `epc: string`（两条链路都接受，便于 `print.submitHtml` 使用——它没有 `printData`）。
2. 缺省时，`print.submit` 从 `printData` 对象按配置项 `rfidEpcField`（默认 `epc`）取值，必须是字符串。
3. `print.submitHtml` 若既无 `epc` 也未启用写卡，则不写卡。

`packages/core/src/client/protocol.ts`：

- `PrintSubmitRequest`、`PrintSubmitHtmlRequest` 新增可选 `epc?: string`。
- `PrintSubmitResponsePayload` 新增可选 `rfid?: WriteResult`（WriteResult 结构定义在 core/client，避免 client 与宿主各定义一份）。

EPC 归一化：去空白；配置 `rfidEpcFormat`（`hex`|`ascii`，默认 `hex`）。`hex` 时校验偶数位十六进制，统一转大写后交给驱动；非法值记为写卡失败（`INVALID_EPC`），不抛协议异常。

**`WriteResult` 与完整错误码（实现者决定，宿主可见契约）**：

```ts
export type WriteErrorCode =
  | 'NO_EPC'              // 已启用写卡但请求未提供 EPC，且 printData 无该字段
  | 'INVALID_EPC'         // EPC 格式校验失败
  | 'BATCH_UNSUPPORTED'   // printData 为数组，v1 不支持逐份写卡
  | 'NO_WRITER'           // 未找到任何可用串口写卡器
  | 'NO_MATCHING_DRIVER'  // 串口存在但 VID/PID 无映射（与 NO_WRITER 区分：端口有、映射无）
  | 'PORT_OPEN_FAILED'    // 端口打开失败（占用/权限/被拔）
  | 'DRIVER_FAILED'       // 驱动判定写卡失败（含 ACK 不符、协议错误）
  | 'TIMEOUT'             // 写卡整体超时

export interface WriteResult {
  ok: boolean
  driverId?: string
  portPath?: string
  epc?: string
  error?: WriteErrorCode
}
```

失败时 `ok:false` + `error`；成功时 `ok:true` + `driverId`/`portPath`/`epc`。错误码不带前缀 `RFID_`，与现有协议错误码（`PRINT_FAILED` 等）分属不同字段，互不冲突。

### 2. 驱动接口与注册表

```ts
export interface SerialPortInfo {
  path: string
  vendorId?: string   // 小写十六进制，如 '1a86'
  productId?: string  // 同上，如 '7523'
  manufacturer?: string
  serialNumber?: string
}

export interface RfidWriterDriver {
  readonly id: string          // 稳定标识，如 'generic-epc-v1'
  readonly label: string
  /** 可选握手探测，用于 VID/PID 撞号时二次确认；v1 示例驱动可不实现 */
  probe?(port: SerialPortLike, options: DriverOptions): Promise<boolean>
  /** 打开端口、写 EPC、关闭端口；实现方保证 finally 关闭 */
  writeEpc(port: SerialPortInfo, epc: string, options: DriverOptions): Promise<WriteResult>
}
```

`DriverOptions` 含 `baudRate`、`timeoutMs` 及驱动自定义 `settings: Record<string, unknown>`。

`SerialPortLike` 是最小可注入接口，**v1 就纳入读能力**（`open` / `write` / `read(length)` / `onData(cb)` / `close` / `drain`），因为真实写卡驱动几乎都要读 ACK 才能判定成功；现在留好口子，后续接真机协议就不必改接口签名。示例驱动可以不使用读能力。真实实现由 `@serialport/bindings-cpp` 适配，测试用内存假端口，硬件协议测试不依赖真机。此项为实现者决定。

`DriverRegistry`：`Map<driverId, driver>` + `Map<"vid:pid", driverId[]>`（VID/PID 映射来自配置，而非驱动硬编码，这样一个驱动能服务多个 VID/PID，且用户能改映射而不改代码）。`match(port)` 返回候选驱动列表；多个候选时按 `probe` 依次确认，再按配置顺序取第一个通过者。

**VID/PID 匹配语义（实现者决定）**：`productId` 省略 = 通配该 vendor 下全部产品（键记为 `"vid:*"`）；`productId` 给出则精确匹配 `"vid:pid"`。`rfidPortPath` 指定时仍要求端口命中某条映射（含通配），否则报 `NO_WRITER`，不绕过映射直接写。

### 3. 发现与匹配

`SerialWriterDiscovery.list()` 调用 serialport 的 `list()`，映射为 `SerialPortInfo[]`（VID/PID 补零成 4 位小写十六进制）。匹配流程：

1. 枚举端口；用注册表按 VID/PID 过滤出候选。
2. 配置 `rfidPortPath` 非空时，只认该路径（仍须 VID/PID 命中，避免误写其它设备）。
3. 候选为 0 → 结果 `NO_WRITER`。
4. 多个候选 → 逐个 `probe`（若有），通过者优先；都无 probe 时按配置顺序取第一个。
5. 选定后调用 `driver.writeEpc`，整体受 `rfidTimeoutMs` 超时约束。

### 4. 写卡流程（挂接位置）

`PrintEngine.runJob` 在 `history.append(record)` / `emitSettled` 之前、`printHtmlDocument`/`printPdfFile` 成功之后插入写卡：

```
出纸成功
  → 若 rfidWriteEnabled 且有 EPC：
      rfidService.write(epc, jobId)  → WriteResult
      写进 JobRecord.rfid；记录一条日志
  → history.append / emitSettled
  → 返回 { jobId, rfid? }
```

`submit` / `submitHtml` 把解析出的顶层 `epc` 与 `printData` 一起传给 `runJob`；`runJob` 统一决定 EPC 来源与是否写卡。`PrintEngine` 构造参数新增 `rfid?: RfidWriteService`（可选，未注入即不写卡，便于现有测试零改动）。

写卡失败语义（重要，待审批确认）：

- 打印任务 `outcome` 保持 `success`（纸确实打了）。
- 响应仍为 `ok: true`，带 `rfid: { ok: false, error }`；宿主自行决定重打。
- 理由：避免「纸打了但响应报错」诱导宿主重打，造成废标与重复出纸。
- 若你希望写卡失败直接让整条响应变失败（`ok: false` + 新错误码 `RFID_WRITE_FAILED`），审批时说明即可改。

### 5. 配置项

`AppConfig` 新增（全部可选解析、旧配置缺省）：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `rfidWriteEnabled` | boolean | `false` | 总开关 |
| `rfidEpcField` | string | `'epc'` | `printData` 中 EPC 字段名 |
| `rfidEpcFormat` | `'hex'` \| `'ascii'` | `'hex'` | EPC 校验/归一化方式 |
| `rfidDrivers` | `RfidDriverConfig[]` | `[]` | `{ driverId, vendorId, productId?, baudRate?, settings? }` 映射表 |
| `rfidPortPath` | string | `''` | 显式指定串口，留空则自动匹配 |
| `rfidTimeoutMs` | number | `3000` | 写卡超时 |

`parseConfig` 逐字段校验，`rfidDrivers` 过滤掉缺 `driverId`/`vendorId` 的项；`vendorId` 规范化为 4 位小写十六进制。

### 6. 打包与原生模块

- 新增依赖：`@serialport/bindings-cpp`（或 `serialport` 包）+ `@serialport/parser-*`（按示例驱动需要）。
- `electron-builder.yml` 增加 `asarUnpack: node_modules/@serialport/**`，避免原生二进制被封进 asar。
- 构建脚本加 `electron-rebuild`（针对 Electron 44.3.0 ABI）；`pack:client*` 与 CI 打包前都要跑。
- 风险：Electron 44 较新，`@serialport/bindings-cpp` 可能无预编译包，需 `node-gyp` + Xcode/VS 工具链；三端冒烟必须覆盖「枚举到串口」。
- 减速开关：若原生重编译在某平台阻塞，按方案 B 把串口挪到独立 Node 进程（Node ABI 编译，无需 Electron ABI）。驱动接口保持不变，仅 `SerialPortLike` 实现换 IPC 适配。

### 7. 限制

- 批量打印（`printData` 为数组）v1 不逐份写卡：记录 `rfid: { ok: false, error: 'BATCH_UNSUPPORTED' }`，打印照常成功。理由：多份标签与多张卡的配对顺序无法可靠推定。
- 不识别标签芯片类型，不保证写卡协议与目标标签匹配——这属于具体驱动实现时的事。
- 示例驱动不接真机；真机验证清单里标注为待办。

## 文件清单

新增：

- `clients/client/src/main/rfid/types.ts`
- `clients/client/src/main/rfid/driver-registry.ts`
- `clients/client/src/main/rfid/serial-discovery.ts`
- `clients/client/src/main/rfid/writer-service.ts`
- `clients/client/src/main/rfid/drivers/generic-epc-driver.ts`
- `clients/client/src/main/rfid/index.ts` + 对应 `*.test.ts`

修改：

- `clients/client/src/main/config.ts`（新增配置字段与解析）
- `clients/client/src/main/print-engine.ts`（写卡挂接、返回 rfid）
- `clients/client/src/main/protocol-handler.ts`（透传 epc，若 runJob 入参需要）
- `clients/client/src/main/index.ts`（实例化服务并注入）
- `packages/core/src/client/protocol.ts`（可选字段）
- `clients/client/package.json`、`electron-builder.yml`、构建脚本（依赖与重编译）
- `clients/client/README.md`（能力说明、限制、真机清单）

**配置入口（实现者决定）**：v1 **不碰 renderer**，写卡配置只通过 `config.json` 修改（总开关、EPC 字段、格式、`rfidDrivers` 映射、端口、超时）。理由：先以最小范围跑通端到端写卡链路；设置页可视化留作后续独立改动，接口不变即可补。

## 验收标准

- `npm run test -w @worm-print-platform/client` 全绿；新增测试覆盖：VID/PID 匹配、撞号 probe、无写卡器、写卡成功/失败/超时、EPC 校验、批量不支持、失败不误报打印失败。
- `npm run typecheck -w @worm-print-platform/client` 通过；core/client 协议类型改动不影响现有测试。
- `npm run build -w @worm-print-platform/client` 通过；三端打包脚本含 electron-rebuild 与 asarUnpack。
- 真机清单（标注待现场验证）：`hello` 响应含 rfid 能力标记（若加）、串口能枚举到写卡器、打一张标签后响应带 `rfid.ok: true`、拔掉写卡器返回 `NO_WRITER` 且打印仍成功。
