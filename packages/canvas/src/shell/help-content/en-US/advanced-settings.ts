// English help content (first-pass translation). Keep id and HTML structure in sync with zh-CN.
export default {
  id: 'advanced-settings',
  title: 'Advanced Settings',
  content: `
<h2>Advanced Settings</h2>
<p>Advanced settings control an element's edit protection, cross-page display, overlap order and deletion. These settings are saved in the template, but each option has different pagination semantics, so choose according to the element's layout role.</p>

<h3>Lock</h3>
<ul>
  <li><strong>Effect:</strong> prevents accidental dragging or resizing on the canvas; suitable for finished titles, tables, lines and fixed marks.</li>
  <li><strong>Print impact:</strong> does not hide the element or change its content, position or pagination.</li>
  <li><strong>Use case:</strong> when the layout is finalized and you only need to adjust other elements; unlock first to adjust position or size again.</li>
</ul>

<h3>Repeat on Every Page</h3>
<ul>
  <li><strong>Effect:</strong> the element is output on every page. The first page keeps its designed position; continuation pages are normalized to the top repeat area, reserving body space by the element and its rotated bounding box height.</li>
  <li><strong>Suitable for:</strong> top horizontal areas such as page titles, payment info, contract info and notes. Using this on tables or dynamic lists repeats the whole item on each page, not just the header.</li>
  <li><strong>Not suitable for:</strong> right-side attachments, vertical text, floating marks that must keep their original coordinates. Use "Fix on Every Page" for those.</li>
  <li><strong>Note:</strong> continuation pages reserve the height of the whole repeat area and will not free space just because the element sits on the right. Rotated vertical attachments usually have a tall bounding box and can push body content to the bottom.</li>
</ul>

<h3>Fix on Every Page</h3>
<ul>
  <li><strong>Effect:</strong> the element keeps the same designed coordinates on every page, does not participate in body pagination, does not consume body height and is not grouped into table-follow regions.</li>
  <li><strong>Suitable for:</strong> right-side vertical attachments, fixed page-edge marks, seam hints, text or graphics that should appear at the same position on every page. Sheet paper outputs each page; continuous paper outputs once.</li>
  <li><strong>Table note:</strong> fixing a whole table repeats it entirely. When details need pagination, let the table paginate normally and use the table row option "Repeat header on every page".</li>
</ul>

<h3>Z-Order</h3>
<ul>
  <li><strong>Effect:</strong> controls the stacking order when elements overlap; larger values are on top.</li>
  <li><strong>Use case:</strong> place background blocks and border lines at the bottom; text, barcodes, QR codes and signatures at the top.</li>
  <li><strong>Print impact:</strong> only changes visual stacking, not coordinates, pagination order or body space.</li>
</ul>

<h3>Delete Element</h3>
<ul>
  <li><strong>Effect:</strong> removes the selected element from the current template.</li>
  <li><strong>Recovery:</strong> use toolbar "Undo" right after an accidental delete; before saving you can also close without saving to discard changes.</li>
</ul>

<h3>Combination Rules and Suggestions</h3>
<ul>
  <li><strong>Fix + Repeat:</strong> when both are on, "Fix on Every Page" wins and the element is output at its original coordinates on every page.</li>
  <li><strong>Repeat + Exclude from Pagination:</strong> repeat is handled in a separate repeat area first; "exclude from pagination" cannot stop continuation pages from reserving space.</li>
  <li><strong>Exclude from Pagination only:</strong> the element is placed at its designed coordinates on the first page only and does not join later pagination; it is not an every-page toggle.</li>
  <li><strong>Right-side attachment on a payment request:</strong> recommended "Fix on Every Page" on, "Repeat on Every Page" off, "Participate in Pagination" off. Positions stay consistent and payment details are not squeezed.</li>
  <li><strong>Right-side attachment on the first page only:</strong> turn off both "Fix on Every Page" and "Repeat on Every Page", and also turn off "Participate in Pagination".</li>
</ul>
  `,
}
