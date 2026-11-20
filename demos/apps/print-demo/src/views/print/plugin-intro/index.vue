<template>
  <div class="page-container">
    <div class="page-head">
      <h1>插件介绍</h1>
      <span class="page-head__hint">安装官方技能，再让 AI 按规范完成接入</span>
    </div>

    <!-- 技能区域：三个官方工具的安装命令 -->
    <el-card shadow="never" class="skills-card">
      <template #header>
        <div class="skills-card__head">
          <span>官方技能</span>
          <span class="skills-card__hint">先安装技能，再让 AI 读规范接入</span>
        </div>
      </template>
      <div class="tools">
        <div v-for="tool in TOOLS" :key="tool.name" class="tool">
          <div class="tool__info">
            <b>{{ tool.name }}</b>
            <small>{{ tool.desc }}</small>
          </div>
          <div class="tool__cmd">
            <code>{{ tool.command }}</code>
            <el-button size="small" @click="copyTool(tool)">复制命令</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 分模块提示词：每个 tab 独立复制 -->
    <el-card shadow="never" class="prompt-card">
      <template #header>
        <div class="prompt-card__head">
          <span>分模块提示词</span>
          <span class="prompt-card__hint">按模块复制给 AI 编程工具</span>
        </div>
      </template>
      <el-tabs v-model="activeModule" type="card">
        <el-tab-pane v-for="mod in MODULES" :key="mod.id" :label="mod.label" :name="mod.id">
          <div class="module-body">
            <div class="module-body__head">
              <span class="module-body__label">{{ mod.label }} · 提示词</span>
              <el-button size="small" @click="copyModule(mod)">复制本模块</el-button>
            </div>
            <pre class="prompt-block">{{ mod.prompt }}</pre>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { TOOLS, MODULES, type InstallTool, type PromptModule } from './content'

const activeModule = ref(MODULES[0].id)

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // 权限被拒时降级到 execCommand
    }
  }
  // 非安全上下文降级：临时 textarea + execCommand
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    if (!document.execCommand('copy')) throw new Error('copy failed')
  } finally {
    document.body.removeChild(textarea)
  }
}

async function copyText(text: string, successMessage: string) {
  if (!text) return
  try {
    await writeClipboard(text)
    ElMessage.success(successMessage)
  } catch {
    ElMessage.error('复制失败，请手动选择文本复制')
  }
}

function copyModule(mod: PromptModule) {
  void copyText(mod.prompt, `已复制「${mod.label}」提示词`)
}

function copyTool(tool: InstallTool) {
  void copyText(tool.command, `已复制「${tool.name}」安装命令`)
}
</script>

<style scoped lang="scss">
.page-container {
  display: flex;
  height: 100%;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.page-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-shrink: 0;

  h1 {
    margin: 0;
    font-size: 18px;
  }

  &__hint {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.skills-card,
.prompt-card {
  flex-shrink: 0;
}

.tools {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tool {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;

  &__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;

    b {
      font-size: 13px;
    }

    small {
      color: var(--el-text-color-secondary);
      font-size: 11px;
    }
  }

  &__cmd {
    display: flex;
    align-items: center;
    gap: 8px;

    code {
      padding: 4px 8px;
      border-radius: 4px;
      background: var(--el-fill-color-lighter);
      font-family: 'SFMono-Regular', Consolas, monospace;
      font-size: 12px;
    }
  }
}

.skills-card__head,
.prompt-card__head {
  display: flex;
  align-items: baseline;
  gap: 12px;

  & > span:first-child {
    font-weight: 600;
  }

  .skills-card__hint,
  .prompt-card__hint {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-weight: 400;
  }
}

.module-body {
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  &__label {
    font-weight: 600;
  }
}

.prompt-block {
  margin: 0;
  padding: 12px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-regular);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
