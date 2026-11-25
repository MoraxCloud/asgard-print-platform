# 国际化全量实测记录（2026-11-22）

## 一、自动化门禁（修复后最终复核）

- `npm run verify:i18n:full`：exit=0。逐项输出：
  `✓ 构建产物齐全 / ✓ template 覆盖四类键 / ✓ 合法包 validate 通过 / ✓ 缺键被拦截 / ✓ 多余键 --strict 被拦截 / ✓ 空值被拦截 / ✓ 占位符丢失被拦截 / ✓ 嵌套·_meta 被拦截 / ✓ bundle 结构含五个命名空间`，结尾「语言包验证全部通过」。
- 全量测试：271 测试文件 / **2912 用例**零失败。
- `npm run i18n:check -w @worm-print-platform/core`：`校验通过：809 个键（含 constants/propertyTips 三语 parity）`。

## 二、浏览器实测（直挂 packages/canvas/dist/canvas.js，本地静态服务）

| 场景 | 结果 |
|---|---|
| zh-CN 工具栏 / 纸张下拉 / 边框提示 | 中文逐字正确（保存、预览、A4、全等分…、线型即时生效说明） |
| en-US | 保存=Save、预览=Preview、纸张=Full sheet…、线型=None/Solid/Dashed/Dotted/Double、边框提示与分组标题英文 |
| th-TH | 保存=บันทึก、纸张=แผ่นเต็ม…、线型=ไม่มี/เส้นทึบ/…、提示泰文 |
| fr-FR 自定义 messages（部分键） | 注入键显示法语（Enregistrer、Trait plein、Rotation de l'élément…），未注入键回退中文，符合缺键回退设计 |
| fr-FR 完整包（957 键） | UI chrome 零中文；仅模板数据「页面 1」「列1/2/3」含中文（模板内容，非 UI 文案） |
| 多实例隔离 | fr 实例 messages 不影响 zh 全局实例（仍显示保存）；两个 fr 实例分别显示 Enregistrer / SAUVEGARDE-2 |
| 空串回退 | `messages['toolbar.k537']=''` 时显示中文「保存」，不出现空译文 |
| 帮助弹窗（fr 实例） | 标题=Aide、关闭 title=Fermer；页签与正文仍中文（已接受限制 D17） |
| 控制台 | 0 error / 0 warning |

### 浏览器实测发现并已修复的问题

**水印密度尺寸后缀残留中文全角括号**：英文/泰文界面显示 `Dense（200×120）`、`หนาแน่น（200×120）`。
修复：新增 `constants.watermark.density.size` 资源键（zh `（{w}×{h}）`，en/th ` ({w}×{h})`），canvas 改为取词渲染；新增回归测试。
修复后浏览器复测：zh=`密（200×120）`、en=`Dense (200×120)`、th=`หนาแน่น (200×120)`；中文界面文案未变。
提交：`2a04b75 fix(i18n): 水印密度尺寸后缀按语言使用对应括号`。

## 三、render 服务实测（真实进程 + HTTP 请求）

- `WORM_PRINT_LOCALE=fr-FR WORM_PRINT_LOCALE_FILE=<fr.json>` 启动，POST `/render/pdf`（`templateJson:{pages:[]}, printData:[]`）返回
  `{"code":"INVALID_REQUEST","message":"Les donnees sont vides (FR)"}`；`/health` 正常 → 语言包生效且不阻塞启动。
- `WORM_PRINT_LOCALE_FILE=<不存在路径>` 启动：日志 `[i18n] 语言包加载失败: … ENOENT`，服务继续监听；请求返回中文
  `批量打印数据必须是非空对象数组` → 失败降级符合设计。
- 观察（未修改，保留记录）：启动时出现 `[i18n] missing key: echarts.meta.* (locale=en-US)` 开发态 warn，属既有诊断噪声，不影响功能；如需调整请后续确认。

## 四、市场 CLI 实测（真实安装 / 卸载）

- 用 `@worm-print-platform/marketplace` dist 的 `installPlugin` + `removePlugin`，以本仓 `marketplace/` 为 local 源安装 echarts 到临时宿主：
  - `.worm-print/i18n/echarts/zh-CN.json` 存在；清单 `i18n={"base":"zh-CN","locales":["en-US","th-TH","zh-CN"]}`。
  - `removePlugin` 后统一目录消失、清单条目清除。
- 过程中发现被 git 跟踪的 marketplace dist 与构建 chunk 引用不一致（还原构建副作用所致），已重建并同步提交：`800f7a9 build(marketplace): 同步语言资源改动后的构建产物`。

## 五、CLI 端到端实测

- `template` 导出骨架 → 填值（含空值）→ `validate` 报 `ERROR a.two: 译文为空`、exit=1。
- `update` 保留译文、补新键为空串。
- `.worm-print/plugins.json` 存在无 `i18n` 字段的旧条目时，`template` 输出「插件 old 的语言资源未同步，请重新安装」且不阻断。

## 六、L4 打包项（环境阻塞，未完全完成）

- 仓库根放入 `locales/fr-FR.json` 后执行 `npm run pack:client:dir`：
  - `electron-vite build` 成功；`[copy-locales] 已复制 locales/ 到 out/locales`；
    `clients/client/out/locales/fr-FR.json` 存在且内容正确（已核对）。
  - **electron-builder --dir 失败**：`Timeout awaiting 'request' for 600000ms`（下载阶段网络超时，`exit=1`）。
  - 因此 **asar 内 `out/locales` 的实际读取未验证**，本项记为环境阻塞，不宣称三端打包完成。

## 七、保留记录、未修改项

- 帮助弹窗正文与页签静态中文（自定义语言回退）为已接受限制，测试显式断言，未改。
- 模板数据（页面名、示例单元格文本「列1」等）非 UI 文案，未翻译，符合设计边界。
- 打印文档 `<html lang>` 未改；demo 未改造。
- render 启动时的 echarts missing-key 开发态 warn 属既有噪声，未改，留待采集后决策。
