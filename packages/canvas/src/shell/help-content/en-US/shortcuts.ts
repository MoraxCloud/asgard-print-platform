// English help content (first-pass translation). Keep id and structure in sync with zh-CN.
export default {
  id: 'shortcuts',
  title: 'Keyboard Shortcuts',
  content: `
<h2>Common Operations</h2>
<table>
  <thead><tr><th>Shortcut</th><th>Action</th></tr></thead>
  <tbody>
    <tr><td><code>Ctrl + Z</code> / <code>⌘ + Z</code></td><td>Undo</td></tr>
    <tr><td><code>Ctrl + Shift + Z</code> / <code>⌘ + Shift + Z</code></td><td>Redo</td></tr>
    <tr><td><code>Ctrl + C</code> / <code>⌘ + C</code></td><td>Copy selected element</td></tr>
    <tr><td><code>Ctrl + V</code> / <code>⌘ + V</code></td><td>Paste</td></tr>
    <tr><td><code>Delete</code> / <code>Backspace</code></td><td>Delete selected element</td></tr>
    <tr><td><code>Ctrl + A</code> / <code>⌘ + A</code></td><td>Select all</td></tr>
    <tr><td><code>Ctrl + G</code> / <code>⌘ + G</code></td><td>Group selected elements</td></tr>
    <tr><td><code>Ctrl + Shift + G</code> / <code>⌘ + Shift + G</code></td><td>Ungroup</td></tr>
    <tr><td><code>Arrow keys</code></td><td>Nudge selected element (hold Shift for larger step)</td></tr>
    <tr><td><code>Esc</code></td><td>Cancel selection / exit dialog or painter mode</td></tr>
    <tr><td><code>Space + drag</code></td><td>Pan the canvas</td></tr>
    <tr><td><code>Ctrl + scroll</code> / <code>⌘ + scroll</code></td><td>Zoom the canvas</td></tr>
  </tbody>
</table>

<h2>Expression Editor</h2>
<ul>
  <li>Double-click a field, variable or function in the left list to insert it into the expression</li>
  <li>Hold <code>Ctrl</code> (<code>⌘</code> on Mac) while double-clicking to insert the field name instead</li>
  <li>Use curly braces <code>{}</code> for field expressions; static text can be typed directly</li>
</ul>
  `
}
