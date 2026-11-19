/*!
 * @worm-print-platform/plugin-echarts v1.0.0
 * Copyright (c) 2026 worm <liu_long_qqcom@qq.com>
 * SPDX-FileCopyrightText: 2026 worm <liu_long_qqcom@qq.com>
 * SPDX-License-Identifier: MIT
 */

// src/plugin.ts
import {
  defineElementPlugin,
  getElementPluginById,
  registerElementPlugin
} from "@worm-print-platform/core/designer";

// src/kinds.ts
var BASE_REQUIRED = ["left", "top", "width", "height", "chartOption"];
var DATA_FIELDS = ["dataSource", "categoryField", "valueFields", "seriesField"];
var STYLE_FIELDS = ["title", "legend", "palette"];
var CHART_KIND_DEFINITIONS = [
  {
    type: "barChart",
    label: "\u67F1\u72B6\u56FE",
    icon: "ChartColumn",
    seriesType: "bar",
    orientation: "vertical",
    fields: [...DATA_FIELDS, ...STYLE_FIELDS, "stack"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 100,
    defaultHeight: 60,
    notes: "\u67F1\u72B6\u56FE\uFF1A\u7C7B\u76EE + \u591A\u4E2A\u6570\u503C\u5B57\u6BB5\uFF0C\u6BCF\u5B57\u6BB5\u4E00\u4E2A series\uFF1Bseries[].data \u5199 $data \u5360\u4F4D\uFF1B\u56FA\u5B9A\u9AD8\uFF0C\u7981\u6B62 autoHeight"
  },
  {
    type: "barHChart",
    label: "\u6761\u5F62\u56FE",
    icon: "ChartBar",
    seriesType: "bar",
    orientation: "horizontal",
    fields: [...DATA_FIELDS, ...STYLE_FIELDS, "stack"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 100,
    defaultHeight: 60,
    notes: "\u6A2A\u5411\u6761\u5F62\u56FE\uFF1AxAxis \u4E3A\u6570\u503C\u3001yAxis \u4E3A\u7C7B\u76EE\uFF1B\u7C7B\u76EE\u5199 yAxis.data \u7684 $data \u5360\u4F4D"
  },
  {
    type: "lineChart",
    label: "\u6298\u7EBF\u56FE",
    icon: "ChartLine",
    seriesType: "line",
    fields: [...DATA_FIELDS, ...STYLE_FIELDS, "stack"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 100,
    defaultHeight: 60,
    notes: "\u6298\u7EBF\u56FE\uFF1A\u7C7B\u76EE + \u591A\u4E2A\u6570\u503C\u5B57\u6BB5\uFF1B\u4E0D\u5199 areaStyle"
  },
  {
    type: "areaChart",
    label: "\u9762\u79EF\u56FE",
    icon: "ChartArea",
    seriesType: "line",
    fields: [...DATA_FIELDS, ...STYLE_FIELDS, "stack"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 100,
    defaultHeight: 60,
    notes: "\u9762\u79EF\u56FE\uFF1A\u6298\u7EBF + series[].areaStyle\uFF1B\u5176\u4F59\u540C\u6298\u7EBF\u56FE"
  },
  {
    type: "pieChart",
    label: "\u997C\u56FE",
    icon: "ChartPie",
    seriesType: "pie",
    fields: ["dataSource", "categoryField", "valueFields", ...STYLE_FIELDS],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 60,
    defaultHeight: 60,
    notes: "\u997C\u56FE\uFF1A\u7C7B\u76EE + \u9996\u4E2A\u6570\u503C\u5B57\u6BB5\u751F\u6210 { name, value }\uFF1B\u53EA\u9700\u4E00\u4E2A\u6570\u503C\u5B57\u6BB5"
  },
  {
    type: "doughnutChart",
    label: "\u73AF\u5F62\u56FE",
    icon: "Donut",
    seriesType: "pie",
    fields: ["dataSource", "categoryField", "valueFields", ...STYLE_FIELDS, "innerRadius"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 60,
    defaultHeight: 60,
    notes: "\u73AF\u5F62\u56FE\uFF1A\u997C\u56FE + radius:[\u5185\u5F84,\u5916\u5F84]\uFF1B\u5185\u5F84\u7531\u9762\u677F\u914D\u7F6E"
  },
  {
    type: "scatterChart",
    label: "\u6563\u70B9\u56FE",
    icon: "ChartScatter",
    seriesType: "scatter",
    fields: ["dataSource", "categoryField", "valueFields", ...STYLE_FIELDS, "bubble"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 80,
    defaultHeight: 60,
    notes: "\u6563\u70B9\u56FE\uFF1A\u7C7B\u76EE\u5B57\u6BB5\u4F5C x\u3001\u9996\u4E2A\u6570\u503C\u5B57\u6BB5\u4F5C y\uFF1BchartBubble \u5F00\u542F\u65F6\u7528\u7B2C\u4E8C\u4E2A\u6570\u503C\u5B57\u6BB5\u4F5C\u70B9\u5927\u5C0F"
  },
  {
    type: "radarChart",
    label: "\u96F7\u8FBE\u56FE",
    icon: "Radar",
    seriesType: "radar",
    fields: ["dataSource", "categoryField", "valueFields", ...STYLE_FIELDS, "radius"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 70,
    defaultHeight: 60,
    notes: "\u96F7\u8FBE\u56FE\uFF1A\u6BCF\u4E2A\u6570\u503C\u5B57\u6BB5\u662F\u4E00\u4E2A\u7EF4\u5EA6\uFF08radar.indicator\uFF09\uFF0C\u6BCF\u884C\u6570\u636E\u662F\u4E00\u4E2A\u7CFB\u5217\uFF08\u7C7B\u76EE\u5B57\u6BB5\u4F5C\u7CFB\u5217\u540D\uFF09\uFF1B\u534A\u5F84\u7531\u9762\u677F\u5199 radar.radius\uFF08%\uFF0C\u9ED8\u8BA4 75\uFF09"
  },
  {
    type: "funnelChart",
    label: "\u6F0F\u6597\u56FE",
    icon: "Funnel",
    seriesType: "funnel",
    fields: ["dataSource", "categoryField", "valueFields", ...STYLE_FIELDS, "padding"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 60,
    defaultHeight: 60,
    notes: "\u6F0F\u6597\u56FE\uFF1A\u7C7B\u76EE + \u9996\u4E2A\u6570\u503C\u5B57\u6BB5\uFF0C\u6309\u6570\u503C\u964D\u5E8F\uFF1B\u56DB\u8FB9\u5185\u8FB9\u8DDD\u7531\u9762\u677F\u5199 series.left/right/top/bottom\uFF08%\uFF0C\u53F3\u4FA7\u9700\u7559\u5916\u7F6E\u6807\u7B7E\u7A7A\u95F4\uFF09"
  },
  {
    type: "gaugeChart",
    label: "\u4EEA\u8868\u76D8",
    icon: "Gauge",
    seriesType: "gauge",
    fields: ["dataSource", "valueFields", ...STYLE_FIELDS, "gaugeRange"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 60,
    defaultHeight: 60,
    notes: "\u4EEA\u8868\u76D8\uFF1A\u53D6\u9996\u884C\u6570\u636E\u7684\u9996\u4E2A\u6570\u503C\u5B57\u6BB5\u4F5C\u6307\u9488\u503C\uFF1Bmin/max \u7531\u9762\u677F\u5199\u5165 series[0].min/max"
  }
];
var CHART_KINDS = CHART_KIND_DEFINITIONS.map((def) => def.type);
function getChartKindDefinition(type) {
  return CHART_KIND_DEFINITIONS.find((def) => def.type === type);
}

// src/bind.ts
import { evaluateTemplate } from "@worm-print-platform/core";
function chartNumber(value) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}
function evaluateChartOption(node, data) {
  if (typeof node === "string") {
    if (node.startsWith("$data")) return node;
    return node.includes("{") ? evaluateTemplate(node, data) : node;
  }
  if (Array.isArray(node)) return node.map((item) => evaluateChartOption(item, data));
  if (node && typeof node === "object") {
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      out[key] = evaluateChartOption(value, data);
    }
    return out;
  }
  return node;
}
function hasDataPlaceholder(series) {
  return Array.isArray(series.data) && series.data.includes("$data");
}
function resolveListSource(options, data) {
  const explicit = options.dataSource;
  if (typeof explicit === "string" && Array.isArray(data[explicit])) return data[explicit];
  for (const value of Object.values(data)) {
    if (Array.isArray(value)) return value;
  }
  return [];
}
function asString(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function asFieldList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.length > 0) : [];
}
function seriesOf(option) {
  return Array.isArray(option.series) ? option.series : [];
}
function rowValue(row, field2) {
  return field2 ? chartNumber(row[field2]) : 0;
}
function writeCategories(option, categories) {
  for (const key of ["xAxis", "yAxis"]) {
    const raw = option[key];
    const axes = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const axis of axes) {
      if (axis && typeof axis === "object" && Array.isArray(axis.data) && axis.data.includes("$data")) {
        axis.data = [...categories];
      }
    }
  }
}
function applyCartesian(option, rows, categoryField, valueFields, seriesField) {
  const rawSeries = seriesOf(option);
  if (!rawSeries.some(hasDataPlaceholder)) return;
  const categories = rows.map((row, index) => categoryField ? row[categoryField] : index + 1);
  const fieldAt = (index) => valueFields[Math.min(index, valueFields.length - 1)];
  if (seriesField) {
    const template2 = rawSeries[0];
    const groups = /* @__PURE__ */ new Map();
    for (const row of rows) {
      const name = String(row[seriesField] ?? "");
      const bucket = groups.get(name) ?? /* @__PURE__ */ new Map();
      const category = String(row[categoryField ?? ""]);
      bucket.set(category, (bucket.get(category) ?? 0) + rowValue(row, fieldAt(0)));
      groups.set(name, bucket);
    }
    const distinctCategories = [...new Set(categories)];
    option.series = [...groups.entries()].map(([name, bucket]) => ({
      ...template2,
      name,
      data: distinctCategories.map((category) => bucket.get(String(category)) ?? null)
    }));
    writeCategories(option, distinctCategories);
    return;
  }
  const template = rawSeries[rawSeries.length - 1];
  while (rawSeries.length < valueFields.length) rawSeries.push({ ...template, data: ["$data"] });
  option.series = rawSeries.map((series, index) => {
    if (!hasDataPlaceholder(series)) return series;
    return { ...series, data: rows.map((row) => rowValue(row, fieldAt(index))) };
  });
  writeCategories(option, categories);
}
function applyPieLike(option, rows, categoryField, valueField, sortDescending) {
  const series = seriesOf(option);
  if (!series.some(hasDataPlaceholder)) return;
  const data = rows.map((row) => ({
    name: categoryField ? String(row[categoryField] ?? "") : "",
    value: rowValue(row, valueField)
  }));
  if (sortDescending) data.sort((a, b) => b.value - a.value);
  option.series = series.map((item) => ({ ...item, data }));
}
function applyScatter(option, rows, xField, valueFields, bubble) {
  const series = seriesOf(option);
  if (!series.some(hasDataPlaceholder)) return;
  const yField = valueFields[0];
  const sizeField = bubble ? valueFields[1] : void 0;
  const sizes = sizeField ? rows.map((row) => rowValue(row, sizeField)) : [];
  const min = sizes.length > 0 ? Math.min(...sizes) : 0;
  const max = sizes.length > 0 ? Math.max(...sizes) : 0;
  const sizeOf = (value) => max === min ? 12 : Math.round(6 + (value - min) / (max - min) * 18);
  option.series = series.map((item) => ({
    ...item,
    data: rows.map((row) => {
      const value = [rowValue(row, xField), rowValue(row, yField)];
      if (!sizeField) return value;
      return { value, symbolSize: sizeOf(rowValue(row, sizeField)) };
    })
  }));
}
function niceMax(value) {
  if (value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = magnitude >= 10 ? magnitude : 10;
  return Math.ceil(value / step) * step;
}
function applyRadar(option, rows, categoryField, valueFields) {
  const series = seriesOf(option);
  if (!series.some(hasDataPlaceholder)) return;
  const columnMax = valueFields.map((field2) => Math.max(0, ...rows.map((row) => rowValue(row, field2))));
  option.radar = {
    ...option.radar ?? {},
    // 维度 = 数值字段；max 取该列最大值上浮取整
    indicator: valueFields.map((field2, index) => ({ name: field2, max: niceMax(columnMax[index]) }))
  };
  option.series = series.map((item) => ({
    ...item,
    data: rows.map((row) => ({
      name: categoryField ? String(row[categoryField] ?? "") : "",
      value: valueFields.map((field2) => rowValue(row, field2))
    }))
  }));
}
function applyGauge(option, rows, valueField) {
  const series = seriesOf(option);
  if (!series.some(hasDataPlaceholder)) return;
  const first = rows[0] ?? {};
  option.series = series.map((item) => ({ ...item, data: [{ value: rowValue(first, valueField), name: valueField }] }));
}
function bindChartData(type, options, data) {
  const raw = options.chartOption;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const option = evaluateChartOption(raw, data);
  const valueFields = asFieldList(options.chartValueFields);
  if (valueFields.length === 0) return { _chartOption: option };
  const list = resolveListSource({ ...options, dataSource: options.chartDataSource ?? options.dataSource }, data);
  if (list.length === 0) return { _chartOption: option };
  const categoryField = asString(options.chartCategoryField);
  const def = getChartKindDefinition(type);
  switch (def?.seriesType) {
    case "radar":
      applyRadar(option, list, categoryField, valueFields);
      break;
    case "gauge":
      applyGauge(option, list, valueFields[0]);
      break;
    case "funnel":
      applyPieLike(option, list, categoryField, valueFields[0], true);
      break;
    case "pie":
      applyPieLike(option, list, categoryField, valueFields[0], false);
      break;
    case "scatter":
      applyScatter(option, list, categoryField, valueFields, options.chartBubble === true);
      break;
    default:
      applyCartesian(option, list, categoryField, valueFields, asString(options.chartSeriesField));
      break;
  }
  return { _chartOption: option };
}

// src/config.ts
import { configurePlugin, getPluginConfig } from "@worm-print-platform/core/designer";

// src/constants.ts
var CHART_PLUGIN_ID = "@worm-print-platform/echarts";
var FUNNEL_PADDING_DEFAULTS = { top: 6, right: 25, bottom: 6, left: 5 };
var RADAR_RADIUS_DEFAULT = 75;

// src/defaults.ts
var GRID = { left: "8%", right: "8%", bottom: "12%", top: "18%", containLabel: true };
function percentInsets(padding) {
  return {
    top: `${padding.top}%`,
    right: `${padding.right}%`,
    bottom: `${padding.bottom}%`,
    left: `${padding.left}%`
  };
}
function createDefaultChartOption(type) {
  const def = getChartKindDefinition(type);
  const title = { text: "" };
  switch (def?.seriesType) {
    case "pie":
      return {
        title,
        tooltip: { trigger: "item" },
        series: [{
          type: "pie",
          name: "\u6570\u91CF",
          data: ["$data"],
          radius: type === "doughnutChart" ? ["40%", "70%"] : "62%"
        }]
      };
    case "scatter":
      return {
        title,
        grid: GRID,
        tooltip: { trigger: "axis" },
        xAxis: { type: "value" },
        yAxis: { type: "value" },
        series: [{ type: "scatter", name: "\u6570\u91CF", data: ["$data"], symbolSize: 8 }]
      };
    case "radar":
      return {
        title,
        tooltip: { trigger: "item" },
        // indicator 由绑定阶段按 chartValueFields 生成；设计态预览见 previewChartOption
        radar: { indicator: [], radius: `${RADAR_RADIUS_DEFAULT}%` },
        series: [{ type: "radar", name: "\u6570\u91CF", data: ["$data"] }]
      };
    case "funnel":
      return {
        title,
        tooltip: { trigger: "item" },
        legend: { show: false },
        // 不写内边距会吃 ECharts 的 px 默认（左右 80/上下 60~65），小框里图形只占一半不到
        series: [{ type: "funnel", name: "\u6570\u91CF", data: ["$data"], sort: "descending", ...percentInsets(FUNNEL_PADDING_DEFAULTS) }]
      };
    case "gauge":
      return {
        title,
        tooltip: { trigger: "item" },
        series: [{ type: "gauge", name: "\u6570\u91CF", min: 0, max: 100, data: [{ value: 0, name: "\u6570\u91CF" }] }]
      };
    default: {
      const horizontal = def?.orientation === "horizontal";
      const isArea = def?.seriesType === "line" && type === "areaChart";
      const seriesType = def?.seriesType === "line" ? "line" : "bar";
      return {
        title,
        grid: GRID,
        tooltip: { trigger: "axis" },
        xAxis: horizontal ? { type: "value" } : { type: "category", data: ["$data"] },
        yAxis: horizontal ? { type: "category", data: ["$data"] } : { type: "value" },
        series: [{ type: seriesType, name: "\u6570\u91CF", data: ["$data"], ...isArea ? { areaStyle: {} } : {} }]
      };
    }
  }
}

// src/config.ts
function getChartPluginConfig() {
  return getPluginConfig(CHART_PLUGIN_ID);
}
function chartFactoryDefaults(type, partial) {
  const config = getChartPluginConfig();
  const def = getChartKindDefinition(type);
  return {
    width: typeof config.defaultWidth === "number" ? config.defaultWidth : def?.defaultWidth ?? 100,
    height: typeof config.defaultHeight === "number" ? config.defaultHeight : def?.defaultHeight ?? 60,
    title: def?.label ?? "\u56FE\u8868",
    chartOption: createDefaultChartOption(type),
    chartDataSource: "",
    chartCategoryField: "name",
    chartValueFields: ["value"],
    chartSeriesField: "",
    ...partial
  };
}

// src/echarts.ts
import { BarChart, LineChart, PieChart, ScatterChart, RadarChart, FunnelChart, GaugeChart } from "echarts/charts";
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent
} from "echarts/components";
import * as echarts from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  FunnelChart,
  GaugeChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  SVGRenderer
]);
var appliedComponents = /* @__PURE__ */ new Set();
function applyExtraComponents() {
  const extra = getChartPluginConfig().components ?? [];
  const fresh = extra.filter((item) => item != null && !appliedComponents.has(item));
  if (fresh.length === 0) return;
  echarts.use(fresh);
  for (const item of fresh) appliedComponents.add(item);
}

// src/normalize.ts
function asArray(value) {
  if (Array.isArray(value)) return value.map((item) => ({ ...item }));
  return [];
}
function normalizeCategoryAxis(axis, horizontal) {
  const next = { ...axis, type: horizontal ? "value" : "category" };
  if (horizontal) delete next.data;
  else if (!Array.isArray(next.data)) next.data = ["$data"];
  return next;
}
function normalizeValueAxis(axis, horizontal) {
  const next = { ...axis, type: horizontal ? "category" : "value" };
  if (horizontal && !Array.isArray(next.data)) next.data = ["$data"];
  if (!horizontal) delete next.data;
  return next;
}
function mapAxes(value, fn) {
  if (Array.isArray(value)) return value.map((item) => fn({ ...item }));
  if (value && typeof value === "object") return fn({ ...value });
  return fn({});
}
function normalizeChartOption(type, option) {
  const def = getChartKindDefinition(type);
  if (!def) return option;
  const next = structuredClone(option);
  const series = asArray(next.series);
  if (series.length === 0) return next;
  if (def.seriesType === "pie") {
    next.series = series.map((item) => ({
      ...item,
      type: "pie",
      ...type === "doughnutChart" ? { radius: item.radius ?? ["40%", "70%"] } : {}
    }));
    delete next.xAxis;
    delete next.yAxis;
    return next;
  }
  if (def.seriesType === "scatter") {
    next.series = series.map((item) => ({ ...item, type: "scatter" }));
    next.xAxis = mapAxes(next.xAxis, (axis) => ({ ...axis, type: "value", data: void 0 }));
    next.yAxis = mapAxes(next.yAxis, (axis) => ({ ...axis, type: "value", data: void 0 }));
    return next;
  }
  if (def.seriesType === "radar") {
    next.series = series.map((item) => ({ ...item, type: "radar" }));
    return next;
  }
  if (def.seriesType === "funnel") {
    next.series = series.map((item) => ({ ...item, type: "funnel", sort: "descending" }));
    return next;
  }
  if (def.seriesType === "gauge") {
    next.series = series.map((item) => ({ ...item, type: "gauge" }));
    return next;
  }
  const horizontal = def.orientation === "horizontal";
  const seriesType = def.seriesType === "line" ? "line" : "bar";
  next.xAxis = mapAxes(next.xAxis, (axis) => normalizeCategoryAxis(axis, horizontal));
  next.yAxis = mapAxes(next.yAxis, (axis) => normalizeValueAxis(axis, horizontal));
  next.series = series.map((item) => {
    const shape = { ...item, type: seriesType };
    if (type === "areaChart") shape.areaStyle = item.areaStyle ?? {};
    else delete shape.areaStyle;
    return shape;
  });
  return next;
}

// src/units.ts
var PX_PER_MM = 96 / 25.4;
function mmToChartPx(mm) {
  const value = Number.isFinite(mm) ? mm : 0;
  return Math.max(1, Math.round(value * PX_PER_MM));
}

// src/renderer.ts
function fitSvgRoot(svg, widthPx, heightPx) {
  const match = /<svg\b[^>]*>/i.exec(svg);
  if (!match) return svg;
  const rootTag = match[0];
  const rawAttrs = rootTag.slice("<svg".length, -1);
  const styleMatch = /\sstyle\s*=\s*"([^"]*)"/i.exec(rawAttrs);
  const keptStyle = (styleMatch?.[1] ?? "").split(";").map((decl) => decl.trim()).filter((decl) => decl && !/^(width|height|display)\s*:/i.test(decl)).join(";");
  const attrs = rawAttrs.replace(/\s(width|height|style|viewBox)\s*=\s*"[^"]*"/gi, "").trimEnd();
  const style = ["display:block", "width:100%", "height:100%", keptStyle].filter(Boolean).join(";");
  const nextTag = `<svg${attrs} width="100%" height="100%" viewBox="0 0 ${widthPx} ${heightPx}" style="${style}">`;
  return svg.slice(0, match.index) + nextTag + svg.slice(match.index + rootTag.length);
}
function renderChartToSvg(spec) {
  applyExtraComponents();
  const option = normalizeChartOption(spec.type, spec.option);
  if (!option || typeof option !== "object" || Array.isArray(option)) {
    throw new Error("\u56FE\u8868 option \u975E\u6CD5\uFF1A\u9700\u8981\u5BF9\u8C61");
  }
  const width = mmToChartPx(spec.widthMm);
  const height = mmToChartPx(spec.heightMm);
  const chart = echarts.init(null, null, { renderer: "svg", ssr: true, width, height });
  try {
    const userTextStyle = option.textStyle && typeof option.textStyle === "object" && !Array.isArray(option.textStyle) ? option.textStyle : void 0;
    const textStyle = {
      ...spec.fontFamily ? { fontFamily: spec.fontFamily } : {},
      ...userTextStyle ?? {}
    };
    chart.setOption({
      animation: false,
      ...option,
      ...Object.keys(textStyle).length > 0 ? { textStyle } : {}
    });
    return fitSvgRoot(chart.renderToSVGString(), width, height);
  } finally {
    chart.dispose();
  }
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function renderChartElement(spec) {
  const option = spec._chartOption ?? spec.chartOption;
  const placeholder = `<span>${escapeHtml(String(spec.title ?? "\u56FE\u8868"))}</span>`;
  if (!option || typeof option !== "object" || Array.isArray(option)) return placeholder;
  try {
    return renderChartToSvg({
      key: String(spec.key ?? ""),
      type: String(spec.type ?? ""),
      option,
      widthMm: Number(spec.widthMm ?? 0),
      heightMm: Number(spec.heightMm ?? 0),
      fontFamily: typeof spec.fontFamily === "string" ? spec.fontFamily : void 0
    });
  } catch {
    return placeholder;
  }
}

// src/version.ts
var CHART_EXECUTOR_VERSION = "2";

// src/plugin.ts
var CHART_OPTION_META = {
  chartOption: { kind: "object", label: "\u56FE\u8868 option" },
  chartDataSource: { kind: "text", label: "\u6570\u636E\u6E90" },
  chartCategoryField: { kind: "text", label: "\u7C7B\u76EE\u5B57\u6BB5" },
  chartValueFields: { kind: "object", label: "\u6570\u503C\u5B57\u6BB5" },
  chartSeriesField: { kind: "text", label: "\u7CFB\u5217\u62C6\u5206\u5B57\u6BB5" }
};
var SCATTER_OPTION_META = {
  ...CHART_OPTION_META,
  chartBubble: { kind: "bool", label: "\u6C14\u6CE1\u5927\u5C0F" }
};
var CHART_PLUGIN = defineElementPlugin({
  id: CHART_PLUGIN_ID,
  version: CHART_EXECUTOR_VERSION,
  kinds: CHART_KIND_DEFINITIONS.map((def) => ({
    type: def.type,
    label: def.label,
    icon: def.icon,
    fixedHeight: true,
    requiredOptionKeys: def.requiredOptionKeys,
    notes: def.notes,
    optionMeta: def.type === "scatterChart" ? SCATTER_OPTION_META : CHART_OPTION_META,
    defaultOptions: (partial) => chartFactoryDefaults(def.type, partial),
    binding: { bind: (options, data) => bindChartData(def.type, options, data) }
  })),
  render: {
    html: renderChartElement,
    createRenderer: () => ({ render: renderChartElement })
  }
});
var disposeHandle;
function registerChartPlugin(designer, extraRender) {
  const current = getElementPluginById(CHART_PLUGIN_ID);
  if (!designer && !extraRender) {
    const dispose2 = registerElementPlugin(CHART_PLUGIN);
    disposeHandle = dispose2;
    return dispose2;
  }
  const merged = {
    ...CHART_PLUGIN,
    designer: designer ?? current?.designer ?? CHART_PLUGIN.designer,
    render: { ...CHART_PLUGIN.render, ...current?.render, ...extraRender }
  };
  const dispose = registerElementPlugin(merged);
  disposeHandle = dispose;
  return dispose;
}
registerChartPlugin();

// src/index.ts
registerChartPlugin();

// src/ui.ts
import { defineElementUI, registerElementUI } from "@worm-print-platform/plugin-kit";
import {
  asObject,
  CHART_KINDS as CHART_KINDS2,
  cloneChartOption,
  createDefaultChartOption as createDefaultChartOption2,
  FUNNEL_PADDING_DEFAULTS as FUNNEL_PADDING_DEFAULTS2,
  getChartKindDefinition as getChartKindDefinition2,
  getChartPalettes as getChartPalettes2,
  normalizeChartOption as normalizeChartOption2,
  previewChartOption,
  RADAR_RADIUS_DEFAULT as RADAR_RADIUS_DEFAULT2,
  readFunnelPadding,
  readPaletteKey,
  readRadarRadius,
  renderChartToSvg as renderChartToSvg2,
  resolveChartPanelFields as resolveChartPanelFields2,
  syncSeriesCount,
  writeFunnelPadding,
  writeRadarRadius
} from "@worm-print-platform/plugin-echarts/kit";
var CANVAS_STYLE = "width:100%;height:100%;min-width:0;min-height:0;pointer-events:none";
var STYLES = [
  ".echarts-canvas-element{overflow:hidden}",
  ".echarts-field-row{display:flex;gap:6px;align-items:center}",
  ".echarts-field-row>.pd-input{flex:1;min-width:0}",
  ".echarts-field-row>.pd-button{flex:none}"
].join("");
var CHART_OPTION_KEYS = [
  "chartOption",
  "chartDataSource",
  "chartCategoryField",
  "chartValueFields",
  "chartSeriesField",
  "chartBubble"
];
var SEARCH_KEYWORDS = [
  "\u56FE\u8868",
  "echarts",
  "option",
  "\u914D\u7F6E",
  "\u6570\u636E\u6E90",
  "\u7C7B\u76EE",
  "\u6570\u503C",
  "\u7CFB\u5217",
  "\u67F1\u72B6",
  "\u6761\u5F62",
  "\u6298\u7EBF",
  "\u9762\u79EF",
  "\u997C",
  "\u73AF\u5F62",
  "\u6563\u70B9",
  "\u96F7\u8FBE",
  "\u6F0F\u6597",
  "\u4EEA\u8868"
];
var PANEL_HINT = "\u6570\u636E\u7531\u6A21\u677F\u7ED1\u5B9A\u9636\u6BB5\u6CE8\u5165\uFF1Aseries/xAxis \u7684 data \u4FDD\u7559 `$data` \u5360\u4F4D\u5373\u53EF\uFF1B\u590D\u6742\u6837\u5F0F\u53EF\u5728\u6A21\u677F JSON \u4E2D\u624B\u5199 chartOption\u3002";
var datalistSeq = 0;
function escapeHtml2(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function elementType(element) {
  return element.printElementType?.type ?? "";
}
function rawChartOption(element) {
  const raw = element.options.chartOption;
  return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : void 0;
}
function panelOption(element) {
  const raw = rawChartOption(element);
  return cloneChartOption(raw ?? createDefaultChartOption2(elementType(element)));
}
function chartHasProperties(element) {
  const options = element?.options;
  if (!options || typeof options !== "object") return false;
  const record = options;
  return CHART_OPTION_KEYS.some((key) => record[key] !== void 0);
}
function commitOption(ctx, type, next, patch = {}) {
  ctx.update({ chartOption: normalizeChartOption2(type, next), ...patch });
}
function readValueFields(element) {
  const raw = element.options.chartValueFields;
  return Array.isArray(raw) ? raw.map(String) : [];
}
function maxValueFields(def) {
  switch (def?.seriesType) {
    case "pie":
    case "funnel":
    case "gauge":
      return 1;
    case "scatter":
      return 2;
    default:
      return 8;
  }
}
function valueFieldsLabel(def, limit) {
  if (def?.seriesType === "radar") return "\u7EF4\u5EA6\u5B57\u6BB5\uFF08\u6BCF\u4E2A\u5B57\u6BB5\u4E00\u4E2A\u7EF4\u5EA6\uFF09";
  return limit === 1 ? "\u6570\u503C\u5B57\u6BB5" : "\u6570\u503C\u5B57\u6BB5\uFF08\u591A\u503C\u591A\u7CFB\u5217\uFF09";
}
function dataSourceCandidates(data) {
  const first = data?.[0];
  if (!first) return [];
  return Object.keys(first).filter((key) => Array.isArray(first[key]));
}
function seriesList(option) {
  return Array.isArray(option.series) ? option.series : [];
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function syncValueFields(ctx, type, nextFields) {
  const next = syncSeriesCount(panelOption(ctx.element), nextFields.length, type);
  const series = Array.isArray(next.series) ? next.series : [];
  series.forEach((item, index) => {
    const name = nextFields[index]?.trim();
    if (name) item.name = name;
  });
  commitOption(ctx, type, next, { chartValueFields: nextFields });
}
function renderCanvas(ctx) {
  const element = ctx.element;
  const type = elementType(element);
  const options = element.options;
  const widthMm = Number(options.width) || 0;
  const heightMm = Number(options.height) || 0;
  try {
    const preview = previewChartOption(type, rawChartOption(element) ?? createDefaultChartOption2(type));
    const option = normalizeChartOption2(type, preview);
    if (!option || typeof option !== "object" || Array.isArray(option)) throw new Error("\u56FE\u8868 option \u975E\u6CD5\uFF1A\u9700\u8981\u5BF9\u8C61");
    const fontFamily = typeof options.fontFamily === "string" && options.fontFamily ? options.fontFamily : void 0;
    const svg = renderChartToSvg2({ key: element.id, type, option, widthMm, heightMm, fontFamily });
    return `<div class="echarts-canvas-element" style="${CANVAS_STYLE}">${svg}</div>`;
  } catch {
    const title = typeof options.title === "string" && options.title.trim() ? options.title : getChartKindDefinition2(type)?.label ?? "\u56FE\u8868";
    return `<div class="echarts-canvas-element" style="${CANVAS_STYLE}">${escapeHtml2(title)}</div>`;
  }
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== void 0) node.textContent = text;
  return node;
}
function field(labelText) {
  const wrap = el("div", "pd-field");
  wrap.appendChild(el("span", "pd-label", labelText));
  return wrap;
}
function textInput(init, onCommit) {
  const input = el("input", "pd-input");
  if (init.type) input.type = init.type;
  if (init.placeholder) input.placeholder = init.placeholder;
  if (init.min !== void 0) input.min = String(init.min);
  if (init.max !== void 0) input.max = String(init.max);
  if (init.title) input.title = init.title;
  if (init.list) input.setAttribute("list", init.list);
  input.value = init.value;
  input.addEventListener("change", () => onCommit(input.value));
  return input;
}
function checkboxField(labelText, checked, onCommit) {
  const wrap = field(labelText);
  wrap.style.cssText = "flex-direction:row;align-items:center;justify-content:space-between";
  const input = el("input", "pd-switch");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", () => onCommit(input.checked));
  wrap.appendChild(input);
  return wrap;
}
function renderProperty(ctx) {
  const element = ctx.element;
  const type = elementType(element);
  const def = getChartKindDefinition2(type);
  const fields = resolveChartPanelFields2(type);
  const has = (key) => fields.includes(key);
  const options = element.options;
  const widthMm = Number(options.width) || 0;
  const heightMm = Number(options.height) || 0;
  const limit = maxValueFields(def);
  const palettes = getChartPalettes2();
  const root = el("div", "echarts-property");
  const form = el("form", "pd-form");
  form.addEventListener("submit", (event) => event.preventDefault());
  root.appendChild(form);
  if (has("dataSource")) {
    const wrap = field("\u6570\u636E\u6E90");
    const candidates = dataSourceCandidates(ctx.data);
    let datalist;
    if (candidates.length > 0) {
      datalist = el("datalist");
      datalist.id = `echarts-ds-${++datalistSeq}`;
      for (const key of candidates) {
        const optionEl = el("option");
        optionEl.value = key;
        datalist.appendChild(optionEl);
      }
    }
    wrap.appendChild(
      textInput(
        {
          value: String(options.chartDataSource ?? ""),
          placeholder: "\u6570\u636E\u96C6\u8DEF\u5F84\uFF08\u7559\u7A7A\u53D6\u9876\u5C42\u7B2C\u4E00\u4E2A\u6570\u7EC4\uFF09",
          list: datalist?.id
        },
        (value) => commitOption(ctx, type, panelOption(element), { chartDataSource: value })
      )
    );
    if (datalist) wrap.appendChild(datalist);
    form.appendChild(wrap);
  }
  if (has("categoryField")) {
    const wrap = field("\u7C7B\u76EE\u5B57\u6BB5");
    wrap.appendChild(
      textInput(
        { value: String(options.chartCategoryField ?? ""), placeholder: "\u5982 name" },
        (value) => commitOption(ctx, type, panelOption(element), { chartCategoryField: value })
      )
    );
    form.appendChild(wrap);
  }
  if (has("valueFields")) {
    const wrap = field(valueFieldsLabel(def, limit));
    const fieldsNow = readValueFields(element);
    fieldsNow.forEach((value, index) => {
      const row = el("div", "echarts-field-row");
      row.appendChild(
        textInput(
          { value, placeholder: "\u5982 value" },
          (next) => {
            const list = readValueFields(element);
            list[index] = next;
            syncValueFields(ctx, type, list);
          }
        )
      );
      if (fieldsNow.length > 1) {
        const remove = el("button", "pd-button small", "\u2212");
        remove.type = "button";
        remove.title = "\u5220\u9664\u8BE5\u5B57\u6BB5";
        remove.addEventListener("click", () => syncValueFields(ctx, type, readValueFields(element).filter((_, i) => i !== index)));
        row.appendChild(remove);
      }
      wrap.appendChild(row);
    });
    if (fieldsNow.length < limit) {
      const add = el("button", "pd-button small", "+ \u6DFB\u52A0\u5B57\u6BB5");
      add.type = "button";
      add.addEventListener("click", () => syncValueFields(ctx, type, [...readValueFields(element), ""]));
      wrap.appendChild(add);
    }
    form.appendChild(wrap);
  }
  if (has("seriesField")) {
    const wrap = field("\u7CFB\u5217\u62C6\u5206\u5B57\u6BB5");
    wrap.appendChild(
      textInput(
        { value: String(options.chartSeriesField ?? ""), placeholder: "\u53EF\u9009\uFF0C\u5982 region\uFF08\u6309\u503C\u62C6\u6210\u591A\u7CFB\u5217\uFF09" },
        (value) => commitOption(ctx, type, panelOption(element), { chartSeriesField: value })
      )
    );
    form.appendChild(wrap);
  }
  if (has("bubble")) {
    form.appendChild(
      checkboxField("\u6C14\u6CE1\u5927\u5C0F", options.chartBubble === true, (checked) => {
        commitOption(ctx, type, panelOption(element), { chartBubble: checked });
      })
    );
  }
  if (has("title")) {
    const wrap = field("\u56FE\u8868\u6807\u9898");
    wrap.appendChild(
      textInput(
        { value: String(asObject(panelOption(element).title).text ?? ""), placeholder: "\u7559\u7A7A\u4E0D\u663E\u793A\u6807\u9898" },
        (value) => {
          const next = panelOption(element);
          next.title = { ...asObject(next.title), text: value };
          commitOption(ctx, type, next);
        }
      )
    );
    form.appendChild(wrap);
  }
  if (has("legend")) {
    const show = asObject(panelOption(element).legend).show !== false;
    form.appendChild(
      checkboxField("\u663E\u793A\u56FE\u4F8B", show, (checked) => {
        const next = panelOption(element);
        next.legend = { ...asObject(next.legend), show: checked };
        commitOption(ctx, type, next);
      })
    );
  }
  if (has("palette")) {
    const wrap = field("\u914D\u8272");
    const select = el("select", "pd-select");
    for (const palette of palettes) {
      const optionEl = el("option");
      optionEl.value = palette.key;
      optionEl.textContent = palette.label;
      select.appendChild(optionEl);
    }
    select.value = readPaletteKey(panelOption(element), palettes);
    select.addEventListener("change", () => {
      const palette = palettes.find((item) => item.key === select.value) ?? palettes[0];
      const next = panelOption(element);
      next.color = [...palette.colors];
      commitOption(ctx, type, next);
    });
    wrap.appendChild(select);
    form.appendChild(wrap);
  }
  if (has("stack")) {
    const series = seriesList(panelOption(element));
    const stacked = series.some((item) => item.stack !== void 0 && item.stack !== null && item.stack !== "");
    form.appendChild(
      checkboxField("\u5806\u53E0\u663E\u793A", stacked, (checked) => {
        const next = panelOption(element);
        for (const item of seriesList(next)) {
          if (checked) item.stack = "total";
          else delete item.stack;
        }
        commitOption(ctx, type, next);
      })
    );
  }
  if (has("innerRadius")) {
    const wrap = field("\u5185\u5F84\uFF08%\uFF09");
    const radius = seriesList(panelOption(element))[0]?.radius;
    const inner = Array.isArray(radius) ? Number(String(radius[0] ?? "40%").replace("%", "")) || 40 : 40;
    wrap.appendChild(
      textInput({ value: String(inner), type: "number", min: 0, max: 90 }, (value) => {
        const next = panelOption(element);
        const series = seriesList(next);
        if (series[0]) series[0].radius = [`${clamp(Number(value) || 0, 0, 90)}%`, "70%"];
        commitOption(ctx, type, next);
      })
    );
    form.appendChild(wrap);
  }
  if (has("padding")) {
    const wrap = field("\u5185\u8FB9\u8DDD \u4E0A/\u53F3/\u4E0B/\u5DE6 (%)");
    const padding = readFunnelPadding(panelOption(element), widthMm, heightMm);
    const row = el("div", "echarts-field-row");
    const sides = [
      { side: "top", title: "\u4E0A\u8FB9\u8DDD" },
      { side: "right", title: "\u53F3\u8FB9\u8DDD\uFF08\u7559\u5916\u7F6E\u6807\u7B7E\uFF09" },
      { side: "bottom", title: "\u4E0B\u8FB9\u8DDD" },
      { side: "left", title: "\u5DE6\u8FB9\u8DDD" }
    ];
    for (const { side, title } of sides) {
      row.appendChild(
        textInput({ value: String(padding[side]), type: "number", min: 0, max: 60, title }, (value) => {
          const raw = Number(value);
          const next = Number.isFinite(raw) ? clamp(raw, 0, 60) : FUNNEL_PADDING_DEFAULTS2[side];
          const option = panelOption(element);
          const current = readFunnelPadding(option, widthMm, heightMm);
          commitOption(ctx, type, writeFunnelPadding(option, { ...current, [side]: next }));
        })
      );
    }
    wrap.appendChild(row);
    form.appendChild(wrap);
  }
  if (has("radius")) {
    const wrap = field("\u534A\u5F84\uFF08%\uFF09");
    wrap.appendChild(
      textInput(
        { value: String(readRadarRadius(panelOption(element), widthMm, heightMm)), type: "number", min: 20, max: 100 },
        (value) => {
          const raw = Number(value);
          const next = Number.isFinite(raw) ? clamp(raw, 20, 100) : RADAR_RADIUS_DEFAULT2;
          commitOption(ctx, type, writeRadarRadius(panelOption(element), next));
        }
      )
    );
    form.appendChild(wrap);
  }
  if (has("gaugeRange")) {
    const wrap = field("\u6700\u5C0F / \u6700\u5927\u503C");
    const series = seriesList(panelOption(element));
    const row = el("div", "echarts-field-row");
    row.appendChild(
      textInput({ value: String(Number(series[0]?.min ?? 0)), type: "number" }, (value) => {
        const next = panelOption(element);
        const list = seriesList(next);
        if (list[0]) list[0].min = Number(value) || 0;
        commitOption(ctx, type, next);
      })
    );
    row.appendChild(
      textInput({ value: String(Number(series[0]?.max ?? 100)), type: "number" }, (value) => {
        const next = panelOption(element);
        const list = seriesList(next);
        if (list[0]) list[0].max = Number(value) || 100;
        commitOption(ctx, type, next);
      })
    );
    wrap.appendChild(row);
    form.appendChild(wrap);
  }
  form.appendChild(el("p", "pd-hint", PANEL_HINT));
  return root;
}
var CHART_ELEMENT_UI = defineElementUI({
  types: CHART_KINDS2,
  renderCanvas,
  renderProperty,
  hasProperties: chartHasProperties,
  group: "\u56FE\u8868",
  searchKeywords: SEARCH_KEYWORDS,
  styles: STYLES
});
var disposeHandle2;
function installChartCommonUI() {
  disposeHandle2?.();
  disposeHandle2 = registerElementUI(CHART_ELEMENT_UI);
  return disposeHandle2;
}
installChartCommonUI();
