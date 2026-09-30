import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { KmDatePickerComponent } from '../../../customElements/date-picker/km-date-picker.component';
import { FormErrorComponent } from '../formError/form-error.component';
import { ResourceMetadataFormGroup, UpdateIntervalOption } from './resource-metadata-form.model';

/**
 * Shared "Allgemeine Metadaten" form block used by the resource add/edit
 * modals. The typed FormGroup is owned by the host component (created via
 * `buildResourceMetadataForm()`) so its values survive stepper navigation
 * that destroys this component.
 */
@Component({
  selector: 'app-resource-metadata-form',
  standalone: true,
  imports: [TranslateModule, ReactiveFormsModule, KmDatePickerComponent, FormErrorComponent],
  templateUrl: './resource-metadata-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceMetadataFormComponent {
  @Input({ required: true }) form!: ResourceMetadataFormGroup;
  @Input() updateIntervalOptions: UpdateIntervalOption[] = [];
}
