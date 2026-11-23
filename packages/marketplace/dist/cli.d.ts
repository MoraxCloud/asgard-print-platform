#!/usr/bin/env node
import { i as installPlugin, r as removePlugin, M as MarketIndex, a as MarketSource } from './install-JsknZ5Fp.js';

interface ParsedArgs {
    command?: 'list' | 'install' | 'remove';
    name?: string;
    version?: string;
    source: MarketSource | 'auto';
    dir?: string;
    repo?: string;
    force: boolean;
    help: boolean;
    helpVersion: boolean;
}
declare function parseArgs(argv: string[]): ParsedArgs;
interface CliDeps {
    install?: typeof installPlugin;
    remove?: typeof removePlugin;
    index?: MarketIndex;
    out?: (message: string) => void;
}
declare function main(argv: string[], deps?: CliDeps): Promise<number>;

export { type CliDeps, type ParsedArgs, main, parseArgs };
