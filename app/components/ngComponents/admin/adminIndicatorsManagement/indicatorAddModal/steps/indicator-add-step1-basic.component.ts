import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';

@Component({
  selector: 'app-indicator-add-step1-basic',
  templateUrl: './indicator-add-step1-basic.component.html',
  styleUrls: ['../indicator-add-form.shared.scss'],
  imports: [TranslateModule, CommonModule, FormsModule, ReactiveFormsModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorAddStep1BasicComponent {
  protected state = inject(IndicatorAddFormStateService);

  protected envConfigService = inject(EnvConfigService);
}
