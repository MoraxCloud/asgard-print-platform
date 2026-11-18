import { MarketError, type RepoSource } from './types.js'

/** 默认主源与备用源，与 packages/skills 保持一致（同一本仓的两处托管） */
export const DEFAULT_GITHUB_REPO = 'https://github.com/worm-longliu/worm-print-platform.git'
export const DEFAULT_GITEE_REPO = 'https://gitee.com/liulong_oschina/worm-print-platform.git'

function classifyHost(hostName: string): RepoSource['host'] {
  const host = hostName.toLowerCase()
  if (host.includes('github')) return 'github'
  if (host.includes('gitee')) return 'gitee'
  return 'other'
}

function extractHostName(url: string): string | null {
  const match = url.match(/^(?:[a-z][a-z0-9+.-]*:\/\/)?(?:[^@/]+@)?([^/:]+)[/:]/i)
  return match ? match[1] : null
}

/** 解析并规范化仓库地址；拒绝空白与 `-` 开头，避免被 git 当作选项 */
export function parseRepoUrl(raw: string): RepoSource {
  const trimmed = raw.trim()
  if (!trimmed) throw new MarketError('BAD_REPO', '仓库地址不能为空')
  let url = trimmed
  if (/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(url)) {
    url = `https://github.com/${url}.git`
  }
  if (!/^(https?:\/\/|ssh:\/\/|git:\/\/|git@)/i.test(url)) {
    throw new MarketError('BAD_REPO', `不支持的仓库地址：${raw}`)
  }
  if (/[\s\r\n]/.test(url)) throw new MarketError('BAD_REPO', `仓库地址不能包含空白字符：${raw}`)
  const hostName = extractHostName(url)
  if (!hostName) throw new MarketError('BAD_REPO', `无法解析仓库主机名：${raw}`)
  return { url, raw: trimmed, host: classifyHost(hostName), hostName }
}

/** 按来源取仓库地址；显式 repo 优先 */
export function resolveGitSource(source: 'github' | 'gitee', repo?: string): RepoSource {
  if (repo !== undefined && repo.trim() !== '') return parseRepoUrl(repo)
  return parseRepoUrl(source === 'github' ? DEFAULT_GITHUB_REPO : DEFAULT_GITEE_REPO)
}
