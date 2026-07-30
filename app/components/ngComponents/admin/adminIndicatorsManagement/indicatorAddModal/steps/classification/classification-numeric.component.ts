import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
    TranslateModule,
    OverlayModule,
    ClassificationMethodSelectComponent,
    ClassificationRegionalBreaksComponent,
    ClassificationComputedClassesComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationNumericComponent {
  protected state = inject(IndicatorClassificationStateService);

  /** Whether the class-count dropdown overlay is open. */
  numClassesOpen = false;

  /** Prefer opening below the trigger, fall back to above (mirrors the palette/method selects). */
  readonly overlayPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  ];

  selectNumClasses(numClasses: number): void {
    this.state.onNumClassesChanged(numClasses);
    this.numClassesOpen = false;
  }
}
