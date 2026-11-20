// English help content (first-pass translation). Keep id and structure in sync with zh-CN.
export default {
  id: 'faq',
  title: 'FAQ',
  content: `
<h2>How do I adjust the paper size?</h2>
<ol>
  <li>Select "Page Setup" in the right panel</li>
  <li>Choose a preset paper size from the "Paper Size" dropdown</li>
  <li>Or choose "Custom Size" and enter the width and height</li>
</ol>

<h2>Why is my expression not evaluating?</h2>
<p>Expressions must be wrapped in curly braces <code>{}</code>. Check that field names are spelled correctly and that functions use the right arguments. Double-click the element to open the expression editor and preview the result.</p>

<h2>Why is content clipped when printing?</h2>
<p>Content extending beyond the printable area (inside the margins) is clipped. Reduce element size, adjust position, or switch to landscape orientation. The save dialog warns about estimated clipping.</p>

<h2>How do I repeat a table header on every page?</h2>
<p>In the table row settings, set the header row to repeat, and make sure the table participates in normal pagination. Enabling "Fix on Every Page" on the whole table will repeat the entire table instead.</p>

<h2>How do I bind dynamic data to an element?</h2>
<p>Use <code>{field.path}</code> syntax in a text element, or double-click the element to open the expression editor and pick a field from the left list. Fields come from the data you pass at print time.</p>

<h2>Why can't I drag a column border to resize it?</h2>
<p>First select the table element in the left layer panel, then drag the column divider on the canvas. Make sure no individual cell is selected.</p>

<h2>How do I add a watermark?</h2>
<p>Enable the watermark option in page setup, enter the watermark text or expression, then adjust rotation, color, opacity and density. Watermarks render consistently in the canvas, browser preview, server PDF and silent printing.</p>

<h2>Can I use charts and other custom elements?</h2>
<p>Yes. Optional plugins such as the ECharts chart pack register extra element types. Once installed, they appear in the asset panel and provide a "Custom Properties" tab when selected.</p>
  `
}
