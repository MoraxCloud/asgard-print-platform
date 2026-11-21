# 出纸侧自定义函数存在性校验（设计）

日期：2026-11-20

## 意图 / 为什么

用户要求：服务端与客户端对模板表达式中的**函数名**做存在性校验，函数不存在则抛异常。

动因是杜绝静默出纸：当前 `evaluateTemplate` 把所有求值失败都降级成 `errorFallback ?? text`，自定义函数（如 `MASK_PHONE`）未部署或写错时，打印结果会原样带着 `{MASK_PHONE(phone)}`，一张没脱敏的纸可能被静默交付。需要的是**可诊断的硬失败**。

## 目标

- 三端（浏览器预览 / 服务端 PDF / 桌面客户端静默打印）共用的出纸引擎，在求值前校验表达式里的函数名。
- 未知函数抛出明确错误：包含**函数名**与**表达式原文**，便于定位是漏注册还是拼写错误。
- 配套最小注册 API，让自定义函数能进入出纸引擎（校验的合法集合需要它）。
- 不破坏字段缺失等既有求值失败的回落行为。

## 非目标

- 不改动设计期 `packages/contract/src/expression.ts` 的静态白名单机制（出纸链路不经过它）。
- 不做「整模板一次性扫描并汇总全部错误位置」（需改 schema / 协议，属更大范围）。
- 不合并设计器 `engine` 与出纸 `RenderEngine` 两套注册入口。
- 不新增服务端 / 客户端协议码。

## 现状事实（约束）

- 三端共用 `packages/core/src/render/expression-eval.ts` 的模块私有 `RenderEngine`，因此改动落一处即三端生效。
- `evaluateTemplate` 当前 catch-all 回落 `errorFallback ?? text`；`safeEval` 直接抛。
- 聚合函数 `SUM/AVG/COUNT/MIN/MAX` 在 `evaluateTemplate` 中做文本预处理，从未注册进引擎。
- evaluator（`packages/core/src/evaluator.ts:143-180`）对未知调用抛 `不允许调用: X`，对非函数变量抛 `X 不是函数`，没有独立错误类型。
- 可调用全局（`evaluator.ts:24`）：`Number / String / Boolean / parseInt / parseFloat / isNaN`，另有 `Math.*` 成员调用。
- **风险点**：设计器 `EXTENDED_FUNCTIONS`（`designer/utils/expression-eval.ts:26-55`）比出纸 `FORMAT_FUNCTIONS`（`render/expression-eval.ts:52-72`）多出 `FORMAT / SUBSTR / NOW / PAD / REPLACE / JSON`。这六个函数只在设计器可用；新校验会让用到它们的存量模板在出纸时硬失败。这是暴露既存跨端不一致，建议接受，函数集对齐另立改动。

## 方案

### 已考虑的方案

- **A. 求值前校验函数名（选定）**：求值前抽出表达式中的函数名，与合法集合比对，未知即抛类型化错误；字段缺失等其它错误仍走原有回落。错误可诊断，不依赖 evaluator 内部文案。
- **B. 仅求值期拦截**：只改 `evaluateTemplate` 的 catch，遇到 evaluator 的「不允许调用 / 不是函数」时重抛。改动最小、零误报，但信息笼统、依赖错误文案、`safeEval` 需单独补。
- **C. 整模板预扫描汇总**：出纸前解析整张模板一次性列出全部错误位置。诊断体验最好，但要动 schema / 协议，范围明显更大。

选 A：核心诉求是「绝不静默出一张没脱敏的纸」且要能快速定位，A 在最小改动下给出精确错误；B 作为兜底层层设防；C 留作后续。

### 具体做法

1. **合法函数名集合**（出纸侧，模块内）
   - `RenderEngine` 已注册函数（内置 `FORMAT_FUNCTIONS` + 后续注册的自定义函数）
   - 聚合函数：`SUM / AVG / COUNT / MIN / MAX`
   - 可调用全局：`Number / String / Boolean / parseInt / parseFloat / isNaN`
   - 成员调用（如 `Math.round(...)`）跳过校验，交由 evaluator 既有语义处理

2. **AST 校验（对方案 A 的实现细化）**
   - 用 core 已有的 `tokenize` + `parse` 解析表达式体，遍历 `call` 节点取 `callee.type === 'ident'` 的函数名；**不用正则扫描**——正则会把字符串字面量里的 `"MASK_PHONE(x)"` 和 `Math.round(...)` 的名字误判为函数调用。
   - 解析失败（语法错误）时不抛校验错误，跳过校验并交回原有求值 / 回落逻辑，保持既有行为。
   - `evaluateTemplate` 对每个 `{...}` 体逐一校验；`safeEval` 对整条裸表达式校验（覆盖水印路径）。

3. **类型化错误**
   - 新增 `UnknownExpressionFunctionError extends Error`，携带 `functionName` 与 `expression`，消息形如：
     `未知函数 MASK_PHONE()：表达式「{MASK_PHONE(phone)}」中引用的函数未在出纸引擎注册`
   - 校验必须在 `evaluateTemplate` 的 try/catch **之外**执行，确保错误逃逸到调用方；服务端转为 500 并带明文消息，客户端使打印任务失败。

4. **注册 API（配套最小改动）**
   - `render/expression-eval.ts` 导出 `registerRenderFunction(name, fn)`，写入同一个私有引擎；`name` 校验为合法标识符 `/^[A-Za-z_][A-Za-z0-9_]*$/`。
   - `packages/core/src/index.ts` 主入口导出该 API 与错误类。
   - 服务端 / 客户端按上一轮确认的「部署白名单 import」方式在函数包入口调用它（本次只落 core 侧 API，宿主接线由使用方按需 import）。

5. **兜底**（对应方案 B）
   - `evaluateTemplate` 的 catch 中，若 evaluator 错误文案匹配 `不允许调用 | 不是函数`，重抛而不回落。仅作防御，主校验仍是第 2 步。

## 文件落点

| 文件 | 改动 |
|---|---|
| `packages/core/src/render/expression-eval.ts` | 合法集合、AST 校验、错误类、`registerRenderFunction`、`evaluateTemplate` / `safeEval` 接入、catch 兜底重抛 |
| `packages/core/src/index.ts` | 导出 `registerRenderFunction`、`UnknownExpressionFunctionError` |
| `packages/core/src/render/expression-eval.test.ts` | 新增校验相关单测 |
| 服务端 / 客户端 | 仅在使用自定义函数时于入口 import 函数包；本次不改其源码 |

## 验证

单测覆盖：
- 未注册自定义函数抛 `UnknownExpressionFunctionError`，消息含函数名与表达式
- 已注册自定义函数正常求值
- 5 个聚合函数不误报
- `Math.round(...)` 成员调用不误报
- 字符串字面量中的 `NAME(` 不误报
- 字段缺失等其它错误仍按 `errorFallback` 回落
- `safeEval` 同样校验未知函数

命令：`npm run build -w @worm-print-platform/core`，并运行 core 单测；必要时跑服务端 / 客户端构建确认无回归。
