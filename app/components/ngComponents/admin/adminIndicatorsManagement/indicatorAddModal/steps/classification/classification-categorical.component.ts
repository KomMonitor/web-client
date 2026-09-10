import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  imports: [CommonModule, TranslateModule, ClassificationColorPickerComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationCategoricalComponent {
  protected state = inject(IndicatorClassificationStateService);
}
