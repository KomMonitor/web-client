import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ColorPaletteSelectComponent } from 'components/ngComponents/common/colorPaletteSelect/color-palette-select.component';
import { ColorPaletteSwatchComponent } from 'components/ngComponents/common/colorPaletteSwatch/color-palette-swatch.component';
import { PaletteType } from 'components/ngComponents/userInterface/kommonitorClassification/colors';
import { IndicatorClassificationStateService } from '../../indicator-classification-state.service';

/**
 * Color-palette chooser for the classification step: a palette dropdown (filtered
 * to the palette families that fit the current classification type) plus a preview
 * of the currently selected palette. Reuses the shared `app-color-palette-select`
 * and `app-color-palette-swatch`.
 */
@Component({
  selector: 'app-classification-palette-picker',
  templateUrl: './classification-palette-picker.component.html',
  styleUrls: ['./classification-palette-picker.component.scss'],
  imports: [TranslateModule, ColorPaletteSelectComponent, ColorPaletteSwatchComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationPalettePickerComponent {
  protected state = inject(IndicatorClassificationStateService);

  /** Palette families offered for the current classification type. */
  get paletteTypes(): PaletteType[] {
    return this.state.isCategorical ? ['qualitative'] : ['sequential', 'diverging'];
  }
}
