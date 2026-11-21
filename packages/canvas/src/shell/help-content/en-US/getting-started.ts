// English help content (first-pass translation). Keep id and HTML structure in sync with zh-CN.
export default {
  id: 'getting-started',
  title: 'Getting Started',
  content: `
<h2>Interface Layout</h2>
<p>The print template designer uses a three-column layout:</p>
<ul>
  <li><strong>Left panel</strong>: field tree and layer management for viewing and managing canvas elements</li>
  <li><strong>Center canvas</strong>: design area with ruler, guides and grid display</li>
  <li><strong>Right panel</strong>: property settings and template configuration</li>
  <li><strong>Top toolbar</strong>: common action buttons</li>
  <li><strong>Bottom status bar</strong>: coordinates, zoom ratio and element count</li>
</ul>

<h2>Adding Your First Element</h2>
<ol>
  <li>Select an element type from the left panel (text, image, barcode, etc.)</li>
  <li>Drag it onto the canvas and release</li>
  <li>Select the element and drag to reposition it</li>
  <li>Drag the corner handles to resize it</li>
</ol>

<h2>Data Binding Basics</h2>
<p>Use curly-brace <code>{field.path}</code> syntax to bind data fields:</p>
<pre><code>Supplier: {supplier.name}
Date: {order.date}
Amount: {MONEY(order.total)}
Total: {ROUND(qty * price, 2)}</code></pre>
<p>Inside braces you can write arithmetic (<code>{qty * price}</code>) or use <code>ADD</code> / <code>SUB</code> / <code>MUL</code> / <code>DIV</code>;
to keep a number of decimals use <code>ROUND</code> (half up), <code>ROUNDUP</code> (up), <code>ROUNDDOWN</code> (down) or <code>ROUNDBANK</code> (banker's rounding).</p>
<p>Double-click an element to open the expression editor and configure its binding.</p>

<h2>Saving and Preview</h2>
<ul>
  <li>Click "Save" in the toolbar to export the template as JSON</li>
  <li>Click "Preview" to see the print result</li>
  <li>Template data includes page setup, element definitions and style configuration</li>
</ul>

<h2>About the Project</h2>
<p><strong>Project:</strong> worm-print-platform</p>
<p><strong>Repository:</strong><a href="https://gitee.com/liulong_oschina/worm-print-platform" target="_blank" rel="noopener noreferrer">https://gitee.com/liulong_oschina/worm-print-platform</a></p>
<p>A Vue 3 based visual print template designer with drag-and-drop editing, expression data binding and in-browser print preview.</p>
  `
}
