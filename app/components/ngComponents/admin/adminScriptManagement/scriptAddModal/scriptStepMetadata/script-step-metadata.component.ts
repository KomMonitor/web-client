import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataExchangeService } from '../../../../../../services/data-exchange-service/data-exchange.service';
import { IndicatorsDataset } from '../../../../models/indicators.models';

export interface ScriptMetadata {
  name: string;
  description: string;
  associatedIndicatorId: string;
}

@Component({
  selector: 'app-script-step-metadata',
  templateUrl: './script-step-metadata.component.html',
  styleUrls: ['./script-step-metadata.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ScriptStepMetadataComponent {
  private dataExchangeService = inject(DataExchangeService);

  @Input({ required: true }) metadata!: ScriptMetadata;
  @Output() metadataChange = new EventEmitter<ScriptMetadata>();

  availableIndicators: IndicatorsDataset[] = this.dataExchangeService.availableIndicators;

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
