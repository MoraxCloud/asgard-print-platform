#!/usr/bin/env node
// 把 docs/guide/ 的索引页 + 章节文档同步到 GitHub / Gitee 的 Wiki。
// 用法：node scripts/sync-wiki.mjs [--dry-run]
//   --dry-run  只生成到临时目录并打印路径，不推送。
// 认证：GitHub 用 `gh auth token`；Gitee 用环境变量 GITEE_TOKEN，未设则用当前 git 凭据。

import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { resolve, relative, dirname, join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const GUIDE = join(ROOT, 'docs', 'guide')
const DRY = process.argv.includes('--dry-run')
const GH_RAW = 'https://github.com/worm-longliu/worm-print-platform'
const GH_WIKI = `${GH_RAW}.wiki.git`
const GT_WIKI = 'https://gitee.com/liulong_oschina/worm-print-platform.wiki.git'
const COMMIT = 'docs: 同步用户使用文档到 Wiki'

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts })
  if (r.status !== 0 && !opts.allowFail) {
    throw new Error(`${cmd} ${args.join(' ')} 失败: ${r.stderr?.trim() || r.stdout?.trim()}`)
  }
  return r
}

// 把 ](../xxx) / ](../../skills/...) 改写为 GitHub 主仓 blob 绝对链接。
// 页内 ./0X-*.md 与 ./README.md 保留（Wiki 内可跳转）。
function rewriteLinks(text, sourceFile) {
  const from = join(GUIDE, sourceFile)
  return text.replace(/\]\((\.\.?\/[^)#]+)(#[^)]*)?\)/g, (full, target, hash = '') => {
    if (!target.startsWith('../')) return full  // ./ 开头的页内链接保留
    const abs = resolve(dirname(from), target)
    const rel = relative(ROOT, abs).replace(/\\/g, '/')
    if (rel.startsWith('..')) return full       // 越出仓库根，保持原样
    return `](${GH_RAW}/blob/master/${rel}${hash})`
  })
}

function collect() {
  const files = readdirSync(GUIDE)
    .filter(f => f.endsWith('.md') && f !== 'AGENTS.md' && /^(README|\d{2}-)/.test(f))
    .sort()
  const pages = []
  for (const f of files) {
    const raw = readFileSync(join(GUIDE, f), 'utf8')
    pages.push({ name: f === 'README.md' ? 'Home.md' : f, text: rewriteLinks(raw, f) })
  }
  return pages
}

function materialize(dir, pages) {
  mkdirSync(dir, { recursive: true })
  for (const p of pages) writeFileSync(join(dir, p.name), p.text, 'utf8')
}

function pushWiki(url, dir, pages, authEnv) {
  const label = url.includes('github') ? 'GitHub' : 'Gitee'
  const tmp = join(tmpdir(), `wiki-${label.toLowerCase()}-${Date.now()}`)
  const cloned = spawnSync('git', ['clone', '--depth', '1', url, tmp], { encoding: 'utf8' })
  if (cloned.status !== 0) {
    mkdirSync(tmp, { recursive: true })
    run('git', ['init', '-q'], { cwd: tmp })
    run('git', ['remote', 'add', 'origin', url], { cwd: tmp })
  }
  // 清理旧内容（保留 .git）
  for (const f of readdirSync(tmp)) {
    if (f === '.git') continue
    const p = join(tmp, f)
    if (existsSync(p)) rmSync(p, { recursive: true, force: true })
  }
  materialize(tmp, pages)
  run('git', ['add', '-A'], { cwd: tmp })
  const diff = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: tmp })
  if (diff.status === 0) {
    console.log(`[${label}] 无变更，跳过提交`)
    rmSync(tmp, { recursive: true, force: true })
    return true
  }
  run('git', ['-c', 'user.name=worm', '-c', 'user.email=worm@users.noreply.github.com', 'commit', '-qm', COMMIT], { cwd: tmp })
  const pushed = run('git', ['push', '-q', 'origin', 'HEAD:master'], { cwd: tmp, env: { ...process.env, ...authEnv }, allowFail: true })
  if (pushed.status !== 0) {
    console.error(`[${label}] 推送失败: ${pushed.stderr?.trim()}`)
    rmSync(tmp, { recursive: true, force: true })
    return false
  }
  console.log(`[${label}] 推送成功`)
  rmSync(tmp, { recursive: true, force: true })
  return true
}

// GitHub 使用 git 已配置的 gh credential helper（credential.https://github.com.helper），
// 不注入自定义 header——bearer header 对 wiki push 无效，且会绕过 helper。
function githubAuth() {
  return {}
}

function giteeAuth() {
  const token = process.env.GITEE_TOKEN
  if (!token) return {}  // 回退当前 git 凭据
  const url = GT_WIKI.replace('https://', `https://oauth2:${token}@`)
  return { __url: url }
}

function main() {
  const pages = collect()
  console.log(`收集到 ${pages.length} 个页面: ${pages.map(p => p.name).join(', ')}`)

  if (DRY) {
    const dir = join(tmpdir(), `wiki-dryrun-${Date.now()}`)
    materialize(dir, pages)
    console.log(`[dry-run] 生成目录: ${dir}`)
    return
  }

  const ghEnv = githubAuth()
  const gt = giteeAuth()
  const okGh = pushWiki(GH_WIKI, ROOT, pages, ghEnv)
  const okGt = pushWiki(gt.__url || GT_WIKI, ROOT, pages, {})
  if (!okGh || !okGt) process.exitCode = 1
}

main()
