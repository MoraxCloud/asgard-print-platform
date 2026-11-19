import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@worm-print-platform/echarts/ui'
import './styles/index.css'
import App from './App.vue'
import router from './router'

// 开发环境启动 MSW，模拟 /sys/print/*；生产构建不引入 mock 代码
if (import.meta.env.DEV) {
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

createApp(App).use(router).use(ElementPlus).mount('#app')
