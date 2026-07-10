import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { KmColorPickerComponent } from 'components/ngComponents/customElements/color-picker/km-color-picker.component';
import { IndicatorClassificationStateService } from '../../indicator-classification-state.service';

/**
 * Per-class-position editor for the computed classification methods (Jenks,
 * equal interval, quantile): the class breaks are computed from the data per
 * spatial level, so only the color and label of each class position are edited
 * here (top = lowest class, bottom = highest).
 */
@Component({
  selector: 'app-classification-computed-classes',
  templateUrl: './classification-computed-classes.component.html',
  styleUrls: ['./classification-computed-classes.component.scss'],
  imports: [CommonModule, FormsModule, TranslateModule, KmColorPickerComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationComputedClassesComponent {
  protected state = inject(IndicatorClassificationStateService);
}
