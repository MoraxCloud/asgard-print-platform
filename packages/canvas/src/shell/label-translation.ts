// 模块级常量（core 的纸张/密度/线型等）以中文 label 直接进 UI <option>，
// 这些常量在模块加载时求值、无法走 tr() 的语义键；此表按中文源文本给出英文，
// 仅在 locale 为 en-* 时替换，其它语言保持中文源。
const SOURCE_EN: Record<string, string> = {
  // 边框线型
  '无': 'None', '实线': 'Solid', '虚线': 'Dashed', '点线': 'Dotted', '双线': 'Double',
  // 纸张预设名与分组
  '全等分 241×279.4mm': 'Full sheet 241×279.4mm',
  '二等分 241×139.7mm': 'Half sheet 241×139.7mm',
  '三等分 241×93.1mm': 'Third sheet 241×93.1mm',
  '连续纸（自定义宽度）': 'Continuous paper (custom width)',
  '常用纸张': 'Common', '针式打印纸': 'Dot-matrix', '标签纸': 'Labels',
  '小票纸': 'Receipt', '连续纸': 'Continuous',
  // 水印密度
  '密（200×120）': 'Dense (200×120)', '中（默认）（260×180）': 'Medium (default) (260×180)',
  '疏（340×260）': 'Sparse (340×260)',
  '密': 'Dense', '中（默认）': 'Medium (default)', '中': 'Medium', '疏': 'Sparse',
  // core 注册表/能力描述符里以中文常量进 UI 的标签与说明
  '内容': 'Content',
  '线型 / 宽度 / 颜色即时生效，这三行显示的就是当前生效规格：已有边框时任改一行都会按新规格铺满四边并清掉单边覆盖；上、下、左、右只给选中的边加框，撤掉一边会把它其余三边落成单边；「无」清除边框，「内部」仅表格单元格可用':
    'Line style / width / color apply immediately; these three rows show the effective spec. With an existing border, changing any row fills all four sides and clears per-side overrides. Top / right / bottom / left add a border only to the selected side; removing one turns the other three into per-side borders. "None" clears the border; "Inside" is available for table cells only.',
  '线型 / 宽度 / 颜色是待应用规格：选中格已有的边框规格一致时会填进这三行；四边不一致的项显示「混合」，一条边都没有时显示「无 / 0」。改完点「全部 / 外侧 / 内部」或勾选上、下、左、右某条边才会写入选中的单元格；「无」是清除边框':
    'Line style / width / color are a pending spec: they are prefilled when the selected cells share one border spec. Mixed values show "Mixed"; no border shows "None / 0". Click All / Outside / Inside or tick a side (top / right / bottom / left) to write to the selected cells; "None" clears the border.',
  '多选时不回显单格边框：线型 / 宽度 / 颜色按当前设置作为批写规格，点「全部 / 外侧 / 内部」或勾选某条边后写入所有选中格；「无」是清除边框':
    'Multi-select does not show a single cell border: line style / width / color act as a batch spec. Click All / Outside / Inside or tick a side to apply to all selected cells; "None" clears the border.',
  '当前单元格四边边框规格不一致：带「混合」的项不谎报，未改项在点「全部 / 外侧 / 内部」或勾选单边时按缺省档（实线 0.75pt）写入，改任一项即按该值批写':
    'The four sides of this cell have different border specs: "Mixed" is shown instead of a false value. Untouched fields fall back to the default (Solid 0.75pt) when you click All / Outside / Inside or tick a side; changing any field writes that value to the batch.',
}

