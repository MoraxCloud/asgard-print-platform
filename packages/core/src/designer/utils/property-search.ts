import { translate } from '../../i18n/index.js'
import { BARCODE_BAR_HEIGHT_MODULES, BARCODE_QUIET_ZONE_MODULES, BARCODE_TEXT_FONT_SIZE_MODULES, QR_DEFAULT_QUIET_MODULES } from '../../render/barcode-dot.js'
import { CROP_SCALE_MIN } from '../../render/crop-style.js'
import { DEFAULT_SHRINK_MIN_FONT_SIZE_PT } from '../../render/text-fit.js'

/** 属性面板搜索注册表：分组 → 表单项 → 关键词 */
export interface PropertyItem {
  key: string
  keywords: string[]
  /** 字段说明文案的语义键（propertyTips.<属性 key>）：挂在标签后的帮助图标上，中文文案只在资源 JSON 中存一份 */
  tipKey?: string
  /** 「恢复默认值」提示语里的数值。**仅用于生成文案，重置行为不读它**——
   *  落点一律派生自该元素类型的出厂值（createDefaultOptions / WATERMARK_DEFAULTS / TILE_DEFAULTS）。
   *  必须引用渲染端既有常量，不得重抄字面量：漂移最多说错数字，不会做错动作。 */
  default?: number | string
  /** 提示语单位，如 模块 / mm / pt */
  defaultUnit?: string
}

export interface PropertyGroupDef {
  group: string
  groupLabel: string
  items: PropertyItem[]
}

