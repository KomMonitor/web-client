import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';

@Component({
  selector: 'app-indicator-add-step6-comparison',
  templateUrl: './indicator-add-step6-comparison.component.html',
  styleUrls: [
    '../indicator-add-form.shared.scss',
    './indicator-add-step6-comparison.component.scss',
  ],
  imports: [CommonModule, FormsModule],
  standalone: true,
})
export class IndicatorAddStep6ComparisonComponent {
  protected state = inject(IndicatorAddFormStateService);
}
