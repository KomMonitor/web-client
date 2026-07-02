import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KmDatePickerComponent } from 'components/ngComponents/customElements/date-picker/km-date-picker.component';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';

@Component({
  selector: 'app-indicator-add-step2-metadata',
  templateUrl: './indicator-add-step2-metadata.component.html',
  styleUrls: ['../indicator-add-form.shared.scss'],
  imports: [CommonModule, FormsModule, KmDatePickerComponent],
  standalone: true,
})
export class IndicatorAddStep2MetadataComponent {
  protected state = inject(IndicatorAddFormStateService);
}
