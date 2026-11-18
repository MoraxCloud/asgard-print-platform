// src/manifest.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, isAbsolute, join, resolve } from "path";
function absPath(p, cwd) {
  return isAbsolute(p) ? p : resolve(cwd, p);
}
function manifestPath(dir, cwd = process.cwd()) {
  return join(dirname(absPath(dir, cwd)), "plugins.json");
}
function readManifest(dir, cwd = process.cwd()) {
  const path = manifestPath(dir, cwd);
  if (!existsSync(path)) return { schemaVersion: 1, plugins: {} };
  return JSON.parse(readFileSync(path, "utf8"));
}
function writeManifest(dir, manifest, cwd = process.cwd()) {
  const path = manifestPath(dir, cwd);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}
`, "utf8");
}
function upsertManifestEntry(dir, id, entry, cwd = process.cwd()) {
  const manifest = readManifest(dir, cwd);
  manifest.plugins[id] = entry;
  writeManifest(dir, manifest, cwd);
}
function removeManifestEntry(dir, id, cwd = process.cwd()) {
  const manifest = readManifest(dir, cwd);
  if (!(id in manifest.plugins)) return;
  delete manifest.plugins[id];
  writeManifest(dir, manifest, cwd);
}

// src/types.ts
var MarketError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "MarketError";
  }
};

// src/semver.ts
function parseSemver(raw) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(raw.trim());
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3], prerelease: m[4] ?? "" };
}
function extractVersion(raw) {
  const m = raw.match(/(?:^|\/)v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/);
  return m ? m[1] : raw.trim();
}
function isStableVersion(raw) {
  return parseSemver(extractVersion(raw))?.prerelease === "";
}
function compareStable(a, b) {
  const x = parseSemver(extractVersion(a));
  const y = parseSemver(extractVersion(b));
  return x.major - y.major || x.minor - y.minor || x.patch - y.patch;
}
function latestStable(versions) {
  const stable = versions.filter(isStableVersion);
  if (stable.length === 0) return null;
  const max = [...stable].sort(compareStable).at(-1);
  return max ? extractVersion(max) : null;
}

// src/resolve.ts
var DEFAULT_SCOPE = "@worm-print-platform/plugin-";
function resolvePluginName(name, index) {
  const raw = name.trim();
  if (!raw || /[\s\r\n]/.test(raw) || raw.startsWith("-")) {
    throw new MarketError("BAD_PLUGIN_ID", `\u975E\u6CD5\u63D2\u4EF6\u540D\uFF1A${name}`);
  }
  const at = raw.lastIndexOf("@");
  const hasVersion = at > 0;
  const base = hasVersion ? raw.slice(0, at) : raw;
  const suffix = hasVersion ? raw.slice(at) : "";
  const entry = index.plugins.find((p) => p.id === base || p.npmName === base);
  if (entry) return { id: entry.id, npmName: `${entry.npmName}${suffix}` };
  if (base.startsWith("@")) {
    return { id: base.split("/").pop().replace(/^plugin-/, ""), npmName: raw };
  }
  return { id: base, npmName: `${DEFAULT_SCOPE}${base}${suffix}` };
}
function resolveVersion(source, versions, requested) {
  if (requested !== void 0) {
    const version = extractVersion(requested);
    if (!parseSemver(version)) {
      throw new MarketError("VERSION_NOT_FOUND", `VERSION_NOT_FOUND\uFF1A\u63D2\u4EF6\u7248\u672C\u300C${requested}\u300D\u4E0D\u662F\u5408\u6CD5\u8BED\u4E49\u5316\u7248\u672C`);
    }
    return version;
  }
  const stable = latestStable(versions);
  if (!stable) {
    throw new MarketError("VERSION_NOT_FOUND", `VERSION_NOT_FOUND\uFF1A\u6765\u6E90 ${source} \u4E2D\u6CA1\u6709\u53EF\u7528\u7684\u7A33\u5B9A\u7248\u672C`);
  }
  return stable;
}
function buildGitTag(id, version) {
  return `plugins/${id}/v${version}`;
}

// src/repo.ts
var DEFAULT_GITHUB_REPO = "https://github.com/worm-longliu/worm-print-platform.git";
var DEFAULT_GITEE_REPO = "https://gitee.com/liulong_oschina/worm-print-platform.git";
function classifyHost(hostName) {
  const host = hostName.toLowerCase();
  if (host.includes("github")) return "github";
  if (host.includes("gitee")) return "gitee";
  return "other";
}
function extractHostName(url) {
  const match = url.match(/^(?:[a-z][a-z0-9+.-]*:\/\/)?(?:[^@/]+@)?([^/:]+)[/:]/i);
  return match ? match[1] : null;
}
function parseRepoUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) throw new MarketError("BAD_REPO", "\u4ED3\u5E93\u5730\u5740\u4E0D\u80FD\u4E3A\u7A7A");
  let url = trimmed;
  if (/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(url)) {
    url = `https://github.com/${url}.git`;
  }
  if (!/^(https?:\/\/|ssh:\/\/|git:\/\/|file:\/\/|git@)/i.test(url)) {
    throw new MarketError("BAD_REPO", `\u4E0D\u652F\u6301\u7684\u4ED3\u5E93\u5730\u5740\uFF1A${raw}`);
  }
  if (/[\s\r\n]/.test(url)) throw new MarketError("BAD_REPO", `\u4ED3\u5E93\u5730\u5740\u4E0D\u80FD\u5305\u542B\u7A7A\u767D\u5B57\u7B26\uFF1A${raw}`);
  if (/^file:\/\//i.test(url)) return { url, raw: trimmed, host: "other", hostName: "localhost" };
  const hostName = extractHostName(url);
  if (!hostName) throw new MarketError("BAD_REPO", `\u65E0\u6CD5\u89E3\u6790\u4ED3\u5E93\u4E3B\u673A\u540D\uFF1A${raw}`);
  return { url, raw: trimmed, host: classifyHost(hostName), hostName };
}
function resolveGitSource(source, repo) {
  if (repo !== void 0 && repo.trim() !== "") return parseRepoUrl(repo);
  return parseRepoUrl(source === "github" ? DEFAULT_GITHUB_REPO : DEFAULT_GITEE_REPO);
}

