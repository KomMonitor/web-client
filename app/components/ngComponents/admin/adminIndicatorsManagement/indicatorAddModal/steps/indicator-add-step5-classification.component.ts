import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ColorPaletteSwatchComponent } from 'components/ngComponents/common/colorPaletteSwatch/color-palette-swatch.component';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';
import { ClassificationNumericComponent } from './classification/classification-numeric.component';
import { ClassificationCategoricalComponent } from './classification/classification-categorical.component';
import { ClassificationPalettePickerComponent } from './classification/classification-palette-picker.component';
import { ClassificationTypeToggleComponent } from './classification/classification-type-toggle.component';

@Component({
  selector: 'app-indicator-add-step5-classification',
  templateUrl: './indicator-add-step5-classification.component.html',
  styleUrls: [
    '../indicator-add-form.shared.scss',
    './indicator-add-step5-classification.component.scss',
  ],
  imports: [
    TranslateModule,
    CommonModule,
    ColorPaletteSwatchComponent,
    ClassificationTypeToggleComponent,
    ClassificationPalettePickerComponent,
    ClassificationNumericComponent,
    ClassificationCategoricalComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorAddStep5ClassificationComponent {
  protected state = inject(IndicatorAddFormStateService);
}
