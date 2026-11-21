// 语言包一键验证：假定已 build（verify:i18n:full 会先 build + test + bundle）。
// 逐项打印 ✓/✗，任一失败退出码 1。
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cli = join(root, 'packages/i18n/dist/cli.js')
const failures = []

const check = (name, fn) => {
  try { fn(); console.log(`✓ ${name}`) }
  catch (err) { console.error(`✗ ${name}: ${err.message}`); failures.push(name) }
}
const runCli = (args) => execFileSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' })
const expectExit = (args, code) => {
  try { runCli(args) } catch (err) { if (err.status === code) return }
  throw new Error(`期望退出码 ${code}：${args.join(' ')}`)
}

check('构建产物齐全', () => {
  for (const file of [
    'packages/core/dist/i18n/zh-CN.json',
    'packages/core/dist/i18n/en-US.json',
    'packages/core/dist/i18n/th-TH.json',
    'marketplace/plugins/echarts/dist/i18n/zh-CN.json',
    'packages/echarts/dist/i18n/zh-CN.json',
    'dist/i18n/resources.json',
  ]) if (!existsSync(join(root, file))) throw new Error(`缺少 ${file}`)
})

const dir = mkdtempSync(join(tmpdir(), 'verify-i18n-'))
const templateFile = join(dir, 'template.json')
runCli(['template', '-o', templateFile])
const template = JSON.parse(readFileSync(templateFile, 'utf8'))
const fixture = JSON.parse(readFileSync(join(root, 'fixtures/i18n/fr-FR.json'), 'utf8'))
const pack = { ...template, ...fixture }
const packFile = join(dir, 'fr-FR.json')
writeFileSync(packFile, JSON.stringify(pack, null, 2) + '\n')

check('template 覆盖四类键', () => {
  for (const key of Object.keys(fixture)) if (!(key in template)) throw new Error(`template 缺少 ${key}`)
})
check('合法包 validate 通过', () => { runCli(['validate', packFile, '--strict']) })
check('缺键被拦截', () => {
  const bad = { ...pack }; delete bad['toolbar.save']
  writeFileSync(join(dir, 'missing.json'), JSON.stringify(bad)); expectExit(['validate', join(dir, 'missing.json')], 1)
})
check('多余键 --strict 被拦截', () => {
  const bad = { ...pack, 'extra.key': 'x' }
  writeFileSync(join(dir, 'extra.json'), JSON.stringify(bad)); expectExit(['validate', '--strict', join(dir, 'extra.json')], 1)
})
check('空值被拦截', () => {
  const bad = { ...pack, 'toolbar.save': '' }
  writeFileSync(join(dir, 'empty.json'), JSON.stringify(bad)); expectExit(['validate', join(dir, 'empty.json')], 1)
})
check('占位符丢失被拦截', () => {
  const bad = { ...pack, 'diagnostic.parser.expected': 'Position attendue' }
  writeFileSync(join(dir, 'placeholder.json'), JSON.stringify(bad)); expectExit(['validate', join(dir, 'placeholder.json')], 1)
})
check('嵌套/_meta 被拦截', () => {
  const bad = { ...pack, nested: { a: 'b' } }
  writeFileSync(join(dir, 'nested.json'), JSON.stringify(bad)); expectExit(['validate', join(dir, 'nested.json')], 1)
  const meta = { ...pack, _meta: { x: 1 } }
  writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta)); expectExit(['validate', join(dir, 'meta.json')], 1)
})
check('bundle 结构含五个命名空间', () => {
  const bundle = JSON.parse(readFileSync(join(root, 'dist/i18n/resources.json'), 'utf8'))
  for (const ns of ['core', 'help', 'constants', 'propertyTips', 'echarts']) {
    if (!bundle['zh-CN']?.[ns]) throw new Error(`resources.json 缺少 zh-CN.${ns}`)
  }
})

// 示例目录里被跟踪的插件副本必须与源码构建一致，否则会重演「中英混杂 / 裸 key」的旧包问题。
check('示例图表插件副本与源码构建一致', () => {
  const pairs = [
    ['marketplace/plugins/echarts/dist/marketplace.js', 'demos/apps/vue3/.worm-print/plugins/echarts/dist/marketplace.js'],
    ['marketplace/plugins/echarts/README.md', 'demos/apps/vue3/.worm-print/plugins/echarts/README.md'],
    ['marketplace/plugins/echarts/plugin.json', 'demos/apps/vue3/.worm-print/plugins/echarts/plugin.json'],
    ['marketplace/plugins/echarts/LICENSE', 'demos/apps/vue3/.worm-print/plugins/echarts/LICENSE'],
  ]
  for (const [src, dst] of pairs) {
    if (!readFileSync(join(root, src)).equals(readFileSync(join(root, dst)))) {
      throw new Error(`${dst} 与源码构建不一致，请运行 npm --prefix demos/apps/vue3 run sync-plugin`)
    }
  }
})

const suites = [
  ['@worm-print-platform/core', 'src/i18n/__tests__/namespaces.spec.ts'],
  ['@worm-print-platform/core', 'src/i18n/__tests__/engine.spec.ts'],
  ['@worm-print-platform/canvas', 'src/shell/__tests__/i18n-shell.spec.ts'],
  ['@worm-print-platform/canvas', 'src/__tests__/messages-isolation.spec.ts'],
  ['@worm-print-platform/render', 'src/i18n.test.ts'],
  ['@worm-print-platform/client', 'src/main/locale-pack.test.ts'],
  ['@worm-print-platform/marketplace', 'src/install.test.ts'],
  ['@worm-print-platform/i18n', ''],
]
for (const [pkg, file] of suites) {
  check(`${pkg} ${file || '全部'}`, () => {
    execFileSync('npm', ['test', '-w', pkg, '--', '--run', ...(file ? [file] : [])], { cwd: root, stdio: 'inherit' })
  })
}

if (failures.length) { console.error(`\n验证失败：${failures.length} 项`); process.exit(1) }
console.log('\n语言包验证全部通过')
