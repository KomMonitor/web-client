import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  DualListBoxComponent,
  dualListInput,
} from 'components/ngComponents/customElements/dual-list-box/dual-list-box.component';
import {
  ProcessInput,
  ProcessInputEnumOption,
} from 'components/ngComponents/models/schedules.models';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ScheduleDraftService } from 'services/schedule-draft-service/schedule-draft.service';
import { buildPolarityEntry } from 'services/processes-api-service/schedule-input-builder.util';

/** One base indicator plus the polarity it enters the normalisation with. */
interface PolarityRow {
  indicatorId: string;
  polarity: string;
}

/** Comparison operators the filter offers, mirroring master's list. */
const FILTER_OPERATORS = ['=', '!=', '>', '>=', '<', '<=', 'Range', 'Contains'];

/** Schema type names that `compProp` accepts. */
const NUMERIC_SCHEMA_TYPES = new Set([
  'integer',
  'int',
  'long',
  'float',
  'double',
  'number',
  'bigdecimal',
]);

/**
 * The process-specific part of the dialog, generated from the process
 * description.
 *
 * The server sends `kommonitorUiParams.inputBoxes`; each box names the inputs
 * it holds and, through its `id`, which widget to use. Anything without a
 * dedicated widget falls back to the generic branch, which reads the input's
 * own `schema` — that is what covers `computation_method`,
 * `aggregation_method`, `comp_meth` and `num_value`.
 */
@Component({
  selector: 'app-schedule-inputs-step',
  standalone: true,
  imports: [TranslateModule, FormsModule, NgTemplateOutlet, DualListBoxComponent],
  templateUrl: './schedule-inputs-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleInputsStepComponent {
  protected draft = inject(ScheduleDraftService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);

  protected readonly operators = FILTER_OPERATORS;

  protected indicators = computed(() =>
    [...this.indicatorStore.availableIndicators].sort((a, b) =>
      (a.indicatorName ?? '').localeCompare(b.indicatorName ?? '')
    )
  );

  protected georesources = computed(() =>
    [...this.georesourceStore.availableGeoresources].sort((a, b) =>
      (a.datasetName ?? '').localeCompare(b.datasetName ?? '')
    )
  );

  /** `georesource_id_line` offers only line data; the value still goes to `georesource_id`. */
  protected lineGeoresources = computed(() =>
    this.georesources().filter((georesource) => (georesource as { isLOI?: boolean }).isLOI)
  );

  /**
   * All feature properties of the chosen georesource, for the filter.
   *
   * The schema arrives as `{ propertyName: typeName }` (e.g. `Platzzahl:
   * "Integer"`), not as a JSON Schema.
   */
  protected filterProperties = computed(() => Object.keys(this.draft.georesourceSchema()));

  /** The numeric subset, for `compProp`. */
  protected numericProperties = computed(() =>
    Object.entries(this.draft.georesourceSchema())
      .filter(([, type]) => NUMERIC_SCHEMA_TYPES.has(String(type).toLowerCase()))
      .map(([name]) => name)
  );

  protected multiSelectData(inputKey: string): dualListInput {
    const selected = (this.draft.getInput(inputKey) as string[] | undefined) ?? [];
    return {
      items: this.indicators().map((indicator) => ({
        id: indicator.indicatorId,
        name: indicator.indicatorName ?? indicator.indicatorId,
      })),
      selectedItems: selected.map((id) => ({
        id,
        name: this.indicatorName(id),
      })),
    };
  }

  protected onMultiSelect(inputKey: string, items: { id: string }[]): void {
    this.draft.setInput(
      inputKey,
      (items ?? []).map((item) => item.id)
    );
  }

  // --- polarity (C12) ---

  protected polarityRows = computed<PolarityRow[]>(() => {
    const entries = (this.draft.getInput('computation_ids_with_polarity') as unknown[]) ?? [];
    return entries.map((entry) => {
      const value = (entry as { value?: { ID?: string; POLARITY?: string } })?.value;
      return { indicatorId: value?.ID ?? '', polarity: value?.POLARITY ?? 'NORMAL' };
    });
  });

  protected addPolarityRow(indicatorId: string): void {
    if (!indicatorId) {
      return;
    }
    const rows = [...this.polarityRows(), { indicatorId, polarity: 'NORMAL' }];
    this.writePolarityRows(rows);
  }

  protected removePolarityRow(index: number): void {
    const rows = this.polarityRows().filter((_, i) => i !== index);
    this.writePolarityRows(rows);
  }

  protected setPolarity(index: number, polarity: string): void {
    const rows = this.polarityRows().map((row, i) => (i === index ? { ...row, polarity } : row));
    this.writePolarityRows(rows);
  }

  private writePolarityRows(rows: PolarityRow[]): void {
    this.draft.setInput(
      'computation_ids_with_polarity',
      rows.map((row) => buildPolarityEntry(row.indicatorId, row.polarity))
    );
  }

  // --- filter (comp_filter) ---

  protected filterValue(field: string): string {
    const filter = (this.draft.getInput('comp_filter') as Record<string, string>) ?? {};
    return filter[field] ?? '';
  }

  protected setFilterValue(field: string, value: string): void {
    const filter = (this.draft.getInput('comp_filter') as Record<string, string>) ?? {};
    this.draft.setInput('comp_filter', { ...filter, [field]: value });
  }

  /** Range needs a second value, so the filter input splits into two fields. */
  protected isRangeOperator = computed(() => this.filterValue('compFilterOperator') === 'Range');

  // --- generic branch ---

  protected enumOptions(declaration: ProcessInput): ProcessInputEnumOption[] {
    return declaration.schema?.enum ?? [];
  }

  protected inputType(declaration: ProcessInput): 'enum' | 'number' | 'date' | 'text' {
    if (declaration.schema?.enum) {
      return 'enum';
    }
    const type = declaration.schema?.type;
    if (type === 'number' || type === 'integer') {
      return 'number';
    }
    return 'text';
  }

  protected indicatorName(indicatorId: string): string {
    return this.indicatorStore.getIndicatorMetadataById(indicatorId)?.indicatorName ?? indicatorId;
  }

  protected setValue(inputKey: string, value: unknown): void {
    this.draft.setInput(inputKey, value);
  }

  protected setNumber(inputKey: string, value: string | number): void {
    const parsed = Number(value);
    this.draft.setInput(inputKey, value === '' || Number.isNaN(parsed) ? undefined : parsed);
  }

  private readNumericProperties(schema: any): string[] {
    return this.readAllProperties(schema).filter((name) => {
      const property = schema?.properties?.[name];
      const type = property?.type ?? property;
      return (
        typeof type === 'string' && ['number', 'integer', 'float'].includes(type.toLowerCase())
      );
    });
  }

  private readAllProperties(schema: any): string[] {
    if (!schema) {
      return [];
    }
    if (Array.isArray(schema.properties)) {
      return schema.properties.map((p: any) => p.name ?? p).filter(Boolean);
    }
    return Object.keys(schema.properties ?? {});
  }
}
