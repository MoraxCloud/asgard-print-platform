/** 未在 fields 中定义时的常用键中文兜底（fields 的 fieldLabel 始终优先） */
const COMMON_LABELS = {
    id: '编号', no: '编号', code: '编码', name: '名称', title: '标题', type: '类型',
    date: '日期', time: '时间', year: '年份', phone: '电话', mobile: '手机',
    address: '地址', org: '机构', company: '公司', dept: '科室', user: '用户',
    doctor: '医生', sex: '性别', age: '年龄', item: '项目', result: '结果',
    unit: '单位', ref: '参考区间', flag: '异常标记', seq: '序号', desc: '说明',
    advice: '建议', remark: '备注', spec: '规格', qty: '数量', price: '单价',
    amount: '金额', total: '合计', value: '值', status: '状态', url: '链接',
    logo: '标志图', image: '图片',
};
function isRecord(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
}
function kindOf(v) {
    if (Array.isArray(v))
        return 'array';
    if (isRecord(v))
        return 'object';
    return 'scalar';
}
function formatValue(v) {
    if (v === null || v === undefined || v === '')
        return '—';
    if (typeof v === 'object')
        return JSON.stringify(v);
    return String(v);
}
/**
 * 构建字段标签映射。三条来源按优先级叠加：
 * 1. 所有字段的「最后一段」（如 supplier.name → name），作为兜底；
 * 2. 当前分组前缀下的精确叶子（groupKey='supplier' 时 name → 供应商名称）；
 * 3. 容器字段原样 key（supplier → 供应商信息），供总览行与子 tab 使用。
 */
function leafMeta(fields, groupKey) {
    const map = new Map();
    const prefix = groupKey ? `${groupKey}.` : '';
    const put = (key, label, order, fieldKey) => {
        if (key)
            map.set(key, { label: label || key, sortOrder: order, fieldKey });
    };
    for (const f of fields) {
        const leaf = f.fieldKey.includes('.') ? f.fieldKey.slice(f.fieldKey.lastIndexOf('.') + 1) : f.fieldKey;
        const order = f.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (!map.has(leaf))
            put(leaf, f.fieldLabel, order, f.fieldKey);
    }
    for (const f of fields) {
        const order = f.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (prefix && f.fieldKey.startsWith(prefix)) {
            const rest = f.fieldKey.slice(prefix.length);
            const leaf = rest.includes('.') ? rest.slice(rest.lastIndexOf('.') + 1) : rest;
            put(leaf, f.fieldLabel, order, f.fieldKey);
        }
        else if (!f.fieldKey.includes('.')) {
            put(f.fieldKey, f.fieldLabel, order, f.fieldKey);
        }
    }
    return map;
}
function labelOf(key, meta) {
    return meta.get(key)?.label ?? COMMON_LABELS[key] ?? key;
}
function orderOf(key, meta) {
    return meta.get(key)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
}
function sortKeys(keys, meta) {
    return keys.sort((a, b) => {
        const oa = orderOf(a, meta);
        const ob = orderOf(b, meta);
        if (oa !== ob)
            return oa - ob;
        // 两者都无显式 sortOrder → 保持 JSON 插入顺序（稳定排序）
        if (oa === Number.MAX_SAFE_INTEGER && ob === Number.MAX_SAFE_INTEGER)
            return 0;
        return a.localeCompare(b, 'zh');
    });
}
function makeFormRows(record, meta) {
    return sortKeys(Object.keys(record), meta).map(key => ({
        key, label: labelOf(key, meta), value: formatValue(record[key]), fieldKey: meta.get(key)?.fieldKey,
    }));
}
function makeTable(items, meta) {
    const keys = new Set();
    const records = [];
    for (const item of items) {
        if (isRecord(item)) {
            records.push(item);
            Object.keys(item).forEach(k => keys.add(k));
        }
        else if (item !== undefined) {
            keys.add('值');
            records.push({ 值: item });
        }
    }
    const columns = sortKeys([...keys], meta).map(key => ({
        key, label: labelOf(key, meta), fieldKey: meta.get(key)?.fieldKey,
    }));
    const rows = records.map(record => columns.map(col => formatValue(record[col.key])));
    return { columns, rows };
}
function makeTab(key, label, value, meta) {
    const fieldKey = meta.get(key)?.fieldKey;
    if (Array.isArray(value)) {
        const { columns, rows } = makeTable(value, meta);
        return { key, label, fieldKey, kind: 'array', columns, rows };
    }
    if (isRecord(value)) {
        return { key, label, fieldKey, kind: 'object', formRows: makeFormRows(value, meta) };
    }
    return { key, label, fieldKey, kind: 'scalar', formRows: [{ key, label, value: formatValue(value), fieldKey }] };
}
/** 子 tab 用子属性名作为分组前缀重建映射，使 supplier.name 在「供应商信息」tab 下显示「供应商名称」 */
function childMeta(fields, key) {
    return leafMeta(fields, key);
}
function tabsFromObject(record, meta, fields) {
    return sortKeys(Object.keys(record), meta)
        .filter(key => kindOf(record[key]) !== 'scalar')
        .map(key => makeTab(key, labelOf(key, meta), record[key], childMeta(fields, key)));
}
function tabsFromArray(items, meta, fields) {
    const keys = new Set();
    for (const item of items)
        if (isRecord(item))
            Object.keys(item).forEach(k => keys.add(k));
    return sortKeys([...keys], meta)
        .filter(key => items.some(item => isRecord(item) && kindOf(item[key]) !== 'scalar'))
        .map(key => {
        const values = items.flatMap(item => {
            if (!isRecord(item))
                return [];
            const v = item[key];
            return Array.isArray(v) ? v : [v];
        });
        return makeTab(key, labelOf(key, meta), values, childMeta(fields, key));
    });
}
/** 把分组数据解析为预览描述。fields 可缺省，此时以 JSON 键与常用键词典推断标签。 */
export function describeDataSource(root, fields, group) {
    const list = fields ?? [];
    const meta = leafMeta(list, group.key);
    const rootKind = kindOf(root);
    const result = {
        title: group.label, group, rootKind, overview: [], tabs: [],
    };
    if (rootKind === 'object') {
        const record = root;
        const overview = sortKeys(Object.keys(record), meta).map(key => {
            const value = record[key];
            const kind = kindOf(value);
            const hasTab = kind !== 'scalar';
            return {
                key,
                label: labelOf(key, meta),
                fieldKey: meta.get(key)?.fieldKey,
                kind,
                summary: kind === 'array'
                    ? `${value.length} 条`
                    : kind === 'object'
                        ? `${Object.keys(value).length} 个字段`
                        : formatValue(value),
                hasTab,
                tabKey: hasTab ? key : undefined,
                value,
            };
        });
        result.overview = overview;
        result.tabs = tabsFromObject(record, meta, list);
    }
    else if (rootKind === 'array') {
        result.table = makeTable(root, meta);
        result.tabs = tabsFromArray(root, meta, list);
    }
    else {
        result.scalar = { key: group.key, label: group.label, value: formatValue(root) };
    }
    return result;
}
