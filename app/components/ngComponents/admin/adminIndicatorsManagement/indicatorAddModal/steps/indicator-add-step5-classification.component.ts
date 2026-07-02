import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';

@Component({
  selector: 'app-indicator-add-step5-classification',
  templateUrl: './indicator-add-step5-classification.component.html',
  styleUrls: [
    '../indicator-add-form.shared.scss',
    './indicator-add-step5-classification.component.scss',
  ],
  imports: [CommonModule, FormsModule],
  standalone: true,
})
export class IndicatorAddStep5ClassificationComponent {
  protected state = inject(IndicatorAddFormStateService);
}
