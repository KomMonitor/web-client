import { Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ScriptHelperService } from 'services/script-helper-service/script-helper.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { FilterableSelectComponent } from 'components/ngComponents/common/filterableSelect/filterable-select.component';
import { GeoresourcesDataset } from '../../../../../../../models/georesources.models';

@Component({
  selector: 'app-script-georesources',
  templateUrl: './script-georesources.component.html',
  styleUrls: ['./script-georesources.component.scss'],
  standalone: true,
  imports: [FormsModule, ExpandableBoxComponent, FilterableSelectComponent],
})
export class ScriptGeoresourcesComponent {
  protected scriptHelperService = inject(ScriptHelperService);
  protected dataExchangeService = inject(DataExchangeService);

  selectedGeoresource: GeoresourcesDataset | undefined = undefined;

  onChangeGeoressource($event: GeoresourcesDataset) {
    this.selectedGeoresource = $event;
  }
}
