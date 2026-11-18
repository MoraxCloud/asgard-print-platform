# 快递面单示例修复与校验器/技能加固 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 `express-waybill` 二维码压线压字缺陷，并让 `inspectTemplate` 不再误报分隔线、能报出线穿码，随后同步技能文档与 MCP 工具描述。

**Architecture:** 单包内的小范围加固。示例模板只改一个数值并由现有同步脚本覆盖四宿主；校验器改动集中在 `packages/contract/src/inspect.ts` 的 `InspectCode` 联合类型、`BACKGROUND_CANDIDATE_TYPES` 常量与逐元素体检循环；技能与工具描述只改文案，不改行为。

**Tech Stack:** TypeScript、Vitest、npm workspaces、core 同构渲染管线 + Playwright（验收用）。

**Spec:** `docs/superpowers/specs/2026-11-18-waybill-fix-and-skill-hardening-design.md`

## Global Constraints

- 几何容差沿用 `inspectTemplate` 的 `toleranceMm`，默认 `0.2mm`，不另设常量。
- 四份 `demos/apps/{vue3,vue2,react,jquery}/src/templates.js` 必须同 MD5；只手工改 vue3 源文件，其余由 `npm run samples:demos` 同步。
- `InspectCode` 是 `@worm-print-platform/contract` 的导出联合类型，新增码值必须同步到类型、工具描述与技能文档。
- 不触碰 core 渲染管线、`print_validate_template` 契约规则、示例的 `batchData`/边距/`testData`/`barHeight`。
- 提交信息用简体中文。

## Review Focus

- **线类刚好贴码边（重叠 ≤0.2mm）不应误报**：靠 `rectOverlap` 的 `eps=tol` 语义保证；Task 3 的"不相交"测试覆盖。
- **线类声明高度为 0 时仍需可判定**：交叉轴厚度取 `max(声明值, 0.2)mm`；Task 3 测试中让 `hline` 省略 `height`。
- **全宽 `rect` 仍应报背景层**：移除的只是 `hline`/`vline`，不能连带删除装饰层判据；Task 2 测试覆盖。
- **页眉/页脚带内的线穿码也应报**：检测逻辑放在现有 `zone` 循环内，覆盖 content/header/footer；Task 3 的 `vline` 测试放在 content，复核时人工确认循环位置。
- **缩小二维码后不能引入新越界/零尺寸 finding**：Task 1 验收步骤对修复后的 `express-waybill` 重跑体检确认。

---

### Task 1: 修复示例二维码高度并同步四宿主

**Files:**
- Modify: `demos/apps/vue3/src/templates.js`（`express-waybill` 的 `ew-10` 元素）

**Interfaces:**
- Consumes: 无
- Produces: 四份同源 `templates.js` 中 `ew-10.options.height === 18`

- [ ] **Step 1: 修改源示例**

在 `demos/apps/vue3/src/templates.js` 中找到 `id: 'ew-10'` 的 `qrcode` 元素，把 `options` 里的 `height: 24` 改为 `height: 18`（`left:0, top:52, width:24` 不变）。改完确认该元素仍是：
```js
options: { left: 0, top: 52, width: 24, height: 18, formatter: '{waybill.qrcode}', qrCodeLevel: 'M' },
```

- [ ] **Step 2: 同步四宿主**

Run: `npm run samples:demos`
Expected: 输出三行"已同步 demos/apps/{vue2,react,jquery}/src/templates.js"，末行打印"✓ 四份 templates.js 同 MD5：……”

- [ ] **Step 3: 验证修复后的示例体检**

Run: `node -e "import('./demos/apps/vue3/src/templates.js').then(async m=>{const s=m.SAMPLES.find(x=>x.id==='express-waybill');const c=await import('./packages/contract/dist/index.js');console.log(JSON.stringify(c.inspectTemplate(s.template).findings,null,2))})"`
Expected: `findings` 中不再出现 `ELEMENT_OVERLAP`；`BACKGROUND_NOT_PAGEABLE` 4 条仍在（Task 2 消除）；`BARCODE_MISSING_BAR_HEIGHT` 1 条仍在（设计明确不处理）。

- [ ] **Step 4: Commit**

```bash
git add demos/apps/vue3/src/templates.js demos/apps/vue2/src/templates.js demos/apps/react/src/templates.js demos/apps/jquery/src/templates.js
git commit -m "fix(demos): 快递面单二维码缩高，避开分隔线与打印时间"
```

---

### Task 2: 消除线类背景层误报

**Files:**
- Modify: `packages/contract/src/inspect.ts:29`
- Test: `packages/contract/src/__tests__/inspect.test.ts`

**Interfaces:**
- Consumes: `inspectTemplate(template, opts)` 现有签名
- Produces: `BACKGROUND_NOT_PAGEABLE` 仅对 `rect`/`oval`/`image` 生效

- [ ] **Step 1: 写失败测试**

