// web/src/components/print/utils/default-config.ts
import type { TemplateData } from '../types.js'

/** 纸张下拉分组语义 id（显示文案在 constants.paper.group.* 资源里） */
export type PaperGroupId = 'common' | 'dotMatrix' | 'labels' | 'receipt' | 'continuous'

/** 标签纸分组 id：该组纸型默认取消页眉、页脚与页边距 */
export const LABEL_PAPER_GROUP: PaperGroupId = 'labels'

export interface PaperPreset {
  width: number
  height: number
  /** 连续纸（热敏卷纸/小票纸）：出纸高度按内容推导，纸宽可用 customWidth 覆盖 */
  continuous?: boolean
  /** 设计器下拉显示名语义键（constants 命名空间） */
  labelKey: string
  /** 设计器下拉分组语义 id */
  group: PaperGroupId
}

/** 纸张预设（mm）；顺序即设计器下拉顺序，与 render 层 PAPER_DIMENSIONS 数值保持一致 */
export const PAPER_PRESETS: Record<string, PaperPreset> = {
  A4:     { width: 210, height: 297, labelKey: 'constants.paper.A4.label',     group: 'common' },
  A3:     { width: 297, height: 420, labelKey: 'constants.paper.A3.label',     group: 'common' },
  A5:     { width: 148, height: 210, labelKey: 'constants.paper.A5.label',     group: 'common' },
  Letter: { width: 216, height: 279, labelKey: 'constants.paper.Letter.label', group: 'common' },
  Legal:  { width: 216, height: 356, labelKey: 'constants.paper.Legal.label',  group: 'common' },
  // 针式打印纸（241 系列等分）：11 英寸整张 279.4mm 按等分取整
  DOT_FULL:  { width: 241, height: 279.4, labelKey: 'constants.paper.DOT_FULL.label',  group: 'dotMatrix' },
  DOT_HALF:  { width: 241, height: 139.7, labelKey: 'constants.paper.DOT_HALF.label',  group: 'dotMatrix' },
  DOT_THIRD: { width: 241, height: 93.1,  labelKey: 'constants.paper.DOT_THIRD.label', group: 'dotMatrix' },
  // 标签纸
  LABEL_80X60: { width: 80, height: 60, labelKey: 'constants.paper.LABEL_80X60.label', group: LABEL_PAPER_GROUP },
  LABEL_60X40: { width: 60, height: 40, labelKey: 'constants.paper.LABEL_60X40.label', group: LABEL_PAPER_GROUP },
  LABEL_40X30: { width: 40, height: 30, labelKey: 'constants.paper.LABEL_40X30.label', group: LABEL_PAPER_GROUP },
  // 小票纸（热敏卷纸）：高度仅为设计画布高度，出纸按内容推导
  THERMAL_57:  { width: 57,  height: 297, continuous: true, labelKey: 'constants.paper.THERMAL_57.label',  group: 'receipt' },
  THERMAL_80:  { width: 80,  height: 297, continuous: true, labelKey: 'constants.paper.THERMAL_80.label',  group: 'receipt' },
  THERMAL_110: { width: 110, height: 297, continuous: true, labelKey: 'constants.paper.THERMAL_110.label', group: 'receipt' },
  // 连续纸：默认 80mm 热敏；高度仅为设计画布高度，出纸按内容推导
  CONTINUOUS: { width: 80, height: 297, continuous: true, labelKey: 'constants.paper.CONTINUOUS.label', group: 'continuous' },
}

/** 纸型是否连续纸（小票纸/热敏卷纸）：出纸高度按渲染内容推导 */
export function isContinuousPaperSize(paperSize: string | undefined): boolean {
  return !!paperSize && PAPER_PRESETS[paperSize]?.continuous === true
}

/** 纸型是否标签纸：整张纸即一张标签，默认不留页边距、不占页眉页脚 */
export function isLabelPaperSize(paperSize: string | undefined): boolean {
  return !!paperSize && PAPER_PRESETS[paperSize]?.group === LABEL_PAPER_GROUP
}

/**
 * 标签纸的默认版面：四边页边距归零、页眉页脚高度归零（整张纸都给内容区）。
 * 页眉页脚里的元素保留，之后把高度改回即可恢复——切换纸型不应静默删掉用户内容。
 * 只在「切到标签纸」时套用一次，用户随后仍可自行调整。
 */
export function labelPaperDefaults(
  t: Pick<TemplateData, 'header' | 'footer'>,
): Pick<TemplateData, 'margins' | 'header' | 'footer'> {
  return {
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
    header: { ...t.header, height: 0 },
    footer: { ...t.footer, height: 0 },
  }
}

/**
 * 获取纸张原始宽高（mm，未应用方向）
 * CUSTOM 时读取 customWidth/customHeight，缺省回退 A4；
 * 连续纸时宽度取 customWidth（缺省取预设纸宽），高度取 customHeight（缺省 297，仅设计画布），方向强制纵向。
 */
export function getPaperDimensions(t: Pick<TemplateData, 'paperSize' | 'orientation' | 'customWidth' | 'customHeight'>): { width: number; height: number } {
  const continuous = isContinuousPaperSize(t.paperSize)
  let base: { width: number; height: number }
  if (t.paperSize === 'CUSTOM' || continuous) {
    const preset = PAPER_PRESETS[t.paperSize]
    base = {
      width: t.customWidth ?? preset?.width ?? 210,
      height: t.customHeight ?? preset?.height ?? 297,
    }
  } else {
    const preset = PAPER_PRESETS[t.paperSize] || PAPER_PRESETS['A4']!
    // 只取宽高：预设还带 labelKey/group 等下拉元数据，不能泄漏进几何结果
    base = { width: preset.width, height: preset.height }
  }
  return t.orientation === 'landscape' && !continuous
    ? { width: base.height, height: base.width }
    : base
}
