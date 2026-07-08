import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ResourceMetadataFormComponent } from '../../../adminShared/resourceMetadataForm/resource-metadata-form.component';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';

@Component({
  selector: 'app-indicator-add-step2-metadata',
  templateUrl: './indicator-add-step2-metadata.component.html',
  styleUrls: ['../indicator-add-form.shared.scss'],
  imports: [ReactiveFormsModule, ResourceMetadataFormComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorAddStep2MetadataComponent {
  protected state = inject(IndicatorAddFormStateService);
  private cdr = inject(ChangeDetectorRef);

  // Re-render this OnPush view whenever the shared form-state service reports
  // an async bulk rewrite of its plain fields (see stateRevision docs).
  private readonly stateSync = effect(() => {
    this.state.stateRevision();
    this.cdr.markForCheck();
  });
}
