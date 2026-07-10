import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IndicatorClassificationStateService } from '../../indicator-classification-state.service';

/**
 * Segmented control letting the user pick the classification type of the indicator:
 * numeric (sequential/diverging) or categorical (qualitative). Drives
 * {@link IndicatorClassificationStateService.classificationType} via `setType`.
 */
@Component({
  selector: 'app-classification-type-toggle',
  templateUrl: './classification-type-toggle.component.html',
  styleUrls: ['./classification-type-toggle.component.scss'],
  imports: [TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationTypeToggleComponent {
  protected state = inject(IndicatorClassificationStateService);
}
