#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const tags = []
const requireTags = process.argv.includes('--require-tags')

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (err) {
    errors.push(`无法读取 ${relative(root, path)}：${err.message}`)
    return undefined
  }
}

function git(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

function isTrackedFile(path) {
  const rel = relative(root, path)
  const inHead = git(['ls-tree', '-r', '--name-only', 'HEAD', '--', rel]).length > 0
  const staged = git(['diff', '--cached', '--name-only', '--diff-filter=ACM', '--', rel]).length > 0
  const deleted = git(['diff', '--cached', '--name-only', '--diff-filter=D', '--', rel]).length > 0
  return !deleted && (inHead || staged)
}

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return listFiles(path)
    return entry.isFile() ? [path] : []
  })
}

function isTracked(path) {
  if (!existsSync(path)) return false
  if (!statSync(path).isDirectory()) return isTrackedFile(path)
  const files = listFiles(path)
  return files.length > 0 && files.every(isTrackedFile)
}

function requireTrackedFile(path, label) {
  if (!existsSync(path)) {
    errors.push(`${label}不存在：${relative(root, path)}`)
    return
  }
  if (!isTracked(path)) errors.push(`${label}未纳入 Git：${relative(root, path)}`)
}

const indexPath = join(root, 'marketplace/marketplace.json')
const index = readJson(indexPath)
if (!index || !Array.isArray(index.plugins)) {
  errors.push('marketplace/marketplace.json 缺少 plugins 数组')
} else {
  for (const entry of index.plugins) {
    const pluginDir = join(root, 'marketplace', entry.path)
    const plugin = readJson(join(pluginDir, 'plugin.json'))
    const pkg = readJson(join(pluginDir, 'package.json'))
    if (!plugin || !pkg) continue

    for (const field of ['id', 'version', 'entry', 'npmName']) {
      if (entry[field] !== plugin[field]) {
        errors.push(`${entry.id} 的 marketplace.json.${field} 与 plugin.json.${field} 不一致`)
      }
    }
    for (const field of ['id', 'version', 'entry']) {
      if (pkg.wormPrint?.[field] !== plugin[field]) {
        errors.push(`${entry.id} 的 package.json.wormPrint.${field} 与 plugin.json.${field} 不一致`)
      }
    }

    const files = plugin.files ?? []
    if (!files.length) errors.push(`${entry.id} 未声明 plugin.json.files`)
    for (const file of files) {
      const path = join(pluginDir, file)
      if (!existsSync(path)) errors.push(`${entry.id} 白名单文件不存在：${file}`)
      else if (!isTracked(path)) errors.push(`${entry.id} 白名单文件未纳入 Git：${file}`)
    }
    requireTrackedFile(join(pluginDir, plugin.entry), `${entry.id} 市场入口`)

    if (entry.id === 'data-preview') {
      for (const file of ['index.js', 'ui.js', 'describe.js', 'types.js']) {
        requireTrackedFile(join(pluginDir, 'dist', file), `data-preview 运行依赖`)
      }
    }
    if (entry.id === 'echarts') {
      requireTrackedFile(join(pluginDir, 'dist/marketplace.js'), 'echarts 市场入口')
      for (const locale of ['zh-CN', 'en-US', 'th-TH']) {
        requireTrackedFile(join(pluginDir, 'dist/i18n', `${locale}.json`), 'echarts 语言资源')
      }
    }
    tags.push(`plugins/${entry.id}/v${plugin.version}`)
  }
}

if (requireTags) {
  const head = git(['rev-parse', 'HEAD'])
  for (const tag of tags) {
    const commit = git(['rev-list', '-n', '1', tag])
    if (!commit) errors.push(`缺少插件标签：${tag}`)
    else if (commit !== head) errors.push(`插件标签未指向当前发布提交：${tag}`)
  }
}

if (errors.length) {
  console.error('官方插件发布门禁未通过：')
  for (const error of errors) console.error(`- ${error}`)
  process.exitCode = 1
} else {
  console.log(`官方插件发布门禁通过，共 ${tags.length} 个插件。`)
  for (const tag of tags) console.log(`- ${tag}`)
}
