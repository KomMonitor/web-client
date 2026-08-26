import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { KmDatePickerComponent } from 'components/ngComponents/customElements/date-picker/km-date-picker.component';
import type { TimeseriesMapping } from 'services/resource-import-service/resource-import.model';
import { FormErrorComponent } from '../formError/form-error.component';
import { FormControlAriaDirective } from '../formError/form-control-aria.directive';
import {
  TimeseriesMappingDraftFormGroup,
  addOrUpdateTimeseriesMapping,
  buildTimeseriesMappingDraftForm,
  patchTimeseriesMappingDraft,
  removeTimeseriesMapping,
  resetTimeseriesMappingDraft,
  timeseriesMappingDraftToEntry,
} from './timeseries-mapping-form.model';

/**
 * Editor for an indicator time-series mapping: one entry per time slice, made
 * of the attribute holding the indicator values plus the time stamp that slice
 * belongs to (entered directly or read from another attribute).
 *
 * Angular port of the AngularJS `indicatorEditTimeseriesMapping` component,
 * which was deleted in the migration without a replacement — leaving the
 * indicator importer to submit an empty mapping. Differences to the original,
 * all deliberate:
 *
 * - It is a `ControlValueAccessor` over `TimeseriesMapping[]` instead of a
 *   component that talks to its host through four `$rootScope` broadcasts
 *   (`timeseriesMappingChanged`, `loadTimeseriesMapping`,
 *   `resetTimeseriesMapping`) and a `$scope.timeseriesMapping` reference shared
 *   by inheritance. Loading and resetting are plain `writeValue` calls now.
 * - The time stamp uses `<km-date-picker>` rather than the jQuery datepicker
 *   plugin, so no `$('.…Datepicker')` bootstrapping and no `$digest` timeouts.
 * - The draft row is a typed `FormGroup`, so the add button is gated by
 *   `draft.invalid` instead of a three-clause `ng-disabled` expression.
 */
@Component({
  selector: 'app-timeseries-mapping-form',
  templateUrl: './timeseries-mapping-form.component.html',
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    KmDatePickerComponent,
    FormErrorComponent,
    FormControlAriaDirective,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeseriesMappingFormComponent),
      multi: true,
    },
  ],
})
export class TimeseriesMappingFormComponent implements ControlValueAccessor {
  private cdr = inject(ChangeDetectorRef);

  /** The staging row above the overview table. */
  readonly draft: TimeseriesMappingDraftFormGroup = buildTimeseriesMappingDraftForm();

  /** Current mapping, i.e. the value of the outer form control. */
  mapping: TimeseriesMapping[] = [];

  /** Set through `setDisabledState` when used as a form control. */
  disabled = false;

  private onChange: (value: TimeseriesMapping[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  /**
   * Clears the time-stamp source the toggle just turned off, so a stale value
   * cannot be submitted through the hidden field (same intent as the original
   * `onChangeUseTimeseriesAsProperty`).
   */
  onChangeUseTimestampProperty(): void {
    if (this.draft.controls.useTimestampProperty.value) {
      this.draft.controls.timestamp.setValue('');
    } else {
      this.draft.controls.timestampProperty.setValue('');
    }
  }

  /** Adds the draft, replacing an existing entry for the same attribute name. */
  onClickUpdateMapping(): void {
    if (this.draft.invalid || this.disabled) {
      this.draft.markAllAsTouched();
      return;
    }

    this.setMapping(
      addOrUpdateTimeseriesMapping(this.mapping, timeseriesMappingDraftToEntry(this.draft))
    );
    resetTimeseriesMappingDraft(this.draft);
  }

  /** Loads an entry back into the draft; re-adding it replaces the entry. */
  onClickEditEntry(entry: TimeseriesMapping): void {
    patchTimeseriesMappingDraft(this.draft, entry);
  }

  onClickDeleteEntry(entry: TimeseriesMapping): void {
    if (this.disabled) {
      return;
    }
    this.setMapping(removeTimeseriesMapping(this.mapping, entry));
  }

  private setMapping(next: TimeseriesMapping[]): void {
    this.mapping = next;
    this.onChange(next);
    this.onTouched();
  }

  writeValue(value: TimeseriesMapping[] | null | undefined): void {
    this.mapping = Array.isArray(value) ? [...value] : [];
    resetTimeseriesMappingDraft(this.draft);
    // Written from outside the view (form patch / reset) on an OnPush host.
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: TimeseriesMapping[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.draft.disable({ emitEvent: false });
    } else {
      this.draft.enable({ emitEvent: false });
    }
    this.cdr.markForCheck();
  }
}