export const PROPERTY_REGISTRY: PropertyGroupDef[] = [
  {
    group: 'position-size',
    groupLabel: '位置与尺寸',
    items: [
      { key: 'ps-left', keywords: ['X', '横坐标', 'left', '位置'] },
      { key: 'ps-top', keywords: ['Y', '纵坐标', 'top', '位置'] },
      { key: 'ps-width', keywords: ['W', '宽度', 'width', '尺寸'] },
      { key: 'ps-height', keywords: ['H', '高度', 'height', '尺寸'] },
      { key: 'ps-margin-top', keywords: ['上外边距', '外边距', 'margintop'], default: 0, defaultUnit: 'mm' },
      { key: 'ps-margin-right', keywords: ['右外边距', '外边距', 'marginright'], default: 0, defaultUnit: 'mm' },
      { key: 'ps-margin-bottom', keywords: ['下外边距', '外边距', 'marginbottom'], default: 0, defaultUnit: 'mm' },
      { key: 'ps-margin-left', keywords: ['左外边距', '外边距', 'marginleft'], default: 0, defaultUnit: 'mm' },
    ],
  },
  {
    group: 'appearance',
    groupLabel: '外观',
    items: [
      { key: 'ap-font-family', keywords: ['字体', '字体名', '字体族', 'fontfamily'] },
      { key: 'ap-font-size', keywords: ['字体大小', 'fontsize', '字号'] },
      { key: 'ap-font-weight', keywords: ['字体粗细', '粗体', 'bold'] },
      { key: 'ap-align', keywords: ['对齐', 'align'] },
      { key: 'ap-vertical-align', keywords: ['垂直对齐', 'verticalalign', '顶对齐', '底对齐'] },
      { key: 'ap-color', keywords: ['颜色', 'color'] },
      { key: 'ap-bg-color', keywords: ['背景色', 'background'] },
      { key: 'ap-line-height', keywords: ['行高', 'lineheight'] },
      { key: 'ap-letter-spacing', keywords: ['字间距', 'letterspacing'] },
      { key: 'ap-text-fit', keywords: ['溢出', '溢出显示', '截断', '自动缩小', '自适应行高', 'textfit', 'overflow'] },
      { key: 'ap-shrink-min', keywords: ['最小字号', '缩放下限', 'shrinkminfontsize'], default: DEFAULT_SHRINK_MIN_FONT_SIZE_PT, defaultUnit: 'pt' },
      { key: 'ap-word-wrap', keywords: ['自动换行', '不换行', 'wordwrap'] },
      { key: 'ap-keep-line-breaks', keywords: ['保留换行符', '换行符', '手动换行', '保留空格', '连续空格', '行首空格', 'keeplinebreaks'] },
      {
        key: 'ap-long-text-indent',
        keywords: ['首行缩进', '缩进', 'indent', 'longtextindent', '两字符', '段首'],
        tipKey: 'propertyTips.ap-long-text-indent',
      },
      {
        key: 'ap-img-fit',
        keywords: ['缩放模式', '拉伸', '等比', 'fit', 'contain', 'cover', '填充', '裁剪', '剪裁', '锚点'],
        tipKey: 'propertyTips.ap-img-fit',
      },
      {
        key: 'ap-img-object-position',
        keywords: ['裁剪锚点', '剪裁锚点', '锚点', 'objectposition', 'object-position', '对齐点', '上移', '头顶'],
        tipKey: 'propertyTips.ap-img-object-position',
      },
      {
        key: 'ap-img-fit-scale',
        keywords: ['放大比例', '剪裁放大', '放大倍数', '取景', '裁切范围', 'fitscale', 'zoom'],
        default: CROP_SCALE_MIN, defaultUnit: '%',
        tipKey: 'propertyTips.ap-img-fit-scale',
      },
      {
        key: 'ap-rotate',
        keywords: ['旋转', '角度', 'rotate', 'angle', '顺时针', '逆时针', '90度', '直角'],
        tipKey: 'propertyTips.ap-rotate',
      },
    ],
  },
  {
    group: 'flow-list',
    groupLabel: '流式列表',
    items: [
      {
        key: 'fl-columns',
        keywords: ['每行列数', '列数', '栏数', '几列', 'flowcolumns'],
        tipKey: 'propertyTips.fl-columns',
      },
      {
        key: 'fl-row-height',
        keywords: ['行高', '每行高度', '单元高度', 'flowrowheight'],
        tipKey: 'propertyTips.fl-row-height',
      },
      {
        key: 'fl-gap-x',
        keywords: ['单元间距', '横向间距', '格间距', '列间距', 'flowgapx'],
        tipKey: 'propertyTips.fl-gap-x',
      },
      {
        key: 'fl-auto-span',
        keywords: ['自适应', '跨列', '内容过长', '占两列', '自动换行', 'flowsautspan', 'flowautospan'],
        tipKey: 'propertyTips.fl-auto-span',
      },
      {
        key: 'fl-max-span',
        keywords: ['最多跨几列', '跨列上限', 'flowmaxspan'],
        tipKey: 'propertyTips.fl-max-span',
      },
      {
        key: 'fl-layout-mode',
        default: 'fixed',
        keywords: ['布局模式', '容器模式', '固定高度', '动态分页', '自动高度', 'flowlayoutmode'],
        tipKey: 'propertyTips.fl-layout-mode',
      },
      {
        key: 'fl-padding-top',
        keywords: ['上内边距', '内边距', '顶边距', 'flowpaddingtop'],
        default: 0, defaultUnit: 'mm',
        tipKey: 'propertyTips.fl-padding-top',
      },
      {
        key: 'fl-padding-right',
        keywords: ['右内边距', '内边距', '右边距', 'flowpaddingright'],
        default: 0, defaultUnit: 'mm',
        tipKey: 'propertyTips.fl-padding-right',
      },
      {
        key: 'fl-padding-bottom',
        keywords: ['下内边距', '内边距', '底边距', 'flowpaddingbottom'],
        default: 0, defaultUnit: 'mm',
        tipKey: 'propertyTips.fl-padding-bottom',
      },
      {
        key: 'fl-padding-left',
        keywords: ['左内边距', '内边距', '左边距', 'flowpaddingleft'],
        default: 0, defaultUnit: 'mm',
        tipKey: 'propertyTips.fl-padding-left',
      },
    ],
  },
  {
    group: 'code',
    groupLabel: '条码设置',
    items: [
      { key: 'cd-type', keywords: ['码制', '条码类型', '条形码类型', 'barcodetype', 'code128', 'ean13', 'code39', 'itf14'] },
      { key: 'cd-dpi', keywords: ['打印机分辨率', 'dpi', '打印点', '点阵对齐', '203', '300'] },
      { key: 'cd-bar-width', keywords: ['条宽', '条粗细', 'barwidth', '模块宽'] },
      {
        key: 'cd-bar-quiet-zone',
        keywords: ['条码静区', '条码白边', '条形码留白', '条码空白边', 'barquietzone'],
        default: BARCODE_QUIET_ZONE_MODULES, defaultUnit: '模块',
        tipKey: 'propertyTips.cd-bar-quiet-zone',
      },
      {
        key: 'cd-bar-height',
        keywords: ['条高', '条码高度', '条区高度', '条码多高', 'barheight'],
        default: BARCODE_BAR_HEIGHT_MODULES, defaultUnit: '模块',
        tipKey: 'propertyTips.cd-bar-height',
      },
      { key: 'cd-show-text', keywords: ['显示文本', '条码文本', '显示数字'] },
      { key: 'cd-font-size', keywords: ['条码字号', '文本字号'], default: BARCODE_TEXT_FONT_SIZE_MODULES, defaultUnit: '模块' },
      { key: 'cd-ec-level', keywords: ['纠错级别', '容错', 'qrcodelevel'] },
      {
        key: 'cd-quiet-zone',
        keywords: ['静区', '静区宽度', '白边', '空白边', '留白', '铺满', 'quietzone'],
        default: QR_DEFAULT_QUIET_MODULES, defaultUnit: '模块',
        tipKey: 'propertyTips.cd-quiet-zone',
      },
      { key: 'cd-fit', keywords: ['缩放模式', '拉伸', '等比', 'fit', 'contain', 'cover'] },
      { key: 'cd-max-width', keywords: ['最大宽度', '最大宽', 'maxwidth'] },
      { key: 'cd-max-height', keywords: ['最大高度', '最大高', 'maxheight'] },
    ],
  },
  {
    group: 'content',
    groupLabel: '内容',
    items: [
      { key: 'ct-title', keywords: ['内容', '文本', 'title'] },
      { key: 'ct-formatter', keywords: ['格式化', '表达式', 'formatter'] },
      { key: 'ct-table-mode', keywords: ['数据模式', '静态布局', '动态数据'] },
      { key: 'ct-table-source', keywords: ['数据源', '列表字段'] },
      { key: 'ct-table-font', keywords: ['默认字号', '默认颜色', '默认内边距'] },
      { key: 'ct-table-cols', keywords: ['列宽', '表格列'] },
    ],
  },
  {
    group: 'border-bg',
    groupLabel: '边框与背景',
    items: [
      { key: 'bb-border-style', keywords: ['线型', '边框线型', '实线', '虚线', '点线', '双线', 'borderstyle'] },
      { key: 'bb-border-width', keywords: ['边框宽度', 'border'] },
      { key: 'bb-border-color', keywords: ['边框颜色'] },
      { key: 'bb-bg-color', keywords: ['背景色', 'background'] },
    ],
  },
  {
    group: 'binding',
    groupLabel: '字段绑定',
    items: [
      { key: 'bd-formatter', keywords: ['格式化', '表达式', 'formatter', 'fx', '字段', '绑定', 'field'] },
      { key: 'bd-content', keywords: ['内容', '表达式', '文本', '变量'] },
    ],
  },
  {
    group: 'pagination',
    groupLabel: '分页',
    items: [
      { key: 'pg-enabled', keywords: ['分页', 'pagination', '启用分页'] },
      { key: 'pg-pageable', keywords: ['参与分页', 'pageable'] },
      { key: 'pg-keep-with-next', keywords: ['同页', 'keepWithNext'] },
    ],
  },
  {
    group: 'advanced',
    groupLabel: '高级',
    items: [
      { key: 'ad-locked', keywords: ['锁定', 'lock'] },
      { key: 'ad-fixed', keywords: ['每页重复', 'repeat'] },
      { key: 'ad-fixed-position', keywords: ['固定', '每页固定', 'fixed'] },
      { key: 'ad-z-index', keywords: ['层级', 'zindex'] },
      { key: 'ad-delete', keywords: ['删除'] },
    ],
  },
  // 扩展元素的属性搜索项由插件描述符的 propertyTab.searchKeywords 提供，
  // 主体只保留内置属性分组（P4 起不再登记任何具体扩展类型）。
]

