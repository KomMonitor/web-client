import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
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

/**
 * The comparison operators, by the `apiName` the process stores. Which set
 * applies depends on the property's type: text is compared for equality or
 * membership, everything else is also ordered and can span a range. Both lists
 * are master's.
 */
const TEXT_OPERATORS = ['Equal', 'Unequal', 'Contains'];
const ORDERED_OPERATORS = [
  'Equal',
  'Unequal',
  'Greater_than',
  'Greater_than_or_equal',
  'Less_than',
  'Less_than_or_equal',
  'Range',
];

/** Schema type that makes a property text-like for the operator list. */
const TEXT_SCHEMA_TYPE = 'string';

/** Types whose values sort as text rather than as numbers. */
const TEXT_SORTED_SCHEMA_TYPES = new Set(['string', 'boolean']);

/** The separator master writes between the two bounds of a `Range`. */
const RANGE_SEPARATOR = '-';

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
  imports: [
    TranslateModule,
    FormsModule,
    NgTemplateOutlet,
    DualListBoxComponent,
    LoadingOverlayComponent,
  ],
  templateUrl: './schedule-inputs-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleInputsStepComponent {
  protected draft = inject(ScheduleDraftService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);

  constructor() {
    // The feature table is fetched when a filter property is picked, but this
    // step is destroyed whenever the wizard moves on — coming back has to find
    // the value lists filled again.
    if (this.filterProperty()) {
      void this.draft.ensureGeoresourceFeaturesLoaded();
    }
  }

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
   * The feature properties the filter can work on.
   *
   * The schema arrives as `{ propertyName: typeName }` (e.g. `Platzzahl:
   * "Integer"`), not as a JSON Schema. Date properties are left out, as on
   * master — none of the operators compares dates.
   */
  protected filterProperties = computed(() =>
    Object.entries(this.draft.georesourceSchema())
      .filter(([, type]) => String(type).toLowerCase() !== 'date')
      .map(([name]) => name)
  );

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

  /**
   * The filter object as stored, holding exactly the three keys the process
   * declares: `compFilterProp`, `compFilterOperator`, `compFilterPropVal`.
   * Anything else here would be submitted along with them.
   */
  private filter = computed<Record<string, string>>(
    () => (this.draft.getInput('comp_filter') as Record<string, string>) ?? {}
  );

  protected filterProperty = computed(() => this.filter()['compFilterProp'] ?? '');
  protected filterOperator = computed(() => this.filter()['compFilterOperator'] ?? '');
  protected filterPropertyValue = computed(() => this.filter()['compFilterPropVal'] ?? '');

  protected isRangeOperator = computed(() => this.filterOperator() === 'Range');
  protected isContainsOperator = computed(() => this.filterOperator() === 'Contains');

  /** The operators the chosen property's type allows. */
  protected filterOperators = computed(() => {
    const property = this.filterProperty();
    if (!property) {
      return [];
    }
    const names = this.isTextProperty(property) ? TEXT_OPERATORS : ORDERED_OPERATORS;
    return names.map((apiName) => ({
      apiName,
      labelKey: 'ADMIN_SCRIPTS.ADD_MODAL.FILTER_OPERATORS.' + apiName.toUpperCase(),
    }));
  });

  /**
   * The values that actually occur in the chosen property, de-duplicated and
   * sorted. Offering them beats a free-text field: a typo here silently
   * filters everything away, and the computation runs on an empty set.
   */
  protected filterValueOptions = computed<string[]>(() => {
    const property = this.filterProperty();
    if (!property) {
      return [];
    }
    const distinct = new Set<string>();
    for (const row of this.draft.georesourceFeatures()) {
      const value = row[property];
      if (value !== undefined && value !== null && value !== '') {
        distinct.add(String(value));
      }
    }
    const values = Array.from(distinct);
    return this.sortsAsText(property)
      ? values.sort((a, b) => a.localeCompare(b))
      : values.sort((a, b) => Number(a) - Number(b));
  });

  /**
   * Both bounds of a `Range` live in the single `compFilterPropVal` the process
   * declares, joined by `-` — that is master's encoding, and the process reads
   * it back the same way. Deriving them from there keeps this step stateless,
   * so stepping away and back loses nothing.
   *
   * The search starts at index 1 so a negative lower bound stays intact.
   */
  protected rangeBounds = computed(() => {
    const value = this.filterPropertyValue();
    const separator = value.indexOf(RANGE_SEPARATOR, 1);
    return separator < 0
      ? { from: value, to: '' }
      : { from: value.slice(0, separator), to: value.slice(separator + 1) };
  });

  /** A range only makes sense upwards. */
  protected rangeToOptions = computed(() => {
    const from = this.rangeBounds().from;
    if (!from) {
      return this.filterValueOptions();
    }
    return this.filterValueOptions().filter((value) => Number(value) > Number(from));
  });

  /** `Contains` holds its selection as a comma-separated list in that same field. */
  protected containsSelection = computed(() =>
    this.filterPropertyValue()
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
  );

  protected containsData(): dualListInput {
    return {
      items: this.filterValueOptions().map((value) => ({ id: value, name: value })),
      selectedItems: this.containsSelection().map((value) => ({ id: value, name: value })),
    };
  }

  protected onContainsSelect(items: { id: string }[]): void {
    this.writeFilter({ compFilterPropVal: (items ?? []).map((item) => item.id).join(',') });
  }

  protected setFilterProperty(property: string): void {
    // Operator and value were picked for the property being replaced.
    this.draft.setInput('comp_filter', {
      compFilterProp: property,
      compFilterOperator: '',
      compFilterPropVal: '',
    });
    void this.draft.ensureGeoresourceFeaturesLoaded();
  }

  protected setFilterOperator(operator: string): void {
    // A single value, a range and a list are not convertible into each other.
    this.writeFilter({ compFilterOperator: operator, compFilterPropVal: '' });
  }

  protected setFilterValue(value: string): void {
    this.writeFilter({ compFilterPropVal: value });
  }

  protected setRangeBound(bound: 'from' | 'to', value: string): void {
    const bounds = { ...this.rangeBounds(), [bound]: value };
    this.writeFilter({
      compFilterPropVal: bounds.from || bounds.to ? bounds.from + RANGE_SEPARATOR + bounds.to : '',
    });
  }

  private writeFilter(changes: Record<string, string>): void {
    this.draft.setInput('comp_filter', { ...this.filter(), ...changes });
  }

  /** Master offers `Contains` for text properties only. */
  private isTextProperty(property: string): boolean {
    return this.schemaType(property) === TEXT_SCHEMA_TYPE;
  }

  private sortsAsText(property: string): boolean {
    return TEXT_SORTED_SCHEMA_TYPES.has(this.schemaType(property));
  }

  private schemaType(property: string): string {
    return String(this.draft.georesourceSchema()[property] ?? '').toLowerCase();
  }

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
}
