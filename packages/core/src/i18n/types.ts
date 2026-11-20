/** 插件语言包类型：键必须以插件 id 为前缀，编译期强制 */
export type PluginLocaleMessages<Id extends string> = {
  [K in `${Id}.${string}`]: string
}
