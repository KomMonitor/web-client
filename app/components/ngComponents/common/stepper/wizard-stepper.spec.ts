import { WizardStepper } from './wizard-stepper';

describe('WizardStepper', () => {
  let securityEnabled: boolean;
  let stepper: WizardStepper;

  beforeEach(() => {
    securityEnabled = true;
    stepper = new WizardStepper([
      { key: 'metadata', label: 'STEP.METADATA' },
      { key: 'security', label: 'STEP.SECURITY', when: () => securityEnabled },
      { key: 'data', label: 'STEP.DATA' },
    ]);
  });

  it('exposes only visible steps and their count', () => {
    expect(stepper.steps.map((s) => s.label)).toEqual([
      'STEP.METADATA',
      'STEP.SECURITY',
      'STEP.DATA',
    ]);
    expect(stepper.totalSteps).toBe(3);

    securityEnabled = false;
    expect(stepper.steps.map((s) => s.label)).toEqual(['STEP.METADATA', 'STEP.DATA']);
    expect(stepper.totalSteps).toBe(2);
  });

  it('keeps the steps array reference stable while visibility is unchanged', () => {
    const first = stepper.steps;
    expect(stepper.steps).toBe(first);

    securityEnabled = false;
    expect(stepper.steps).not.toBe(first);
  });

  it('addresses steps by key independent of index shifts', () => {
    stepper.goTo(2);
    expect(stepper.isActive('security')).toBe(true);
    expect(stepper.isActive('data')).toBe(false);

    securityEnabled = false;
    // step 2 is now the data step
    expect(stepper.isActive('security')).toBe(false);
    expect(stepper.isActive('data')).toBe(true);
  });

  it('clamps navigation to the visible range', () => {
    stepper.next();
    stepper.next();
    stepper.next();
    expect(stepper.currentStep).toBe(3); // next() stops at the last visible step

    stepper.goTo(99);
    expect(stepper.currentStep).toBe(3); // goTo rejects out-of-range targets
    stepper.goTo(0);
    expect(stepper.currentStep).toBe(3);

    stepper.reset();
    stepper.previous();
    expect(stepper.currentStep).toBe(1);
  });
  it('surfaces the invalid flag of each step', () => {
    let metadataInvalid = false;
    const marked = new WizardStepper([
      { key: 'metadata', label: 'M', invalid: () => metadataInvalid },
      { key: 'data', label: 'D' },
    ]);

    expect(marked.steps.map((step) => step.invalid)).toEqual([false, false]);

    metadataInvalid = true;

    expect(marked.steps.map((step) => step.invalid)).toEqual([true, false]);
  });

  it('rebuilds the memoised step array when an invalid flag flips', () => {
    let invalid = false;
    const marked = new WizardStepper([{ key: 'metadata', label: 'M', invalid: () => invalid }]);
    const first = marked.steps;
    expect(marked.steps).toBe(first);

    invalid = true;

    expect(marked.steps).not.toBe(first);
  });

  it('ignores the invalid flag of a hidden step', () => {
    let securityVisible = false;
    const marked = new WizardStepper([
      { key: 'metadata', label: 'M' },
      { key: 'security', label: 'S', when: () => securityVisible, invalid: () => true },
    ]);

    expect(marked.steps.some((step) => step.invalid)).toBe(false);

    securityVisible = true;

    expect(marked.steps.some((step) => step.invalid)).toBe(true);
  });
});
