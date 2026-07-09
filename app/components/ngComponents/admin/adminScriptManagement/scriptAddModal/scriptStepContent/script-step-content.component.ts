import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  ScriptHelperService,
  ScriptSelectItem,
} from 'services/script-helper-service/script-helper.service';
import { ScriptDefinitionWrapperComponent } from './script-definition-wrapper/script-definition-wrapper.component';
import { FilterableSelectComponent } from '../../../../common/filterableSelect/filterable-select.component';
import { ScriptGenericComponent } from './script-types/script-generic/script-generic.component';

import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-script-step-content',
  templateUrl: './script-step-content.component.html',
  styleUrls: ['./script-step-content.component.scss'],
  imports: [
    TranslateModule,
    FormsModule,
    ScriptDefinitionWrapperComponent,
    ScriptGenericComponent,
    FilterableSelectComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptStepContentComponent {
  protected scriptHelperService = inject(ScriptHelperService);

  protected selectedScriptType: ScriptSelectItem | undefined = undefined;

  protected scriptTypeOptions: ScriptSelectItem[] =
    this.scriptHelperService.availableScriptTypeOptions;

  // TODO: remove later?
  reset(): void {
    this.selectedScriptType = undefined;
  }

  onChangeScriptType(item: ScriptSelectItem): void {
    this.selectedScriptType = item;
  }
}
