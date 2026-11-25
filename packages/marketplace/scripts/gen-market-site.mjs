// 由 marketplace.json 生成单文件静态目录页。零依赖，可发布到任意静态托管。
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')

function parseArgs(argv) {
  const opts = {
    input: resolve(repoRoot, 'marketplace/marketplace.json'),
    output: resolve(repoRoot, 'docs/market/index.html'),
    check: false,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--check') { opts.check = true; continue }
    if (arg === '--input' || arg === '--output') {
      const value = argv[++i]
      if (!value) throw new Error(`${arg} 缺少值`)
      opts[arg.slice(2)] = resolve(value)
      continue
    }
    throw new Error(`未知选项：${arg}`)
  }
  return opts
}

const escapeHtml = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const localize = (text, locale) => {
  if (text === undefined || text === null) return ''
  if (typeof text === 'string') return text
  const wanted = String(locale).toLowerCase()
  return text[wanted] ?? text[wanted.split('-')[0]] ?? text['zh-CN'] ?? ''
}

function render(index) {
  const data = index.plugins.map(p => ({
    uniqueId: p.uniqueId ?? p.id,
    type: p.type ?? (p.exportFormats?.length ? 'export' : p.kinds?.length ? 'element' : 'functional'),
    category: p.metadata?.category,
    labels: p.metadata?.labels ?? [],
    title: p.title ?? p.name,
    description: p.description ?? '',
    version: p.version,
    npmName: p.npmName,
    engine: p.engines?.core ?? p.minCoreVersion,
    sortKeys: p.metadata?.sortKeys ?? {},
  }))
  // 内嵌数据：转义 '<' 防止 </script> 注入
  const embedded = JSON.stringify({ title: index.title, metadata: index.metadata, plugins: data })
    .replace(/</g, '\\u003c')
  const indexUrl = 'marketplace/marketplace.json（仓库内置索引）'

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(localize(index.title, 'zh-CN') || '插件市场')}</title>
<style>
:root{--bg:#f6f7fb;--card:#fff;--text:#1f2430;--muted:#6b7280;--accent:#165dff;--border:#e5e7eb}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
header{max-width:1040px;margin:0 auto;padding:32px 20px 12px}h1{margin:0 0 6px;font-size:24px}p.sub{margin:0;color:var(--muted)}
.notice{max-width:1040px;margin:12px auto;padding:10px 14px;background:#fff7e6;border:1px solid #ffd591;border-radius:8px;color:#874d00;font-size:12px}
.toolbar{max-width:1040px;margin:16px auto;padding:0 20px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.toolbar select,.toolbar input{padding:7px 10px;border:1px solid var(--border);border-radius:6px;background:var(--card);font:inherit;color:inherit}
.toolbar input{flex:1;min-width:180px}
main{max-width:1040px;margin:0 auto;padding:8px 20px 48px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:8px}
.card h2{margin:0;font-size:16px}.badge{display:inline-block;padding:2px 8px;border-radius:999px;background:#eef2ff;color:var(--accent);font-size:12px;width:fit-content}
.card p{margin:0;color:var(--muted);font-size:13px}.meta{font-size:12px;color:var(--muted);margin-top:auto}
code{background:#f3f4f6;padding:1px 5px;border-radius:4px;font-size:12px}
</style>
</head>
<body>
<header><h1>${escapeHtml(localize(index.title, 'zh-CN') || '插件市场')}</h1>
<p class="sub"> worm-print-platform 插件索引 · 来源：${escapeHtml(indexUrl)}</p></header>
<div class="notice">索引为第三方内容：客户端只校验格式，不背书标题、作者与来源声明。安装前请核对来源。</div>
<div class="toolbar">
  <select data-market-filter="type" aria-label="类型"><option value="">全部类型</option><option value="element">元素插件</option><option value="functional">功能插件</option><option value="export">导出插件</option></select>
  <select data-market-filter="category" aria-label="分类"><option value="">全部分类</option></select>
  <input data-market-search type="search" placeholder="搜索插件名称、标识、描述…" aria-label="搜索">
</div>
<main id="market-list"></main>
<script id="market-data" type="application/json">${embedded}</script>
<script>
(function(){
  const data=JSON.parse(document.getElementById('market-data').textContent);
  const list=document.getElementById('market-list');
  const typeSel=document.querySelector('[data-market-filter="type"]');
  const catSel=document.querySelector('[data-market-filter="category"]');
  const search=document.querySelector('[data-market-search]');
  const loc=(text)=>{if(text==null)return'';if(typeof text==='string')return text;return text['zh-CN']||Object.values(text)[0]||''};
  const cats=[...new Set(data.plugins.map(p=>p.category).filter(Boolean))];
  for(const c of cats){const o=document.createElement('option');o.value=c;o.textContent=(data.metadata&&data.metadata.categories&&data.metadata.categories[c]&&loc(data.metadata.categories[c].title))||c;catSel.appendChild(o)}
  function render(){
    const q=(search.value||'').toLowerCase();
    const rows=data.plugins.filter(p=>(!typeSel.value||p.type===typeSel.value)&&(!catSel.value||p.category===catSel.value)&&(!q||JSON.stringify(p).toLowerCase().includes(q)));
    list.innerHTML=rows.map(p=>'<article class="card"><span class="badge">'+esc(p.type)+'</span><h2>'+esc(loc(p.title))+'</h2><p>'+esc(loc(p.description))+'</p><p class="meta"><code>'+esc(p.npmName)+'</code> · v'+esc(p.version)+(p.engine?' · core '+esc(p.engine):'')+'</p></article>').join('')||'<p>没有匹配的插件</p>';
  }
  function esc(s){return String(s==null?'':s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
  typeSel.addEventListener('change',render);catSel.addEventListener('change',render);search.addEventListener('input',render);render();
})();
</script>
</body>
</html>
`
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  const html = render(JSON.parse(readFileSync(opts.input, 'utf8')))
  if (opts.check) {
    const current = readFileSync(opts.output, 'utf8')
    if (current !== html) {
      console.error('静态目录页与索引不一致，请先运行 market:site')
      process.exit(1)
    }
    console.log('静态目录页无漂移')
    return
  }
  mkdirSync(dirname(opts.output), { recursive: true })
  writeFileSync(opts.output, html, 'utf8')
  console.log(`已生成 ${opts.output}`)
}

main()
