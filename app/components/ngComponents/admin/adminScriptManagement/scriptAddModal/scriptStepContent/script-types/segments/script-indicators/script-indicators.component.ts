import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ScriptHelperService } from 'services/script-helper-service/script-helper.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { FilterableSelectComponent } from 'components/ngComponents/common/filterableSelect/filterable-select.component';
import { IndicatorsDataset } from '../../../../../../../models/indicators.models';

import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-script-indicators',
  templateUrl: './script-indicators.component.html',
  standalone: true,
  imports: [TranslateModule, FormsModule, ExpandableBoxComponent, FilterableSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptIndicatorsComponent {
  protected scriptHelperService = inject(ScriptHelperService);
  protected indicatorStore = inject(IndicatorMetadataStoreService);

  selectedIndicator: IndicatorsDataset | undefined = undefined;

  onChangeIndicator($event: IndicatorsDataset) {
    this.selectedIndicator = $event;
  }
}
