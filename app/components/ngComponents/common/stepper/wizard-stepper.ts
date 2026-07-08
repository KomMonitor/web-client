import { signal } from '@angular/core';
import { StepperStep } from './stepper.component';

export interface WizardStepDefinition {
  /** Stable identifier the templates address the step by (`isActive(key)`). */
  key: string;
  label: string;
  /** The step is part of the wizard only while this returns true (default: always). */
  when?: () => boolean;
}

/**
 * Step-flow state for the admin wizard modals, used together with
 * `<app-stepper>`. Replaces the per-modal copies of
 * `currentStep`/`totalSteps`/`nextStep`/`previousStep`/`goToStep` and the
 * duplicated with/without-security step arrays: steps are declared once with a
 * `when` condition, and templates address them by key via
 * `stepper.isActive('security')` instead of index arithmetic like
 * `currentStep === 4 && enableKeycloakSecurity`.
 *
 * Template usage:
 *   <app-stepper [steps]="stepper.steps" [(currentStep)]="stepper.currentStep">
 *   <fieldset [style.display]="stepper.isActive('security') ? 'block' : 'none'">
 *   <input type="button" (click)="stepper.next()" />
 */
export class WizardStepper {
  // Signal-backed behind a getter/setter shim: templates of OnPush host
  // components read `currentStep`/`isActive()` during rendering and are
  // re-rendered when the step changes programmatically (e.g. reset() after an
  // async save) — without any template or consumer changes.
  private readonly _currentStep = signal(1);

  /** 1-based index into the currently visible steps (bind with [(currentStep)]). */
  get currentStep(): number {
    return this._currentStep();
  }
  set currentStep(value: number) {
    this._currentStep.set(value);
  }

  private cachedSteps: StepperStep[] = [];
  private cachedSignature: string | null = null;

  constructor(private readonly definitions: WizardStepDefinition[]) {}

  private get visibleDefinitions(): WizardStepDefinition[] {
    return this.definitions.filter((definition) => !definition.when || definition.when());
  }

  /**
   * Steps for `<app-stepper>`. The array reference stays stable while the step
   * visibility is unchanged, so the OnPush stepper only re-renders when a
   * conditional step actually appears/disappears.
   */
  get steps(): StepperStep[] {
    const visible = this.visibleDefinitions;
    const signature = visible.map((definition) => definition.key).join('|');
    if (signature !== this.cachedSignature) {
      this.cachedSignature = signature;
      this.cachedSteps = visible.map((definition) => ({ label: definition.label }));
    }
    return this.cachedSteps;
  }

  get totalSteps(): number {
    return this.visibleDefinitions.length;
  }

  /** True while the step with the given key is visible and the current one. */
  isActive(key: string): boolean {
    return this.visibleDefinitions[this.currentStep - 1]?.key === key;
  }

  next(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previous(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goTo(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  reset(): void {
    this.currentStep = 1;
  }
}
