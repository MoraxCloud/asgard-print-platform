// English help content (first-pass translation, condensed). Keep id and version headers in sync with zh-CN.
export default {
  id: 'changelog',
  title: 'Release Notes',
  content: `
<h2>V1.6.3<small>(2026-11-24)</small></h2>

<h3>Fixed</h3>
<ul>
  <li><strong>Data-binding fallbacks</strong>: table demo data sources no longer fall back to the first array when missing; charts keep the placeholder when an explicitly bound data source is absent, and field pickers no longer mix in sample-data fields.</li>
</ul>

<h2>V1.6.2<small>(2026-11-23)</small></h2>

<h3>Fixed</h3>
<ul>
  <li><strong>Chart plugin installation</strong>: fixed the marketplace CLI silently doing nothing when invoked via npx, and chart plugin installs from Git sources failing due to missing language resources; installing the Baidu chart plugin via the marketplace works again.</li>
</ul>

<h2>V1.6.1<small>(2026-11-22)</small></h2>

<h3>Added</h3>
<ul>
  <li><strong>Custom language packs</strong>: designer shell text can be replaced with custom language resources, with a CLI to export skeletons, validate translations and apply incremental updates.</li>
</ul>

<h3>Fixed</h3>
<ul>
  <li><strong>Rendering and designer details</strong>: fixes for dot-matrix barcodes, full-page rotation, watermarks, image borders and crop anchors; property search and table matrices are more reliable.</li>
</ul>

<h2>V1.6.0<small>(2026-11-19)</small></h2>
<h3>Added</h3>
<ul>
  <li><strong>Host-configurable field display</strong>: new <code>field-display</code> attribute (<code>fieldDisplay</code> property) with label-only, key-only or both modes (default both). Key-only styling matches the label style; group names always show; search/copy/insert semantics unchanged.</li>
</ul>
<h3>Fixed</h3>
<ul>
  <li><strong>Chart data label offset</strong>: the panel now writes native ECharts <code>offset: [x, y]</code>; legacy <code>offsetX</code>/<code>offsetY</code> are migrated on read, write and render.</li>
</ul>

<h2>V1.5.3<small>(2026-11-18)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Various stability and rendering fixes.</li>
</ul>

<h2>V1.5.2<small>(2026-11-17)</small></h2>
<h3>Added</h3>
<ul>
  <li>Enhancements to the data preview plugin and expression handling.</li>
</ul>

<h2>V1.5.1<small>(2026-11-16)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Minor fixes to element behavior and print output.</li>
</ul>

<h2>V1.5.0<small>(2026-11-16)</small></h2>
<h3>Added</h3>
<ul>
  <li>New capabilities for element layout and pagination.</li>
</ul>

<h2>V1.4.8<small>(2026-11-11)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Corrected table and pagination edge cases.</li>
</ul>

<h2>V1.4.7<small>(2026-11-09)</small></h2>
<h3>Added / Fixed</h3>
<ul>
  <li>Improved geometry warning accuracy and various fixes.</li>
</ul>

<h2>V1.4.6<small>(2026-11-05)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Fixes to rotation and text fitting.</li>
</ul>

<h2>V1.4.5<small>(2026-11-04)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Fixes to table borders and property panel.</li>
</ul>

<h2>V1.4.4<small>(2026-11-04)</small></h2>
<h3>Added</h3>
<ul>
  <li>Enhancements to chart labels and plugin UI.</li>
</ul>

<h2>V1.4.3<small>(2026-11-01)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Fixes to expression evaluation and preview.</li>
</ul>

<h2>V1.4.2<small>(2026-10-30)</small></h2>
<h3>Added</h3>
<ul>
  <li>Additions to the plugin marketplace and element capabilities.</li>
</ul>

<h2>V1.4.1<small>(2026-10-28)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Minor stability fixes.</li>
</ul>

<h2>V1.4.0<small>(2026-10-28)</small></h2>
<h3>Added</h3>
<ul>
  <li>Major feature release with new designer capabilities.</li>
</ul>

<h2>V1.3.11<small>(2026-10-26)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Fixes to continuous paper and tiling.</li>
</ul>

<h2>V1.3.10<small>(2026-10-24)</small></h2>
<h3>Added / Fixed</h3>
<ul>
  <li>Improvements to pagination and multiple fixes.</li>
</ul>

<h2>V1.3.9<small>(2026-10-22)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Fixes to flow layout and rendering.</li>
</ul>

<h2>V1.3.8<small>(2026-10-22)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Minor fixes to element rendering.</li>
</ul>

<h2>V1.3.7<small>(2026-10-19)</small></h2>
<h3>Added</h3>
<ul>
  <li>Enhancements to design background and watermarks.</li>
</ul>

<h2>V1.3.6<small>(2026-10-16)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Fixes to crop anchors and image handling.</li>
</ul>

<h2>V1.3.5<small>(2026-10-05)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Minor fixes to property panel.</li>
</ul>

<h2>V1.3.4<small>(2026-09-27)</small></h2>
<h3>Added</h3>
<ul>
  <li>New options for element styling.</li>
</ul>

<h2>V1.3.3<small>(2026-09-27)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Fixes to data binding and expressions.</li>
</ul>

<h2>V1.3.2<small>(2026-09-26)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Minor stability fixes.</li>
</ul>

<h2>V1.3.1<small>(2026-09-21)</small></h2>
<h3>Added</h3>
<ul>
  <li>Enhancements to toolbar and panels.</li>
</ul>

<h2>V1.3.0<small>(2026-09-20)</small></h2>
<h3>Added</h3>
<ul>
  <li>Major release with plugin architecture improvements.</li>
</ul>

<h2>V1.2.2<small>(2026-09-11)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Fixes to printing and preview.</li>
</ul>

<h2>V1.2.1<small>(2026-09-11)</small></h2>
<h3>Fixed</h3>
<ul>
  <li>Minor fixes.</li>
</ul>

<h2>V1.2.0<small>(2026-09-10)</small></h2>
<h3>Added</h3>
<ul>
  <li>New rendering pipeline features.</li>
</ul>

<h2>V1.1.0<small>(2026-09-06)</small></h2>
<h3>Added</h3>
<ul>
  <li>Additional element types and designer features.</li>
</ul>

<h2>V1.0.0<small>(2026-09-02)</small></h2>
<h3>Added</h3>
<ul>
  <li>Initial release of the print template designer.</li>
</ul>
  `
}
