import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KommonitorMultiStepFormHelperService {

  constructor() { }

  /**
   * Register click handlers for multi-step forms
   * @param formId Optional form identifier
   */
  registerClickHandler(formId?: string): void {
    // This method can be extended to handle specific form interactions
    // For now, it's a placeholder that maintains compatibility with the existing code
    console.log('Multi-step form click handler registered', formId ? `for form: ${formId}` : '');
  }

  /**
   * Initialize multi-step form with default settings
   * @param totalSteps Total number of steps in the form
   * @returns Initial form configuration
   */
  initializeForm(totalSteps: number = 2): any {
    return {
      currentStep: 1,
      totalSteps: totalSteps,
      steps: Array.from({ length: totalSteps }, (_, i) => i + 1)
    };
  }

  /**
   * Validate if a step can be accessed
   * @param currentStep Current step number
   * @param targetStep Target step number
   * @param validationRules Optional validation rules for step transitions
   * @returns Whether the step transition is valid
   */
  canAccessStep(currentStep: number, targetStep: number, validationRules?: any): boolean {
    if (targetStep < 1 || targetStep > this.getTotalSteps()) {
      return false;
    }

    // Add custom validation logic here if needed
    if (validationRules && validationRules[targetStep]) {
      return validationRules[targetStep]();
    }

    return true;
  }

  /**
   * Get total number of steps
   * @returns Total steps count
   */
  getTotalSteps(): number {
    return 2; // Default for most forms
  }

  /**
   * Check if form is on the last step
   * @param currentStep Current step number
   * @returns Whether current step is the last step
   */
  isLastStep(currentStep: number): boolean {
    return currentStep === this.getTotalSteps();
  }

  /**
   * Check if form is on the first step
   * @param currentStep Current step number
   * @returns Whether current step is the first step
   */
  isFirstStep(currentStep: number): boolean {
    return currentStep === 1;
  }

  /**
   * Get step progress percentage
   * @param currentStep Current step number
   * @returns Progress percentage (0-100)
   */
  getStepProgress(currentStep: number): number {
    return (currentStep / this.getTotalSteps()) * 100;
  }

  /**
   * Validate form data for a specific step
   * @param stepData Form data for the step
   * @param stepNumber Step number to validate
   * @returns Validation result object
   */
  validateStep(stepData: any, stepNumber: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Add step-specific validation logic here
    switch (stepNumber) {
      case 1:
        // Validate step 1 data
        if (!stepData || Object.keys(stepData).length === 0) {
          errors.push('Step 1 data is required');
        }
        break;
      case 2:
        // Validate step 2 data
        if (!stepData || Object.keys(stepData).length === 0) {
          errors.push('Step 2 data is required');
        }
        break;
      default:
        errors.push(`Unknown step ${stepNumber}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Reset form to initial state
   * @param formData Form data object to reset
   * @returns Reset form data
   */
  resetForm(formData: any): any {
    // Reset form data to initial state
    if (formData) {
      Object.keys(formData).forEach(key => {
        if (Array.isArray(formData[key])) {
          formData[key] = [];
        } else if (typeof formData[key] === 'boolean') {
          formData[key] = false;
        } else if (typeof formData[key] === 'string') {
          formData[key] = '';
        } else if (typeof formData[key] === 'number') {
          formData[key] = 0;
        } else {
          formData[key] = null;
        }
      });
    }
    
    return formData;
  }
}
