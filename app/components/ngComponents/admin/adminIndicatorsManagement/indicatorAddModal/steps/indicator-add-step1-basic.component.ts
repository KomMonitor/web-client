import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { FormErrorComponent } from '../../../adminShared/formError/form-error.component';
import { FormControlAriaDirective } from '../../../adminShared/formError/form-control-aria.directive';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';

@Component({
  selector: 'app-indicator-add-step1-basic',
  templateUrl: './indicator-add-step1-basic.component.html',
  styleUrls: ['../indicator-add-form.shared.scss'],
  imports: [
    TranslateModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormErrorComponent,
    FormControlAriaDirective,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorAddStep1BasicComponent {
  protected state = inject(IndicatorAddFormStateService);

  protected envConfigService = inject(EnvConfigService);

  protected get basic() {
    return this.state.addForm.controls.basic;
  }
}
