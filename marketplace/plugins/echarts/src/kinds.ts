// 十类图表元素的种类定义：面板字段、默认尺寸、AI 提示（notes）与渲染形态的唯一真源。
// 插件包内部使用，不进入 core；canvas 素材卡 label/icon 来自这里的每个 kind。
export type ChartFieldKey =
  | 'dataSource' | 'categoryField' | 'valueFields' | 'seriesField'
  | 'title' | 'legend' | 'palette' | 'stack' | 'bubble' | 'innerRadius' | 'gaugeRange'
  | 'padding' | 'radius' | 'label'

export type ChartSeriesType = 'bar' | 'line' | 'pie' | 'scatter' | 'radar' | 'funnel' | 'gauge'

export interface ChartKindDefinition {
  type: string
  label: string
  /** 语言包键（UI 展示时经 t() 解析） */
  labelKey: string
  /** lucide 图标名（canvas ElementIcon 解析） */
  icon: string
  seriesType: ChartSeriesType
  orientation?: 'vertical' | 'horizontal'
  fields: readonly ChartFieldKey[]
  requiredOptionKeys: readonly string[]
  notes: string
  /** 语言包键：AI 提示说明按实例语言取词 */
  notesKey: string
  defaultWidth: number
  defaultHeight: number
}

const BASE_REQUIRED = ['left', 'top', 'width', 'height', 'chartOption'] as const
const DATA_FIELDS: readonly ChartFieldKey[] = ['dataSource', 'categoryField', 'valueFields', 'seriesField']
const STYLE_FIELDS: readonly ChartFieldKey[] = ['title', 'legend', 'palette']

export const CHART_KIND_DEFINITIONS: readonly ChartKindDefinition[] = [
  {
    type: 'barChart', label: "柱状图", labelKey: 'echarts.kinds.k84', icon: 'ChartColumn', seriesType: 'bar', orientation: 'vertical',
    fields: [...DATA_FIELDS, ...STYLE_FIELDS, 'stack', 'label'], requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 100, defaultHeight: 60,
    notes: "柱状图：类目 + 多个数值字段，每字段一个 series；series[].data 写 $data 占位；固定高，禁止 autoHeight",
    notesKey: 'echarts.notes.k146',
  },
  {
    type: 'barHChart', label: "条形图", labelKey: 'echarts.kinds.k86', icon: 'ChartBar', seriesType: 'bar', orientation: 'horizontal',
    fields: [...DATA_FIELDS, ...STYLE_FIELDS, 'stack', 'label'], requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 100, defaultHeight: 60,
    notes: "横向条形图：xAxis 为数值、yAxis 为类目；类目写 yAxis.data 的 $data 占位",
    notesKey: 'echarts.notes.k147',
  },
  {
    type: 'lineChart', label: "折线图", labelKey: 'echarts.kinds.k88', icon: 'ChartLine', seriesType: 'line',
    fields: [...DATA_FIELDS, ...STYLE_FIELDS, 'stack', 'label'], requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 100, defaultHeight: 60,
    notes: "折线图：类目 + 多个数值字段；不写 areaStyle",
    notesKey: 'echarts.notes.k148',
  },
  {
    type: 'areaChart', label: "面积图", labelKey: 'echarts.kinds.k90', icon: 'ChartArea', seriesType: 'line',
    fields: [...DATA_FIELDS, ...STYLE_FIELDS, 'stack', 'label'], requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 100, defaultHeight: 60,
    notes: "面积图：折线 + series[].areaStyle；其余同折线图",
    notesKey: 'echarts.notes.k149',
  },
  {
    type: 'pieChart', label: "饼图", labelKey: 'echarts.kinds.k92', icon: 'ChartPie', seriesType: 'pie',
    fields: ['dataSource', 'categoryField', 'valueFields', ...STYLE_FIELDS, 'label'], requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 60, defaultHeight: 60,
    notes: "饼图：类目 + 首个数值字段生成 { name, value }；只需一个数值字段",
    notesKey: 'echarts.notes.k150',
  },
  {
    type: 'doughnutChart', label: "环形图", labelKey: 'echarts.kinds.k94', icon: 'Donut', seriesType: 'pie',
    fields: ['dataSource', 'categoryField', 'valueFields', ...STYLE_FIELDS, 'innerRadius', 'label'], requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 60, defaultHeight: 60,
    notes: "环形图：饼图 + radius:[内径,外径]；内径由面板配置",
    notesKey: 'echarts.notes.k151',
  },
  {
    type: 'scatterChart', label: "散点图", labelKey: 'echarts.kinds.k96', icon: 'ChartScatter', seriesType: 'scatter',
    fields: ['dataSource', 'categoryField', 'valueFields', ...STYLE_FIELDS, 'bubble', 'label'], requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 80, defaultHeight: 60,
    notes: "散点图：类目字段作 x、首个数值字段作 y；chartBubble 开启时用第二个数值字段作点大小",
    notesKey: 'echarts.notes.k152',
  },
  {
    type: 'radarChart', label: "雷达图", labelKey: 'echarts.kinds.k98', icon: 'Radar', seriesType: 'radar',
    fields: ['dataSource', 'categoryField', 'valueFields', ...STYLE_FIELDS, 'radius', 'label'], requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 70, defaultHeight: 60,
    notes: "雷达图：每个数值字段是一个维度（radar.indicator），每行数据是一个系列（类目字段作系列名）；半径由面板写 radar.radius（%，默认 75）",
    notesKey: 'echarts.notes.k153',
  },
  {
    type: 'funnelChart', label: "漏斗图", labelKey: 'echarts.kinds.k100', icon: 'Funnel', seriesType: 'funnel',
    fields: ['dataSource', 'categoryField', 'valueFields', ...STYLE_FIELDS, 'padding', 'label'], requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 60, defaultHeight: 60,
    notes: "漏斗图：类目 + 首个数值字段，按数值降序；四边内边距由面板写 series.left/right/top/bottom（%，右侧需留外置标签空间）",
    notesKey: 'echarts.notes.k154',
  },
  {
    type: 'gaugeChart', label: "仪表盘", labelKey: 'echarts.kinds.k102', icon: 'Gauge', seriesType: 'gauge',
    fields: ['dataSource', 'valueFields', ...STYLE_FIELDS, 'gaugeRange', 'label'], requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 60, defaultHeight: 60,
    notes: "仪表盘：取首行数据的首个数值字段作指针值；min/max 由面板写入 series[0].min/max",
    notesKey: 'echarts.notes.k155',
  },
]

export const CHART_KINDS: readonly string[] = CHART_KIND_DEFINITIONS.map(def => def.type)

export function getChartKindDefinition(type: string): ChartKindDefinition | undefined {
  return CHART_KIND_DEFINITIONS.find(def => def.type === type)
}

/** 面板字段裁剪：一份共享面板按此渲染控件（纯函数，便于单测与 AI 元数据复用） */
export function resolveChartPanelFields(type: string): readonly ChartFieldKey[] {
  return getChartKindDefinition(type)?.fields ?? []
}
