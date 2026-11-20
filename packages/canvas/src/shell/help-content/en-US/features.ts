// English help content (first-pass translation). Keep id and HTML structure in sync with zh-CN.
export default {
  id: 'features',
  title: 'Features',
  content: `
<h2>Element Types</h2>
<table>
  <thead><tr><th>Type</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td>Text</td><td>Static or dynamic text, supports expression binding</td></tr>
    <tr><td>Long Text</td><td>Multi-line text with automatic wrapping</td></tr>
    <tr><td>Data Table</td><td>Dynamic rows and columns, supports pagination, header repeat, sequence/subtotal/summary</td></tr>
    <tr><td>Barcode</td><td>Supports code128 and many other symbologies</td></tr>
    <tr><td>QR Code</td><td>Supports L/M/Q/H error correction; "Quiet zone (modules)" controls the border (0-8, default 0 = fill); use 4 for the ISO-recommended quiet zone</td></tr>
    <tr><td>Image</td><td>Static or dynamic images</td></tr>
    <tr><td>Line</td><td>Horizontal or vertical lines</td></tr>
    <tr><td>Shape</td><td>Rectangles and ellipses with borders and background colors</td></tr>
    <tr><td>HTML</td><td>Custom HTML content</td></tr>
    <tr><td>Page Number</td><td>Automatic page numbering</td></tr>
    <tr><td>Extension Element</td><td>Elements registered by optional plugins (e.g. the ECharts pack <code>@worm-print-platform/echarts</code>): they appear in the asset panel once registered, with a "Custom Properties" tab when selected; chart data is bound by template expressions at print time and output as vectors</td></tr>
  </tbody>
</table>

<h2>Expression Editor</h2>
<h3>Basic Syntax</h3>
<p>Wrap expressions in curly braces <code>{}</code>; text outside braces is literal.</p>

<h3>Built-in Functions</h3>
<table>
  <thead><tr><th>Function</th><th>Description</th><th>Example</th></tr></thead>
  <tbody>
    <tr><td><code>MONEY(value)</code></td><td>Amount formatting (thousands separator + 2 decimals)</td><td><code>{MONEY(order.total)}</code> -> "69,543.75"</td></tr>
    <tr><td><code>DATE(value, format)</code></td><td>Date formatting</td><td><code>{DATE(order.date, 'YYYY-MM-DD')}</code></td></tr>
    <tr><td><code>UPPER(value)</code></td><td>Number to uppercase Chinese amount</td><td><code>{UPPER(order.total)}</code></td></tr>
    <tr><td><code>IF(cond, true, false)</code></td><td>Conditional</td><td><code>{IF(qty > 100, 'large', 'small')}</code></td></tr>
    <tr><td><code>CONCAT(str1, str2, ...)</code></td><td>String concatenation</td><td><code>{CONCAT(name, '-', spec)}</code></td></tr>
    <tr><td><code>IFEMPTY(value, default)</code></td><td>Default for empty value</td><td><code>{IFEMPTY(remark, 'none')}</code></td></tr>
    <tr><td><code>ROUND(num, decimals)</code></td><td>Round half up (default 2 decimals)</td><td><code>{ROUND(price, 2)}</code></td></tr>
    <tr><td><code>ROUNDUP(n, d)</code> / <code>CEIL(n, d)</code></td><td>Round away from zero</td><td><code>{ROUNDUP(price, 2)}</code></td></tr>
    <tr><td><code>ROUNDDOWN(n, d)</code> / <code>FLOOR(n, d)</code></td><td>Round toward zero</td><td><code>{ROUNDDOWN(price, 2)}</code></td></tr>
    <tr><td><code>ROUNDBANK(n, d)</code></td><td>Banker's rounding (GB/T 8170)</td><td><code>{ROUNDBANK(price, 2)}</code></td></tr>
    <tr><td><code>ADD(a, b, ...)</code></td><td>Add (variadic)</td><td><code>{ADD(qty, 1)}</code></td></tr>
    <tr><td><code>SUB(a, b, ...)</code></td><td>Subtract</td><td><code>{SUB(total, discount)}</code></td></tr>
    <tr><td><code>MUL(a, b, ...)</code></td><td>Multiply (variadic)</td><td><code>{MUL(qty, price)}</code></td></tr>
    <tr><td><code>DIV(a, b)</code></td><td>Divide (returns 0 when divisor is 0)</td><td><code>{DIV(total, qty)}</code></td></tr>
    <tr><td><code>NOW()</code></td><td>Current date</td><td><code>{NOW()}</code></td></tr>
    <tr><td><code>SUBSTR(str, start, len)</code></td><td>Substring</td><td><code>{SUBSTR(name, 0, 3)}</code></td></tr>
    <tr><td><code>LEN(str)</code></td><td>String length</td><td><code>{LEN(name)}</code></td></tr>
    <tr><td><code>PAD(value, len, char)</code></td><td>Left padding</td><td><code>{PAD(qty, 5, '0')}</code></td></tr>
  </tbody>
</table>

<h3>Aggregate Functions (table subtotal/summary rows)</h3>
<table>
  <thead><tr><th>Function</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>SUM(field)</code></td><td>Sum</td></tr>
    <tr><td><code>AVG(field)</code></td><td>Average</td></tr>
    <tr><td><code>COUNT(field)</code></td><td>Count</td></tr>
    <tr><td><code>MIN(field)</code></td><td>Minimum</td></tr>
    <tr><td><code>MAX(field)</code></td><td>Maximum</td></tr>
  </tbody>
</table>

<h3>System Variables</h3>
<table>
  <thead><tr><th>Variable</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>pageIndex</code></td><td>Current page number</td></tr>
    <tr><td><code>totalPages</code></td><td>Total page count</td></tr>
    <tr><td><code>printDate</code></td><td>Print date (YYYY-MM-DD)</td></tr>
    <tr><td><code>printTime</code></td><td>Print timestamp</td></tr>
  </tbody>
</table>

<h2>Data Table Configuration</h2>
<h3>Row Types</h3>
<ul>
  <li><strong>Header row</strong>: can repeat on every page</li>
  <li><strong>Data row</strong>: iterates over a bound list data source</li>
  <li><strong>Subtotal row</strong>: shows a subtotal at the end of the current page</li>
  <li><strong>Summary row</strong>: shown only on the last page</li>
</ul>

<h3>Table Operations</h3>
<ul>
  <li>Right-click a cell to open the table menu (the table is auto-selected); insert/delete rows and columns, merge/split cells, change row type</li>
  <li>Drag-select multiple cells to merge; right-click any member cell to split</li>
  <li>Supports cell merge/split</li>
  <li>Border presets: all / outside / inside / none</li>
  <li>Borderless tables show dashed guide lines in design mode</li>
  <li><strong>Resize columns</strong>: first select the table element in the left layer panel, then drag the column divider on the canvas</li>
  <li><strong>Edit table properties</strong>: make sure no cell is selected; click empty canvas to deselect, then select the table in the layer panel</li>
  <li><strong>Cell images</strong>: if an image cannot shrink, set its handling to "Scale down (keep ratio)"</li>
</ul>

<h2>Format Toolbar and Format Painter</h2>
<h3>Format Toolbar</h3>
<ul>
  <li>Located in the top toolbar, enabled when an element or cell is selected; inapplicable buttons are greyed out with a hover reason</li>
  <li>Set: font, size, bold / underline / strikethrough, text color, background color, horizontal and vertical alignment, borders</li>
  <li>Inconsistent values in multi-selection show "Mixed"; setting a value unifies them</li>
  <li>Border panel offers all / outside / inside / none presets and per-side toggles with line style, width and color; "inside" is only for table cells</li>
  <li>Rectangles, ellipses and lines draw with element borders; tables use cell borders, so no element-level border is offered for them</li>
</ul>
<h3>Format Painter</h3>
<ul>
  <li>First select a <strong>single</strong> element as the source, click the format painter (double-click for continuous mode)</li>
  <li>Click or drag-select target elements to apply; single mode exits after one application</li>
  <li>Press <code>Esc</code>, deselect, or click the painter button again to exit</li>
  <li>Auto-filters by target type: text styles only to text elements, borders only to border-capable types, background color to all</li>
  <li>Locked elements are not painted; the source element is not modified</li>
</ul>

<h2>Alignment and Snapping</h2>
<h3>Auto Alignment</h3>
<p>Alignment guides appear automatically while dragging:</p>
<ul>
  <li>Blue: left/top alignment</li>
  <li>Green: center alignment</li>
  <li>Orange: right/bottom alignment</li>
</ul>
<h3>Grid Snapping</h3>
<p>When enabled, elements snap to grid points.</p>
<h3>Manual Guides</h3>
<p>Drag from the ruler area to add guides; guides participate in snapping.</p>

<h2>Layer Management</h2>
<ul>
  <li>Change display order (bring to front / send to back / move up / move down)</li>
  <li>Show/hide elements</li>
  <li>Lock/unlock elements (locked elements cannot be edited)</li>
</ul>

<h3>Grouping</h3>
<p>Select multiple elements (Ctrl/⌘+click or marquee on empty area), then group them via the toolbar, layer panel button or <code>Ctrl + G</code>; ungroup with <code>Ctrl + Shift + G</code>. After grouping:</p>
<ul>
  <li>Clicking any member selects the whole group; dragging any member moves the whole group</li>
  <li><strong>The group is forced onto a single page when printing</strong>, never split across pages</li>
</ul>
<p><strong>Note:</strong> the total height of group members must not exceed the page content area, otherwise the overflow is clipped. Split tall groups or ungroup them.</p>

<h3>Context Menu</h3>
<ul>
  <li><strong>Right-click an element</strong>: copy / cut / paste / delete / bring to front / move up / move down / send to back. If the element is not in the current selection, selection is reduced to it; if it already belongs to a multi-selection, the selection is kept</li>
  <li><strong>Right-click empty area</strong>: paste / select all / deselect</li>
  <li>Paste is greyed out when there is nothing to paste</li>
</ul>

<h2>Three-Zone Layout</h2>
<p>A page has three zones:</p>
<ul>
  <li><strong>Header</strong>: top area</li>
  <li><strong>Content</strong>: main body</li>
  <li><strong>Footer</strong>: bottom area</li>
</ul>
<p>Element types supported in header/footer: text, image, line, shape, barcode, QR code</p>

<h2>Watermark Configuration</h2>
<ul>
  <li>Watermark content uses a single "watermark expression" input: plain text is a static watermark; <code>{order.no}</code>, <code>CONCAT(...)</code> etc. are parsed as expressions</li>
  <li>Click "Edit expression" (or double-click the input) to open the editor and pick business fields and system variables: print date <code>{printDate}</code>, print time <code>{printTime}</code>, current page <code>{pageIndex}</code>, total pages <code>{totalPages}</code>; a failed expression falls back to the test value</li>
  <li>Set rotation angle (-90° to 90°), color and opacity</li>
  <li>Adjust density (dense/medium/sparse/custom tile size) and watermark color</li>
  <li>Watermarks render consistently in the canvas, browser preview, server PDF and silent printing</li>
</ul>
  `
}
