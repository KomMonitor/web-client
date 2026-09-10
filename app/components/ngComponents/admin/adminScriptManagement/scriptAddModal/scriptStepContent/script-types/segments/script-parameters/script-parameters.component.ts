import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ScriptHelperService } from 'services/script-helper-service/script-helper.service';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { FormErrorComponent } from '../../../../../../adminShared/formError/form-error.component';
import { FormControlAriaDirective } from '../../../../../../adminShared/formError/form-control-aria.directive';

import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-script-parameters',
  templateUrl: './script-parameters.component.html',
  standalone: true,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    FormErrorComponent,
    FormControlAriaDirective,
    ExpandableBoxComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptParametersComponent {
  protected scriptHelperService = inject(ScriptHelperService);

  /**
   * Staging row for a new script parameter. Name, description, data type and a
   * default value are all mandatory — the add button gates on `draft.invalid`,
   * replacing the hand-written four-clause check.
   *
   * The default value is typed `any` on purpose: its input widget follows the
   * chosen data type (text, checkbox, integer, double).
   */
  readonly draft = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dataType: new FormControl<any | null>(null, Validators.required),
    defaultValue: new FormControl<any>(null, {
      // `false` is a valid boolean default, so `required` will not do.
      validators: [(control) => (control.value === null ? { required: true } : null)],
    }),
    numericMinValue: new FormControl(0, { nonNullable: true }),
    numericMaxValue: new FormControl(1, { nonNullable: true }),
  });

  /** Read-only views used by the template's `@if` branches. */
  get parameterDataType_tmp(): any {
    return this.draft.controls.dataType.value;
  }

  onChangeParameterDataType(): void {
    // A fresh default for the newly chosen type; booleans start unchecked.
    this.draft.controls.defaultValue.setValue(
      this.parameterDataType_tmp?.apiName === 'boolean' ? false : null
    );
  }

  onAddScriptParameter(): void {
    const value = this.draft.getRawValue();
    this.scriptHelperService.addScriptParameter(
      value.name,
      value.description,
      value.dataType,
      value.defaultValue,
      value.numericMinValue,
      value.numericMaxValue
    );
    this.resetForm();
  }

  private resetForm(): void {
    this.draft.reset({
      name: '',
      description: '',
      dataType: null,
      defaultValue: null,
      numericMinValue: 0,
      numericMaxValue: 1,
    });
  }

  isAddParameterDisabled(): boolean {
    return this.draft.invalid;
  }
}
