import { SkillError, type HostKind, type RepoSource } from './types'

/** 默认主源：GitHub。 */
export const DEFAULT_GITHUB_REPO = 'https://github.com/worm-longliu/worm-print-platform.git'
/** 默认备用源：Gitee 镜像。 */
export const DEFAULT_GITEE_REPO = 'https://gitee.com/liulong_oschina/worm-print-platform.git'

function classifyHost(hostName: string): HostKind {
  const host = hostName.toLowerCase()
  if (host.includes('github')) return 'github'
  if (host.includes('gitee')) return 'gitee'
  return 'other'
}

/** 从 HTTPS / SSH / scp 风格地址中取出主机名。 */
function extractHostName(url: string): string | null {
  const match = url.match(/^(?:[a-z][a-z0-9+.-]*:\/\/)?(?:[^@/]+@)?([^/:]+)[/:]/i)
  return match ? match[1] : null
}

/**
 * 解析并规范化仓库地址。
 * 支持：https(s)://、ssh://、git://、git@host:path，以及 owner/repo 简写（按 GitHub 处理）。
 * 拒绝以 - 开头或含空白的地址，避免被 git 当作选项或产生歧义。
 */
export function parseRepoUrl(raw: string): RepoSource {
  const trimmed = raw.trim()
  if (!trimmed) throw new SkillError('BAD_REPO', '仓库地址不能为空')

  let url = trimmed
  if (/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(url)) {
    url = `https://github.com/${url}.git`
  }

  if (!/^(https?:\/\/|ssh:\/\/|git:\/\/|git@)/i.test(url)) {
    throw new SkillError(
      'BAD_REPO',
      `不支持的仓库地址：${raw}。支持 https/ssh/git 地址或 owner/repo 简写`,
    )
  }
  if (/[\s\r\n]/.test(url)) {
    throw new SkillError('BAD_REPO', `仓库地址不能包含空白字符：${raw}`)
  }

  const hostName = extractHostName(url)
  if (!hostName) throw new SkillError('BAD_REPO', `无法解析仓库主机名：${raw}`)

  return { url, raw: trimmed, host: classifyHost(hostName), hostName }
}

/**
 * 解析安装源列表。显式 --repo 时只用该源；否则默认 GitHub 优先、失败回退 Gitee。
 */
export function resolveSources(repo?: string): RepoSource[] {
  if (repo !== undefined && repo.trim() !== '') return [parseRepoUrl(repo)]
  return [parseRepoUrl(DEFAULT_GITHUB_REPO), parseRepoUrl(DEFAULT_GITEE_REPO)]
}
