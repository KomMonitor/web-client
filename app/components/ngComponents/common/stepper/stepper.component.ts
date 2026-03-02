import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export interface StepperStep {
  label: string;
}

@Component({
  selector: "app-stepper",
  templateUrl: "./stepper.component.html",
  styleUrls: ["./stepper.component.css"],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class StepperComponent {
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

  onStepClick(step: number): void {
    if (this.isClickable(step)) {
      this.currentStepChange.emit(step);
    }
  }
}
