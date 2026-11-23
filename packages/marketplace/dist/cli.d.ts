#!/usr/bin/env node
import { i as installPlugin, r as removePlugin, M as MarketIndex, P as PluginType, a as MarketSource, b as MarketIndexEntry, c as MarketMetadataDecl } from './install-GAO58ijj.js';

interface ParsedArgs {
    command?: 'list' | 'validate' | 'install' | 'remove';
    name?: string;
    version?: string;
    source: MarketSource | 'auto';
    dir?: string;
    repo?: string;
    index?: string;
    type?: PluginType;
    category?: string;
    label?: string;
    search?: string;
    locale?: string;
    sort?: string;
    json: boolean;
    force: boolean;
    help: boolean;
    helpVersion: boolean;
}
declare function parseArgs(argv: string[]): ParsedArgs;
interface ListOptions {
    type?: PluginType;
    category?: string;
    label?: string;
    search?: string;
    locale?: string;
    sort?: string;
}
/** 按筛选条件过滤并按可选排序键排序；缺值排最后，保持原数组顺序稳定。 */
declare function filterAndSortPlugins(index: MarketIndex, opts: ListOptions): MarketIndexEntry[];
/** 格式化 list 的展示行；categories 缺省时用内置中文类型名。 */
declare function formatPluginLines(entries: readonly MarketIndexEntry[], locale: string, categories?: MarketMetadataDecl['categories']): string;
interface CliDeps {
    install?: typeof installPlugin;
    remove?: typeof removePlugin;
    index?: MarketIndex;
    out?: (message: string) => void;
    err?: (message: string) => void;
}
declare function main(argv: string[], deps?: CliDeps): Promise<number>;
/** 判断是否直接执行本 CLI；经 npm bin 软链调用时 argv[1] 是链接路径，需先归一。 */
declare function isCliEntry(argv1: string | undefined, moduleUrl: string): boolean;

export { type CliDeps, type ListOptions, type ParsedArgs, filterAndSortPlugins, formatPluginLines, isCliEntry, main, parseArgs };