// 泰语映射：中文源文本 → 泰语（AI 直译），键与 SOURCE_EN 对齐
const SOURCE_TH: Record<string, string> = {
  '无': 'ไม่มี', '实线': 'เส้นทึบ', '虚线': 'เส้นประ', '点线': 'เส้นจุด', '双线': 'เส้นคู่',
  '全等分 241×279.4mm': 'แผ่นเต็ม 241×279.4mm',
  '二等分 241×139.7mm': 'แผ่นครึ่ง 241×139.7mm',
  '三等分 241×93.1mm': 'แผ่นหนึ่งในสาม 241×93.1mm',
  '连续纸（自定义宽度）': 'กระดาษต่อเนื่อง (ความกว้างกำหนดเอง)',
  '常用纸张': 'กระดาษทั่วไป', '针式打印纸': 'กระดาษดอทเมทริกซ์', '标签纸': 'ฉลาก',
  '小票纸': 'ใบเสร็จ', '连续纸': 'กระดาษต่อเนื่อง',
  '密（200×120）': 'หนาแน่น (200×120)', '中（默认）（260×180）': 'กลาง (ค่าเริ่มต้น) (260×180)',
  '疏（340×260）': 'ห่าง (340×260)',
  '密': 'หนาแน่น', '中（默认）': 'กลาง (ค่าเริ่มต้น)', '中': 'กลาง', '疏': 'ห่าง',
  '内容': 'เนื้อหา',
  '线型 / 宽度 / 颜色即时生效，这三行显示的就是当前生效规格：已有边框时任改一行都会按新规格铺满四边并清掉单边覆盖；上、下、左、右只给选中的边加框，撤掉一边会把它其余三边落成单边；「无」清除边框，「内部」仅表格单元格可用':
    'รูปแบบเส้น/ความกว้าง/สีมีผลทันที สามบรรทัดนี้แสดงผลที่มีผลอยู่: เมื่อมีเส้นขอบอยู่แล้ว การเปลี่ยนแถวใดจะเติมสี่ด้านและลบการเขียนทับรายด้าน; บน/ขวา/ล่าง/ซ้ายเพิ่มเส้นเฉพาะด้านที่เลือก การลบด้านหนึ่งจะทำให้สามด้านที่เหลือเป็นเส้นแยก; "ไม่มี" ลบเส้นขอบ "ด้านใน" ใช้สำหรับเซลล์ตารางเท่านั้น',
  '线型 / 宽度 / 颜色是待应用规格：选中格已有的边框规格一致时会填进这三行；四边不一致的项显示「混合」，一条边都没有时显示「无 / 0」。改完点「全部 / 外侧 / 内部」或勾选上、下、左、右某条边才会写入选中的单元格；「无」是清除边框':
    'รูปแบบเส้น/ความกว้าง/สีเป็นค่าที่รอใช้งาน: จะเติมในสามบรรทัดนี้เมื่อเซลล์ที่เลือกมีเส้นขอบสอดคล้องกัน; ค่าที่ไม่ตรงกันแสดง "ผสม" ไม่มีเส้นแสดง "ไม่มี / 0" แก้แล้วคลิก ทั้งหมด/ด้านนอก/ด้านใน หรือทำเครื่องหมายด้านใดด้านหนึ่งจึงเขียนลงเซลล์ที่เลือก; "ไม่มี" ลบเส้นขอบ',
  '多选时不回显单格边框：线型 / 宽度 / 颜色按当前设置作为批写规格，点「全部 / 外侧 / 内部」或勾选某条边后写入所有选中格；「无」是清除边框':
    'การเลือกหลายรายการไม่แสดงเส้นขอบของเซลล์เดี่ยว: รูปแบบเส้น/ความกว้าง/สีเป็นค่าเขียนเป็นชุด คลิก ทั้งหมด/ด้านนอก/ด้านใน หรือทำเครื่องหมายด้านใดด้านหนึ่งเพื่อเขียนทุกเซลล์ที่เลือก; "ไม่มี" ลบเส้นขอบ',
  '当前单元格四边边框规格不一致：带「混合」的项不谎报，未改项在点「全部 / 外侧 / 内部」或勾选单边时按缺省档（实线 0.75pt）写入，改任一项即按该值批写':
    'เส้นขอบสี่ด้านของเซลล์นี้ไม่สอดคล้องกัน: รายการ "ผสม" ไม่รายงานค่าผิด; รายการที่ไม่เปลี่ยนใช้ค่าเริ่มต้น (เส้นทึบ 0.75pt) เมื่อคลิก ทั้งหมด/ด้านนอก/ด้านใน หรือทำเครื่องหมายด้านเดียว; เปลี่ยนรายการใดจะเขียนค่านั้นเป็นชุด',
}

/** 把模块级常量的中文 label 按当前 locale 翻译（en-* 英文 / th-* 泰语，其余保持中文源） */
export function translateConstantLabel(label: string, locale: string): string {
  if (/^th([-_]|$)/i.test(locale)) return SOURCE_TH[label] ?? label
  if (/^en([-_]|$)/i.test(locale)) return SOURCE_EN[label] ?? label
  return label
}
