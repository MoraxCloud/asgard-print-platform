// 极简语义化版本解析：本 CLI 零运行时依赖，不引入 semver 包。
// 正式版格式 major.minor.patch；带 - 后缀（rc/beta/alpha/…）视为预发布，默认不选用。

export interface ParsedSemver {
  major: number
  minor: number
  patch: number
  prerelease: string
}

export function parseSemver(raw: string): ParsedSemver | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(raw.trim())
  if (!m) return null
  return { major: +m[1], minor: +m[2], patch: +m[3], prerelease: m[4] ?? '' }
}

/** 从 git tag ref / 版本号中抽取纯版本号：refs/tags/plugins/x/v1.2.3 → 1.2.3 */
export function extractVersion(raw: string): string {
  const m = raw.match(/(?:^|\/)v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/)
  return m ? m[1] : raw.trim()
}

export function isStableVersion(raw: string): boolean {
  return parseSemver(extractVersion(raw))?.prerelease === ''
}

export function compareStable(a: string, b: string): number {
  const x = parseSemver(extractVersion(a))!
  const y = parseSemver(extractVersion(b))!
  return x.major - y.major || x.minor - y.minor || x.patch - y.patch
}

/** 取最高非预发布版本；全是预发布或无法解析时返回 null */
export function latestStable(versions: readonly string[]): string | null {
  const stable = versions.filter(isStableVersion)
  if (stable.length === 0) return null
  const max = [...stable].sort(compareStable).at(-1)
  return max ? extractVersion(max) : null
}
