<template>
  <div class="demo-layout">
    <aside class="demo-layout__sidebar">
      <div class="demo-layout__brand">打印模板管理</div>
      <div class="demo-layout__menu">
        <RouterLink to="/print/plugin-intro">插件介绍</RouterLink>
        <RouterLink to="/print/dev-skills">开发技能</RouterLink>
        <RouterLink to="/print/template">模板管理</RouterLink>
        <RouterLink to="/print/health-report">体检报告</RouterLink>
        <RouterLink to="/print/silent-config">静默打印配置</RouterLink>
      </div>
      <div class="demo-layout__host-links">
        <div class="demo-layout__group-title">示例互跳</div>
        <a v-for="link in HOST_LINKS" :key="link.key" :href="link.href">{{ link.label }}</a>
      </div>
    </aside>
    <div class="demo-layout__main">
      <header class="demo-layout__header">
        <span>打印平台接入示例</span>
      </header>
      <main class="demo-layout__content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

/** 示例互跳：本地用 localhost:93xx，Pages 用 /worm-print-platform/canvas/xxx/，口径与其余四个 demo 一致 */
const _isLocalhost = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(window.location.host)
const _hostBase = _isLocalhost ? '' : '/worm-print-platform'
const HOST_LINKS = _isLocalhost
  ? [
      { key: 'vue3', label: 'Vue3 宿主', href: 'http://localhost:9331/' },
      { key: 'vue2', label: 'Vue2 宿主', href: 'http://localhost:9332/' },
      { key: 'react', label: 'React 宿主', href: 'http://localhost:9335/' },
      { key: 'jquery', label: 'jQuery 宿主', href: 'http://localhost:9334/' },
    ]
  : [
      { key: 'vue3', label: 'Vue3 宿主', href: `${_hostBase}/canvas/vue3/` },
      { key: 'vue2', label: 'Vue2 宿主', href: `${_hostBase}/canvas/vue2/` },
      { key: 'react', label: 'React 宿主', href: `${_hostBase}/canvas/react/` },
      { key: 'jquery', label: 'jQuery 宿主', href: `${_hostBase}/canvas/jquery/` },
    ]
</script>

<style scoped lang="scss">
.demo-layout {
  display: flex;
  height: 100vh;
  min-height: 400px;

  &__sidebar {
    display: flex;
    flex-direction: column;
    width: 200px;
    flex-shrink: 0;
    background: var(--el-color-primary-dark-2, #1d2b4f);
    color: #fff;
  }

  &__brand {
    height: 56px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 1px solid rgb(255 255 255 / 12%);
  }

  &__menu {
    padding: 12px;

    a {
      display: block;
      padding: 10px 12px;
      border-radius: 4px;
      color: rgb(255 255 255 / 85%);
      text-decoration: none;

      &:hover,
      &.router-link-active {
        background: rgb(255 255 255 / 14%);
        color: #fff;
      }
    }
  }

  &__host-links {
    padding: 12px;
    border-top: 1px solid rgb(255 255 255 / 12%);

    a {
      display: block;
      padding: 8px 12px;
      border-radius: 4px;
      color: rgb(255 255 255 / 85%);
      text-decoration: none;

      &:hover {
        background: rgb(255 255 255 / 14%);
        color: #fff;
      }
    }
  }

  &__group-title {
    padding: 4px 12px 8px;
    color: rgb(255 255 255 / 55%);
    font-size: 12px;
  }

  &__main {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
  }

  &__header {
    height: 56px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
  }

  &__content {
    flex: 1;
    min-height: 0;
    overflow: auto;
    background: var(--el-bg-color-page);
  }
}
</style>