// src/install.ts
import { execFile } from "child_process";
import { cpSync, existsSync as existsSync2, mkdirSync as mkdirSync2, mkdtempSync, readFileSync as readFileSync2, rmSync } from "fs";
import { tmpdir } from "os";
import { isAbsolute as isAbsolute2, join as join2, resolve as resolve2 } from "path";
import { promisify } from "util";
var execFileAsync = promisify(execFile);
var defaultNpmExecutor = async (args, cwd) => {
  try {
    const { stdout, stderr } = await execFileAsync("npm", args, { cwd, timeout: 12e4 });
    return { stdout, stderr };
  } catch (err) {
    throw new MarketError("NPM_FAILED", err instanceof Error ? err.message : String(err));
  }
};
var defaultGitExecutor = async (args, cwd) => {
  try {
    const { stdout, stderr } = await execFileAsync("git", args, {
      cwd,
      timeout: 12e4,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }
    });
    return { stdout, stderr };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code = /ENOENT/i.test(message) ? "GIT_MISSING" : "CLONE_FAILED";
    throw new MarketError(code, message);
  }
};
var DETERMINISTIC = /* @__PURE__ */ new Set([
  "BAD_ARGUMENT",
  "BAD_PLUGIN_ID",
  "BAD_REPO",
  "NOT_FOUND",
  "VERSION_NOT_FOUND",
  "INVALID_PLUGIN",
  "ALREADY_EXISTS"
]);
function absPath2(p, cwd) {
  return isAbsolute2(p) ? p : resolve2(cwd, p);
}
function normalizeMeta(raw) {
  const kinds = (raw?.kinds ?? []).map((k) => typeof k === "string" ? k : k?.type);
  return {
    id: raw?.id,
    version: raw?.version,
    entry: raw?.entry ?? "dist/index.js",
    kinds,
    exportFormats: raw?.exportFormats ?? [],
    files: raw?.files
  };
}
function readPluginJson(dir) {
  const path = join2(dir, "plugin.json");
  if (!existsSync2(path)) {
    throw new MarketError("INVALID_PLUGIN", `\u63D2\u4EF6\u76EE\u5F55\u7F3A\u5C11 plugin.json\uFF1A${dir}`);
  }
  return normalizeMeta(JSON.parse(readFileSync2(path, "utf8")));
}
async function fetchLocal(options, id, cwd) {
  const repo = options.repo;
  if (!repo) throw new MarketError("BAD_REPO", "local \u6E90\u5FC5\u987B\u901A\u8FC7 --repo \u6307\u5B9A\u672C\u5730\u76EE\u5F55");
  const sourceDir = absPath2(repo, cwd);
  if (!existsSync2(join2(sourceDir, "marketplace.json"))) {
    throw new MarketError("NOT_FOUND", `\u76EE\u5F55\u4E0D\u662F\u6709\u6548\u7684\u5E02\u573A\u4ED3\u5E93\uFF1A${repo}`);
  }
  const entry = options.index.plugins.find((p) => p.id === id);
  if (!entry) throw new MarketError("NOT_FOUND", `\u7D22\u5F15\u4E2D\u4E0D\u5B58\u5728\u63D2\u4EF6\uFF1A${id}`);
  const dir = join2(sourceDir, entry.path);
  const meta = readPluginJson(dir);
  const version = options.version ?? entry.version;
  return { version, sourceDir: dir, meta };
}
async function fetchNpm(options, id, npmName, cwd, npmExecutor) {
  const view = await npmExecutor(["view", npmName, "versions", "--json"], cwd);
  let versions = [];
  try {
    versions = JSON.parse(view.stdout || "[]");
  } catch {
    throw new MarketError("NPM_FAILED", `\u89E3\u6790 npm versions \u8F93\u51FA\u5931\u8D25\uFF1A${npmName}`);
  }
  const version = resolveVersion("npm", versions, options.version);
  await npmExecutor(["install", `${npmName}@${version}`, "--no-audit", "--no-fund"], cwd);
  const pkgDir = join2(cwd, "node_modules", npmName);
  const pkgPath = join2(pkgDir, "package.json");
  if (!existsSync2(pkgPath)) {
    throw new MarketError("INVALID_PLUGIN", `npm \u5305\u7F3A\u5C11 package.json\uFF1A${npmName}`);
  }
  const raw = JSON.parse(readFileSync2(pkgPath, "utf8"));
  const meta = normalizeMeta(raw.wormPrint);
  if (!meta.id) throw new MarketError("INVALID_PLUGIN", `npm \u5305\u7F3A\u5C11 wormPrint \u5143\u6570\u636E\uFF1A${npmName}`);
  return { version, sourceDir: pkgDir, meta };
}
async function fetchGit(options, id, source, cwd, gitExecutor) {
  if (options.repo && existsSync2(absPath2(options.repo, cwd))) {
    return fetchLocal(options, id, cwd);
  }
  const repoSource = resolveGitSource(source, options.repo);
  const refs = await gitExecutor(["ls-remote", "--tags", "--refs", repoSource.url], cwd);
  const tags = refs.stdout.split("\n").map((line) => line.split("	")[1] ?? "").filter((ref) => ref.includes(`/plugins/${id}/v`));
  const fromHead = tags.length === 0 && options.version === void 0;
  const version = fromHead ? void 0 : resolveVersion(source, tags, options.version);
  const tag = version ? buildGitTag(id, version) : void 0;
  const tmp = mkdtempSync(join2(tmpdir(), `mp-git-${id}-`));
  const cleanup = () => rmSync(tmp, { recursive: true, force: true });
  try {
    await gitExecutor([
      "clone",
      "--depth",
      "1",
      "--filter=blob:none",
      "--sparse",
      ...tag ? ["--branch", tag.replace(/^refs\/tags\//, "")] : [],
      repoSource.url,
      tmp
    ], cwd);
    const entryPath = options.index.plugins.find((p) => p.id === id)?.path ?? `plugins/${id}`;
    await gitExecutor([
      "sparse-checkout",
      "set",
      "--no-cone",
      "marketplace/marketplace.json",
      `marketplace/${entryPath}`
    ], tmp);
    const sourceDir = join2(tmp, "marketplace", entryPath);
    const meta = readPluginJson(sourceDir);
    return { version: version ?? meta.version, sourceDir, meta, stable: !fromHead, cleanup };
  } catch (err) {
    cleanup();
    throw err;
  }
}
function copyFiles(sourceDir, target, meta) {
  const candidates = meta.files?.length ? meta.files : ["dist", "plugin.json"];
  for (const file of candidates) {
    const src = join2(sourceDir, file);
    if (existsSync2(src)) cpSync(src, join2(target, file), { recursive: true });
  }
}
async function installPlugin(options) {
  const cwd = options.cwd ?? process.cwd();
  const dir = options.dir ?? ".worm-print/plugins";
  const { id, npmName } = resolvePluginName(options.name, options.index);
  const target = absPath2(join2(dir, id), cwd);
  if (existsSync2(target) && !options.force) {
    throw new MarketError("ALREADY_EXISTS", `\u63D2\u4EF6\u5DF2\u5B58\u5728\uFF1A${id}\uFF08\u4F7F\u7528 --force \u8986\u76D6\uFF09`);
  }
  const npmExecutor = options.npmExecutor ?? defaultNpmExecutor;
  const gitExecutor = options.gitExecutor ?? defaultGitExecutor;
  const sources = options.source === "auto" ? ["npm", "github", "gitee"] : [options.source];
  let lastError;
  for (const source of sources) {
    let fetched;
    try {
      if (source === "local") fetched = await fetchLocal(options, id, cwd);
      else if (source === "npm") fetched = await fetchNpm(options, id, npmName, cwd, npmExecutor);
      else fetched = await fetchGit(options, id, source, cwd, gitExecutor);
      if (fetched.meta.id !== id) {
        throw new MarketError("INVALID_PLUGIN", `\u63D2\u4EF6 id \u4E0D\u4E00\u81F4\uFF1A\u671F\u671B ${id}\uFF0C\u5B9E\u9645 ${fetched.meta.id}`);
      }
      if (fetched.meta.version !== fetched.version) {
        throw new MarketError("INVALID_PLUGIN", `\u63D2\u4EF6\u7248\u672C\u4E0D\u4E00\u81F4\uFF1A\u671F\u671B ${fetched.version}\uFF0C\u5B9E\u9645 ${fetched.meta.version}`);
      }
      if (!existsSync2(join2(fetched.sourceDir, fetched.meta.entry))) {
        throw new MarketError("INVALID_PLUGIN", `\u63D2\u4EF6\u5165\u53E3\u6587\u4EF6\u4E0D\u5B58\u5728\uFF1A${fetched.meta.entry}`);
      }
      mkdirSync2(target, { recursive: true });
      copyFiles(fetched.sourceDir, target, fetched.meta);
      upsertManifestEntry(dir, id, {
        version: fetched.version,
        entry: fetched.meta.entry,
        kinds: fetched.meta.kinds,
        exportFormats: fetched.meta.exportFormats,
        npmName,
        source: source === "local" ? { mode: source, path: options.repo } : source === "npm" ? { mode: source } : {
          mode: source,
          repo: options.repo ?? void 0,
          tag: fetched.stable === false ? void 0 : buildGitTag(id, fetched.version)
        },
        stable: fetched.stable !== false,
        installedAt: (/* @__PURE__ */ new Date()).toISOString()
      }, cwd);
      return {
        id,
        version: fetched.version,
        target,
        source,
        stable: fetched.stable !== false,
        created: true
      };
    } catch (err) {
      if (err instanceof MarketError && DETERMINISTIC.has(err.code)) throw err;
      lastError = err;
    } finally {
      fetched?.cleanup?.();
    }
  }
  throw lastError ?? new MarketError("NOT_FOUND", `\u672A\u80FD\u4ECE\u4EFB\u4F55\u6765\u6E90\u5B89\u88C5\u63D2\u4EF6\uFF1A${id}`);
}
async function removePlugin(options) {
  const cwd = options.cwd ?? process.cwd();
  const dir = options.dir ?? ".worm-print/plugins";
  const { id } = resolvePluginName(options.name, { schemaVersion: 1, plugins: [] });
  const manifestPlugins = readManifest(dir, cwd).plugins;
  const entry = manifestPlugins[id];
  if (!entry) return;
  if (entry.source.mode === "npm") {
    try {
      await (options.npmExecutor ?? defaultNpmExecutor)(["uninstall", entry.npmName], cwd);
    } catch {
    }
  }
  rmSync(absPath2(join2(dir, id), cwd), { recursive: true, force: true });
  removeManifestEntry(dir, id, cwd);
}

// src/catalog.generated.ts
var BUNDLED_CATALOG = {
  "schemaVersion": 1,
  "plugins": [
    {
      "id": "echarts",
      "name": "\u767E\u5EA6\u56FE\u8868\u5143\u7D20",
      "description": "\u57FA\u4E8E ECharts \u7684\u5341\u7C7B\u6253\u5370\u56FE\u8868\u5143\u7D20\uFF0C\u6D4F\u89C8\u5668\u4E0E\u670D\u52A1\u7AEF\u540C\u6784\u51FA\u56FE\u3002\u56FE\u8868\u5E93\u5305 @worm-print-platform/echarts \u72EC\u7ACB\u53D1\u5E03\uFF0C\u672C\u63D2\u4EF6\u4EC5\u505A\u526F\u4F5C\u7528\u6CE8\u518C\u3002",
      "version": "1.0.0",
      "npmName": "@worm-print-platform/plugin-echarts",
      "path": "plugins/echarts",
      "entry": "dist/marketplace.js",
      "kinds": [
        "barChart",
        "barHChart",
        "lineChart",
        "areaChart",
        "pieChart",
        "doughnutChart",
        "scatterChart",
        "radarChart",
        "funnelChart",
        "gaugeChart"
      ],
      "exportFormats": [],
      "homepage": "https://github.com/worm-longliu/worm-print-platform/tree/master/marketplace/plugins/echarts",
      "license": "MIT",
      "minCoreVersion": "1.5.2"
    }
  ]
};

export {
  manifestPath,
  readManifest,
  writeManifest,
  upsertManifestEntry,
  removeManifestEntry,
  MarketError,
  parseSemver,
  extractVersion,
  isStableVersion,
  compareStable,
  latestStable,
  resolvePluginName,
  resolveVersion,
  buildGitTag,
  DEFAULT_GITHUB_REPO,
  DEFAULT_GITEE_REPO,
  parseRepoUrl,
  resolveGitSource,
  defaultNpmExecutor,
  defaultGitExecutor,
  installPlugin,
  removePlugin,
  BUNDLED_CATALOG
};
