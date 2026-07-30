import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { IndicatorMetadataStoreService } from '../../../../../../services/indicator-metadata-store-service/indicator-metadata-store.service';
import { IndicatorsDataset } from '../../../../models/indicators.models';

import { TranslateModule } from '@ngx-translate/core';
export interface ScriptMetadata {
  name: string;
  description: string;
  associatedIndicatorId: string;
}

@Component({
  selector: 'app-script-step-metadata',
  templateUrl: './script-step-metadata.component.html',
  styleUrls: ['./script-step-metadata.component.scss'],
  standalone: true,
  imports: [TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptStepMetadataComponent {
  private indicatorStore = inject(IndicatorMetadataStoreService);

  @Input({ required: true }) metadata!: ScriptMetadata;
  @Output() metadataChange = new EventEmitter<ScriptMetadata>();

  // Getter instead of a one-time snapshot: the store is signal-backed, so the
  // template read tracks late-arriving indicator metadata under OnPush.
  get availableIndicators(): IndicatorsDataset[] {
    return this.indicatorStore.availableIndicators;
  }

  targetIndicator: IndicatorsDataset | undefined;

  indicatorNameFilter: string = '';

  get filteredComputationIndicators(): IndicatorsDataset[] {
    const computation = this.availableIndicators.filter((i) => i.creationType === 'COMPUTATION');
    if (!this.indicatorNameFilter) return computation;
    const filter = this.indicatorNameFilter.toLowerCase();
    return computation.filter((i) => i.indicatorName?.toLowerCase().includes(filter));
  }

  updateName(name: string) {
    this.metadataChange.emit({ ...this.metadata, name });
  }

  updateTargetIndicator(targetIndicator: IndicatorsDataset) {
    this.targetIndicator = targetIndicator;
    this.metadataChange.emit({
      ...this.metadata,
      associatedIndicatorId: targetIndicator.indicatorId,
    });
  }

  updateDescription(description: string) {
    this.metadataChange.emit({ ...this.metadata, description });
  }
}
