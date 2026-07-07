import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ResourceMetadataFormComponent } from '../../../adminShared/resourceMetadataForm/resource-metadata-form.component';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';

@Component({
  selector: 'app-indicator-add-step2-metadata',
  templateUrl: './indicator-add-step2-metadata.component.html',
  styleUrls: ['../indicator-add-form.shared.scss'],
  imports: [ReactiveFormsModule, ResourceMetadataFormComponent],
  standalone: true,
})
export class IndicatorAddStep2MetadataComponent {
  protected state = inject(IndicatorAddFormStateService);
}
