import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { ColorPaletteSelectComponent } from 'components/ngComponents/common/colorPaletteSelect/color-palette-select.component';
import { ColorPaletteSwatchComponent } from 'components/ngComponents/common/colorPaletteSwatch/color-palette-swatch.component';
import { ClassificationMethodSelectComponent } from 'components/ngComponents/common/classificationMethodSelect/classification-method-select.component';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';

@Component({
  selector: 'app-indicator-add-step5-classification',
  templateUrl: './indicator-add-step5-classification.component.html',
  styleUrls: [
    '../indicator-add-form.shared.scss',
    './indicator-add-step5-classification.component.scss',
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgbNavModule,
    ColorPaletteSelectComponent,
    ColorPaletteSwatchComponent,
    ClassificationMethodSelectComponent,
  ],
  standalone: true,
})
export class IndicatorAddStep5ClassificationComponent {
  protected state = inject(IndicatorAddFormStateService);
}
