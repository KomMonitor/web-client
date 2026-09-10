import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

/**
 * Generic id → name table renderer shared by the "required base indicators" and
 * "required base georesources" columns. The column config supplies the data
 * field holding the id list and a resolver that maps an id to its display name,
 * so the two previously duplicated renderers collapse into one.
 */
interface IdNameTableParams extends ICellRendererParams {
  idsField: string;
  resolveName: (id: string) => string;
}

@Component({
  selector: 'app-script-id-name-table-cell-renderer',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (rows().length > 0) {
      <table class="table table-bordered table-striped table-sm">
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.id) {
            <tr>
              <td>{{ row.id }}</td>
              <td>{{ row.name }}</td>
            </tr>
          }
        </tbody>
      </table>
    } @else {
      keine
    }
  `,
})
export class ScriptIdNameTableCellRendererComponent implements ICellRendererAngularComp {
  // Signal-backed: refresh() is invoked by AG Grid outside Angular's change
  // detection, so a plain field would leave this OnPush view stale.
  rows = signal<{ id: string; name: string }[]>([]);

  agInit(params: IdNameTableParams): void {
    this.setRows(params);
  }

  refresh(params: IdNameTableParams): boolean {
    this.setRows(params);
    return true;
  }

  private setRows(params: IdNameTableParams): void {
    const ids: string[] = params.data?.[params.idsField] ?? [];
    this.rows.set(ids.map((id) => ({ id, name: params.resolveName(id) })));
  }
}
