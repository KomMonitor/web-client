import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ScriptHelperService } from 'services/script-helper-service/script-helper.service';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';

@Component({
  selector: 'app-script-parameters',
  templateUrl: './script-parameters.component.html',
  styleUrls: ['./script-parameters.component.scss'],
  standalone: true,
  imports: [FormsModule, ExpandableBoxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptParametersComponent {
  protected scriptHelperService = inject(ScriptHelperService);

  parameterName_tmp: string | undefined = undefined;
  parameterDescription_tmp: string | undefined = undefined;
  parameterDefaultValue_tmp: any = undefined;
  parameterNumericMinValue_tmp: number = 0;
  parameterNumericMaxValue_tmp: number = 1;
  parameterDataType_tmp: any = undefined;

  onChangeParameterDataType(): void {
    this.parameterDefaultValue_tmp = undefined;
    if (this.parameterDataType_tmp?.apiName === 'boolean') {
      this.parameterDefaultValue_tmp = false;
    }
  }

  onAddScriptParameter(): void {
    this.scriptHelperService.addScriptParameter(
      this.parameterName_tmp,
      this.parameterDescription_tmp,
      this.parameterDataType_tmp,
      this.parameterDefaultValue_tmp,
      this.parameterNumericMinValue_tmp,
      this.parameterNumericMaxValue_tmp
    );
    this.resetForm();
  }

  private resetForm(): void {
    this.parameterName_tmp = undefined;
    this.parameterDescription_tmp = undefined;
    this.parameterDefaultValue_tmp = undefined;
    this.parameterNumericMinValue_tmp = 0;
    this.parameterNumericMaxValue_tmp = 1;
    this.parameterDataType_tmp = undefined;
  }

  isAddParameterDisabled(): boolean {
    return (
      !this.parameterDataType_tmp ||
      this.parameterDefaultValue_tmp === undefined ||
      !this.parameterName_tmp ||
      !this.parameterDescription_tmp
    );
  }
}
