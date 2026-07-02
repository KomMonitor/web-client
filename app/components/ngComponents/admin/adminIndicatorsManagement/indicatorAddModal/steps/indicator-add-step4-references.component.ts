import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';

@Component({
  selector: 'app-indicator-add-step4-references',
  templateUrl: './indicator-add-step4-references.component.html',
  styleUrls: ['../indicator-add-form.shared.scss'],
  imports: [CommonModule, FormsModule, ExpandableBoxComponent],
  standalone: true,
})
export class IndicatorAddStep4ReferencesComponent {
  protected state = inject(IndicatorAddFormStateService);
}
