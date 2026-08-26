import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';

@Component({
  selector: 'app-indicator-add-step6-comparison',
  templateUrl: './indicator-add-step6-comparison.component.html',
  styleUrls: [
    '../indicator-add-form.shared.scss',
    './indicator-add-step6-comparison.component.scss',
  ],
  imports: [TranslateModule, CommonModule, FormsModule, ReactiveFormsModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorAddStep6ComparisonComponent {
  protected state = inject(IndicatorAddFormStateService);
  private cdr = inject(ChangeDetectorRef);

  // Re-render this OnPush view whenever the shared form-state service reports
  // an async bulk rewrite of its plain fields (see stateRevision docs).
  private readonly stateSync = effect(() => {
    this.state.stateRevision();
    this.cdr.markForCheck();
  });
}
