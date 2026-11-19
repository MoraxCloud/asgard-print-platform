<template>
  <div class="page-container">
    <div class="page-head">
      <h1>开发技能</h1>
      <span class="page-head__hint">给协作者与正在学 AI 开发的读者：三把可直接转发的工具</span>
    </div>

    <el-card
      v-for="(skill, index) in DEV_SKILLS"
      :key="skill.name"
      shadow="never"
      class="skill-card"
    >
      <template #header>
        <div class="skill-card__head">
          <span class="skill-card__index">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="skill-card__name">{{ skill.name }}</span>
        </div>
      </template>

      <div class="skill-card__body">
        <div v-for="row in skill.rows" :key="row.label" class="skill-row">
          <b class="skill-row__label">{{ row.label }}</b>
          <div class="skill-row__text"><RichText :text="row.text" /></div>
        </div>
        <div class="skill-row">
          <b class="skill-row__label">原始链接</b>
          <div class="skill-row__links">
            <a
              v-for="link in skill.links"
              :key="link.url"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ link.label }} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { DEV_SKILLS } from './content'

/** 把原文里的 **强调** 渲染成 <strong>，不引入 v-html */
const RichText = (props: { text: string }) => {
  const parts = props.text.split('**')
  return h('span', parts.map((part, i) => (i % 2 ? h('strong', part) : part)))
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

.skill-card {
  flex-shrink: 0;

  &__head {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  &__index {
    color: var(--el-color-primary);
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-size: 12px;
    font-weight: 700;
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.skill-row {
  display: grid;
  grid-template-columns: 76px 1fr;
  gap: 12px;
  align-items: baseline;

  &__label {
    font-size: 13px;
  }

  &__text {
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 1.75;

    strong {
      color: var(--el-text-color-primary);
    }
  }

  &__links {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;

    a {
      color: var(--el-color-primary);
      font-size: 13px;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

@media (max-width: 640px) {
  .skill-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
