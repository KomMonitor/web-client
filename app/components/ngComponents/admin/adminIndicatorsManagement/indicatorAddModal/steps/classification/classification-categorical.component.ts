import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { KmColorPickerComponent } from 'components/ngComponents/customElements/color-picker/km-color-picker.component';
import { IndicatorClassificationStateService } from '../../indicator-classification-state.service';

/**
 * Categorical (qualitative) classification editor: a manually defined list of
 * categories, each with a value, an editable label and a color (palette color,
 * or an individual override). Categories beyond the palette size fall back to the
 * configurable default color and are flagged as overflow.
 */
@Component({
  selector: 'app-classification-categorical',
  templateUrl: './classification-categorical.component.html',
  styleUrls: ['./classification-categorical.component.scss'],
  imports: [CommonModule, FormsModule, TranslateModule, KmColorPickerComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationCategoricalComponent {
  protected state = inject(IndicatorClassificationStateService);
}
