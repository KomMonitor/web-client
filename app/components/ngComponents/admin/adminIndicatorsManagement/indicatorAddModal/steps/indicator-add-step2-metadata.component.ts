import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ResourceMetadataFormComponent } from '../../../adminShared/resourceMetadataForm/resource-metadata-form.component';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';

@Component({
  selector: 'app-indicator-add-step2-metadata',
  templateUrl: './indicator-add-step2-metadata.component.html',
  styleUrls: ['../indicator-add-form.shared.scss'],
  imports: [TranslateModule, ReactiveFormsModule, ResourceMetadataFormComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorAddStep2MetadataComponent {
  protected state = inject(IndicatorAddFormStateService);
}
