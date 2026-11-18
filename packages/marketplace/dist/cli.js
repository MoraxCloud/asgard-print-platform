#!/usr/bin/env node
import {
  BUNDLED_CATALOG,
  MarketError,
  installPlugin,
  removePlugin
} from "./chunk-7P6GBMU3.js";

// src/cli.ts
import { resolve } from "path";
import { fileURLToPath } from "url";
var VERSION = true ? "1.5.2" : "1.5.2";
var SOURCES = /* @__PURE__ */ new Set(["npm", "github", "gitee", "auto", "local"]);
var USAGE = `\u7528\u6CD5: worm-print-marketplace <\u547D\u4EE4> [\u9009\u9879]

\u547D\u4EE4:
  list                       \u5217\u51FA\u5185\u7F6E\u7D22\u5F15\u4E2D\u7684\u63D2\u4EF6
  install <\u540D\u79F0>[@\u7248\u672C]      \u5B89\u88C5\u5355\u4E2A\u63D2\u4EF6\uFF08\u7F3A\u7701\u7248\u672C = \u6700\u65B0\u7A33\u5B9A\u7248\uFF09
  remove <\u540D\u79F0>              \u5378\u8F7D\u63D2\u4EF6

\u9009\u9879:
  --source npm|github|gitee|auto   \u5B89\u88C5\u6765\u6E90\uFF0C\u9ED8\u8BA4 auto\uFF08npm \u2192 GitHub \u2192 Gitee\uFF09
  --dir <\u8DEF\u5F84>                     \u63D2\u4EF6\u6839\u76EE\u5F55\uFF0C\u9ED8\u8BA4 .worm-print/plugins
  --repo <\u8DEF\u5F84\u6216URL>               \u672C\u5730\u5E02\u573A\u76EE\u5F55\u6216\u81EA\u5B9A\u4E49 git \u4ED3\u5E93\u5730\u5740
  --force                         \u5DF2\u5B58\u5728\u65F6\u8986\u76D6\u5B89\u88C5
  -h, --help                      \u663E\u793A\u5E2E\u52A9
  -v, --version                   \u663E\u793A\u7248\u672C`;
function parseArgs(argv) {
  const result = { source: "auto", force: false, help: false, helpVersion: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      result.help = true;
      continue;
    }
    if (arg === "-v" || arg === "--version") {
      result.helpVersion = true;
      continue;
    }
    if (arg === "--force") {
      result.force = true;
      continue;
    }
    if (arg === "--source" || arg === "--dir" || arg === "--repo") {
      const value = argv[++i];
      if (!value) throw new MarketError("BAD_ARGUMENT", `${arg} \u7F3A\u5C11\u503C`);
      if (arg === "--source") {
        if (!SOURCES.has(value)) throw new MarketError("BAD_ARGUMENT", `\u4E0D\u652F\u6301\u7684\u6765\u6E90\uFF08--source\uFF09\uFF1A${value}`);
        result.source = value;
      } else if (arg === "--dir") result.dir = value;
      else result.repo = value;
      continue;
    }
    if (arg.startsWith("-")) throw new MarketError("BAD_ARGUMENT", `\u672A\u77E5\u9009\u9879\uFF1A${arg}`);
    if (!result.command) {
      if (arg === "list" || arg === "install" || arg === "remove") result.command = arg;
      else throw new MarketError("BAD_ARGUMENT", `\u672A\u77E5\u547D\u4EE4\uFF1A${arg}`);
      continue;
    }
    if (!result.name) {
      const at = arg.lastIndexOf("@");
      if (at > 0) {
        result.name = arg.slice(0, at);
        result.version = arg.slice(at + 1);
      } else {
        result.name = arg;
      }
    }
  }
  return result;
}
function errorCode(err) {
  if (err instanceof MarketError) {
    const map = {
      BAD_ARGUMENT: 2,
      BAD_PLUGIN_ID: 2,
      BAD_REPO: 2,
      NOT_FOUND: 3,
      VERSION_NOT_FOUND: 3,
      ALREADY_EXISTS: 4,
      INVALID_PLUGIN: 5,
      NPM_FAILED: 6,
      CLONE_FAILED: 6,
      GIT_MISSING: 6
    };
    return map[err.code] ?? 1;
  }
  return 1;
}
async function main(argv, deps = {}) {
  const out = deps.out ?? console.log;
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (err) {
    out(err instanceof Error ? err.message : String(err));
    return 1;
  }
  if (parsed.help) {
    out(USAGE);
    return 0;
  }
  if (parsed.helpVersion) {
    out(`@worm-print-platform/marketplace ${VERSION}`);
    return 0;
  }
  if (!parsed.command) {
    out(USAGE);
    return 1;
  }
  const index = deps.index ?? BUNDLED_CATALOG;
  if (parsed.command === "list") {
    out(index.plugins.map((p) => `${p.id}@${p.version}  ${p.npmName}`).join("\n") || "\uFF08\u7D22\u5F15\u4E3A\u7A7A\uFF09");
    return 0;
  }
  if (!parsed.name) {
    out("\u7F3A\u5C11\u63D2\u4EF6\u540D");
    return 1;
  }
  try {
    if (parsed.command === "install") {
      const options = {
        name: parsed.name,
        version: parsed.version,
        source: parsed.source,
        dir: parsed.dir,
        repo: parsed.repo,
        force: parsed.force,
        index
      };
      const result = await (deps.install ?? installPlugin)(options);
      out(`\u5DF2\u5B89\u88C5 ${result.id}@${result.version}\uFF08\u6765\u6E90 ${result.source}\uFF09\u2192 ${result.target}`);
      return 0;
    }
    await (deps.remove ?? removePlugin)({
      name: parsed.name,
      dir: parsed.dir,
      repo: parsed.repo
    });
    out(`\u5DF2\u5378\u8F7D ${parsed.name}`);
    return 0;
  } catch (err) {
    out(err instanceof Error ? err.message : String(err));
    return errorCode(err);
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
export {
  main,
  parseArgs
};
