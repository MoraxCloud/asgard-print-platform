/** 仓库源所属托管平台，仅用于错误提示与归类，不影响 git 克隆方式。 */
export type HostKind = 'github' | 'gitee' | 'other'

/** 规范化后的仓库源。 */
export interface RepoSource {
  /** 传给 git clone 的地址。 */
  url: string
  /** 用户原始输入，用于提示。 */
  raw: string
  host: HostKind
  hostName: string
}

/** git 子进程输出。 */
export interface GitResult {
  stdout: string
  stderr: string
}

/**
 * git 执行器。抽成可注入接口，使安装流程可在测试中不依赖真实 git 与网络。
 * args 以数组传入 execFile，不经 shell，杜绝命令注入。
 */
export type GitExecutor = (args: string[], cwd?: string) => Promise<GitResult>

export interface InstallOptions {
  /** 显式仓库地址；缺省时用默认 GitHub → Gitee 双源。 */
  repo?: string
  /** 技能根目录，技能装到 <dir>/<skill>/。默认 .agents/skills。 */
  dir?: string
  /** 目标已存在时是否覆盖。默认 false。 */
  force?: boolean
  /** 相对 dir 的解析基准，默认 process.cwd()。 */
  cwd?: string
  /** 自定义 git 执行器，测试用。 */
  executor?: GitExecutor
}

export interface InstallResult {
  skill: string
  /** 技能最终落地目录的绝对路径。 */
  target: string
  source: RepoSource
  /** true 表示新建，false 表示覆盖已有目录。 */
  created: boolean
}

export type SkillErrorCode =
  | 'BAD_ARGUMENT'
  | 'BAD_SKILL_NAME'
  | 'BAD_REPO'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'CLONE_FAILED'
  | 'GIT_MISSING'

/** 带稳定错误码的领域错误，CLI 据此映射退出码。 */
export class SkillError extends Error {
  constructor(
    public readonly code: SkillErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'SkillError'
  }
}
