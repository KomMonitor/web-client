import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IndicatorClassificationStateService } from '../../indicator-classification-state.service';
import { ClassificationColorPickerComponent } from './classification-color-picker.component';

/**
 * Categorical (qualitative) classification editor: a manually defined list of
 * categories, each with a value, an editable label and a color (palette color,
 * or an individual override). Categories beyond the palette size fall back to the
 * configurable default color and are flagged as overflow.
 */
@Component({
  selector: 'app-classification-categorical',
  templateUrl: './classification-categorical.component.html',
  styleUrls: ['./classification-fields.shared.scss', './classification-categorical.component.scss'],
  imports: [CommonModule, FormsModule, TranslateModule, ClassificationColorPickerComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationCategoricalComponent {
  protected state = inject(IndicatorClassificationStateService);
  private cdr = inject(ChangeDetectorRef);

  // Re-check this OnPush view when the service rebuilds its plain state arrays in
  // bulk (e.g. category-count change, mapping import) while this editor stays mounted.
  private readonly revisionSync = effect(() => {
    this.state.revision();
    this.cdr.markForCheck();
  });
}
