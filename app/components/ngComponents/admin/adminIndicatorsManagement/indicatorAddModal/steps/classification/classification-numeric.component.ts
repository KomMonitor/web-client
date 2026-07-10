import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ClassificationMethodSelectComponent } from 'components/ngComponents/common/classificationMethodSelect/classification-method-select.component';
import { IndicatorClassificationStateService } from '../../indicator-classification-state.service';
import { ClassificationComputedClassesComponent } from './classification-computed-classes.component';
import { ClassificationRegionalBreaksComponent } from './classification-regional-breaks.component';

/**
 * Numeric classification branch: classification-method picker and class count,
 * then either the per-spatial-unit break editor (regional default) or the
 * per-class-position color/label editor (computed methods).
 */
@Component({
  selector: 'app-classification-numeric',
  templateUrl: './classification-numeric.component.html',
  styleUrls: ['./classification-numeric.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ClassificationMethodSelectComponent,
    ClassificationRegionalBreaksComponent,
    ClassificationComputedClassesComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationNumericComponent {
  protected state = inject(IndicatorClassificationStateService);
}
