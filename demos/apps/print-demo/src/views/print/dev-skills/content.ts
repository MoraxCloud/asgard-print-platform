/** 可转发的通用开发技能：正文沿用整理好的文案，保留原始链接与各技能原有小标题 */
export interface SkillLink {
  label: string
  url: string
}

export interface SkillRow {
  /** 沿用原文小标题：定位 / 核心玩法|核心机制|核心做法 / 适用场景|适合谁 */
  label: string
  /** 原文正文，用 ** 包裹需要强调的片段 */
  text: string
}

export interface DevSkill {
  name: string
  rows: SkillRow[]
  links: SkillLink[]
}

export const DEV_SKILLS: DevSkill[] = [
  {
    name: 'mattpocock/grill-me',
    rows: [
      {
        label: '定位',
        text: '一个“反过来拷问你”的方案压力测试技能。它本身不写代码，也不直接产出最终方案，而是扮演一个**无情的访谈者**，围绕你的计划、架构或决策，沿着设计树的每一个分支逐层追问，直到双方对方案达成真正的共识。',
      },
      {
        label: '核心玩法',
        text: '一次只问一个问题，按依赖顺序推进；每个问题都会附带 AI 的推荐答案或当前假设，你只需要接受、否定或修正。如果问题可以通过代码库或文档查证，它会先去查，而不是把可查的问题丢回给你。',
      },
      {
        label: '安装方式',
        text: '运行 **npx skills@latest add mattpocock/skills -a opencode**（其他代理把 opencode 换成 cursor / devin / windsurf / amp / pi，省略 -a 可交互选择）。当安装器询问要装哪些技能时，**必须同时勾选 grill-me 和 grilling**：grill-me 只负责接收你的显式调用，真正的访谈逻辑在 grilling，只装其中一个将无法工作。',
      },
      {
        label: '适用场景',
        text: '产品方案、架构设计、计划决策的早期阶段，尤其是你“有一个模糊想法，但还没想清楚哪里会出问题”的时候。也可以泛化到日常决策（如学习路线、设备选型等）。',
      },
    ],
    links: [
      { label: 'grill-me SKILL.md', url: 'https://raw.githubusercontent.com/mattpocock/skills/main/skills/productivity/grill-me/SKILL.md' },
      { label: 'grilling SKILL.md（被引用的技能）', url: 'https://raw.githubusercontent.com/mattpocock/skills/main/skills/productivity/grilling/SKILL.md' },
      { label: 'skills.sh', url: 'https://skills.sh/mattpocock/skills' },
    ],
  },
  {
    name: 'obra/superpowers',
    rows: [
      {
        label: '定位',
        text: '目前社区影响力最大的 **AI 编程代理软件开发方法论**之一。它不只是一个“技能”，而是一套完整的可安装工作流框架，把作者团队在实践中沉淀的工程流程拆成一组可组合、可版本化的 skills，让编码代理在写代码之前就先走完**规格澄清 → 设计评审 → 实施计划 → 子代理执行与审查**的流程。',
      },
      {
        label: '核心机制',
        text: '在支持的 harness（如 Claude Code、Cursor、Codex 等）中，相关技能会**自动触发**。代理不会一上来就写代码，而是先逼出规格说明，再生成一份强调 **TDD（红/绿）、YAGNI、DRY** 的实施计划，最后以子代理驱动的方式逐任务执行并审查，代理可以在一段时间内自主推进而不偏离计划。',
      },
      {
        label: '适合谁',
        text: '希望把 AI 编码从“一次性 demo”升级为**可重复、有纪律的工程流程**的开发者或团队。',
      },
    ],
    links: [
      { label: 'GitHub', url: 'https://github.com/obra/superpowers' },
    ],
  },
  {
    name: '@anthropics/frontend-design',
    rows: [
      {
        label: '定位',
        text: 'Anthropic 官方出品的前端**视觉设计技能**，核心目标是解决 AI 生成前端页面“千篇一律”的问题——默认审美往往是 Inter 字体 + 紫色渐变 + 统一圆角卡片。它强制代理在**写代码之前**先确定一套明确的设计方向（如 brutalist、editorial 等），再带着设计意识去实现。',
      },
      {
        label: '核心做法',
        text: '先产出 token 级的设计计划（色彩、字体角色、布局概念等），对照“AI 默认审美 tell”进行修订，强调**单点 bold、其余克制**，同时守住响应式、键盘焦点、reduced-motion 等可访问性底线。技能通常会在支持的编码代理中自动激活，把设计决策推到编码之前。',
      },
      {
        label: '适合谁',
        text: '想让 AI 生成的前端页面“不那么像 AI 做的”——包括首页、展示页、小型产品页或工具单页——但不需要完整前端工程化流程的场景。',
      },
    ],
    links: [
      { label: 'ModelScope', url: 'https://www.modelscope.cn/skills/@anthropics/frontend-design' },
      { label: 'GitHub', url: 'https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design/skills/frontend-design' },
    ],
  },
]
