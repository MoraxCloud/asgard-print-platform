import { createApp } from 'vue'
import { registerAll } from '@worm-print-platform/canvas'
// 图表插件从市场安装后的副作用入口：import 即注册（core 插件描述符 + plugin-kit 设计器 UI）。
// 产物位于 .worm-print/plugins/echarts/dist/index.js（由 worm-print-marketplace 安装），
// 薄包装内部再 import 独立发布的 @worm-print-platform/echarts，图表库本身不被复制。
import '../.worm-print/plugins/echarts/dist/index.js'
import App from './App.vue'

// 一次性注册 <print-designer>：不自动污染全局，宿主按需调用
registerAll()

// SFC 的编译期配置见 vite.config.js 的 @vitejs/plugin-vue → template.compilerOptions.isCustomElement
// （runtime-only 构建下 app.config.compilerOptions 不生效，只在用运行时编译器的宿主里才需要那条）
createApp(App).mount('#app')
