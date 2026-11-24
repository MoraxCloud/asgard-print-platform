import type { PrintBusinessField } from '@worm-print-platform/core/designer';
import type { FieldGroupInfo, PreviewDescriptor } from './types.js';
/** 把分组数据解析为预览描述。fields 可缺省，此时以 JSON 键与常用键词典推断标签。 */
export declare function describeDataSource(root: unknown, fields: readonly PrintBusinessField[] | undefined, group: FieldGroupInfo): PreviewDescriptor;
