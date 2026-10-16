import { ColDef } from 'ag-grid-community';

/**
 * A value that executes script if it ever reaches the DOM as markup: the
 * `<img>` fires `onerror`, the quotes break out of an attribute it is
 * interpolated into.
 */
export const HOSTILE_PAYLOAD = `<img src=x onerror="window.__xss=1">"'`;

/**
 * Renders one cell of `colDef` for `data` the way AG Grid 31 does, so specs
 * can check what actually reaches the DOM:
 *
 * - the value comes from `valueGetter`, else from `field` (dotted paths too);
 * - without a renderer the value is set as text;
 * - a function `cellRenderer` returning a string, number or boolean is
 *   wrapped in a `<span>` and assigned to `innerHTML`, unsanitized, exactly as
 *   AG Grid's `adaptCellRendererFunction` does; a returned element is used as
 *   is.
 *
 * Returns `null` for renderers given as a component class or a registered
 * name — those are Angular components and are tested on their own.
 */
export function renderCellLikeAgGrid(colDef: ColDef, data: any): HTMLElement | null {
  const value = cellValue(colDef, data);
  const renderer = colDef.cellRenderer;

  if (renderer == null) {
    const cell = document.createElement('span');
    cell.textContent = value == null ? '' : String(value);
    return cell;
  }

  // A component class carries its methods on the prototype; an arrow function
  // has no prototype at all.
  if (typeof renderer !== 'function' || renderer.prototype?.agInit) {
    return null;
  }

  const result = renderer({ data, value, colDef });
  if (result == null || ['string', 'number', 'boolean'].includes(typeof result)) {
    const template = document.createElement('div');
    template.innerHTML = '<span>' + (result ?? '') + '</span>';
    return template.firstElementChild as HTMLElement;
  }
  return result as HTMLElement;
}

/**
 * Asserts that no column of `columnDefs` turns `data` carrying
 * `HOSTILE_PAYLOAD` into markup: no rendered cell contains an element with an
 * `onerror` handler or a `<script>`. Returns the rendered cells for further
 * checks.
 */
export function expectNoMarkupInjection(columnDefs: ColDef[], data: any): HTMLElement[] {
  const cells = columnDefs
    .map((colDef) => renderCellLikeAgGrid(colDef, data))
    .filter((cell): cell is HTMLElement => cell !== null);

  for (const cell of cells) {
    expect(cell.querySelector('[onerror], script')).toBeNull();
  }
  return cells;
}

function cellValue(colDef: ColDef, data: any): unknown {
  if (typeof colDef.valueGetter === 'function') {
    return colDef.valueGetter({ data, colDef } as any);
  }
  if (colDef.field) {
    return colDef.field.split('.').reduce((value: any, key) => value?.[key], data);
  }
  return undefined;
}
