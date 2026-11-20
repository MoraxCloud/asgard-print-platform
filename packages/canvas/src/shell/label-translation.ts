// 模块级常量（core 的纸张/密度/线型等）以中文 label 直接进 UI <option>，
// 这些常量在模块加载时求值、无法走 tr() 的语义键；此表按中文源文本给出英文，
// 仅在 locale 为 en-* 时替换，其它语言保持中文源。
const SOURCE_EN: Record<string, string> = {
  // 边框线型
  '无': 'None', '实线': 'Solid', '虚线': 'Dashed', '点线': 'Dotted', '双线': 'Double',
  // 纸张预设名与分组
  '全等分 241×279.4mm': 'Full sheet 241×279.4mm',
  '二等分 241×139.7mm': 'Half sheet 241×139.7mm',
  '三等分 241×93.1mm': 'Third sheet 241×93.1mm',
  '连续纸（自定义宽度）': 'Continuous paper (custom width)',
  '常用纸张': 'Common', '针式打印纸': 'Dot-matrix', '标签纸': 'Labels',
  '小票纸': 'Receipt', '连续纸': 'Continuous',
  // 水印密度
  '密（200×120）': 'Dense (200×120)', '中（默认）（260×180）': 'Medium (default) (260×180)',
  '疏（340×260）': 'Sparse (340×260)',
  '密': 'Dense', '中（默认）': 'Medium (default)', '中': 'Medium', '疏': 'Sparse',
}

/** 把模块级常量的中文 label 按当前 locale 翻译为英文（en-* 才替换） */
export function translateConstantLabel(label: string, locale: string): string {
  if (!/^en([-_]|$)/i.test(locale)) return label
  return SOURCE_EN[label] ?? label
}