在 `packages/contract/src/__tests__/inspect.test.ts` 的 `BACKGROUND_NOT_PAGEABLE` 用例之后新增：
```ts
it('全宽 hline/vline 不报 BACKGROUND_NOT_PAGEABLE，全宽 rect 仍报', () => {
  const line = (type: 'hline' | 'vline'): PrintElementData => ({
    id: 'l1', type, printElementType: { type },
    options: { left: 0, top: 0, width: CONTENT_W, height: CONTENT_H } as ElementOptions,
  })
  expect(inspectTemplate(tpl([line('hline')])).findings.some(f => f.code === 'BACKGROUND_NOT_PAGEABLE')).toBe(false)
  expect(inspectTemplate(tpl([line('vline')])).findings.some(f => f.code === 'BACKGROUND_NOT_PAGEABLE')).toBe(false)
  expect(inspectTemplate(tpl([{ id: 'r', type: 'rect', printElementType: { type: 'rect' },
    options: { left: 0, top: 0, width: CONTENT_W, height: CONTENT_H } } as PrintElementData])).findings
    .some(f => f.code === 'BACKGROUND_NOT_PAGEABLE')).toBe(true)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -w @worm-print-platform/contract -- --run src/__tests__/inspect.test.ts`
Expected: FAIL，前两个断言为 `true`（当前实现把线类算作背景层）。

- [ ] **Step 3: 实现**

