import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorAddStep5ClassificationComponent {
  protected state = inject(IndicatorAddFormStateService);
  private cdr = inject(ChangeDetectorRef);

  // Re-render this OnPush view whenever the shared form-state service reports
  // an async bulk rewrite of its plain fields (see stateRevision docs).
  private readonly stateSync = effect(() => {
    this.state.stateRevision();
    this.cdr.markForCheck();
  });
}
