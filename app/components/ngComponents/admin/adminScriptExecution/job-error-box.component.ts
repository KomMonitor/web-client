import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { JobError } from 'components/ngComponents/models/jobs.models';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';

/**
 * Maps an error type onto its i18n key segment.
 *
 * Two spellings map onto each segment, because the API and its own schema
 * disagree: a real payload sends camelCase (`missingTimestamp`, observed
 * 2026-09-18), while the process descriptions declare UPPER_SNAKE_CASE — note
 * `DATAMANAGEMENT_API_ERROR`, one word, unlike the translation key. Accepting
 * both costs six lines and survives whichever side moves. Getting it wrong
 * would be invisible rather than loud: an unmapped type quietly renders as
 * "unknown".
 */
const KEY_BY_TYPE: Record<string, string> = {
  MISSING_TIMESTAMP: 'MISSING_TIMESTAMP',
  MISSING_DATASET: 'MISSING_DATASET',
  MISSING_SPATIAL_UNIT: 'MISSING_SPATIAL_UNIT',
  MISSING_SPATIAL_UNIT_FEATURE: 'MISSING_SPATIAL_UNIT_FEATURE',
  DATAMANAGEMENT_API_ERROR: 'DATA_MANAGEMENT_API_ERROR',
  PROCESSING_ERROR: 'PROCESSING_ERROR',

  missingTimestamp: 'MISSING_TIMESTAMP',
  missingDataset: 'MISSING_DATASET',
  missingSpatialUnit: 'MISSING_SPATIAL_UNIT',
  missingSpatialUnitFeature: 'MISSING_SPATIAL_UNIT_FEATURE',
  dataManagementApiError: 'DATA_MANAGEMENT_API_ERROR',
  processingError: 'PROCESSING_ERROR',
};

/**
 * One entry of `jobSummary[].errorsOccurred`, as a collapsible box.
 *
 * Replaces master's `getErrorTypeShortDescription` / `...LongDescription`
 * switches over German string literals: the texts are translation keys with
 * parameters here, and the collapsing uses the app's `expandable-box` instead
 * of master's jQuery box widget, which had to be re-registered on every
 * viewport change.
 */
@Component({
  selector: 'app-job-error-box',
  standalone: true,
  imports: [TranslateModule, ExpandableBoxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .affected-list {
      margin: 0.5rem 0 0;
      padding-left: 1.25rem;
    }

    .error-message {
      margin: 0.5rem 0 0;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 0.85em;
    }
  `,
  template: `
    <expandable-box
      [title]="shortDescription()"
      [collapsed]="true"
      borderColor="red"
      variant="nested"
    >
      <div class="box-content">
        <span>{{ longDescription() }}</span>
        @if (affectedEntries().length > 0) {
          <ul class="affected-list">
            @for (entry of affectedEntries(); track entry) {
              <li>{{ entry }}</li>
            }
          </ul>
        }
        @if (errorMessage()) {
          <p class="error-message">{{ errorMessage() }}</p>
        }
      </div>
    </expandable-box>
  `,
})
export class JobErrorBoxComponent {
  private translate = inject(TranslateService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);

  // Signal-backed so the computed texts re-derive when the renderer reuses the
  // component for another row.
  private _error = signal<JobError | undefined>(undefined);
  @Input({ required: true }) set error(value: JobError) {
    this._error.set(value);
  }

  /** The i18n segment of this error's type, whichever spelling it arrived in. */
  private typeKey = computed(() => KEY_BY_TYPE[this._error()?.type ?? '']);

  protected shortDescription = computed(() => {
    const error = this._error();
    if (!error) {
      return '';
    }
    const key = this.typeKey();
    return key ? this.translate.instant('ADMIN_SCRIPTS.JOB_ERRORS.' + key + '.SHORT') : error.type;
  });

  protected longDescription = computed(() => {
    const error = this._error();
    if (!error) {
      return '';
    }
    const key = this.typeKey();
    if (!key) {
      return this.translate.instant('ADMIN_SCRIPTS.JOB_ERRORS.UNKNOWN.LONG');
    }
    return this.translate.instant('ADMIN_SCRIPTS.JOB_ERRORS.' + key + '.LONG', {
      resourceType: this.resourceTypeLabel(error),
      datasetName: this.datasetName(error),
    });
  });

  /** The per-type detail list: timestamps or spatial unit features. */
  protected affectedEntries = computed(() => {
    const error = this._error();
    if (!error) {
      return [];
    }
    if (this.typeKey() === 'MISSING_TIMESTAMP') {
      return [...(error.affectedTimestamps ?? [])].sort();
    }
    if (this.typeKey() === 'MISSING_SPATIAL_UNIT_FEATURE') {
      return [...(error.affectedSpatialUnitFeatures ?? [])].sort();
    }
    return [];
  });

  /**
   * The server's own text for this error. The schema marks it required, and for
   * an unmapped type it is the only thing that says what went wrong.
   */
  protected errorMessage = computed(() => this._error()?.errorMessage ?? '');

  private isGeoresource(error: JobError): boolean {
    return (error.affectedResourceType ?? '').toLowerCase() === 'georesource';
  }

  private resourceTypeLabel(error: JobError): string {
    return this.translate.instant(
      this.isGeoresource(error)
        ? 'ADMIN_SCRIPTS.JOB_ERRORS.RESOURCE_TYPE.GEORESOURCE'
        : 'ADMIN_SCRIPTS.JOB_ERRORS.RESOURCE_TYPE.INDICATOR'
    );
  }

  /** Resolves the affected dataset id to a name, per resource type. */
  private datasetName(error: JobError): string {
    const name = this.isGeoresource(error)
      ? this.georesourceStore.getGeoresourceMetadataById(error.affectedDatasetId)?.datasetName
      : this.indicatorStore.getIndicatorMetadataById(error.affectedDatasetId)?.indicatorName;
    return name ?? this.translate.instant('ADMIN_SCRIPTS.JOB_ERRORS.UNKNOWN_DATASET');
  }
}
