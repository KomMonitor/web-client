import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';

@Component({
  selector: 'app-indicator-add-step1-basic',
  templateUrl: './indicator-add-step1-basic.component.html',
  styleUrls: ['../indicator-add-form.shared.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true,
})
export class IndicatorAddStep1BasicComponent {
  protected state = inject(IndicatorAddFormStateService);
  protected envConfigService = inject(EnvConfigService);
}
