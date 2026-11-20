/**
 * 打印平台 demos/apps/vue3 官方示例模板的本地副本。
 * 抽取来源：demos/apps/vue3/src/templates.js 的 SAMPLES；抽取日期：2026-11-19。
 * 运行时不依赖打印平台仓库；不要手工修改本文件内容。
 */
import type { PrintBusinessField, TemplateData, MultiPageTemplateData } from '@worm-print-platform/canvas/vue3'

export interface OfficialSample {
  id: string
  name: string
  fields: PrintBusinessField[]
  data: Record<string, unknown>
  template: TemplateData | MultiPageTemplateData
}

export const OFFICIAL_SAMPLES: Record<string, OfficialSample> = {
  "express": {
    "id": "express-waybill",
    "name": "快递电子面单",
    "fields": [
      {
        "id": "ew-1",
        "fieldKey": "express",
        "fieldLabel": "快递公司",
        "fieldType": "string",
        "sortOrder": 1
      },
      {
        "id": "ew-2",
        "fieldKey": "express.company",
        "fieldLabel": "公司名称",
        "fieldType": "string",
        "sortOrder": 2
      },
      {
        "id": "ew-3",
        "fieldKey": "express.product",
        "fieldLabel": "产品类型",
        "fieldType": "string",
        "sortOrder": 3
      },
      {
        "id": "ew-4",
        "fieldKey": "express.hotline",
        "fieldLabel": "客服热线",
        "fieldType": "string",
        "sortOrder": 4
      },
      {
        "id": "ew-5",
        "fieldKey": "waybill",
        "fieldLabel": "运单信息",
        "fieldType": "string",
        "sortOrder": 5
      },
      {
        "id": "ew-6",
        "fieldKey": "waybill.no",
        "fieldLabel": "运单号",
        "fieldType": "string",
        "sortOrder": 6
      },
      {
        "id": "ew-7",
        "fieldKey": "waybill.qrcode",
        "fieldLabel": "查件二维码",
        "fieldType": "string",
        "sortOrder": 7
      },
      {
        "id": "ew-8",
        "fieldKey": "waybill.goodsName",
        "fieldLabel": "托寄物",
        "fieldType": "string",
        "sortOrder": 8
      },
      {
        "id": "ew-9",
        "fieldKey": "waybill.weight",
        "fieldLabel": "重量（kg）",
        "fieldType": "number",
        "sortOrder": 9
      },
      {
        "id": "ew-10",
        "fieldKey": "waybill.count",
        "fieldLabel": "件数",
        "fieldType": "number",
        "sortOrder": 10
      },
      {
        "id": "ew-11",
        "fieldKey": "waybill.remark",
        "fieldLabel": "备注",
        "fieldType": "string",
        "sortOrder": 11
      },
      {
        "id": "ew-12",
        "fieldKey": "waybill.printedAt",
        "fieldLabel": "打印时间",
        "fieldType": "string",
        "sortOrder": 12
      },
      {
        "id": "ew-13",
        "fieldKey": "waybill.destCode",
        "fieldLabel": "目的地代码",
        "fieldType": "string",
        "sortOrder": 13
      },
      {
        "id": "ew-14",
        "fieldKey": "sender",
        "fieldLabel": "寄件方",
        "fieldType": "string",
        "sortOrder": 14
      },
      {
        "id": "ew-15",
        "fieldKey": "sender.name",
        "fieldLabel": "寄件人",
        "fieldType": "string",
        "sortOrder": 15
      },
      {
        "id": "ew-16",
        "fieldKey": "sender.phone",
        "fieldLabel": "寄件电话",
        "fieldType": "string",
        "sortOrder": 16
      },
      {
        "id": "ew-17",
        "fieldKey": "sender.province",
        "fieldLabel": "寄件省份",
        "fieldType": "string",
        "sortOrder": 17
      },
      {
        "id": "ew-18",
        "fieldKey": "sender.city",
        "fieldLabel": "寄件城市",
        "fieldType": "string",
        "sortOrder": 18
      },
      {
        "id": "ew-19",
        "fieldKey": "sender.address",
        "fieldLabel": "寄件地址",
        "fieldType": "string",
        "sortOrder": 19
      },
      {
        "id": "ew-20",
        "fieldKey": "receiver",
        "fieldLabel": "收件方",
        "fieldType": "string",
        "sortOrder": 20
      },
      {
        "id": "ew-21",
        "fieldKey": "receiver.name",
        "fieldLabel": "收件人",
        "fieldType": "string",
        "sortOrder": 21
      },
      {
        "id": "ew-22",
        "fieldKey": "receiver.phone",
        "fieldLabel": "收件电话",
        "fieldType": "string",
        "sortOrder": 22
      },
      {
        "id": "ew-23",
        "fieldKey": "receiver.province",
        "fieldLabel": "收件省份",
        "fieldType": "string",
        "sortOrder": 23
      },
      {
        "id": "ew-24",
        "fieldKey": "receiver.city",
        "fieldLabel": "收件城市",
        "fieldType": "string",
        "sortOrder": 24
      },
      {
        "id": "ew-25",
        "fieldKey": "receiver.district",
        "fieldLabel": "收件区县",
        "fieldType": "string",
        "sortOrder": 25
      },
      {
        "id": "ew-26",
        "fieldKey": "receiver.address",
        "fieldLabel": "收件地址",
        "fieldType": "string",
        "sortOrder": 26
      }
    ],
    "data": {
      "express": {
        "company": "迅达速运",
        "product": "标准快递",
        "hotline": "400-820-0000"
      },
      "waybill": {
        "no": "XD7788009900123",
        "qrcode": "https://example.com/track/XD7788009900123",
        "goodsName": "数码配件",
        "weight": 1.35,
        "count": 2,
        "remark": "易碎轻放，请勿倒置",
        "printedAt": "2026-09-20 15:42",
        "destCode": "571-03-08"
      },
      "sender": {
        "name": "张伟",
        "phone": "138****1234",
        "province": "浙江省",
        "city": "杭州市",
        "address": "余杭区文一西路 998 号 3 幢 502 室"
      },
      "receiver": {
        "name": "李娜",
        "phone": "139****5678",
        "province": "广东省",
        "city": "深圳市",
        "district": "南山区",
        "address": "科技园南区高新南七道 12 号 A 座 1801"
      }
    },
    "template": {
      "unit": "mm",
      "paperSize": "CUSTOM",
      "orientation": "portrait",
      "customWidth": 100,
      "customHeight": 150,
      "margins": {
        "top": 5,
        "right": 5,
        "bottom": 5,
        "left": 5
      },
      "header": {
        "height": 0,
        "elements": []
      },
      "footer": {
        "height": 0,
        "elements": []
      },
      "watermark": {},
      "elements": [
        {
          "id": "ew-1",
          "type": "text",
          "options": {
            "left": 0,
            "top": 0,
            "width": 60,
            "height": 6,
            "formatter": "{express.company}",
            "fontSize": 13,
            "fontWeight": "bold",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "ew-2",
          "type": "text",
          "options": {
            "left": 60,
            "top": 0,
            "width": 30,
            "height": 6,
            "formatter": "{express.product}",
            "fontSize": 10,
            "textAlign": "right",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "ew-3",
          "type": "barcode",
          "options": {
            "left": 0,
            "top": 6.5,
            "width": 90,
            "height": 13,
            "formatter": "{waybill.no}",
            "barcodeType": "code128",
            "barWidth": 2,
            "printerDpi": 203,
            "hideTitle": false
          },
          "printElementType": {
            "type": "barcode",
            "title": "条形码"
          }
        },
        {
          "id": "ew-4",
          "type": "text",
          "options": {
            "left": 0,
            "top": 21,
            "width": 90,
            "height": 4.5,
            "formatter": "收件人   {receiver.name}   {receiver.phone}",
            "fontSize": 11,
            "fontWeight": "bold",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "ew-5",
          "type": "longText",
          "options": {
            "left": 0,
            "top": 25.5,
            "width": 90,
            "height": 10,
            "formatter": "{receiver.province}{receiver.city}{receiver.district}{receiver.address}",
            "fontSize": 9,
            "lineHeight": 13
          },
          "printElementType": {
            "type": "longText",
            "title": "长文"
          }
        },
        {
          "id": "ew-6",
          "type": "hline",
          "options": {
            "left": 0,
            "top": 36,
            "width": 90,
            "height": 0.2,
            "borderWidth": 0.4,
            "borderColor": "#bbbbbb"
          },
          "printElementType": {
            "type": "hline",
            "title": "横线"
          }
        },
        {
          "id": "ew-7",
          "type": "text",
          "options": {
            "left": 0,
            "top": 37,
            "width": 90,
            "height": 4,
            "formatter": "寄件人   {sender.name}   {sender.phone}",
            "fontSize": 9,
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "ew-8",
          "type": "longText",
          "options": {
            "left": 0,
            "top": 41,
            "width": 90,
            "height": 8,
            "formatter": "{sender.province}{sender.city}{sender.address}",
            "fontSize": 8,
            "color": "#444444",
            "lineHeight": 12
          },
          "printElementType": {
            "type": "longText",
            "title": "长文"
          }
        },
        {
          "id": "ew-9",
          "type": "hline",
          "options": {
            "left": 0,
            "top": 50,
            "width": 90,
            "height": 0.2,
            "borderWidth": 0.4,
            "borderColor": "#bbbbbb"
          },
          "printElementType": {
            "type": "hline",
            "title": "横线"
          }
        },
        {
          "id": "ew-10",
          "type": "qrcode",
          "options": {
            "left": 0,
            "top": 52,
            "width": 24,
            "height": 18,
            "formatter": "{waybill.qrcode}",
            "qrCodeLevel": "M"
          },
          "printElementType": {
            "type": "qrcode",
            "title": "二维码"
          }
        },
        {
          "id": "ew-11",
          "type": "text",
          "options": {
            "left": 27,
            "top": 52,
            "width": 63,
            "height": 4.5,
            "formatter": "托寄物：{waybill.goodsName}",
            "fontSize": 9,
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "ew-12",
          "type": "text",
          "options": {
            "left": 27,
            "top": 56.5,
            "width": 63,
            "height": 4.5,
            "formatter": "重量：{waybill.weight} kg   件数：{waybill.count}",
            "fontSize": 9,
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "ew-13",
          "type": "text",
          "options": {
            "left": 27,
            "top": 61,
            "width": 63,
            "height": 4.5,
            "formatter": "备注：{waybill.remark}",
            "fontSize": 9,
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "ew-14",
          "type": "text",
          "options": {
            "left": 27,
            "top": 65.5,
            "width": 63,
            "height": 4.5,
            "formatter": "签收人：____________",
            "fontSize": 9,
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "ew-15",
          "type": "hline",
          "options": {
            "left": 0,
            "top": 71,
            "width": 90,
            "height": 0.2,
            "borderWidth": 0.4,
            "borderColor": "#dddddd"
          },
          "printElementType": {
            "type": "hline",
            "title": "横线"
          }
        },
        {
          "id": "ew-16",
          "type": "text",
          "options": {
            "left": 0,
            "top": 72,
            "width": 90,
            "height": 4,
            "formatter": "打印时间：{waybill.printedAt}",
            "fontSize": 8,
            "color": "#666666",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "ew-17",
          "type": "text",
          "options": {
            "left": 0,
            "top": 76,
            "width": 90,
            "height": 4,
            "formatter": "客服热线：{express.hotline}",
            "fontSize": 8,
            "color": "#666666",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "ew-18",
          "type": "text",
          "options": {
            "left": 0,
            "top": 82,
            "width": 90,
            "height": 16,
            "formatter": "{waybill.destCode}",
            "fontSize": 22,
            "fontWeight": "bold",
            "textAlign": "center",
            "verticalAlign": "middle",
            "borderWidth": 0.6,
            "borderColor": "#333333"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "ew-19",
          "type": "text",
          "options": {
            "left": 0,
            "top": 99,
            "width": 90,
            "height": 4,
            "formatter": "收件人存根联   {express.company}",
            "fontSize": 7.5,
            "color": "#999999",
            "textAlign": "center",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "ew-20",
          "type": "hline",
          "options": {
            "left": 0,
            "top": 108,
            "width": 90,
            "height": 0.2,
            "borderWidth": 0.4,
            "borderColor": "#dddddd"
          },
          "printElementType": {
            "type": "hline",
            "title": "横线"
          }
        },
        {
          "id": "ew-21",
          "type": "text",
          "options": {
            "left": 0,
            "top": 110,
            "width": 90,
            "height": 6,
            "formatter": "签收时间：______年____月____日",
            "fontSize": 9,
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "ew-22",
          "type": "text",
          "options": {
            "left": 0,
            "top": 117,
            "width": 90,
            "height": 6,
            "formatter": "派件员：__________     收件人签收：__________",
            "fontSize": 9,
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "ew-23",
          "type": "text",
          "options": {
            "left": 0,
            "top": 126,
            "width": 90,
            "height": 5,
            "formatter": "本联为收件人存根，请核对包裹完好后再签收",
            "fontSize": 8,
            "color": "#999999",
            "textAlign": "center",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        }
      ]
    }
  },
  "label": {
    "id": "weight-label",
    "name": "称签打印",
    "fields": [
      {
        "id": "wl-1",
        "fieldKey": "shop",
        "fieldLabel": "门店信息",
        "fieldType": "string",
        "sortOrder": 1
      },
      {
        "id": "wl-2",
        "fieldKey": "shop.name",
        "fieldLabel": "门店名称",
        "fieldType": "string",
        "sortOrder": 2
      },
      {
        "id": "wl-3",
        "fieldKey": "shop.code",
        "fieldLabel": "门店编码",
        "fieldType": "string",
        "sortOrder": 3
      },
      {
        "id": "wl-4",
        "fieldKey": "product",
        "fieldLabel": "商品信息",
        "fieldType": "string",
        "sortOrder": 4
      },
      {
        "id": "wl-5",
        "fieldKey": "product.name",
        "fieldLabel": "商品名称",
        "fieldType": "string",
        "sortOrder": 5
      },
      {
        "id": "wl-6",
        "fieldKey": "product.unitPrice",
        "fieldLabel": "单价（元/500g）",
        "fieldType": "number",
        "sortOrder": 6
      },
      {
        "id": "wl-7",
        "fieldKey": "product.weight",
        "fieldLabel": "净重（kg）",
        "fieldType": "number",
        "sortOrder": 7
      },
      {
        "id": "wl-8",
        "fieldKey": "product.amount",
        "fieldLabel": "应付金额",
        "fieldType": "number",
        "sortOrder": 8
      },
      {
        "id": "wl-9",
        "fieldKey": "product.barcode",
        "fieldLabel": "商品条码",
        "fieldType": "string",
        "sortOrder": 9
      },
      {
        "id": "wl-10",
        "fieldKey": "product.packedAt",
        "fieldLabel": "包装日期",
        "fieldType": "date",
        "sortOrder": 10
      },
      {
        "id": "wl-11",
        "fieldKey": "product.expireAt",
        "fieldLabel": "保质期至",
        "fieldType": "date",
        "sortOrder": 11
      },
      {
        "id": "wl-12",
        "fieldKey": "product.traceCode",
        "fieldLabel": "追溯码",
        "fieldType": "string",
        "sortOrder": 12
      }
    ],
    "data": {
      "shop": {
        "name": "鲜享生活超市 · 文一西路店",
        "code": "HZ-0321"
      },
      "product": {
        "name": "散装五常稻花香米",
        "unitPrice": 6.9,
        "weight": 1.236,
        "amount": 17.06,
        "barcode": "2201234567890",
        "packedAt": "2026-09-20",
        "expireAt": "2027-03-20",
        "traceCode": "TR2609200317"
      }
    },
    "template": {
      "unit": "mm",
      "paperSize": "LABEL_60X40",
      "orientation": "portrait",
      "margins": {
        "top": 2,
        "right": 2,
        "bottom": 2,
        "left": 2
      },
      "header": {
        "height": 0,
        "elements": []
      },
      "footer": {
        "height": 0,
        "elements": []
      },
      "watermark": {},
      "elements": [
        {
          "id": "wt-1",
          "type": "text",
          "options": {
            "left": 0,
            "top": 0,
            "width": 56,
            "height": 4.2,
            "formatter": "{shop.name}",
            "fontSize": 8,
            "textAlign": "center",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "wt-2",
          "type": "text",
          "options": {
            "left": 0,
            "top": 4.2,
            "width": 56,
            "height": 5.4,
            "formatter": "{product.name}",
            "fontSize": 11,
            "fontWeight": "bold",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "wt-3",
          "type": "text",
          "options": {
            "left": 0,
            "top": 9.6,
            "width": 56,
            "height": 3.9,
            "formatter": "单价 ¥{MONEY(product.unitPrice)} 元/500g",
            "fontSize": 8,
            "color": "#444444"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "wt-4",
          "type": "text",
          "options": {
            "left": 0,
            "top": 13.5,
            "width": 28,
            "height": 4.8,
            "groupId": "wt-weight-price",
            "formatter": "净重 {product.weight} kg",
            "fontSize": 9,
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "wt-5",
          "type": "text",
          "options": {
            "left": 28,
            "top": 13.5,
            "width": 28,
            "height": 4.8,
            "groupId": "wt-weight-price",
            "formatter": "¥{MONEY(product.amount)}",
            "fontSize": 12,
            "fontWeight": "bold",
            "color": "#c8211e",
            "textAlign": "right",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "wt-6",
          "type": "hline",
          "options": {
            "left": 0,
            "top": 18.8,
            "width": 56,
            "height": 0.2,
            "borderWidth": 0.4,
            "borderColor": "#9a9a9a"
          },
          "printElementType": {
            "type": "hline",
            "title": "横线"
          }
        },
        {
          "id": "wt-7",
          "type": "barcode",
          "options": {
            "left": 0,
            "top": 19.3,
            "width": 56,
            "height": 7.7,
            "formatter": "{product.barcode}",
            "barcodeType": "code128",
            "barWidth": 2,
            "printerDpi": 203,
            "hideTitle": false
          },
          "printElementType": {
            "type": "barcode",
            "title": "条形码"
          }
        },
        {
          "id": "wt-8",
          "type": "text",
          "options": {
            "left": 0,
            "top": 27.3,
            "width": 56,
            "height": 3.1,
            "formatter": "包装 {product.packedAt}  保质至 {product.expireAt}",
            "fontSize": 6.5
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "wt-9",
          "type": "text",
          "options": {
            "left": 0,
            "top": 30.4,
            "width": 56,
            "height": 3.2,
            "formatter": "门店 {shop.code}  追溯码 {product.traceCode}",
            "fontSize": 6.5
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        }
      ]
    }
  },
  "receipt": {
    "id": "thermal-receipt",
    "name": "零售小票",
    "fields": [
      {
        "id": "tr-1",
        "fieldKey": "store",
        "fieldLabel": "门店信息",
        "fieldType": "string",
        "sortOrder": 1
      },
      {
        "id": "tr-2",
        "fieldKey": "store.name",
        "fieldLabel": "门店名称",
        "fieldType": "string",
        "sortOrder": 2
      },
      {
        "id": "tr-3",
        "fieldKey": "store.address",
        "fieldLabel": "门店地址",
        "fieldType": "string",
        "sortOrder": 3
      },
      {
        "id": "tr-4",
        "fieldKey": "store.tel",
        "fieldLabel": "门店电话",
        "fieldType": "string",
        "sortOrder": 4
      },
      {
        "id": "tr-5",
        "fieldKey": "order",
        "fieldLabel": "订单信息",
        "fieldType": "string",
        "sortOrder": 5
      },
      {
        "id": "tr-6",
        "fieldKey": "order.no",
        "fieldLabel": "小票号",
        "fieldType": "string",
        "sortOrder": 6
      },
      {
        "id": "tr-7",
        "fieldKey": "order.time",
        "fieldLabel": "交易时间",
        "fieldType": "string",
        "sortOrder": 7
      },
      {
        "id": "tr-8",
        "fieldKey": "order.cashier",
        "fieldLabel": "收银员",
        "fieldType": "string",
        "sortOrder": 8
      },
      {
        "id": "tr-9",
        "fieldKey": "order.payMethod",
        "fieldLabel": "支付方式",
        "fieldType": "string",
        "sortOrder": 9
      },
      {
        "id": "tr-10",
        "fieldKey": "order.paid",
        "fieldLabel": "实付金额",
        "fieldType": "number",
        "sortOrder": 10
      },
      {
        "id": "tr-11",
        "fieldKey": "order.change",
        "fieldLabel": "找零",
        "fieldType": "number",
        "sortOrder": 11
      },
      {
        "id": "tr-12",
        "fieldKey": "order.memberNo",
        "fieldLabel": "会员卡号",
        "fieldType": "string",
        "sortOrder": 12
      },
      {
        "id": "tr-13",
        "fieldKey": "order.points",
        "fieldLabel": "本次积分",
        "fieldType": "number",
        "sortOrder": 13
      },
      {
        "id": "tr-14",
        "fieldKey": "order.total",
        "fieldLabel": "合计金额",
        "fieldType": "number",
        "sortOrder": 14
      },
      {
        "id": "tr-15",
        "fieldKey": "order.qrcode",
        "fieldLabel": "电子发票二维码",
        "fieldType": "string",
        "sortOrder": 15
      },
      {
        "id": "tr-16",
        "fieldKey": "items",
        "fieldLabel": "商品明细",
        "fieldType": "list",
        "sortOrder": 16
      },
      {
        "id": "tr-17",
        "fieldKey": "items.name",
        "fieldLabel": "商品名称",
        "fieldType": "string",
        "sortOrder": 17
      },
      {
        "id": "tr-18",
        "fieldKey": "items.qty",
        "fieldLabel": "数量",
        "fieldType": "number",
        "sortOrder": 18
      },
      {
        "id": "tr-19",
        "fieldKey": "items.price",
        "fieldLabel": "单价",
        "fieldType": "number",
        "sortOrder": 19
      },
      {
        "id": "tr-20",
        "fieldKey": "items.amount",
        "fieldLabel": "金额",
        "fieldType": "number",
        "sortOrder": 20
      }
    ],
    "data": {
      "store": {
        "name": "好邻居便利店（文一西路店）",
        "address": "杭州市余杭区文一西路 969 号",
        "tel": "0571-8888 6688"
      },
      "order": {
        "no": "20260920000158",
        "time": "2026-09-20 16:08:32",
        "cashier": "王芳 / 1001",
        "payMethod": "微信支付",
        "paid": 50,
        "change": 0.5,
        "memberNo": "8802 3311 0099",
        "points": 49,
        "total": 49.5,
        "qrcode": "https://example.com/invoice/20260920000158"
      },
      "items": [
        {
          "name": "饮用天然水 550ml",
          "qty": 2,
          "price": 2,
          "amount": 4
        },
        {
          "name": "红烧牛肉面 桶装",
          "qty": 1,
          "price": 5.5,
          "amount": 5.5
        },
        {
          "name": "常温酸奶 205g",
          "qty": 3,
          "price": 6.5,
          "amount": 19.5
        },
        {
          "name": "卤香鸡蛋",
          "qty": 2,
          "price": 2.5,
          "amount": 5
        },
        {
          "name": "辣味豆干 108g",
          "qty": 1,
          "price": 3.5,
          "amount": 3.5
        },
        {
          "name": "抽取式面巾纸",
          "qty": 1,
          "price": 12,
          "amount": 12
        }
      ]
    },
    "template": {
      "unit": "mm",
      "paperSize": "THERMAL_80",
      "orientation": "portrait",
      "margins": {
        "top": 3,
        "right": 2,
        "bottom": 3,
        "left": 2
      },
      "header": {
        "height": 0,
        "elements": []
      },
      "footer": {
        "height": 0,
        "elements": []
      },
      "watermark": {},
      "elements": [
        {
          "id": "rc-1",
          "type": "text",
          "options": {
            "left": 0,
            "top": 0,
            "width": 76,
            "height": 6,
            "formatter": "{store.name}",
            "fontSize": 14,
            "fontWeight": "bold",
            "textAlign": "center",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "rc-2",
          "type": "text",
          "options": {
            "left": 0,
            "top": 6,
            "width": 76,
            "height": 4,
            "formatter": "{store.address}",
            "fontSize": 8,
            "textAlign": "center",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "rc-3",
          "type": "text",
          "options": {
            "left": 0,
            "top": 10,
            "width": 76,
            "height": 4,
            "formatter": "服务热线：{store.tel}",
            "fontSize": 8,
            "textAlign": "center",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "rc-4",
          "type": "hline",
          "options": {
            "left": 0,
            "top": 14.5,
            "width": 76,
            "height": 0.2,
            "borderWidth": 0.4,
            "borderColor": "#999999"
          },
          "printElementType": {
            "type": "hline",
            "title": "横线"
          }
        },
        {
          "id": "rc-5",
          "type": "text",
          "options": {
            "left": 0,
            "top": 15.5,
            "width": 44,
            "height": 4,
            "formatter": "单号：{order.no}",
            "fontSize": 8,
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "rc-6",
          "type": "text",
          "options": {
            "left": 44,
            "top": 15.5,
            "width": 32,
            "height": 4,
            "formatter": "收银员：{order.cashier}",
            "fontSize": 8,
            "textAlign": "right",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "rc-7",
          "type": "text",
          "options": {
            "left": 0,
            "top": 19.5,
            "width": 76,
            "height": 4,
            "formatter": "交易时间：{order.time}",
            "fontSize": 8,
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "rc-8",
          "type": "hline",
          "options": {
            "left": 0,
            "top": 24,
            "width": 76,
            "height": 0.2,
            "borderWidth": 0.4,
            "borderColor": "#999999"
          },
          "printElementType": {
            "type": "hline",
            "title": "横线"
          }
        },
        {
          "id": "rc-12",
          "type": "table",
          "options": {
            "left": 0,
            "top": 25.5,
            "width": 76,
            "height": 45,
            "tableMode": "dynamic",
            "dataSource": "items",
            "tableColWidths": [
              38,
              12,
              13,
              13
            ],
            "tableDefaultFontSize": 8,
            "tableDefaultPadding": 0.8,
            "tablePagination": {
              "enabled": true
            },
            "tableRows": [
              {
                "id": "row-rc-9",
                "type": "header",
                "height": 6,
                "cells": [
                  {
                    "id": "cell-rc-9-1",
                    "formatter": "商品",
                    "align": "left",
                    "fontWeight": "bold"
                  },
                  {
                    "id": "cell-rc-9-2",
                    "formatter": "数量",
                    "align": "right",
                    "fontWeight": "bold"
                  },
                  {
                    "id": "cell-rc-9-3",
                    "formatter": "单价",
                    "align": "right",
                    "fontWeight": "bold"
                  },
                  {
                    "id": "cell-rc-9-4",
                    "formatter": "金额",
                    "align": "right",
                    "fontWeight": "bold"
                  }
                ]
              },
              {
                "id": "row-rc-10",
                "type": "data",
                "height": 5.5,
                "cells": [
                  {
                    "id": "cell-rc-10-1",
                    "formatter": "{items.name}",
                    "align": "left"
                  },
                  {
                    "id": "cell-rc-10-2",
                    "formatter": "{items.qty}",
                    "align": "right"
                  },
                  {
                    "id": "cell-rc-10-3",
                    "formatter": "{MONEY(items.price)}",
                    "align": "right"
                  },
                  {
                    "id": "cell-rc-10-4",
                    "formatter": "{MONEY(items.amount)}",
                    "align": "right"
                  }
                ]
              },
              {
                "id": "row-rc-11",
                "type": "summary",
                "height": 6,
                "cells": [
                  {
                    "id": "cell-rc-11-1",
                    "formatter": "合计",
                    "align": "left",
                    "fontWeight": "bold"
                  },
                  {
                    "id": "cell-rc-11-2",
                    "formatter": "{SUM(items.qty)}",
                    "align": "right",
                    "fontWeight": "bold"
                  },
                  {
                    "id": "cell-rc-11-3",
                    "formatter": "",
                    "align": "right"
                  },
                  {
                    "id": "cell-rc-11-4",
                    "formatter": "{MONEY(SUM(items.amount))}",
                    "align": "right",
                    "fontWeight": "bold"
                  }
                ]
              }
            ]
          },
          "printElementType": {
            "type": "table",
            "title": "表格"
          }
        },
        {
          "id": "rc-13",
          "type": "text",
          "options": {
            "left": 0,
            "top": 72.5,
            "width": 76,
            "height": 4,
            "formatter": "支付方式：{order.payMethod}",
            "fontSize": 8.5,
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "rc-14",
          "type": "text",
          "options": {
            "left": 0,
            "top": 76.5,
            "width": 76,
            "height": 4,
            "formatter": "实付：¥{MONEY(order.paid)}    找零：¥{MONEY(order.change)}",
            "fontSize": 8.5,
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "rc-15",
          "type": "text",
          "options": {
            "left": 0,
            "top": 80.5,
            "width": 76,
            "height": 4,
            "formatter": "会员卡号：{order.memberNo}    本次积分：{order.points}",
            "fontSize": 8,
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "rc-16",
          "type": "hline",
          "options": {
            "left": 0,
            "top": 85,
            "width": 76,
            "height": 0.2,
            "borderWidth": 0.4,
            "borderColor": "#999999"
          },
          "printElementType": {
            "type": "hline",
            "title": "横线"
          }
        },
        {
          "id": "rc-17",
          "type": "qrcode",
          "options": {
            "left": 26,
            "top": 86.5,
            "width": 24,
            "height": 24,
            "formatter": "{order.qrcode}",
            "qrCodeLevel": "M"
          },
          "printElementType": {
            "type": "qrcode",
            "title": "二维码"
          }
        },
        {
          "id": "rc-18",
          "type": "text",
          "options": {
            "left": 0,
            "top": 111.5,
            "width": 76,
            "height": 5,
            "formatter": "谢谢惠顾，欢迎下次光临！",
            "fontSize": 10,
            "fontWeight": "bold",
            "textAlign": "center",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "rc-19",
          "type": "text",
          "options": {
            "left": 0,
            "top": 116.5,
            "width": 76,
            "height": 4,
            "formatter": "小票号 {order.no}   {order.time}",
            "fontSize": 7.5,
            "color": "#666666",
            "textAlign": "center",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        },
        {
          "id": "rc-20",
          "type": "text",
          "options": {
            "left": 0,
            "top": 120.5,
            "width": 76,
            "height": 4,
            "formatter": "凭此小票 7 日内可办理退换货",
            "fontSize": 7,
            "color": "#999999",
            "textAlign": "center",
            "verticalAlign": "middle"
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        }
      ]
    }
  },
  "invoice": {
    "id": "payment-request",
    "name": "付款申请单",
    "fields": [
      {
        "id": "pr-1",
        "fieldKey": "applicationNo",
        "fieldLabel": "单据编号",
        "fieldType": "string",
        "sortOrder": 1
      },
      {
        "id": "pr-2",
        "fieldKey": "department",
        "fieldLabel": "申请部门",
        "fieldType": "string",
        "sortOrder": 2
      },
      {
        "id": "pr-3",
        "fieldKey": "applyDate",
        "fieldLabel": "申请日期",
        "fieldType": "date",
        "sortOrder": 3
      },
      {
        "id": "pr-4",
        "fieldKey": "applicant",
        "fieldLabel": "经办人",
        "fieldType": "string",
        "sortOrder": 4
      },
      {
        "id": "pr-5",
        "fieldKey": "attachmentCount",
        "fieldLabel": "附件数量",
        "fieldType": "number",
        "sortOrder": 5
      },
      {
        "id": "pr-6",
        "fieldKey": "payeeName",
        "fieldLabel": "收款单位",
        "fieldType": "string",
        "sortOrder": 6
      },
      {
        "id": "pr-7",
        "fieldKey": "bankName",
        "fieldLabel": "开户银行",
        "fieldType": "string",
        "sortOrder": 7
      },
      {
        "id": "pr-8",
        "fieldKey": "bankAccount",
        "fieldLabel": "开户账号",
        "fieldType": "string",
        "sortOrder": 8
      },
      {
        "id": "pr-9",
        "fieldKey": "taxNumber",
        "fieldLabel": "税号",
        "fieldType": "string",
        "sortOrder": 9
      },
      {
        "id": "pr-10",
        "fieldKey": "projectName",
        "fieldLabel": "项目名称",
        "fieldType": "string",
        "sortOrder": 10
      },
      {
        "id": "pr-11",
        "fieldKey": "contractNo",
        "fieldLabel": "合同号",
        "fieldType": "string",
        "sortOrder": 11
      },
      {
        "id": "pr-12",
        "fieldKey": "contractTotal",
        "fieldLabel": "合同总金额",
        "fieldType": "number",
        "sortOrder": 12
      },
      {
        "id": "pr-13",
        "fieldKey": "paidTotal",
        "fieldLabel": "累计已支付金额",
        "fieldType": "number",
        "sortOrder": 13
      },
      {
        "id": "pr-14",
        "fieldKey": "items",
        "fieldLabel": "付款项目明细",
        "fieldType": "list",
        "sortOrder": 14
      },
      {
        "id": "pr-15",
        "fieldKey": "items.summary",
        "fieldLabel": "付款项目摘要",
        "fieldType": "string",
        "sortOrder": 15
      },
      {
        "id": "pr-16",
        "fieldKey": "items.amount",
        "fieldLabel": "付款金额",
        "fieldType": "number",
        "sortOrder": 16
      },
      {
        "id": "pr-17",
        "fieldKey": "items.paymentMethod",
        "fieldLabel": "付款方式",
        "fieldType": "string",
        "sortOrder": 17
      },
      {
        "id": "pr-18",
        "fieldKey": "items.remark",
        "fieldLabel": "备注",
        "fieldType": "string",
        "sortOrder": 18
      }
    ],
    "data": {
      "applicationNo": "FK-20261105-001",
      "department": "供应链管理部",
      "applyDate": "2026-11-05",
      "applicant": "王威",
      "attachmentCount": 12,
      "payeeName": "上海示例供应链有限公司",
      "bankName": "中国建设银行上海示例支行",
      "bankAccount": "31050123456789012345",
      "taxNumber": "91310115MA1K4XXXXX",
      "projectName": "华东仓储中心设备采购项目",
      "contractNo": "HT-CG-2026-1105",
      "contractTotal": 198000,
      "paidTotal": 100338.75,
      "items": [
        {
          "summary": "货架采购首期款",
          "amount": 12800,
          "paymentMethod": "电汇",
          "remark": "合同款"
        },
        {
          "summary": "输送设备预付款",
          "amount": 8600,
          "paymentMethod": "电汇",
          "remark": "预付款"
        },
        {
          "summary": "自动分拣机进度款",
          "amount": 15320.5,
          "paymentMethod": "电汇",
          "remark": "进度款"
        },
        {
          "summary": "仓储笼采购款",
          "amount": 6800,
          "paymentMethod": "支票",
          "remark": "货到付款"
        },
        {
          "summary": "叉车配件采购款",
          "amount": 9300,
          "paymentMethod": "支票",
          "remark": "维保物料"
        },
        {
          "summary": "设备搬运零星支出",
          "amount": 1260,
          "paymentMethod": "现金",
          "remark": "备用金"
        },
        {
          "summary": "现场安装交通及住宿费",
          "amount": 2480.75,
          "paymentMethod": "现金",
          "remark": "费用报销"
        },
        {
          "summary": "打包机设备验收款",
          "amount": 20000,
          "paymentMethod": "承兑",
          "remark": "六个月"
        },
        {
          "summary": "托盘采购尾款",
          "amount": 17500,
          "paymentMethod": "承兑",
          "remark": "三个月"
        },
        {
          "summary": "旧设备拆卸及回收费",
          "amount": 3600,
          "paymentMethod": "其他",
          "remark": "抵扣结算"
        }
      ]
    },
    "template": {
      "unit": "mm",
      "paperSize": "CUSTOM",
      "orientation": "landscape",
      "margins": {
        "top": 10,
        "right": 10,
        "bottom": 10,
        "left": 10
      },
      "header": {
        "height": 16,
        "elements": [
          {
            "id": "application-no",
            "type": "text",
            "options": {
              "left": 0,
              "top": 0,
              "width": 70,
              "height": 8,
              "formatter": "单据编号：{applicationNo}",
              "fontSize": 9,
              "verticalAlign": "middle"
            },
            "printElementType": {
              "type": "text",
              "title": "文本"
            }
          },
          {
            "id": "title",
            "type": "text",
            "options": {
              "left": 0,
              "top": 0,
              "width": 220,
              "height": 8,
              "formatter": "付款申请单",
              "fontSize": 16,
              "fontWeight": "bold",
              "textAlign": "center",
              "verticalAlign": "middle"
            },
            "printElementType": {
              "type": "text",
              "title": "文本"
            }
          },
          {
            "id": "page-number",
            "type": "text",
            "options": {
              "left": 170,
              "top": 0,
              "width": 50,
              "height": 8,
              "formatter": "第 {pageIndex} 页 / 共 {totalPages} 页",
              "fontSize": 9,
              "textAlign": "right",
              "verticalAlign": "middle"
            },
            "printElementType": {
              "type": "text",
              "title": "文本"
            }
          },
          {
            "id": "department",
            "type": "text",
            "options": {
              "left": 0,
              "top": 8,
              "width": 110,
              "height": 8,
              "formatter": "申请部门：{department}",
              "fontSize": 10,
              "verticalAlign": "middle"
            },
            "printElementType": {
              "type": "text",
              "title": "文本"
            }
          },
          {
            "id": "apply-date",
            "type": "text",
            "options": {
              "left": 110,
              "top": 8,
              "width": 110,
              "height": 8,
              "formatter": "申请日期：{applyDate}",
              "fontSize": 10,
              "textAlign": "right",
              "verticalAlign": "middle"
            },
            "printElementType": {
              "type": "text",
              "title": "文本"
            }
          }
        ]
      },
      "footer": {
        "height": 16,
        "elements": [
          {
            "id": "leader",
            "type": "text",
            "options": {
              "left": 0,
              "top": 4,
              "width": 55,
              "height": 8,
              "formatter": "领导批示：",
              "fontSize": 9,
              "fontWeight": "bold",
              "verticalAlign": "middle"
            },
            "printElementType": {
              "type": "text",
              "title": "文本"
            }
          },
          {
            "id": "finance",
            "type": "text",
            "options": {
              "left": 55,
              "top": 4,
              "width": 55,
              "height": 8,
              "formatter": "财务负责人：",
              "fontSize": 9,
              "fontWeight": "bold",
              "verticalAlign": "middle"
            },
            "printElementType": {
              "type": "text",
              "title": "文本"
            }
          },
          {
            "id": "manager",
            "type": "text",
            "options": {
              "left": 110,
              "top": 4,
              "width": 55,
              "height": 8,
              "formatter": "部门负责人：",
              "fontSize": 9,
              "fontWeight": "bold",
              "verticalAlign": "middle"
            },
            "printElementType": {
              "type": "text",
              "title": "文本"
            }
          },
          {
            "id": "applicant",
            "type": "text",
            "options": {
              "left": 165,
              "top": 4,
              "width": 55,
              "height": 8,
              "formatter": "经办人：{applicant}",
              "fontSize": 9,
              "fontWeight": "bold",
              "verticalAlign": "middle"
            },
            "printElementType": {
              "type": "text",
              "title": "文本"
            }
          }
        ]
      },
      "elements": [
        {
          "id": "payment-table",
          "type": "table",
          "options": {
            "left": 0,
            "top": 0,
            "width": 212,
            "height": 54,
            "dataSource": "items",
            "tableDefaultFontSize": 9,
            "tableDefaultPadding": 1,
            "tableDefaultColor": "#333333",
            "tableColWidths": [
              34.7,
              38.5,
              34.7,
              34.7,
              34.7,
              34.7
            ],
            "tableRows": [
              {
                "id": "r1",
                "type": "header",
                "height": 7,
                "cells": [
                  {
                    "id": "c1",
                    "formatter": "收款单位",
                    "align": "center",
                    "valign": "middle",
                    "fontWeight": "bold",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c2",
                    "formatter": "{payeeName}",
                    "colspan": 2,
                    "valign": "middle",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c3",
                    "merged": true,
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c4",
                    "formatter": "项目名称",
                    "align": "center",
                    "valign": "middle",
                    "fontWeight": "bold",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c5",
                    "formatter": "{projectName}",
                    "colspan": 2,
                    "valign": "middle",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c6",
                    "merged": true,
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  }
                ],
                "repeatOnPage": true
              },
              {
                "id": "r2",
                "type": "header",
                "height": 7,
                "cells": [
                  {
                    "id": "c7",
                    "formatter": "开户银行",
                    "align": "center",
                    "valign": "middle",
                    "fontWeight": "bold",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c8",
                    "formatter": "{bankName}",
                    "colspan": 2,
                    "valign": "middle",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c9",
                    "merged": true,
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c10",
                    "formatter": "合同号",
                    "align": "center",
                    "valign": "middle",
                    "fontWeight": "bold",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c11",
                    "formatter": "{contractNo}",
                    "colspan": 2,
                    "valign": "middle",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c12",
                    "merged": true,
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  }
                ],
                "repeatOnPage": true
              },
              {
                "id": "r3",
                "type": "header",
                "height": 7,
                "cells": [
                  {
                    "id": "c13",
                    "formatter": "开户账号",
                    "align": "center",
                    "valign": "middle",
                    "fontWeight": "bold",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c14",
                    "formatter": "{bankAccount}",
                    "colspan": 2,
                    "valign": "middle",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c15",
                    "merged": true,
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c16",
                    "formatter": "合同总金额",
                    "align": "center",
                    "valign": "middle",
                    "fontWeight": "bold",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c17",
                    "formatter": "{MONEY(contractTotal)}",
                    "colspan": 2,
                    "align": "right",
                    "valign": "middle",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c18",
                    "merged": true,
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  }
                ],
                "repeatOnPage": true
              },
              {
                "id": "r4",
                "type": "header",
                "height": 7,
                "cells": [
                  {
                    "id": "c19",
                    "formatter": "税号",
                    "align": "center",
                    "valign": "middle",
                    "fontWeight": "bold",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c20",
                    "formatter": "{taxNumber}",
                    "colspan": 2,
                    "valign": "middle",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c21",
                    "merged": true,
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c22",
                    "formatter": "累计已支付金额",
                    "align": "center",
                    "valign": "middle",
                    "fontWeight": "bold",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c23",
                    "formatter": "{MONEY(paidTotal)}",
                    "colspan": 2,
                    "align": "right",
                    "valign": "middle",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c24",
                    "merged": true,
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  }
                ],
                "repeatOnPage": true
              },
              {
                "id": "r5",
                "type": "header",
                "height": 8,
                "cells": [
                  {
                    "id": "c25",
                    "formatter": "付款项目摘要",
                    "colspan": 3,
                    "align": "center",
                    "valign": "middle",
                    "fontWeight": "bold",
                    "backgroundColor": "#f2f2f2",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c26",
                    "merged": true,
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c27",
                    "merged": true,
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c28",
                    "formatter": "付款金额",
                    "align": "center",
                    "valign": "middle",
                    "fontWeight": "bold",
                    "backgroundColor": "#f2f2f2",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c29",
                    "formatter": "付款方式",
                    "align": "center",
                    "valign": "middle",
                    "fontWeight": "bold",
                    "backgroundColor": "#f2f2f2",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c30",
                    "formatter": "备注",
                    "align": "center",
                    "valign": "middle",
                    "fontWeight": "bold",
                    "backgroundColor": "#f2f2f2",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  }
                ],
                "repeatOnPage": true
              },
              {
                "id": "r6",
                "type": "data",
                "height": 10,
                "cells": [
                  {
                    "id": "c31",
                    "formatter": "{summary}",
                    "colspan": 3,
                    "valign": "middle",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c32",
                    "merged": true,
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c33",
                    "merged": true,
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c34",
                    "formatter": "{MONEY(amount)}",
                    "align": "right",
                    "valign": "middle",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c35",
                    "formatter": "{paymentMethod}",
                    "align": "center",
                    "valign": "middle",
                    "mergeSameValue": true,
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c36",
                    "formatter": "{remark}",
                    "align": "center",
                    "valign": "middle",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  }
                ]
              },
              {
                "id": "r7",
                "type": "subtotal",
                "height": 8,
                "cells": [
                  {
                    "id": "c37",
                    "formatter": "合计金额（本页）",
                    "colspan": 3,
                    "align": "right",
                    "valign": "middle",
                    "fontWeight": "bold",
                    "backgroundColor": "#fafafa",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c38",
                    "merged": true,
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c39",
                    "merged": true,
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c40",
                    "formatter": "{MONEY(SUM(amount))}",
                    "align": "right",
                    "valign": "middle",
                    "fontWeight": "bold",
                    "backgroundColor": "#fafafa",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c41",
                    "formatter": "",
                    "backgroundColor": "#fafafa",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  },
                  {
                    "id": "c42",
                    "formatter": "",
                    "backgroundColor": "#fafafa",
                    "borders": {
                      "top": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "right": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "bottom": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      },
                      "left": {
                        "width": 0.75,
                        "style": "solid",
                        "color": "#333333"
                      }
                    }
                  }
                ]
              }
            ],
            "tablePagination": {
              "enabled": true
            }
          },
          "printElementType": {
            "type": "table",
            "title": "表格"
          }
        },
        {
          "id": "attachments",
          "type": "text",
          "options": {
            "left": 177.5,
            "top": 41.5,
            "width": 80,
            "height": 5,
            "formatter": "附件单据：{attachmentCount} 张",
            "fontSize": 10,
            "textAlign": "center",
            "verticalAlign": "middle",
            "textFit": "shrink",
            "rotate": 90,
            "fixed": true,
            "pagination": {
              "pageable": false,
              "keepWithNext": false
            }
          },
          "printElementType": {
            "type": "text",
            "title": "文本"
          }
        }
      ],
      "customWidth": 140,
      "customHeight": 240,
      "name": "付款申请单（明细分页与付款方式合并）"
    }
  },
  "healthReport": {
    "id": "health-report",
    "name": "健康体检报告",
    "fields": [
      {
        "id": "hr-1",
        "fieldKey": "report",
        "fieldLabel": "报告信息",
        "fieldType": "string",
        "sortOrder": 1
      },
      {
        "id": "hr-2",
        "fieldKey": "report.org",
        "fieldLabel": "体检机构",
        "fieldType": "string",
        "sortOrder": 2
      },
      {
        "id": "hr-3",
        "fieldKey": "report.no",
        "fieldLabel": "报告编号",
        "fieldType": "string",
        "sortOrder": 3
      },
      {
        "id": "hr-4",
        "fieldKey": "report.name",
        "fieldLabel": "受检人",
        "fieldType": "string",
        "sortOrder": 4
      },
      {
        "id": "hr-5",
        "fieldKey": "report.sex",
        "fieldLabel": "性别",
        "fieldType": "string",
        "sortOrder": 5
      },
      {
        "id": "hr-6",
        "fieldKey": "report.age",
        "fieldLabel": "年龄",
        "fieldType": "string",
        "sortOrder": 6
      },
      {
        "id": "hr-7",
        "fieldKey": "report.examDate",
        "fieldLabel": "体检日期",
        "fieldType": "date",
        "sortOrder": 7
      },
      {
        "id": "hr-8",
        "fieldKey": "report.package",
        "fieldLabel": "体检套餐",
        "fieldType": "string",
        "sortOrder": 8
      },
      {
        "id": "hr-9",
        "fieldKey": "report.doctor",
        "fieldLabel": "总检医师",
        "fieldType": "string",
        "sortOrder": 9
      },
      {
        "id": "hr-10",
        "fieldKey": "report.reviewer",
        "fieldLabel": "审核医师",
        "fieldType": "string",
        "sortOrder": 10
      },
      {
        "id": "hr-11",
        "fieldKey": "summary",
        "fieldLabel": "总检结论",
        "fieldType": "string",
        "sortOrder": 11
      },
      {
        "id": "hr-12",
        "fieldKey": "summary.abnormalCount",
        "fieldLabel": "异常项数",
        "fieldType": "number",
        "sortOrder": 12
      },
      {
        "id": "hr-13",
        "fieldKey": "summary.conclusion",
        "fieldLabel": "结论正文",
        "fieldType": "string",
        "sortOrder": 13
      },
      {
        "id": "hr-14",
        "fieldKey": "summary.advice",
        "fieldLabel": "健康建议",
        "fieldType": "string",
        "sortOrder": 14
      },
      {
        "id": "hr-15",
        "fieldKey": "vitals",
        "fieldLabel": "一般检查",
        "fieldType": "list",
        "sortOrder": 15
      },
      {
        "id": "hr-16",
        "fieldKey": "clinical",
        "fieldLabel": "科室检查",
        "fieldType": "list",
        "sortOrder": 16
      },
      {
        "id": "hr-17",
        "fieldKey": "blood",
        "fieldLabel": "血常规",
        "fieldType": "list",
        "sortOrder": 17
      },
      {
        "id": "hr-18",
        "fieldKey": "blood.item",
        "fieldLabel": "血常规项目",
        "fieldType": "string",
        "sortOrder": 18
      },
      {
        "id": "hr-19",
        "fieldKey": "blood.result",
        "fieldLabel": "血常规结果",
        "fieldType": "string",
        "sortOrder": 19
      },
      {
        "id": "hr-20",
        "fieldKey": "blood.ref",
        "fieldLabel": "血常规参考区间",
        "fieldType": "string",
        "sortOrder": 20
      },
      {
        "id": "hr-21",
        "fieldKey": "chemistry",
        "fieldLabel": "生化检验",
        "fieldType": "list",
        "sortOrder": 21
      },
      {
        "id": "hr-22",
        "fieldKey": "urine",
        "fieldLabel": "尿常规",
        "fieldType": "list",
        "sortOrder": 22
      },
      {
        "id": "hr-23",
        "fieldKey": "imaging",
        "fieldLabel": "影像与心电",
        "fieldType": "list",
        "sortOrder": 23
      },
      {
        "id": "hr-24",
        "fieldKey": "abnormals",
        "fieldLabel": "异常指标汇总",
        "fieldType": "list",
        "sortOrder": 24
      },
      {
        "id": "hr-25",
        "fieldKey": "trends",
        "fieldLabel": "历年趋势",
        "fieldType": "list",
        "sortOrder": 25
      },
      {
        "id": "hr-26",
        "fieldKey": "wbc",
        "fieldLabel": "白细胞分类",
        "fieldType": "list",
        "sortOrder": 26
      },
      {
        "id": "hr-27",
        "fieldKey": "report.title",
        "fieldLabel": "报告标题",
        "fieldType": "string",
        "sortOrder": 27
      },
      {
        "id": "hr-28",
        "fieldKey": "report.date",
        "fieldLabel": "报告日期",
        "fieldType": "date",
        "sortOrder": 28
      },
      {
        "id": "hr-29",
        "fieldKey": "report.phone",
        "fieldLabel": "联系电话",
        "fieldType": "string",
        "sortOrder": 29
      },
      {
        "id": "hr-30",
        "fieldKey": "report.verifyUrl",
        "fieldLabel": "报告验证链接",
        "fieldType": "string",
        "sortOrder": 30
      },
      {
        "id": "hr-31",
        "fieldKey": "vitals.seq",
        "fieldLabel": "序号",
        "fieldType": "number",
        "sortOrder": 31
      },
      {
        "id": "hr-32",
        "fieldKey": "vitals.item",
        "fieldLabel": "检查项目",
        "fieldType": "string",
        "sortOrder": 32
      },
      {
        "id": "hr-33",
        "fieldKey": "vitals.result",
        "fieldLabel": "检查结果",
        "fieldType": "string",
        "sortOrder": 33
      },
      {
        "id": "hr-34",
        "fieldKey": "vitals.unit",
        "fieldLabel": "单位",
        "fieldType": "string",
        "sortOrder": 34
      },
      {
        "id": "hr-35",
        "fieldKey": "vitals.ref",
        "fieldLabel": "参考区间",
        "fieldType": "string",
        "sortOrder": 35
      },
      {
        "id": "hr-36",
        "fieldKey": "vitals.flag",
        "fieldLabel": "异常标记",
        "fieldType": "string",
        "sortOrder": 36
      },
      {
        "id": "hr-37",
        "fieldKey": "clinical.dept",
        "fieldLabel": "检查科室",
        "fieldType": "string",
        "sortOrder": 37
      },
      {
        "id": "hr-38",
        "fieldKey": "clinical.item",
        "fieldLabel": "检查项目",
        "fieldType": "string",
        "sortOrder": 38
      },
      {
        "id": "hr-39",
        "fieldKey": "clinical.result",
        "fieldLabel": "检查结果",
        "fieldType": "string",
        "sortOrder": 39
      },
      {
        "id": "hr-40",
        "fieldKey": "clinical.desc",
        "fieldLabel": "检查描述",
        "fieldType": "string",
        "sortOrder": 40
      },
      {
        "id": "hr-41",
        "fieldKey": "blood.seq",
        "fieldLabel": "序号",
        "fieldType": "number",
        "sortOrder": 41
      },
      {
        "id": "hr-42",
        "fieldKey": "blood.unit",
        "fieldLabel": "单位",
        "fieldType": "string",
        "sortOrder": 42
      },
      {
        "id": "hr-43",
        "fieldKey": "blood.flag",
        "fieldLabel": "异常标记",
        "fieldType": "string",
        "sortOrder": 43
      },
      {
        "id": "hr-44",
        "fieldKey": "chemistry.seq",
        "fieldLabel": "序号",
        "fieldType": "number",
        "sortOrder": 44
      },
      {
        "id": "hr-45",
        "fieldKey": "chemistry.item",
        "fieldLabel": "检验项目",
        "fieldType": "string",
        "sortOrder": 45
      },
      {
        "id": "hr-46",
        "fieldKey": "chemistry.result",
        "fieldLabel": "检验结果",
        "fieldType": "string",
        "sortOrder": 46
      },
      {
        "id": "hr-47",
        "fieldKey": "chemistry.unit",
        "fieldLabel": "单位",
        "fieldType": "string",
        "sortOrder": 47
      },
      {
        "id": "hr-48",
        "fieldKey": "chemistry.ref",
        "fieldLabel": "参考区间",
        "fieldType": "string",
        "sortOrder": 48
      },
      {
        "id": "hr-49",
        "fieldKey": "chemistry.flag",
        "fieldLabel": "异常标记",
        "fieldType": "string",
        "sortOrder": 49
      },
      {
        "id": "hr-50",
        "fieldKey": "urine.seq",
        "fieldLabel": "序号",
        "fieldType": "number",
        "sortOrder": 50
      },
      {
        "id": "hr-51",
        "fieldKey": "urine.item",
        "fieldLabel": "检验项目",
        "fieldType": "string",
        "sortOrder": 51
      },
      {
        "id": "hr-52",
        "fieldKey": "urine.result",
        "fieldLabel": "检验结果",
        "fieldType": "string",
        "sortOrder": 52
      },
      {
        "id": "hr-53",
        "fieldKey": "urine.unit",
        "fieldLabel": "单位",
        "fieldType": "string",
        "sortOrder": 53
      },
      {
        "id": "hr-54",
        "fieldKey": "urine.ref",
        "fieldLabel": "参考区间",
        "fieldType": "string",
        "sortOrder": 54
      },
      {
        "id": "hr-55",
        "fieldKey": "urine.flag",
        "fieldLabel": "异常标记",
        "fieldType": "string",
        "sortOrder": 55
      },
      {
        "id": "hr-56",
        "fieldKey": "imaging.dept",
        "fieldLabel": "检查科室",
        "fieldType": "string",
        "sortOrder": 56
      },
      {
        "id": "hr-57",
        "fieldKey": "imaging.item",
        "fieldLabel": "检查项目",
        "fieldType": "string",
        "sortOrder": 57
      },
      {
        "id": "hr-58",
        "fieldKey": "imaging.result",
        "fieldLabel": "检查结果",
        "fieldType": "string",
        "sortOrder": 58
      },
      {
        "id": "hr-59",
        "fieldKey": "imaging.desc",
        "fieldLabel": "检查描述",
        "fieldType": "string",
        "sortOrder": 59
      },
      {
        "id": "hr-60",
        "fieldKey": "abnormals.dept",
        "fieldLabel": "异常来源",
        "fieldType": "string",
        "sortOrder": 60
      },
      {
        "id": "hr-61",
        "fieldKey": "abnormals.item",
        "fieldLabel": "异常项目",
        "fieldType": "string",
        "sortOrder": 61
      },
      {
        "id": "hr-62",
        "fieldKey": "abnormals.result",
        "fieldLabel": "异常结果",
        "fieldType": "string",
        "sortOrder": 62
      },
      {
        "id": "hr-63",
        "fieldKey": "abnormals.ref",
        "fieldLabel": "参考区间",
        "fieldType": "string",
        "sortOrder": 63
      },
      {
        "id": "hr-64",
        "fieldKey": "abnormals.advice",
        "fieldLabel": "处理建议",
        "fieldType": "string",
        "sortOrder": 64
      },
      {
        "id": "hr-65",
        "fieldKey": "trends.year",
        "fieldLabel": "年份",
        "fieldType": "string",
        "sortOrder": 65
      },
      {
        "id": "hr-66",
        "fieldKey": "trends.ldl",
        "fieldLabel": "低密度脂蛋白",
        "fieldType": "number",
        "sortOrder": 66
      },
      {
        "id": "hr-67",
        "fieldKey": "trends.glucose",
        "fieldLabel": "空腹血糖",
        "fieldType": "number",
        "sortOrder": 67
      },
      {
        "id": "hr-68",
        "fieldKey": "wbc.name",
        "fieldLabel": "白细胞分类",
        "fieldType": "string",
        "sortOrder": 68
      },
      {
        "id": "hr-69",
        "fieldKey": "wbc.value",
        "fieldLabel": "分类占比",
        "fieldType": "number",
        "sortOrder": 69
      }
    ],
    "data": {
      "report": {
        "org": "康和健康管理中心 · 体检部",
        "title": "健康体检报告",
        "no": "TJ2026111500286",
        "date": "2026-11-15",
        "examDate": "2026-11-12",
        "name": "张明远",
        "sex": "男",
        "age": "42 岁",
        "phone": "138****6621",
        "package": "精英综合套餐（男）",
        "doctor": "李文华",
        "reviewer": "周敏",
        "verifyUrl": "https://example.com/report/TJ2026111500286"
      },
      "summary": {
        "abnormalCount": 5,
        "conclusion": "一、主要阳性发现：低密度脂蛋白胆固醇 4.12 mmol/L 偏高，总胆固醇 6.28 mmol/L 偏高；空腹血糖 6.42 mmol/L 处于空腹血糖受损区间；体重指数 27.4 kg/m² 属超重；血压 138/88 mmHg 属正常高值。\n二、其余检查：血常规、尿常规、肝肾功能、甲状腺功能、胸片与心电图均未见明显异常；腹部超声提示轻度脂肪肝。\n三、综合评估：存在血脂异常、糖代谢异常及超重等心血管代谢危险因素，建议 3 个月内生活方式干预后复查血脂与空腹血糖。",
        "advice": "1. 饮食：减少饱和脂肪与精制糖摄入，每日食盐不超过 5g，增加全谷物、蔬菜与优质蛋白。\n2. 运动：每周不少于 150 分钟中等强度有氧运动，配合每周 2 次抗阻训练，目标减重 3~5kg。\n3. 复查：3 个月后复查血脂四项、空腹血糖与糖化血红蛋白；如持续升高请至内分泌科门诊评估。\n4. 作息：戒烟限酒，保证每日 7 小时睡眠，避免长期熬夜与久坐。"
      },
      "vitals": [
        {
          "seq": 1,
          "item": "身高",
          "result": "172.5",
          "unit": "cm",
          "ref": "—",
          "flag": ""
        },
        {
          "seq": 2,
          "item": "体重",
          "result": "81.6",
          "unit": "kg",
          "ref": "—",
          "flag": ""
        },
        {
          "seq": 3,
          "item": "体重指数 BMI",
          "result": "27.4",
          "unit": "kg/m²",
          "ref": "18.5~23.9",
          "flag": "H"
        },
        {
          "seq": 4,
          "item": "收缩压",
          "result": "138",
          "unit": "mmHg",
          "ref": "90~139",
          "flag": ""
        },
        {
          "seq": 5,
          "item": "舒张压",
          "result": "88",
          "unit": "mmHg",
          "ref": "60~89",
          "flag": ""
        },
        {
          "seq": 6,
          "item": "脉搏",
          "result": "76",
          "unit": "次/分",
          "ref": "60~100",
          "flag": ""
        }
      ],
      "clinical": [
        {
          "dept": "内科",
          "item": "心肺听诊",
          "result": "未见异常",
          "desc": "心律齐，双肺呼吸音清"
        },
        {
          "dept": "内科",
          "item": "腹部触诊",
          "result": "未见异常",
          "desc": "腹软，肝脾未触及"
        },
        {
          "dept": "外科",
          "item": "甲状腺",
          "result": "未见异常",
          "desc": "未触及肿大及结节"
        },
        {
          "dept": "眼科",
          "item": "眼底检查",
          "result": "未见异常",
          "desc": "双侧眼底动脉未见硬化征"
        },
        {
          "dept": "耳鼻喉",
          "item": "常规检查",
          "result": "未见异常",
          "desc": "咽部无充血，双耳鼓膜完整"
        }
      ],
      "blood": [
        {
          "seq": 1,
          "item": "白细胞计数 WBC",
          "result": "6.72",
          "unit": "10⁹/L",
          "ref": "3.50~9.50",
          "flag": ""
        },
        {
          "seq": 2,
          "item": "红细胞计数 RBC",
          "result": "4.86",
          "unit": "10¹²/L",
          "ref": "4.30~5.80",
          "flag": ""
        },
        {
          "seq": 3,
          "item": "血红蛋白 HGB",
          "result": "148",
          "unit": "g/L",
          "ref": "130~175",
          "flag": ""
        },
        {
          "seq": 4,
          "item": "血小板计数 PLT",
          "result": "236",
          "unit": "10⁹/L",
          "ref": "125~350",
          "flag": ""
        },
        {
          "seq": 5,
          "item": "中性粒细胞百分比",
          "result": "58.2",
          "unit": "%",
          "ref": "40.0~75.0",
          "flag": ""
        },
        {
          "seq": 6,
          "item": "淋巴细胞百分比",
          "result": "32.4",
          "unit": "%",
          "ref": "20.0~50.0",
          "flag": ""
        },
        {
          "seq": 7,
          "item": "单核细胞百分比",
          "result": "6.1",
          "unit": "%",
          "ref": "3.0~10.0",
          "flag": ""
        },
        {
          "seq": 8,
          "item": "嗜酸性粒细胞百分比",
          "result": "2.6",
          "unit": "%",
          "ref": "0.4~8.0",
          "flag": ""
        },
        {
          "seq": 9,
          "item": "嗜碱性粒细胞百分比",
          "result": "0.7",
          "unit": "%",
          "ref": "0.0~1.0",
          "flag": ""
        }
      ],
      "chemistry": [
        {
          "seq": 1,
          "item": "总胆固醇 TC",
          "result": "6.28",
          "unit": "mmol/L",
          "ref": "<5.18",
          "flag": "H"
        },
        {
          "seq": 2,
          "item": "甘油三酯 TG",
          "result": "1.94",
          "unit": "mmol/L",
          "ref": "<1.70",
          "flag": "H"
        },
        {
          "seq": 3,
          "item": "低密度脂蛋白 LDL-C",
          "result": "4.12",
          "unit": "mmol/L",
          "ref": "<3.37",
          "flag": "H"
        },
        {
          "seq": 4,
          "item": "高密度脂蛋白 HDL-C",
          "result": "1.08",
          "unit": "mmol/L",
          "ref": ">1.04",
          "flag": ""
        },
        {
          "seq": 5,
          "item": "空腹血糖 GLU",
          "result": "6.42",
          "unit": "mmol/L",
          "ref": "3.90~6.10",
          "flag": "H"
        },
        {
          "seq": 6,
          "item": "糖化血红蛋白 HbA1c",
          "result": "5.9",
          "unit": "%",
          "ref": "4.0~6.0",
          "flag": ""
        },
        {
          "seq": 7,
          "item": "丙氨酸氨基转移酶 ALT",
          "result": "34",
          "unit": "U/L",
          "ref": "9~50",
          "flag": ""
        },
        {
          "seq": 8,
          "item": "天门冬氨酸氨基转移酶 AST",
          "result": "26",
          "unit": "U/L",
          "ref": "15~40",
          "flag": ""
        },
        {
          "seq": 9,
          "item": "血清肌酐 CREA",
          "result": "78",
          "unit": "μmol/L",
          "ref": "57~97",
          "flag": ""
        },
        {
          "seq": 10,
          "item": "尿酸 UA",
          "result": "398",
          "unit": "μmol/L",
          "ref": "208~428",
          "flag": ""
        },
        {
          "seq": 11,
          "item": "尿素 UREA",
          "result": "5.2",
          "unit": "mmol/L",
          "ref": "3.1~8.0",
          "flag": ""
        }
      ],
      "urine": [
        {
          "seq": 1,
          "item": "尿蛋白 PRO",
          "result": "阴性",
          "unit": "—",
          "ref": "阴性",
          "flag": ""
        },
        {
          "seq": 2,
          "item": "尿葡萄糖 GLU",
          "result": "阴性",
          "unit": "—",
          "ref": "阴性",
          "flag": ""
        },
        {
          "seq": 3,
          "item": "尿潜血 BLD",
          "result": "阴性",
          "unit": "—",
          "ref": "阴性",
          "flag": ""
        },
        {
          "seq": 4,
          "item": "尿酮体 KET",
          "result": "阴性",
          "unit": "—",
          "ref": "阴性",
          "flag": ""
        },
        {
          "seq": 5,
          "item": "尿比重 SG",
          "result": "1.018",
          "unit": "—",
          "ref": "1.005~1.030",
          "flag": ""
        },
        {
          "seq": 6,
          "item": "酸碱度 pH",
          "result": "6.0",
          "unit": "—",
          "ref": "4.5~8.0",
          "flag": ""
        },
        {
          "seq": 7,
          "item": "尿白细胞 LEU",
          "result": "阴性",
          "unit": "—",
          "ref": "阴性",
          "flag": ""
        }
      ],
      "imaging": [
        {
          "dept": "放射科",
          "item": "胸部正位片",
          "result": "未见异常",
          "desc": "双肺纹理清晰，心影大小正常"
        },
        {
          "dept": "超声科",
          "item": "腹部彩超",
          "result": "轻度脂肪肝",
          "desc": "肝回声增强，建议随访"
        },
        {
          "dept": "超声科",
          "item": "甲状腺彩超",
          "result": "未见异常",
          "desc": "双侧甲状腺形态回声正常"
        },
        {
          "dept": "心电室",
          "item": "常规心电图",
          "result": "窦性心律",
          "desc": "心率 76 次/分，未见 ST-T 改变"
        }
      ],
      "abnormals": [
        {
          "dept": "生化",
          "item": "总胆固醇 TC",
          "result": "6.28 mmol/L",
          "ref": "<5.18",
          "advice": "低脂饮食，3 个月复查"
        },
        {
          "dept": "生化",
          "item": "低密度脂蛋白 LDL-C",
          "result": "4.12 mmol/L",
          "ref": "<3.37",
          "advice": "内分泌科评估"
        },
        {
          "dept": "生化",
          "item": "甘油三酯 TG",
          "result": "1.94 mmol/L",
          "ref": "<1.70",
          "advice": "限酒限糖"
        },
        {
          "dept": "生化",
          "item": "空腹血糖 GLU",
          "result": "6.42 mmol/L",
          "ref": "3.90~6.10",
          "advice": "复查糖化血红蛋白"
        },
        {
          "dept": "一般检查",
          "item": "体重指数 BMI",
          "result": "27.4 kg/m²",
          "ref": "18.5~23.9",
          "advice": "减重 3~5kg"
        }
      ],
      "trends": [
        {
          "year": "2022",
          "ldl": 2.86,
          "glucose": 5.24
        },
        {
          "year": "2023",
          "ldl": 3.12,
          "glucose": 5.46
        },
        {
          "year": "2024",
          "ldl": 3.58,
          "glucose": 5.82
        },
        {
          "year": "2025",
          "ldl": 3.84,
          "glucose": 6.08
        },
        {
          "year": "2026",
          "ldl": 4.12,
          "glucose": 6.42
        }
      ],
      "wbc": [
        {
          "name": "中性粒",
          "value": 58.2
        },
        {
          "name": "淋巴",
          "value": 32.4
        },
        {
          "name": "单核",
          "value": 6.1
        },
        {
          "name": "嗜酸",
          "value": 2.6
        },
        {
          "name": "嗜碱",
          "value": 0.7
        }
      ]
    },
    "template": {
      "version": 1,
      "plugins": [
        {
          "id": "@worm-print-platform/echarts",
          "version": "2"
        }
      ],
      "pages": [
        {
          "unit": "mm",
          "paperSize": "A4",
          "orientation": "portrait",
          "name": "封面与总检结论",
          "margins": {
            "top": 10,
            "right": 10,
            "bottom": 10,
            "left": 10
          },
          "header": {
            "height": 14,
            "elements": [
              {
                "id": "hr-17",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 0,
                  "width": 120,
                  "height": 5,
                  "formatter": "{report.org}",
                  "fontSize": 8.5,
                  "color": "#6b7c8f",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-18",
                "type": "text",
                "options": {
                  "left": 120,
                  "top": 0,
                  "width": 70,
                  "height": 5,
                  "formatter": "{report.no} · {report.name}",
                  "fontSize": 8.5,
                  "color": "#6b7c8f",
                  "textAlign": "right",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-19",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 5,
                  "width": 190,
                  "height": 8,
                  "formatter": "{report.title}",
                  "fontSize": 15,
                  "fontWeight": "bold",
                  "letterSpacing": 3,
                  "textAlign": "center",
                  "verticalAlign": "middle",
                  "color": "#26364a"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-20",
                "type": "hline",
                "options": {
                  "left": 0,
                  "top": 13,
                  "width": 190,
                  "height": 1,
                  "borderWidth": 0.8,
                  "borderColor": "#26364a"
                },
                "printElementType": {
                  "type": "hline",
                  "title": "横线"
                }
              }
            ]
          },
          "footer": {
            "height": 18,
            "elements": [
              {
                "id": "hr-21",
                "type": "hline",
                "options": {
                  "left": 0,
                  "top": 0,
                  "width": 190,
                  "height": 1,
                  "borderWidth": 0.6,
                  "borderColor": "#dfe6ee"
                },
                "printElementType": {
                  "type": "hline",
                  "title": "横线"
                }
              },
              {
                "id": "hr-22",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 2,
                  "width": 150,
                  "height": 5,
                  "formatter": "本报告仅供健康参考，不作为临床诊断依据；如有不适请及时就医。",
                  "fontSize": 7.5,
                  "color": "#6b7c8f",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-23",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 8,
                  "width": 150,
                  "height": 5,
                  "formatter": "体检日期：{report.examDate}　总检医师：{report.doctor}　审核：{report.reviewer}",
                  "fontSize": 7.5,
                  "color": "#6b7c8f",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-24",
                "type": "text",
                "options": {
                  "left": 110,
                  "top": 12,
                  "width": 50,
                  "height": 5,
                  "formatter": "第 {pageIndex} 页 / 共 {totalPages} 页",
                  "fontSize": 8,
                  "color": "#26364a",
                  "textAlign": "right",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-25",
                "type": "qrcode",
                "options": {
                  "left": 168,
                  "top": 1,
                  "width": 16,
                  "height": 16,
                  "formatter": "{report.verifyUrl}"
                },
                "printElementType": {
                  "type": "qrcode",
                  "title": "二维码"
                }
              }
            ]
          },
          "watermark": {},
          "elements": [
            {
              "id": "hr-1",
              "type": "text",
              "options": {
                "left": 0,
                "top": 0,
                "width": 190,
                "height": 7,
                "formatter": "一、受检人信息",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-6",
              "type": "table",
              "options": {
                "left": 0,
                "top": 8,
                "width": 190,
                "height": 32,
                "tableMode": "dynamic",
                "tableColWidths": [
                  24,
                  71,
                  24,
                  71
                ],
                "tableDefaultFontSize": 9,
                "tableDefaultPadding": 1,
                "tablePagination": {
                  "enabled": false
                },
                "tableRows": [
                  {
                    "id": "row-hr-2",
                    "type": "header",
                    "height": 8,
                    "cells": [
                      {
                        "id": "cell-hr-2-1",
                        "formatter": "姓名",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-2-2",
                        "formatter": "{report.name}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-2-3",
                        "formatter": "性别",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-2-4",
                        "formatter": "{report.sex}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      }
                    ]
                  },
                  {
                    "id": "row-hr-3",
                    "type": "header",
                    "height": 8,
                    "cells": [
                      {
                        "id": "cell-hr-3-1",
                        "formatter": "年龄",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-3-2",
                        "formatter": "{report.age}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-3-3",
                        "formatter": "体检日期",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-3-4",
                        "formatter": "{report.examDate}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      }
                    ]
                  },
                  {
                    "id": "row-hr-4",
                    "type": "header",
                    "height": 8,
                    "cells": [
                      {
                        "id": "cell-hr-4-1",
                        "formatter": "报告编号",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-4-2",
                        "formatter": "{report.no}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-4-3",
                        "formatter": "联系电话",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-4-4",
                        "formatter": "{report.phone}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      }
                    ]
                  },
                  {
                    "id": "row-hr-5",
                    "type": "header",
                    "height": 8,
                    "cells": [
                      {
                        "id": "cell-hr-5-1",
                        "formatter": "体检套餐",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-5-2",
                        "formatter": "{report.package}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-5-3",
                        "formatter": "总检医师",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-5-4",
                        "formatter": "{report.doctor}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      }
                    ]
                  }
                ]
              },
              "printElementType": {
                "type": "table",
                "title": "表格"
              }
            },
            {
              "id": "hr-7",
              "type": "text",
              "options": {
                "left": 0,
                "top": 44,
                "width": 190,
                "height": 7,
                "formatter": "二、总检结论",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-8",
              "type": "longText",
              "options": {
                "left": 0,
                "top": 52,
                "width": 190,
                "height": 46,
                "formatter": "{summary.conclusion}",
                "fontSize": 9,
                "lineHeight": 14,
                "color": "#26364a",
                "keepLineBreaks": true,
                "wordWrap": true,
                "borderWidth": 0.5,
                "borderColor": "#dfe6ee",
                "contentPaddingLeft": 2
              },
              "printElementType": {
                "type": "longText",
                "title": "长文"
              }
            },
            {
              "id": "hr-9",
              "type": "text",
              "options": {
                "left": 0,
                "top": 102,
                "width": 190,
                "height": 7,
                "formatter": "三、健康建议",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-10",
              "type": "longText",
              "options": {
                "left": 0,
                "top": 110,
                "width": 190,
                "height": 34,
                "formatter": "{summary.advice}",
                "fontSize": 9,
                "lineHeight": 14,
                "color": "#26364a",
                "keepLineBreaks": true,
                "wordWrap": true,
                "borderWidth": 0.5,
                "borderColor": "#dfe6ee",
                "contentPaddingLeft": 2
              },
              "printElementType": {
                "type": "longText",
                "title": "长文"
              }
            },
            {
              "id": "hr-11",
              "type": "text",
              "options": {
                "left": 0,
                "top": 148,
                "width": 190,
                "height": 7,
                "formatter": "四、异常指标汇总（共 {summary.abnormalCount} 项）",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-15",
              "type": "table",
              "options": {
                "left": 0,
                "top": 156,
                "width": 190,
                "height": 23,
                "tableMode": "dynamic",
                "dataSource": "abnormals",
                "tableColWidths": [
                  22,
                  50,
                  34,
                  30,
                  54
                ],
                "tableDefaultFontSize": 8.5,
                "tableDefaultPadding": 1,
                "tablePagination": {
                  "enabled": true
                },
                "tableRows": [
                  {
                    "id": "row-hr-12",
                    "type": "header",
                    "height": 8,
                    "repeatOnPage": true,
                    "cells": [
                      {
                        "id": "cell-hr-12-1",
                        "formatter": "科室",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-12-2",
                        "formatter": "异常项目",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-12-3",
                        "formatter": "本次结果",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-12-4",
                        "formatter": "参考区间",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-12-5",
                        "formatter": "处理建议",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      }
                    ]
                  },
                  {
                    "id": "row-hr-13",
                    "type": "data",
                    "height": 8,
                    "cells": [
                      {
                        "id": "cell-hr-13-1",
                        "formatter": "{abnormals.dept}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-13-2",
                        "formatter": "{abnormals.item}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-13-3",
                        "formatter": "{abnormals.result}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1,
                        "color": "#d0453b",
                        "fontWeight": "bold"
                      },
                      {
                        "id": "cell-hr-13-4",
                        "formatter": "{abnormals.ref}",
                        "valign": "middle",
                        "fontSize": 8,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-13-5",
                        "formatter": "{abnormals.advice}",
                        "valign": "middle",
                        "fontSize": 8,
                        "padding": 1
                      }
                    ]
                  },
                  {
                    "id": "row-hr-14",
                    "type": "summary",
                    "height": 7,
                    "cells": [
                      {
                        "id": "cell-hr-14-1",
                        "formatter": "合计：{summary.abnormalCount} 项异常，详见各专项页",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1,
                        "colspan": 5,
                        "fontWeight": "bold"
                      },
                      {
                        "id": "cell-hr-14-2",
                        "merged": true
                      },
                      {
                        "id": "cell-hr-14-3",
                        "merged": true
                      },
                      {
                        "id": "cell-hr-14-4",
                        "merged": true
                      },
                      {
                        "id": "cell-hr-14-5",
                        "merged": true
                      }
                    ]
                  }
                ]
              },
              "printElementType": {
                "type": "table",
                "title": "表格"
              }
            },
            {
              "id": "hr-16",
              "type": "text",
              "options": {
                "left": 0,
                "top": 183,
                "width": 190,
                "height": 6,
                "formatter": "总检医师：{report.doctor}　　审核医师：{report.reviewer}　　报告日期：{report.date}",
                "fontSize": 9,
                "color": "#26364a",
                "verticalAlign": "middle"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            }
          ]
        },
        {
          "unit": "mm",
          "paperSize": "A4",
          "orientation": "portrait",
          "name": "一般检查",
          "margins": {
            "top": 10,
            "right": 10,
            "bottom": 10,
            "left": 10
          },
          "header": {
            "height": 14,
            "elements": [
              {
                "id": "hr-38",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 0,
                  "width": 120,
                  "height": 5,
                  "formatter": "{report.org}",
                  "fontSize": 8.5,
                  "color": "#6b7c8f",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-39",
                "type": "text",
                "options": {
                  "left": 120,
                  "top": 0,
                  "width": 70,
                  "height": 5,
                  "formatter": "{report.no} · {report.name}",
                  "fontSize": 8.5,
                  "color": "#6b7c8f",
                  "textAlign": "right",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-40",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 5,
                  "width": 190,
                  "height": 8,
                  "formatter": "{report.title}",
                  "fontSize": 15,
                  "fontWeight": "bold",
                  "letterSpacing": 3,
                  "textAlign": "center",
                  "verticalAlign": "middle",
                  "color": "#26364a"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-41",
                "type": "hline",
                "options": {
                  "left": 0,
                  "top": 13,
                  "width": 190,
                  "height": 1,
                  "borderWidth": 0.8,
                  "borderColor": "#26364a"
                },
                "printElementType": {
                  "type": "hline",
                  "title": "横线"
                }
              }
            ]
          },
          "footer": {
            "height": 18,
            "elements": [
              {
                "id": "hr-42",
                "type": "hline",
                "options": {
                  "left": 0,
                  "top": 0,
                  "width": 190,
                  "height": 1,
                  "borderWidth": 0.6,
                  "borderColor": "#dfe6ee"
                },
                "printElementType": {
                  "type": "hline",
                  "title": "横线"
                }
              },
              {
                "id": "hr-43",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 2,
                  "width": 150,
                  "height": 5,
                  "formatter": "本报告仅供健康参考，不作为临床诊断依据；如有不适请及时就医。",
                  "fontSize": 7.5,
                  "color": "#6b7c8f",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-44",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 8,
                  "width": 150,
                  "height": 5,
                  "formatter": "体检日期：{report.examDate}　总检医师：{report.doctor}　审核：{report.reviewer}",
                  "fontSize": 7.5,
                  "color": "#6b7c8f",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-45",
                "type": "text",
                "options": {
                  "left": 110,
                  "top": 12,
                  "width": 50,
                  "height": 5,
                  "formatter": "第 {pageIndex} 页 / 共 {totalPages} 页",
                  "fontSize": 8,
                  "color": "#26364a",
                  "textAlign": "right",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-46",
                "type": "qrcode",
                "options": {
                  "left": 168,
                  "top": 1,
                  "width": 16,
                  "height": 16,
                  "formatter": "{report.verifyUrl}"
                },
                "printElementType": {
                  "type": "qrcode",
                  "title": "二维码"
                }
              }
            ]
          },
          "watermark": {},
          "elements": [
            {
              "id": "hr-26",
              "type": "text",
              "options": {
                "left": 0,
                "top": 0,
                "width": 190,
                "height": 7,
                "formatter": "一、一般检查 / 体格测量",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-29",
              "type": "table",
              "options": {
                "left": 0,
                "top": 8,
                "width": 190,
                "height": 16,
                "tableMode": "dynamic",
                "dataSource": "vitals",
                "tableColWidths": [
                  16,
                  52,
                  30,
                  26,
                  44,
                  22
                ],
                "tableDefaultFontSize": 8.5,
                "tableDefaultPadding": 1,
                "tablePagination": {
                  "enabled": true
                },
                "tableRows": [
                  {
                    "id": "row-hr-27",
                    "type": "header",
                    "height": 8,
                    "repeatOnPage": true,
                    "cells": [
                      {
                        "id": "cell-hr-27-1",
                        "formatter": "序号",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-27-2",
                        "formatter": "检查项目",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-27-3",
                        "formatter": "结果",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-27-4",
                        "formatter": "单位",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-27-5",
                        "formatter": "参考区间",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-27-6",
                        "formatter": "提示",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      }
                    ]
                  },
                  {
                    "id": "row-hr-28",
                    "type": "data",
                    "height": 8,
                    "cells": [
                      {
                        "id": "cell-hr-28-1",
                        "formatter": "{vitals.seq}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1,
                        "align": "center"
                      },
                      {
                        "id": "cell-hr-28-2",
                        "formatter": "{vitals.item}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-28-3",
                        "formatter": "{vitals.result}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1,
                        "align": "right"
                      },
                      {
                        "id": "cell-hr-28-4",
                        "formatter": "{vitals.unit}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1,
                        "align": "center"
                      },
                      {
                        "id": "cell-hr-28-5",
                        "formatter": "{vitals.ref}",
                        "valign": "middle",
                        "fontSize": 8,
                        "padding": 1,
                        "align": "center"
                      },
                      {
                        "id": "cell-hr-28-6",
                        "formatter": "{vitals.flag}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1,
                        "align": "center",
                        "color": "#d0453b",
                        "fontWeight": "bold"
                      }
                    ]
                  }
                ]
              },
              "printElementType": {
                "type": "table",
                "title": "表格"
              }
            },
            {
              "id": "hr-30",
              "type": "text",
              "options": {
                "left": 0,
                "top": 28,
                "width": 190,
                "height": 7,
                "formatter": "二、主要指标与参考区间对照",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-31",
              "type": "image",
              "options": {
                "left": 0,
                "top": 36,
                "width": 190,
                "height": 46.7,
                "src": "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%25%22%20height%3D%22100%25%22%20viewBox%3D%220%200%20700%20172%22%20preserveAspectRatio%3D%22none%22%3E%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%22700%22%20height%3D%22172%22%20fill%3D%22%23ffffff%22%2F%3E%3Ctext%20x%3D%228%22%20y%3D%2214%22%20font-size%3D%2211%22%20fill%3D%22%236b7c8f%22%3E%E7%81%B0%E5%B8%A6%E4%B8%BA%E5%8F%82%E8%80%83%E5%8C%BA%E9%97%B4%EF%BC%8C%E5%9C%86%E7%82%B9%E4%B8%BA%E6%9C%AC%E6%AC%A1%E6%B5%8B%E9%87%8F%E5%80%BC%3C%2Ftext%3E%3Ctext%20x%3D%228%22%20y%3D%2244%22%20font-size%3D%2212%22%20fill%3D%22%2326364a%22%3E%E4%BD%93%E9%87%8D%E6%8C%87%E6%95%B0%20BMI%3C%2Ftext%3E%3Cline%20x1%3D%22150%22%20y1%3D%2238%22%20x2%3D%22640%22%20y2%3D%2238%22%20stroke%3D%22%23dfe6ee%22%20stroke-width%3D%2210%22%2F%3E%3Cline%20x1%3D%22280.6195965417868%22%20y1%3D%2238%22%20x2%3D%22471.25360230547557%22%20y2%3D%2238%22%20stroke%3D%22%23e9eff6%22%20stroke-width%3D%2210%22%2F%3E%3Ccircle%20cx%3D%22594.8126801152739%22%20cy%3D%2238%22%20r%3D%228%22%20fill%3D%22%23d0453b%22%2F%3E%3Ctext%20x%3D%22650%22%20y%3D%2243%22%20font-size%3D%2211%22%20fill%3D%22%23d0453b%22%3E27.4%20%E2%86%91%3C%2Ftext%3E%3Ctext%20x%3D%228%22%20y%3D%2290%22%20font-size%3D%2212%22%20fill%3D%22%2326364a%22%3E%E6%94%B6%E7%BC%A9%E5%8E%8B%20mmHg%3C%2Ftext%3E%3Cline%20x1%3D%22150%22%20y1%3D%2284%22%20x2%3D%22640%22%20y2%3D%2284%22%20stroke%3D%22%23dfe6ee%22%20stroke-width%3D%2210%22%2F%3E%3Cline%20x1%3D%22243.03797468354432%22%20y1%3D%2284%22%20x2%3D%22496.3080168776372%22%20y2%3D%2284%22%20stroke%3D%22%23e9eff6%22%20stroke-width%3D%2210%22%2F%3E%3Ccircle%20cx%3D%22491.1392405063292%22%20cy%3D%2284%22%20r%3D%228%22%20fill%3D%22%232e8b6b%22%2F%3E%3Ctext%20x%3D%22650%22%20y%3D%2289%22%20font-size%3D%2211%22%20fill%3D%22%232e8b6b%22%3E138%3C%2Ftext%3E%3Ctext%20x%3D%228%22%20y%3D%22136%22%20font-size%3D%2212%22%20fill%3D%22%2326364a%22%3E%E6%80%BB%E8%83%86%E5%9B%BA%E9%86%87%20mmol%2FL%3C%2Ftext%3E%3Cline%20x1%3D%22150%22%20y1%3D%22130%22%20x2%3D%22640%22%20y2%3D%22130%22%20stroke%3D%22%23dfe6ee%22%20stroke-width%3D%2210%22%2F%3E%3Cline%20x1%3D%22231.31691648822266%22%20y1%3D%22130%22%20x2%3D%22504.1220556745182%22%20y2%3D%22130%22%20stroke%3D%22%23e9eff6%22%20stroke-width%3D%2210%22%2F%3E%3Ccircle%20cx%3D%22648.3940042826554%22%20cy%3D%22130%22%20r%3D%228%22%20fill%3D%22%23d0453b%22%2F%3E%3Ctext%20x%3D%22650%22%20y%3D%22135%22%20font-size%3D%2211%22%20fill%3D%22%23d0453b%22%3E6.28%20%E2%86%91%3C%2Ftext%3E%3C%2Fsvg%3E",
                "borderWidth": 0.5,
                "borderColor": "#dfe6ee"
              },
              "printElementType": {
                "type": "image",
                "title": "图片"
              }
            },
            {
              "id": "hr-32",
              "type": "text",
              "options": {
                "left": 0,
                "top": 86,
                "width": 190,
                "height": 7,
                "formatter": "三、科室检查记录",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-35",
              "type": "table",
              "options": {
                "left": 0,
                "top": 94,
                "width": 190,
                "height": 16,
                "tableMode": "dynamic",
                "dataSource": "clinical",
                "tableColWidths": [
                  24,
                  36,
                  28,
                  102
                ],
                "tableDefaultFontSize": 8.5,
                "tableDefaultPadding": 1,
                "tablePagination": {
                  "enabled": true
                },
                "tableRows": [
                  {
                    "id": "row-hr-33",
                    "type": "header",
                    "height": 8,
                    "repeatOnPage": true,
                    "cells": [
                      {
                        "id": "cell-hr-33-1",
                        "formatter": "科室",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-33-2",
                        "formatter": "检查项目",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-33-3",
                        "formatter": "结果",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-33-4",
                        "formatter": "检查所见",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      }
                    ]
                  },
                  {
                    "id": "row-hr-34",
                    "type": "data",
                    "height": 8,
                    "cells": [
                      {
                        "id": "cell-hr-34-1",
                        "formatter": "{clinical.dept}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-34-2",
                        "formatter": "{clinical.item}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-34-3",
                        "formatter": "{clinical.result}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-34-4",
                        "formatter": "{clinical.desc}",
                        "valign": "middle",
                        "fontSize": 8,
                        "padding": 1
                      }
                    ]
                  }
                ]
              },
              "printElementType": {
                "type": "table",
                "title": "表格"
              }
            },
            {
              "id": "hr-36",
              "type": "text",
              "options": {
                "left": 0,
                "top": 114,
                "width": 190,
                "height": 7,
                "formatter": "四、一般检查小结",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-37",
              "type": "longText",
              "options": {
                "left": 0,
                "top": 122,
                "width": 190,
                "height": 24,
                "formatter": "体重指数 27.4 kg/m² 超出参考区间，血压 138/88 mmHg 处于正常高值，其余体格测量与各科查体未见异常。\n建议控制总热量摄入并规律有氧运动，3 个月后复测体重、血压与血脂。",
                "fontSize": 9,
                "lineHeight": 14,
                "color": "#26364a",
                "keepLineBreaks": true,
                "wordWrap": true,
                "borderWidth": 0.5,
                "borderColor": "#dfe6ee",
                "contentPaddingLeft": 2
              },
              "printElementType": {
                "type": "longText",
                "title": "长文"
              }
            }
          ]
        },
        {
          "unit": "mm",
          "paperSize": "A4",
          "orientation": "portrait",
          "name": "血常规",
          "margins": {
            "top": 10,
            "right": 10,
            "bottom": 10,
            "left": 10
          },
          "header": {
            "height": 14,
            "elements": [
              {
                "id": "hr-57",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 0,
                  "width": 120,
                  "height": 5,
                  "formatter": "{report.org}",
                  "fontSize": 8.5,
                  "color": "#6b7c8f",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-58",
                "type": "text",
                "options": {
                  "left": 120,
                  "top": 0,
                  "width": 70,
                  "height": 5,
                  "formatter": "{report.no} · {report.name}",
                  "fontSize": 8.5,
                  "color": "#6b7c8f",
                  "textAlign": "right",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-59",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 5,
                  "width": 190,
                  "height": 8,
                  "formatter": "{report.title}",
                  "fontSize": 15,
                  "fontWeight": "bold",
                  "letterSpacing": 3,
                  "textAlign": "center",
                  "verticalAlign": "middle",
                  "color": "#26364a"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-60",
                "type": "hline",
                "options": {
                  "left": 0,
                  "top": 13,
                  "width": 190,
                  "height": 1,
                  "borderWidth": 0.8,
                  "borderColor": "#26364a"
                },
                "printElementType": {
                  "type": "hline",
                  "title": "横线"
                }
              }
            ]
          },
          "footer": {
            "height": 18,
            "elements": [
              {
                "id": "hr-61",
                "type": "hline",
                "options": {
                  "left": 0,
                  "top": 0,
                  "width": 190,
                  "height": 1,
                  "borderWidth": 0.6,
                  "borderColor": "#dfe6ee"
                },
                "printElementType": {
                  "type": "hline",
                  "title": "横线"
                }
              },
              {
                "id": "hr-62",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 2,
                  "width": 150,
                  "height": 5,
                  "formatter": "本报告仅供健康参考，不作为临床诊断依据；如有不适请及时就医。",
                  "fontSize": 7.5,
                  "color": "#6b7c8f",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-63",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 8,
                  "width": 150,
                  "height": 5,
                  "formatter": "体检日期：{report.examDate}　总检医师：{report.doctor}　审核：{report.reviewer}",
                  "fontSize": 7.5,
                  "color": "#6b7c8f",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-64",
                "type": "text",
                "options": {
                  "left": 110,
                  "top": 12,
                  "width": 50,
                  "height": 5,
                  "formatter": "第 {pageIndex} 页 / 共 {totalPages} 页",
                  "fontSize": 8,
                  "color": "#26364a",
                  "textAlign": "right",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-65",
                "type": "qrcode",
                "options": {
                  "left": 168,
                  "top": 1,
                  "width": 16,
                  "height": 16,
                  "formatter": "{report.verifyUrl}"
                },
                "printElementType": {
                  "type": "qrcode",
                  "title": "二维码"
                }
              }
            ]
          },
          "watermark": {},
          "elements": [
            {
              "id": "hr-47",
              "type": "text",
              "options": {
                "left": 0,
                "top": 0,
                "width": 190,
                "height": 7,
                "formatter": "一、血常规（五分类）",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-51",
              "type": "table",
              "options": {
                "left": 0,
                "top": 8,
                "width": 190,
                "height": 24,
                "tableMode": "dynamic",
                "dataSource": "blood",
                "tableColWidths": [
                  16,
                  54,
                  28,
                  22,
                  42,
                  28
                ],
                "tableDefaultFontSize": 8.5,
                "tableDefaultPadding": 1,
                "tablePagination": {
                  "enabled": true
                },
                "tableRows": [
                  {
                    "id": "row-hr-48",
                    "type": "header",
                    "height": 8,
                    "repeatOnPage": true,
                    "cells": [
                      {
                        "id": "cell-hr-48-1",
                        "formatter": "序号",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5,
                        "rowspan": 2
                      },
                      {
                        "id": "cell-hr-48-2",
                        "formatter": "检验项目",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5,
                        "rowspan": 2
                      },
                      {
                        "id": "cell-hr-48-3",
                        "formatter": "检验结果",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5,
                        "colspan": 2
                      },
                      {
                        "id": "cell-hr-48-4",
                        "merged": true
                      },
                      {
                        "id": "cell-hr-48-5",
                        "formatter": "参考与判定",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5,
                        "colspan": 2
                      },
                      {
                        "id": "cell-hr-48-6",
                        "merged": true
                      }
                    ]
                  },
                  {
                    "id": "row-hr-49",
                    "type": "header",
                    "height": 8,
                    "cells": [
                      {
                        "id": "cell-hr-49-1",
                        "merged": true
                      },
                      {
                        "id": "cell-hr-49-2",
                        "merged": true
                      },
                      {
                        "id": "cell-hr-49-3",
                        "formatter": "结果",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-49-4",
                        "formatter": "单位",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-49-5",
                        "formatter": "参考区间",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-49-6",
                        "formatter": "提示",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      }
                    ]
                  },
                  {
                    "id": "row-hr-50",
                    "type": "data",
                    "height": 8,
                    "cells": [
                      {
                        "id": "cell-hr-50-1",
                        "formatter": "{blood.seq}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1,
                        "align": "center"
                      },
                      {
                        "id": "cell-hr-50-2",
                        "formatter": "{blood.item}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-50-3",
                        "formatter": "{blood.result}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1,
                        "align": "right",
                        "fontWeight": "bold"
                      },
                      {
                        "id": "cell-hr-50-4",
                        "formatter": "{blood.unit}",
                        "valign": "middle",
                        "fontSize": 8,
                        "padding": 1,
                        "align": "center"
                      },
                      {
                        "id": "cell-hr-50-5",
                        "formatter": "{blood.ref}",
                        "valign": "middle",
                        "fontSize": 8,
                        "padding": 1,
                        "align": "center"
                      },
                      {
                        "id": "cell-hr-50-6",
                        "formatter": "{blood.flag}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1,
                        "align": "center",
                        "color": "#d0453b",
                        "fontWeight": "bold"
                      }
                    ]
                  }
                ]
              },
              "printElementType": {
                "type": "table",
                "title": "表格"
              }
            },
            {
              "id": "hr-52",
              "type": "text",
              "options": {
                "left": 0,
                "top": 36,
                "width": 190,
                "height": 7,
                "formatter": "二、白细胞分类占比",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-53",
              "type": "barChart",
              "options": {
                "left": 0,
                "top": 44,
                "width": 190,
                "height": 53.2,
                "chartOption": {
                  "title": {
                    "text": "白细胞分类（%）",
                    "left": "center",
                    "textStyle": {
                      "fontSize": 12,
                      "color": "#26364a"
                    }
                  },
                  "grid": {
                    "left": "8%",
                    "right": "8%",
                    "bottom": "12%",
                    "top": "22%",
                    "containLabel": true
                  },
                  "xAxis": {
                    "type": "category",
                    "data": [
                      "$data"
                    ]
                  },
                  "yAxis": {
                    "type": "value",
                    "max": 100
                  },
                  "series": [
                    {
                      "type": "bar",
                      "name": "占比",
                      "data": [
                        "$data"
                      ],
                      "barWidth": "46%",
                      "itemStyle": {
                        "color": "#2f6fb5"
                      }
                    }
                  ]
                },
                "chartDataSource": "wbc",
                "chartCategoryField": "name",
                "chartValueFields": [
                  "value"
                ]
              },
              "printElementType": {
                "type": "barChart",
                "title": "柱状图"
              }
            },
            {
              "id": "hr-54",
              "type": "text",
              "options": {
                "left": 0,
                "top": 100,
                "width": 190,
                "height": 7,
                "formatter": "三、检验意见",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-55",
              "type": "longText",
              "options": {
                "left": 0,
                "top": 108,
                "width": 190,
                "height": 24,
                "formatter": "白细胞总数及五分类比例均在参考区间内，红细胞、血红蛋白与血小板未见异常，本次血常规未提示感染、贫血或血小板异常。\n检验者：王倩　　审核者：{report.reviewer}",
                "fontSize": 9,
                "lineHeight": 14,
                "color": "#26364a",
                "keepLineBreaks": true,
                "wordWrap": true,
                "borderWidth": 0.5,
                "borderColor": "#dfe6ee",
                "contentPaddingLeft": 2
              },
              "printElementType": {
                "type": "longText",
                "title": "长文"
              }
            },
            {
              "id": "hr-56",
              "type": "text",
              "options": {
                "left": 0,
                "top": 136,
                "width": 190,
                "height": 6,
                "formatter": "标本类型：EDTA-K2 抗凝全血　　采集时间：{report.examDate} 08:12",
                "fontSize": 8,
                "color": "#6b7c8f",
                "verticalAlign": "middle"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            }
          ]
        },
        {
          "unit": "mm",
          "paperSize": "A4",
          "orientation": "portrait",
          "name": "生化检验",
          "margins": {
            "top": 10,
            "right": 10,
            "bottom": 10,
            "left": 10
          },
          "header": {
            "height": 14,
            "elements": [
              {
                "id": "hr-75",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 0,
                  "width": 120,
                  "height": 5,
                  "formatter": "{report.org}",
                  "fontSize": 8.5,
                  "color": "#6b7c8f",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-76",
                "type": "text",
                "options": {
                  "left": 120,
                  "top": 0,
                  "width": 70,
                  "height": 5,
                  "formatter": "{report.no} · {report.name}",
                  "fontSize": 8.5,
                  "color": "#6b7c8f",
                  "textAlign": "right",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-77",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 5,
                  "width": 190,
                  "height": 8,
                  "formatter": "{report.title}",
                  "fontSize": 15,
                  "fontWeight": "bold",
                  "letterSpacing": 3,
                  "textAlign": "center",
                  "verticalAlign": "middle",
                  "color": "#26364a"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-78",
                "type": "hline",
                "options": {
                  "left": 0,
                  "top": 13,
                  "width": 190,
                  "height": 1,
                  "borderWidth": 0.8,
                  "borderColor": "#26364a"
                },
                "printElementType": {
                  "type": "hline",
                  "title": "横线"
                }
              }
            ]
          },
          "footer": {
            "height": 18,
            "elements": [
              {
                "id": "hr-79",
                "type": "hline",
                "options": {
                  "left": 0,
                  "top": 0,
                  "width": 190,
                  "height": 1,
                  "borderWidth": 0.6,
                  "borderColor": "#dfe6ee"
                },
                "printElementType": {
                  "type": "hline",
                  "title": "横线"
                }
              },
              {
                "id": "hr-80",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 2,
                  "width": 150,
                  "height": 5,
                  "formatter": "本报告仅供健康参考，不作为临床诊断依据；如有不适请及时就医。",
                  "fontSize": 7.5,
                  "color": "#6b7c8f",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-81",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 8,
                  "width": 150,
                  "height": 5,
                  "formatter": "体检日期：{report.examDate}　总检医师：{report.doctor}　审核：{report.reviewer}",
                  "fontSize": 7.5,
                  "color": "#6b7c8f",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-82",
                "type": "text",
                "options": {
                  "left": 110,
                  "top": 12,
                  "width": 50,
                  "height": 5,
                  "formatter": "第 {pageIndex} 页 / 共 {totalPages} 页",
                  "fontSize": 8,
                  "color": "#26364a",
                  "textAlign": "right",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-83",
                "type": "qrcode",
                "options": {
                  "left": 168,
                  "top": 1,
                  "width": 16,
                  "height": 16,
                  "formatter": "{report.verifyUrl}"
                },
                "printElementType": {
                  "type": "qrcode",
                  "title": "二维码"
                }
              }
            ]
          },
          "watermark": {},
          "elements": [
            {
              "id": "hr-66",
              "type": "text",
              "options": {
                "left": 0,
                "top": 0,
                "width": 190,
                "height": 7,
                "formatter": "一、生化检验（血脂 / 糖代谢 / 肝肾功能）",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-70",
              "type": "table",
              "options": {
                "left": 0,
                "top": 8,
                "width": 190,
                "height": 23,
                "tableMode": "dynamic",
                "dataSource": "chemistry",
                "tableColWidths": [
                  16,
                  58,
                  28,
                  24,
                  42,
                  22
                ],
                "tableDefaultFontSize": 8.5,
                "tableDefaultPadding": 1,
                "tablePagination": {
                  "enabled": true
                },
                "tableRows": [
                  {
                    "id": "row-hr-67",
                    "type": "header",
                    "height": 8,
                    "repeatOnPage": true,
                    "cells": [
                      {
                        "id": "cell-hr-67-1",
                        "formatter": "序号",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-67-2",
                        "formatter": "检验项目",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-67-3",
                        "formatter": "结果",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-67-4",
                        "formatter": "单位",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-67-5",
                        "formatter": "参考区间",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-67-6",
                        "formatter": "提示",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      }
                    ]
                  },
                  {
                    "id": "row-hr-68",
                    "type": "data",
                    "height": 8,
                    "cells": [
                      {
                        "id": "cell-hr-68-1",
                        "formatter": "{chemistry.seq}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1,
                        "align": "center"
                      },
                      {
                        "id": "cell-hr-68-2",
                        "formatter": "{chemistry.item}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-68-3",
                        "formatter": "{chemistry.result}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1,
                        "align": "right",
                        "fontWeight": "bold"
                      },
                      {
                        "id": "cell-hr-68-4",
                        "formatter": "{chemistry.unit}",
                        "valign": "middle",
                        "fontSize": 8,
                        "padding": 1,
                        "align": "center"
                      },
                      {
                        "id": "cell-hr-68-5",
                        "formatter": "{chemistry.ref}",
                        "valign": "middle",
                        "fontSize": 8,
                        "padding": 1,
                        "align": "center"
                      },
                      {
                        "id": "cell-hr-68-6",
                        "formatter": "{chemistry.flag}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1,
                        "align": "center",
                        "color": "#d0453b",
                        "fontWeight": "bold"
                      }
                    ]
                  },
                  {
                    "id": "row-hr-69",
                    "type": "summary",
                    "height": 7,
                    "cells": [
                      {
                        "id": "cell-hr-69-1",
                        "formatter": "注：H 表示高于参考区间；肝肾功能各项本次均在正常范围。",
                        "valign": "middle",
                        "fontSize": 8,
                        "padding": 1,
                        "colspan": 6,
                        "color": "#6b7c8f"
                      },
                      {
                        "id": "cell-hr-69-2",
                        "merged": true
                      },
                      {
                        "id": "cell-hr-69-3",
                        "merged": true
                      },
                      {
                        "id": "cell-hr-69-4",
                        "merged": true
                      },
                      {
                        "id": "cell-hr-69-5",
                        "merged": true
                      },
                      {
                        "id": "cell-hr-69-6",
                        "merged": true
                      }
                    ]
                  }
                ]
              },
              "printElementType": {
                "type": "table",
                "title": "表格"
              }
            },
            {
              "id": "hr-71",
              "type": "text",
              "options": {
                "left": 0,
                "top": 35,
                "width": 190,
                "height": 7,
                "formatter": "二、历年血脂与血糖趋势",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-72",
              "type": "lineChart",
              "options": {
                "left": 0,
                "top": 43,
                "width": 190,
                "height": 58.6,
                "chartOption": {
                  "title": {
                    "text": "LDL-C 与空腹血糖趋势",
                    "left": "center",
                    "textStyle": {
                      "fontSize": 12,
                      "color": "#26364a"
                    }
                  },
                  "tooltip": {
                    "trigger": "axis"
                  },
                  "legend": {
                    "data": [
                      "LDL-C",
                      "空腹血糖"
                    ],
                    "bottom": 0,
                    "textStyle": {
                      "fontSize": 10
                    }
                  },
                  "grid": {
                    "left": "8%",
                    "right": "8%",
                    "bottom": "18%",
                    "top": "22%",
                    "containLabel": true
                  },
                  "xAxis": {
                    "type": "category",
                    "data": [
                      "$data"
                    ]
                  },
                  "yAxis": {
                    "type": "value"
                  },
                  "series": [
                    {
                      "type": "line",
                      "name": "LDL-C",
                      "data": [
                        "$data"
                      ],
                      "smooth": true,
                      "lineStyle": {
                        "width": 2
                      },
                      "itemStyle": {
                        "color": "#2f6fb5"
                      }
                    },
                    {
                      "type": "line",
                      "name": "空腹血糖",
                      "data": [
                        "$data"
                      ],
                      "smooth": true,
                      "lineStyle": {
                        "width": 2
                      },
                      "itemStyle": {
                        "color": "#2e8b6b"
                      }
                    }
                  ]
                },
                "chartDataSource": "trends",
                "chartCategoryField": "year",
                "chartValueFields": [
                  "ldl",
                  "glucose"
                ]
              },
              "printElementType": {
                "type": "lineChart",
                "title": "折线图"
              }
            },
            {
              "id": "hr-73",
              "type": "text",
              "options": {
                "left": 0,
                "top": 105,
                "width": 190,
                "height": 7,
                "formatter": "三、检验意见",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-74",
              "type": "longText",
              "options": {
                "left": 0,
                "top": 113,
                "width": 190,
                "height": 30,
                "formatter": "总胆固醇、甘油三酯与低密度脂蛋白胆固醇持续升高，空腹血糖已进入空腹血糖受损区间，提示心血管代谢风险上升；肝肾功能指标正常。\n建议 3 个月生活方式干预后复查血脂四项、空腹血糖及糖化血红蛋白，必要时至内分泌科门诊进一步评估。",
                "fontSize": 9,
                "lineHeight": 14,
                "color": "#26364a",
                "keepLineBreaks": true,
                "wordWrap": true,
                "borderWidth": 0.5,
                "borderColor": "#dfe6ee",
                "contentPaddingLeft": 2
              },
              "printElementType": {
                "type": "longText",
                "title": "长文"
              }
            }
          ]
        },
        {
          "unit": "mm",
          "paperSize": "A4",
          "orientation": "portrait",
          "name": "尿常规与影像检查",
          "margins": {
            "top": 10,
            "right": 10,
            "bottom": 10,
            "left": 10
          },
          "header": {
            "height": 14,
            "elements": [
              {
                "id": "hr-95",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 0,
                  "width": 120,
                  "height": 5,
                  "formatter": "{report.org}",
                  "fontSize": 8.5,
                  "color": "#6b7c8f",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-96",
                "type": "text",
                "options": {
                  "left": 120,
                  "top": 0,
                  "width": 70,
                  "height": 5,
                  "formatter": "{report.no} · {report.name}",
                  "fontSize": 8.5,
                  "color": "#6b7c8f",
                  "textAlign": "right",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-97",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 5,
                  "width": 190,
                  "height": 8,
                  "formatter": "{report.title}",
                  "fontSize": 15,
                  "fontWeight": "bold",
                  "letterSpacing": 3,
                  "textAlign": "center",
                  "verticalAlign": "middle",
                  "color": "#26364a"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-98",
                "type": "hline",
                "options": {
                  "left": 0,
                  "top": 13,
                  "width": 190,
                  "height": 1,
                  "borderWidth": 0.8,
                  "borderColor": "#26364a"
                },
                "printElementType": {
                  "type": "hline",
                  "title": "横线"
                }
              }
            ]
          },
          "footer": {
            "height": 18,
            "elements": [
              {
                "id": "hr-99",
                "type": "hline",
                "options": {
                  "left": 0,
                  "top": 0,
                  "width": 190,
                  "height": 1,
                  "borderWidth": 0.6,
                  "borderColor": "#dfe6ee"
                },
                "printElementType": {
                  "type": "hline",
                  "title": "横线"
                }
              },
              {
                "id": "hr-100",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 2,
                  "width": 150,
                  "height": 5,
                  "formatter": "本报告仅供健康参考，不作为临床诊断依据；如有不适请及时就医。",
                  "fontSize": 7.5,
                  "color": "#6b7c8f",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-101",
                "type": "text",
                "options": {
                  "left": 0,
                  "top": 8,
                  "width": 150,
                  "height": 5,
                  "formatter": "体检日期：{report.examDate}　总检医师：{report.doctor}　审核：{report.reviewer}",
                  "fontSize": 7.5,
                  "color": "#6b7c8f",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-102",
                "type": "text",
                "options": {
                  "left": 110,
                  "top": 12,
                  "width": 50,
                  "height": 5,
                  "formatter": "第 {pageIndex} 页 / 共 {totalPages} 页",
                  "fontSize": 8,
                  "color": "#26364a",
                  "textAlign": "right",
                  "verticalAlign": "middle"
                },
                "printElementType": {
                  "type": "text",
                  "title": "文本"
                }
              },
              {
                "id": "hr-103",
                "type": "qrcode",
                "options": {
                  "left": 168,
                  "top": 1,
                  "width": 16,
                  "height": 16,
                  "formatter": "{report.verifyUrl}"
                },
                "printElementType": {
                  "type": "qrcode",
                  "title": "二维码"
                }
              }
            ]
          },
          "watermark": {},
          "elements": [
            {
              "id": "hr-84",
              "type": "text",
              "options": {
                "left": 0,
                "top": 0,
                "width": 190,
                "height": 7,
                "formatter": "一、尿常规",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-87",
              "type": "table",
              "options": {
                "left": 0,
                "top": 8,
                "width": 190,
                "height": 16,
                "tableMode": "dynamic",
                "dataSource": "urine",
                "tableColWidths": [
                  16,
                  58,
                  28,
                  24,
                  42,
                  22
                ],
                "tableDefaultFontSize": 8.5,
                "tableDefaultPadding": 1,
                "tablePagination": {
                  "enabled": true
                },
                "tableRows": [
                  {
                    "id": "row-hr-85",
                    "type": "header",
                    "height": 8,
                    "repeatOnPage": true,
                    "cells": [
                      {
                        "id": "cell-hr-85-1",
                        "formatter": "序号",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-85-2",
                        "formatter": "检验项目",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-85-3",
                        "formatter": "结果",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-85-4",
                        "formatter": "单位",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-85-5",
                        "formatter": "参考区间",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-85-6",
                        "formatter": "提示",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      }
                    ]
                  },
                  {
                    "id": "row-hr-86",
                    "type": "data",
                    "height": 8,
                    "cells": [
                      {
                        "id": "cell-hr-86-1",
                        "formatter": "{urine.seq}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1,
                        "align": "center"
                      },
                      {
                        "id": "cell-hr-86-2",
                        "formatter": "{urine.item}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-86-3",
                        "formatter": "{urine.result}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1,
                        "align": "right"
                      },
                      {
                        "id": "cell-hr-86-4",
                        "formatter": "{urine.unit}",
                        "valign": "middle",
                        "fontSize": 8,
                        "padding": 1,
                        "align": "center"
                      },
                      {
                        "id": "cell-hr-86-5",
                        "formatter": "{urine.ref}",
                        "valign": "middle",
                        "fontSize": 8,
                        "padding": 1,
                        "align": "center"
                      },
                      {
                        "id": "cell-hr-86-6",
                        "formatter": "{urine.flag}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1,
                        "align": "center",
                        "color": "#d0453b"
                      }
                    ]
                  }
                ]
              },
              "printElementType": {
                "type": "table",
                "title": "表格"
              }
            },
            {
              "id": "hr-88",
              "type": "text",
              "options": {
                "left": 0,
                "top": 28,
                "width": 190,
                "height": 7,
                "formatter": "二、影像与心电检查",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-91",
              "type": "table",
              "options": {
                "left": 0,
                "top": 36,
                "width": 190,
                "height": 16,
                "tableMode": "dynamic",
                "dataSource": "imaging",
                "tableColWidths": [
                  24,
                  40,
                  32,
                  94
                ],
                "tableDefaultFontSize": 8.5,
                "tableDefaultPadding": 1,
                "tablePagination": {
                  "enabled": true
                },
                "tableRows": [
                  {
                    "id": "row-hr-89",
                    "type": "header",
                    "height": 8,
                    "repeatOnPage": true,
                    "cells": [
                      {
                        "id": "cell-hr-89-1",
                        "formatter": "科室",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-89-2",
                        "formatter": "检查项目",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-89-3",
                        "formatter": "结果",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      },
                      {
                        "id": "cell-hr-89-4",
                        "formatter": "检查所见",
                        "align": "center",
                        "valign": "middle",
                        "fontWeight": "bold",
                        "backgroundColor": "#eef2f7",
                        "fontSize": 8.5
                      }
                    ]
                  },
                  {
                    "id": "row-hr-90",
                    "type": "data",
                    "height": 8,
                    "cells": [
                      {
                        "id": "cell-hr-90-1",
                        "formatter": "{imaging.dept}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-90-2",
                        "formatter": "{imaging.item}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-90-3",
                        "formatter": "{imaging.result}",
                        "valign": "middle",
                        "fontSize": 8.5,
                        "padding": 1
                      },
                      {
                        "id": "cell-hr-90-4",
                        "formatter": "{imaging.desc}",
                        "valign": "middle",
                        "fontSize": 8,
                        "padding": 1
                      }
                    ]
                  }
                ]
              },
              "printElementType": {
                "type": "table",
                "title": "表格"
              }
            },
            {
              "id": "hr-92",
              "type": "text",
              "options": {
                "left": 0,
                "top": 56,
                "width": 190,
                "height": 7,
                "formatter": "三、复诊与随访建议",
                "fontSize": 10.5,
                "fontWeight": "bold",
                "color": "#26364a",
                "verticalAlign": "middle",
                "backgroundColor": "#eef2f7"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            },
            {
              "id": "hr-93",
              "type": "longText",
              "options": {
                "left": 0,
                "top": 64,
                "width": 190,
                "height": 30,
                "formatter": "尿常规各项阴性，肾功能未见损害；心电图与胸片正常，腹部超声提示轻度脂肪肝，与血脂异常及超重相符。\n建议：① 3 个月复查血脂、血糖与肝脏超声；② 每年完成一次全面健康体检；③ 出现胸闷、头晕或持续乏力请及时就诊。",
                "fontSize": 9,
                "lineHeight": 14,
                "color": "#26364a",
                "keepLineBreaks": true,
                "wordWrap": true,
                "borderWidth": 0.5,
                "borderColor": "#dfe6ee",
                "contentPaddingLeft": 2
              },
              "printElementType": {
                "type": "longText",
                "title": "长文"
              }
            },
            {
              "id": "hr-94",
              "type": "text",
              "options": {
                "left": 0,
                "top": 98,
                "width": 190,
                "height": 6,
                "formatter": "报告完成日期：{report.date}　　咨询电话：400-800-1234（工作日 8:30-17:30）",
                "fontSize": 8.5,
                "color": "#26364a",
                "verticalAlign": "middle"
              },
              "printElementType": {
                "type": "text",
                "title": "文本"
              }
            }
          ]
        }
      ]
    }
  }
}
