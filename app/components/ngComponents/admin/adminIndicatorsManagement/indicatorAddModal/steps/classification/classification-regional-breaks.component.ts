import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { KmColorPickerComponent } from 'components/ngComponents/customElements/color-picker/km-color-picker.component';
import { IndicatorClassificationStateService } from '../../indicator-classification-state.service';

/**
 * Per-spatial-unit class-break editor for the "regional default" method: one tab
 * per spatial level, each with the editable break values and a legend showing the
 * (individually overridable) color, editable label and computed value range of
 * every class. Break values must be ascending; invalid tabs are flagged.
 */
@Component({
  selector: 'app-classification-regional-breaks',
  templateUrl: './classification-regional-breaks.component.html',
  styleUrls: ['./classification-regional-breaks.component.scss'],
  imports: [CommonModule, FormsModule, TranslateModule, NgbNavModule, KmColorPickerComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationRegionalBreaksComponent {
  protected state = inject(IndicatorClassificationStateService);
}
