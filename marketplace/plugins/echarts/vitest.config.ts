import { defineConfig } from 'vitest/config'

// 图表渲染器与执行器均走 echarts SSR，测试不依赖真实 DOM，统一 node 环境。
// /ui（plugin-kit 设计器 UI）子路径的测试需要 DOM：src/__tests__/ui.test.ts
// 单文件声明 happy-dom 环境（vitest 环境注释），无需整包切换。
export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/__tests__/*.test.ts'],
  },
})
