/** 一个包的语言资源集合，用于生成骨架与校验。 */
export interface LocalePackage {
  /** 插件 id / core */
  id: string
  /** 基准语言（zh-CN） */
  base: string
  /** locale → { 命名空间 → 扁平键值 } */
  locales: Map<string, Record<string, Record<string, string>>>
  /** 来源路径，用于告警 */
  origin: string
}
