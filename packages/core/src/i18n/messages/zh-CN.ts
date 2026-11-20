// 内置中文（源文本）语言包。新增键时须同步 en-US.ts 与 locale-keys.json。
import { shellZh } from './shell-zh.js'
import { exprZh } from './expr-zh.js'

export const zhCN = {
  'toolbar.save': '保存',
  'toolbar.preview': '预览',
  'diagnostic.expressionUnexpectedEnd': '表达式意外结束',

  // 表达式解析
  'diagnostic.parser.trailingContent': '表达式存在多余内容: {value}',
  'diagnostic.parser.expected': '位置 {pos}: 期望 "{value}"',
  'diagnostic.parser.memberName': '位置 {pos}: 成员访问需要属性名',
  'diagnostic.parser.invalidNumber': '非法数字: {value}',
  'diagnostic.parser.objectKey': '位置 {pos}: 对象键必须是标识符或字符串',
  'diagnostic.parser.unexpectedToken': '位置 {pos}: 意外的符号: {value}',

  // 词法
  'diagnostic.lexer.unterminatedString': '字符串未闭合',
  'diagnostic.lexer.keyword': '不允许使用关键字: {word}',
  'diagnostic.lexer.forbidden': '禁止访问: {word}',
  'diagnostic.lexer.noFunctionDef': '不允许函数定义',
  'diagnostic.lexer.noAssignment': '不允许赋值',
  'diagnostic.lexer.noMultipleStatements': '不允许多条语句',
  'diagnostic.lexer.invalidChar': '非法字符: {ch}',

  // 求值
  'diagnostic.evaluator.undefinedIdentifier': '未定义的标识符: {name}',
  'diagnostic.evaluator.unknownOperator': '未知运算符: {op}',
  'diagnostic.evaluator.unknownUnaryOperator': '未知一元运算符: {op}',
  'diagnostic.evaluator.nullProperty': '无法访问空值的属性',
  'diagnostic.evaluator.forbiddenProperty': '禁止访问属性: {property}',
  'diagnostic.evaluator.mathNotMethod': 'Math.{name} 不是方法',
  'diagnostic.evaluator.noMethodCall': '不支持方法调用，请使用顶级函数',
  'diagnostic.evaluator.notFunction': '{name} 不是函数',
  'diagnostic.evaluator.forbiddenCall': '不允许调用: {name}',

  // 模板解析
  'diagnostic.template.unclosedBrace': '位置 {pos}: 花括号未闭合',
  'diagnostic.template.emptyExpression': '位置 {pos}: 空表达式',

  // 分页与拼版
  'diagnostic.pagination.insufficientHeight': '页面可用高度不足: paper={paper}mm, margins={margins}mm, header={header}mm, footer={footer}mm',
  'diagnostic.pagination.repeatHeaderOverflow': '表格 {id} 的重复表头高度 ({repeat}mm) 超过页面可用高度 ({avail}mm)，请减少重复表头行',
  'diagnostic.tiling.continuousUnsupported': '连续纸不支持拼版打印，请将模板纸张改为固定纸张或关闭拼版',
  'diagnostic.tiling.sheetContinuous': '拼版目标纸张不能是连续纸',
  'diagnostic.tiling.sheetSizeInvalid': '拼版自定义纸张宽高必须是大于 0 的数值（mm）',
  'diagnostic.tiling.columnsInvalid': '拼版列数必须是大于 0 的整数',
  'diagnostic.tiling.rotationNote': '（内容旋转 {angle}°，每格 {width}×{height}mm）',
  'diagnostic.tiling.columnsExceedWidth': '拼版列数 {columns} 超出纸面可用宽度：{sheet}mm − 左右留白 {margin}mm = {avail}mm，最多可放 {max} 列；当前 {columns} 列 {label}mm 标签含间距需要 {need}mm{rotation}',
  'diagnostic.tiling.labelHeightExceed': '标签高度 {height}mm 超出纸面可用高度 {avail}mm，拼版每张 0 行；请缩小标签高度或改用横向纸{rotation}',

  // 多页模板
  'diagnostic.multiTemplate.emptyPages': '多页面模板至少需要一页',
  'diagnostic.multiTemplate.continuous': '多页面模板不支持连续纸（{page}）',
  'diagnostic.multiTemplate.tiling': '多页面模板不支持标签拼版（{page}）',
  'diagnostic.multiTemplate.paperMismatch': '多页面模板各页纸张尺寸必须一致（{page} {width}×{height}mm 与首页 {firstWidth}×{firstHeight}mm 不同）',
  'diagnostic.multiTemplate.emptyData': '多页面模板至少需要一份数据',
  'diagnostic.multiTemplate.pageLabelNamed': '第 {index} 页「{name}」',
  'diagnostic.multiTemplate.pageLabelPlain': '第 {index} 页',

  // 桌面客户端连接
  'client.cancelled': '连接已取消',
  'client.invalidToken': '配对 token 无效或来源未授权',
  'client.notRunning': '未发现运行中的打印客户端（已探测默认端口区间），请确认客户端已启动',
  'client.notConnected': '打印客户端未连接',
  'client.timeout': '请求 {type} 超时未响应',
  'client.closed': '连接已关闭',
  'client.disconnected': '与客户端的连接中断',
  'client.unregisteredHandler': '桌面端请求未注册处理器',
  'client.internalError': '内部错误',

  // 表格校验
  'table.atLeastTwoCells': '至少选择 2 个单元格',
  'table.crossRowTypes': '合并区域不能跨越不同类型的行',
  'table.dataVerticalMerge': '数据行将按列表展开，纵向合并请使用单元格属性「按值合并」',
  'table.partialOverlap': '选区与已有合并区域部分重叠',
  'table.lastRow': '不能删除最后一行',
  'table.lastColumn': '不能删除最后一列',
  'table.dataRowExists': '数据行已存在（第 {row} 行），全表最多一行',
  'table.headerContinuous': '标题行必须从表格顶部连续设置',
  'table.subtotalAfterData': '请先设置数据行，小计/汇总行必须位于数据行之后',
  'table.subtotalBeforeData': '小计/汇总行必须位于数据行之后',
  'table.subtotalBeforeSummary': '小计行必须位于汇总行之前',
  'table.summaryAfterSubtotal': '汇总行必须位于小计行之后',
  'table.headerBreak': '取消该标题行会导致标题行不连续，请先调整后续标题行',
  'table.defaultHeader': '列{index}',
  'table.borderHint': '线型 / 宽度 / 颜色是待应用规格：选中格已有的边框规格一致时会填进这三行；四边不一致的项显示「混合」，一条边都没有时显示「无 / 0」。改完点「全部 / 外侧 / 内部」或勾选上、下、左、右某条边才会写入选中的单元格；「无」是清除边框',
  'table.borderHintMulti': '多选时不回显单格边框：线型 / 宽度 / 颜色按当前设置作为批写规格，点「全部 / 外侧 / 内部」或勾选某条边后写入所有选中格；「无」是清除边框',
  'table.borderHintMixed': '当前单元格四边边框规格不一致：带「混合」的项不谎报，未改项在点「全部 / 外侧 / 内部」或勾选单边时按缺省档（实线 0.75pt）写入，改任一项即按该值批写',
  'diagnostic.pagination.overflowTop': '元素 {id} 旋转 {rot}° 后顶部超出页首 {amount}mm，打印将被裁切',
  'diagnostic.pagination.overflowRight': '元素 {id} 超出纸面右侧 {amount}mm，打印将被裁切',
  'diagnostic.pagination.overflowLeft': '元素 {id} 超出纸面左侧 {amount}mm，打印将被裁切',

  // 图片裁剪
  'crop.sampleNote': '图片还没设置，上面按内置示例图演示取位；换上真图后档位与可挪量按真图重算',
  'crop.verticalPosition': '垂直位置 (%)',
  'crop.horizontalPosition': '水平位置 (%)',
  'crop.scaleLabel': '放大比例 (%)',
  'crop.originalValue': '已保留模板里的原值；改动下面任一项就整体替换成新的取位',
  'crop.movableBoth': '水平可挪 {x}mm、垂直可挪 {y}mm：0 贴左／贴顶，100 贴右／贴底',
  'crop.movableX': '水平可挪 {x}mm；垂直这一轴已贴满，挪不动',
  'crop.movableY': '垂直可挪 {y}mm；水平这一轴已贴满，挪不动',
  'crop.noRoom': '这个缩放下图与框正好一样大，两轴都没有可挪的余量',
  'crop.top': '顶部',
  'crop.center': '居中',
  'crop.bottom': '底部',
  'crop.left': '左侧',
  'crop.right': '右侧',
  'crop.topLeft': '左上',
  'crop.topCenter': '上中',
  'crop.topRight': '右上',
  'crop.middleLeft': '左中',
  'crop.middleRight': '右中',
  'crop.bottomLeft': '左下',
  'crop.bottomCenter': '下中',
  'crop.bottomRight': '右下',
  'crop.fitContain': '包含（保持比例）',
  'crop.fitCover': '剪裁（等比铺满后裁边）',
  'crop.fitFill': '拉伸填满',
  'crop.fitNone': '原始尺寸',
  'crop.fitScaleDown': '缩小（保持比例）',

  // 设计器外壳
  'save.geometryWarningConfirm': '出纸提示：部分内容超出纸面，打印时会被裁切。\n是否接受裁切并继续保存？\n点击“确定”继续保存，点击“取消”返回修改。\n\n{warnings}',
  'store.tilingSinglePage': '开启拼版后只能有一个设计页面',

  // 打印数据校验（core / render / client 共用）
  'service.printData.emptyArray': '批量打印数据必须是非空对象数组',
  'service.printData.tooMany': '批量打印最多支持 {max} 份，当前 {count} 份',
  'service.printData.itemNotObject': '批量打印数据第 {index} 项必须是对象',
  'service.printData.notObjectOrArray': 'printData 必须是对象或数组',

  // canvas shell UI 文案（由 Task 7 语义化脚本派生）
  ...shellZh,

  // 表达式编辑器 UI 文案（由 Task 11 修复派生）
  ...exprZh,
}
