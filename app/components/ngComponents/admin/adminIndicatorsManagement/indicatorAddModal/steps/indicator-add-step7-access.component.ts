import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';

@Component({
  selector: 'app-indicator-add-step7-access',
  templateUrl: './indicator-add-step7-access.component.html',
  styleUrls: ['../indicator-add-form.shared.scss', './indicator-add-step7-access.component.scss'],
  imports: [CommonModule, FormsModule, AgGridAngular],
  standalone: true,
})
export class IndicatorAddStep7AccessComponent {
  protected state = inject(IndicatorAddFormStateService);
}
