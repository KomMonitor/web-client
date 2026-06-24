import { Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';

@Component({
  selector: 'app-script-georesources-cell-renderer',
  standalone: true,
  imports: [],
  template: `
    @if (georesourceIds && georesourceIds.length > 0) {
      <table class="table table-condensed table-bordered table-striped table-sm">
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          @for (id of georesourceIds; track id) {
            <tr>
              <td>{{ id }}</td>
              <td>{{ getGeoresourceName(id) }}</td>
            </tr>
          }
        </tbody>
      </table>
    } @else {
      keine
    }
  `,
})
export class ScriptGeoresourcesCellRendererComponent implements ICellRendererAngularComp {
  private georesourceStore = inject(GeoresourceMetadataStoreService);

  georesourceIds: string[] = [];

  agInit(params: ICellRendererParams): void {
    this.setParams(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.setParams(params);
    return true;
  }

  private setParams(params: ICellRendererParams): void {
    this.georesourceIds = params.data?.requiredGeoresourceIds ?? [];
  }

  getGeoresourceName(id: string): string {
    return (this.georesourceStore.getGeoresourceMetadataById(id) as any)?.datasetName ?? '';
  }
}
