import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ScriptHelperService } from 'services/script-helper-service/script-helper.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { FilterableSelectComponent } from 'components/ngComponents/common/filterableSelect/filterable-select.component';
import { GeoresourcesDataset } from '../../../../../../../models/georesources.models';

@Component({
  selector: 'app-script-georesources',
  templateUrl: './script-georesources.component.html',
  styleUrls: ['./script-georesources.component.scss'],
  standalone: true,
  imports: [FormsModule, ExpandableBoxComponent, FilterableSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptGeoresourcesComponent {
  protected scriptHelperService = inject(ScriptHelperService);
  protected georesourceStore = inject(GeoresourceMetadataStoreService);

  selectedGeoresource: GeoresourcesDataset | undefined = undefined;

  onChangeGeoressource($event: GeoresourcesDataset) {
    this.selectedGeoresource = $event;
  }
}
