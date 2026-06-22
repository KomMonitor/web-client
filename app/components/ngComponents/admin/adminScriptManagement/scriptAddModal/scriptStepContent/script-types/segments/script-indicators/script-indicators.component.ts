import { Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ScriptHelperService } from 'services/script-helper-service/script-helper.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { FilterableSelectComponent } from 'components/ngComponents/common/filterableSelect/filterable-select.component';
import { IndicatorsDataset } from '../../../../../../../models/indicators.models';

@Component({
  selector: 'app-script-indicators',
  templateUrl: './script-indicators.component.html',
  styleUrls: ['./script-indicators.component.scss'],
  standalone: true,
  imports: [FormsModule, ExpandableBoxComponent, FilterableSelectComponent],
})
export class ScriptIndicatorsComponent {
  protected scriptHelperService = inject(ScriptHelperService);
  protected dataExchangeService = inject(DataExchangeService);

  selectedIndicator: IndicatorsDataset | undefined = undefined;

  onChangeIndicator($event: IndicatorsDataset) {
    this.selectedIndicator = $event;
  }
}
