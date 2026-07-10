import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { IndicatorClassificationStateService } from '../../indicator-classification-state.service';
import { ClassificationColorPickerComponent } from './classification-color-picker.component';

/**
 * Per-spatial-unit class-break editor for the "regional default" method: one tab
 * per spatial level, each with the editable break values and a legend showing the
 * (individually overridable) color, editable label and computed value range of
 * every class. Break values must be ascending; invalid tabs are flagged.
 */
@Component({
  selector: 'app-classification-regional-breaks',
  templateUrl: './classification-regional-breaks.component.html',
  styleUrls: [
    './classification-fields.shared.scss',
    './classification-regional-breaks.component.scss',
  ],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    NgbNavModule,
    ClassificationColorPickerComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationRegionalBreaksComponent {
  protected state = inject(IndicatorClassificationStateService);
  private cdr = inject(ChangeDetectorRef);

  // Re-check this OnPush view when the service rebuilds its plain state arrays in
  // bulk (e.g. class-count change) while this editor stays mounted.
  private readonly revisionSync = effect(() => {
    this.state.revision();
    this.cdr.markForCheck();
  });
}
