import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  ElementRef,
  QueryList,
  HostListener,
  AfterViewInit,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export interface StepperStep {
  /** ngx-translate key resolved in the template via the `translate` pipe. */
  label: string;
  /** Renders the bubble as invalid; never affects whether the step is clickable. */
  invalid?: boolean;
}

@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
})
export class StepperComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) steps!: StepperStep[];
  @Input() currentStep: number = 1;
  @Output() currentStepChange = new EventEmitter<number>();

  /**
   * When true, every step is directly clickable regardless of canNavigateFn.
   */
  @Input() allStepsClickable: boolean = false;

  /**
   * A function (passed from the parent) that returns true when the given
   * 1-based step number may be navigated to.
   * Ignored when allStepsClickable is true.
   */
  @Input() canNavigateFn: (step: number) => boolean = (_step: number) => true;

  isClickable(step: number): boolean {
    return this.allStepsClickable || this.canNavigateFn(step);
  }

  /** Percentage (0-100) of the progress bar to fill based on current step */
  get progressPercent(): number {
    if (!this.steps || this.steps.length <= 1) return 100;
    const totalGaps = this.steps.length - 1;
    const completedGaps = Math.max(0, Math.min(this.currentStep - 1, totalGaps));
    return (completedGaps / totalGaps) * 100;
  }

  onStepClick(step: number): void {
    if (this.isClickable(step)) {
      this.currentStepChange.emit(step);
    }
  }

  @ViewChild('stepperRoot', { read: ElementRef })
  stepperRoot!: ElementRef<HTMLDivElement>;
  @ViewChildren('circle', { read: ElementRef }) circles!: QueryList<ElementRef<HTMLElement>>;

  private _updateTimeout: any = null;

  ngAfterViewInit(): void {
    // initial calculation after view init
    this.scheduleUpdate();

    // recalc whenever circles change (e.g., steps input changes)
    this.circles.changes.subscribe(() => this.scheduleUpdate());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentStep'] || changes['steps']) {
      this.scheduleUpdate();
    }
  }

  ngOnDestroy(): void {
    if (this._updateTimeout) {
      clearTimeout(this._updateTimeout);
    }
  }

  @HostListener('window:resize') onWindowResize(): void {
    this.scheduleUpdate();
  }

  private scheduleUpdate(delay = 20): void {
    if (this._updateTimeout) clearTimeout(this._updateTimeout);
    this._updateTimeout = setTimeout(() => {
      this.updateLineBounds();
    }, delay);
  }

  private updateLineBounds(): void {
    try {
      const root = this.stepperRoot?.nativeElement;
      const circles = this.circles?.toArray() || [];
      if (!root || circles.length === 0) return;

      const rootRect = root.getBoundingClientRect();
      const first = circles[0].nativeElement.getBoundingClientRect();
      const last = circles[circles.length - 1].nativeElement.getBoundingClientRect();

      // center x coordinates relative to root
      const firstCenter = (first.left + first.right) / 2 - rootRect.left;
      const lastCenter = (last.left + last.right) / 2 - rootRect.left;

      const left = Math.max(0, firstCenter);
      const width = Math.max(0, lastCenter - firstCenter);

      root.style.setProperty('--line-left', `${left}px`);
      root.style.setProperty('--line-width', `${width}px`);

      // set progress width in px: distance from first bubble center to
      // the center of the current step's bubble (so it aligns exactly)
      const clampedIndex = Math.max(0, Math.min(this.currentStep - 1, circles.length - 1));
      const currentRect = circles[clampedIndex].nativeElement.getBoundingClientRect();
      const currentCenter = (currentRect.left + currentRect.right) / 2 - rootRect.left;
      const progressPx = Math.max(0, currentCenter - firstCenter);
      root.style.setProperty('--progress-width', `${progressPx}px`);
    } catch (e) {
      // fail silently
    }
  }
}