/** 按表单项 key 取中文说明文案（兼容导出）：文案真源在 propertyTips 资源，这里固定以 zh-CN 取词 */
export function propertyTip(key: string): string {
  for (const group of PROPERTY_REGISTRY) {
    const hit = group.items.find(item => item.key === key)
    if (hit?.tipKey) return translate('zh-CN', hit.tipKey)
  }
  return ''
}

/** 正向包含匹配：任一关键词包含搜索词即命中；空搜索恒命中 */

export function matchKeywords(search: string, keywords: string[]): boolean {
  const s = search.trim().toLowerCase()
  if (!s) {
    return true
  }
  return keywords.some(k => k.toLowerCase().includes(s))
}

/** 计算命中的分组与表单项 key 集合 */
export function searchProperties(search: string): { groups: string[]; itemKeys: Set<string> } {
  const groups: string[] = []
  const itemKeys = new Set<string>()
  for (const g of PROPERTY_REGISTRY) {
    const matched = g.items.filter(item => matchKeywords(search, [...item.keywords, g.groupLabel]))
    if (matched.length > 0) {
      groups.push(g.group)
      for (const item of matched) {
        itemKeys.add(item.key)
      }
    }
  }
  return { groups, itemKeys }
}

/** 「恢复默认值」提示语取数：只读注册表的纯提示字段，重置行为不经过这里 */
export function propertyDefault(key: string): { value: number | string; unit?: string } | undefined {
  for (const g of PROPERTY_REGISTRY) {
    for (const item of g.items) {
      if (item.key === key && item.default !== undefined) return { value: item.default, unit: item.defaultUnit }
    }
  }
  return undefined
}
