// 市场安装入口：import 即注册十类图表插件描述符与设计器 UI。
// 兼容包 @worm-print-platform/echarts 的根入口仍是 src/index.ts（只注册描述符，不注册 UI），
// 保证 render / client 等纯 Node 宿主行为不变；市场口径统一从本入口安装。
import './index'
import './ui'