在 `packages/contract/src/inspect.ts` 中把 `BACKGROUND_CANDIDATE_TYPES` 从
`new Set(['rect', 'oval', 'image', 'vline', 'hline'])`
改为
`new Set(['rect', 'oval', 'image'])`。其余判据不动。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -w @worm-print-platform/contract -- --run src/__tests__/inspect.test.ts`
Expected: PASS，且该文件原有断言全部通过。

- [ ] **Step 5: Commit**

```bash
git add packages/contract/src/inspect.ts packages/contract/src/__tests__/inspect.test.ts
git commit -m "fix(contract): 分隔线不再误报为背景装饰层"
```

---

### Task 3: 新增 LINE_OVER_CODE 线穿码检测

**Files:**
- Modify: `packages/contract/src/inspect.ts:4-17`（`InspectCode` 联合类型）
- Modify: `packages/contract/src/inspect.ts:189-201`（`zone` 循环内的重叠检测之后）
- Test: `packages/contract/src/__tests__/inspect.test.ts`

**Interfaces:**
- Consumes: `rectOverlap(a, b, eps)`（同文件已有）、`tol`、`list`、`path`
- Produces: `InspectFinding { code: 'LINE_OVER_CODE', level: 'error', path: 线元素路径, message: 含两元素 id/类型 }`

- [ ] **Step 1: 写失败测试**

在 `inspect.test.ts` 末尾新增：
```ts
it('LINE_OVER_CODE：横线穿二维码 / 竖线穿条码报 error，贴边不报', () => {
  const code = (id: string, type: 'barcode' | 'qrcode'): PrintElementData => ({
    id, type, printElementType: { type },
    options: { left: 10, top: 10, width: 20, height: 20 } as ElementOptions,
  })
  const hline: PrintElementData = { id: 'l1', type: 'hline', printElementType: { type: 'hline' },
    options: { left: 0, top: 15, width: 50 } as ElementOptions } // 故意省略 height
  const hit = inspectTemplate(tpl([code('q1', 'qrcode'), hline]))
  expect(hit.ok).toBe(false)
  expect(hit.findings.some(f => f.code === 'LINE_OVER_CODE' && f.level === 'error' && f.path === 'elements[1]')).toBe(true)

  const vline: PrintElementData = { id: 'l2', type: 'vline', printElementType: { type: 'vline' },
    options: { left: 15, top: 5, width: 0.2, height: 30 } as ElementOptions }
  expect(inspectTemplate(tpl([code('b1', 'barcode'), vline])).findings
    .some(f => f.code === 'LINE_OVER_CODE' && f.path === 'elements[1]')).toBe(true)

  const aside: PrintElementData = { id: 'l3', type: 'hline', printElementType: { type: 'hline' },
    options: { left: 0, top: 30, width: 50, height: 0.2 } as ElementOptions }
  expect(inspectTemplate(tpl([code('q2', 'qrcode'), aside])).findings
    .some(f => f.code === 'LINE_OVER_CODE')).toBe(false)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -w @worm-print-platform/contract -- --run src/__tests__/inspect.test.ts`
Expected: FAIL，`LINE_OVER_CODE` 不存在、三个断言均不成立。

- [ ] **Step 3: 实现**

在 `packages/contract/src/inspect.ts`：
1. `InspectCode` 联合类型末尾增加 `| 'LINE_OVER_CODE'`。
2. 在 `zone` 循环内、现有 `boxes` 两两重叠检测之后，加入线×码检测：
   - 取 `list` 中 `type` 为 `hline`/`vline` 的项为线，`barcode`/`qrcode` 为码；
   - 线框 = `{ left: o.left ?? 0, top: o.top ?? 0, width: Math.max(o.width ?? 0, 0.2), height: Math.max(o.height ?? 0, 0.2) }`；码框取自身 `left/top/width/height`；
   - 用 `rectOverlap(线框, 码框, tol)` 判定；相交时 push `{ code: 'LINE_OVER_CODE', level: 'error', path: 线元素路径, message: 说明哪条线穿过哪个码 }`。

不要改动 `NON_OVERLAP_TYPES`，不要改 `rectOverlap`，不要把 `hline`/`vline` 加回 `BACKGROUND_CANDIDATE_TYPES`。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -w @worm-print-platform/contract -- --run src/__tests__/inspect.test.ts`
Expected: PASS。

- [ ] **Step 5: 跑整包测试 + 构建**

Run: `npm test -w @worm-print-platform/contract && npm run build -w @worm-print-platform/contract`
Expected: 全绿，构建成功。

- [ ] **Step 6: 对全量示例复测**

Run: `node /private/var/folders/lp/1snj0ynn3ngb2yb5xktgmm6r0000gn/T/opencode/recon.mjs`（如临时脚本已不存在，按 Task 1 Step 3 的方式遍历 `SAMPLES` 调 `inspectTemplate`）
Expected: `LINE_OVER_CODE` 命中数为 0；`BACKGROUND_NOT_PAGEABLE` 线类误报数为 0。

- [ ] **Step 7: Commit**

```bash
git add packages/contract/src/inspect.ts packages/contract/src/__tests__/inspect.test.ts
git commit -m "feat(contract): 静态体检新增线穿码检测并去除分隔线误报"
```

---

### Task 4: 同步技能文档与 MCP 工具描述

**Files:**
- Modify: `skills/worm-print-platform-mcp/references/layout-recipes.md`
- Modify: `skills/worm-print-platform-mcp/SKILL.md`
- Modify: `packages/mcp/src/tools.ts:147-152`

**Interfaces:**
- Consumes: Task 3 产出的码值 `LINE_OVER_CODE`
- Produces: 无（纯文案）

- [ ] **Step 1: 补配方四与避坑清单**

在 `layout-recipes.md` 的"配方四：快递面单"末尾追加一条约束：二维码/条码高度必须按"右侧信息块底部 → 分隔线 → 底部文字"预留净空，码底边与分隔线至少留 1mm；示例 100×150 面单中右侧块止于 70mm，故 24mm 高的二维码（底 76mm）会压住 71mm 分隔线和 72mm 打印时间，应取 18mm。
在"避坑清单"末尾新增第 12 条：线穿码——`hline`/`vline` 横穿 `barcode`/`qrcode` 会破坏识读，`print_inspect_layout` 现以 `LINE_OVER_CODE`（error）报出，必须修；静态体检不替代 `print_preview_template` 视觉回读。

- [ ] **Step 2: 补 SKILL.md**

在 `SKILL.md` §1 的 `print_inspect_layout` 条目补"含线穿码 `LINE_OVER_CODE`（error）"；在 §2 第 5/6 步之间或 §3 增加一句：`LINE_OVER_CODE` 属 error 必须清零，且静态体检不判真实换行与分页，视觉回读不可省。

- [ ] **Step 3: 补 MCP 工具描述**

在 `packages/mcp/src/tools.ts` 的 `print_inspect_layout` description 中，把码值列表补上 `LINE_OVER_CODE（线穿码，error，破坏条码/二维码识读）`，并明确线类不再计入 `BACKGROUND_NOT_PAGEABLE`。

- [ ] **Step 4: 验证文案一致性**

Run: `grep -rn "LINE_OVER_CODE" skills/worm-print-platform-mcp packages/mcp/src/tools.ts packages/contract/src/inspect.ts`
Expected: 四处均命中，码值拼写一致。

Run: `npm run build -w @worm-print-platform/mcp`
Expected: 构建成功。

- [ ] **Step 5: Commit**

```bash
git add skills/worm-print-platform-mcp/references/layout-recipes.md skills/worm-print-platform-mcp/SKILL.md packages/mcp/src/tools.ts
git commit -m "docs(skills): 同步线穿码判据与面单二维码避坑说明"
```

---

### Task 5: 端到端验收

**Files:** 无（只读验证）

**Interfaces:**
- Consumes: Task 1-4 全部产出
- Produces: 验收结论

- [ ] **Step 1: 本地重渲染示例**

用 core 同构管线 + Playwright 渲染修复后的 `express-waybill`（可复用本次会话已存在的临时脚本 `render-waybill2.mjs`，必要时重建），输出 PNG。
Expected: 二维码完整、与 71mm 分隔线及 72mm 打印时间文字互不相交，截图可肉眼确认。

- [ ] **Step 2: 复跑体检**

Run: Task 1 Step 3 的命令。
Expected: `ELEMENT_OVERLAP` 与 `LINE_OVER_CODE` 均为 0；仅剩 `BARCODE_MISSING_BAR_HEIGHT` 与 4 条已被 Task 2 消除的 `BACKGROUND_NOT_PAGEABLE`（此时应为 0 条）。

- [ ] **Step 3: 全量回归**

Run: `npm test -w @worm-print-platform/contract && npm run build -w @worm-print-platform/contract && npm run build -w @worm-print-platform/mcp`
Expected: 全绿。

- [ ] **Step 4: diff 审查**

Run: `git diff HEAD~5 --stat && git status --short`
Expected: 仅出现计划内文件；无无关重构、无临时脚本混入仓库。
