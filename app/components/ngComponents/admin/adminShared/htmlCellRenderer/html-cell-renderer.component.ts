import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

/**
 * Renders a cell value that is authored as HTML (e.g. an indicator's
 * methodology with `<b>`, `<br/>`, `<sub>`).
 *
 * The value goes through an `[innerHTML]` binding, which Angular sanitizes —
 * unlike an HTML string returned from a function `cellRenderer`, which AG Grid
 * assigns to `innerHTML` unchecked. Supply the value through the column's
 * `valueGetter` or `field`.
 */
@Component({
  selector: 'app-html-cell-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div [innerHTML]="html()"></div>`,
})
export class HtmlCellRendererComponent implements ICellRendererAngularComp {
  // Signal: refresh() is invoked by AG Grid outside Angular CD (OnPush).
  protected html = signal('');

  agInit(params: ICellRendererParams): void {
    this.html.set(params.value ?? '');
  }

  refresh(params: ICellRendererParams): boolean {
    this.html.set(params.value ?? '');
    return true;
  }
}
