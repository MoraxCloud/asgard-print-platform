/** locale 感知格式化，供诊断文案与表达式 FORMAT 复用 */
export function formatNumber(
  value: number,
  locale?: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

export function formatDate(value: Date | number | string, locale?: string): string {
  return new Intl.DateTimeFormat(locale).format(new Date(value))
}
