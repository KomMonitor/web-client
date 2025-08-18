import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KommonitorMultiStepFormHelperService {

  constructor() { }

  /**
   * Register click handler for multi-step forms
   */
  registerClickHandler(): void {
    // This method is called to register click handlers for multi-step forms
    // In the original AngularJS service, this would set up event listeners
    // For now, it's a placeholder that can be enhanced as needed
    console.log('Multi-step form click handler registered');
  }

  /**
   * Validate step data
   */
  validateStep(stepNumber: number, stepData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    switch (stepNumber) {
      case 1:
        // Basic validation for step 1
        if (!stepData.datasetName) {
          errors.push('Dataset name is required');
        }
        if (!stepData.georesourceType) {
          errors.push('Georesource type is required');
        }
        break;
        
      case 2:
        // Metadata validation for step 2
        if (!stepData.description) {
          errors.push('Description is required');
        }
        if (!stepData.datasource) {
          errors.push('Datasource is required');
        }
        if (!stepData.contact) {
          errors.push('Contact is required');
        }
        break;
        
      case 3:
        // Topic hierarchy validation for step 3
        if (!stepData.topicReference) {
          errors.push('Topic reference is required');
        }
        break;
        
      case 4:
        // Access control validation for step 4 (if security is enabled)
        if (stepData.enableKeycloakSecurity) {
          if (!stepData.ownerOrganization) {
            errors.push('Owner organization is required');
          }
        }
        break;
        
      case 5:
        // Spatial data validation for step 5
        if (!stepData.converter) {
          errors.push('Converter is required');
        }
        if (!stepData.datasourceType) {
          errors.push('Datasource type is required');
        }
        break;
        
      default:
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Get step title
   */
  getStepTitle(stepNumber: number): string {
    const titles: { [key: number]: string } = {
      1: 'Metadaten der Georessource',
      2: 'Allgemeine Metadaten',
      3: 'Themenhierarchie',
      4: 'Zugriffsschutz und Eigentümerschaft',
      5: 'Räumlicher Datensatz'
    };
    
    return titles[stepNumber] || `Step ${stepNumber}`;
  }

  /**
   * Get step subtitle
   */
  getStepSubtitle(stepNumber: number): string {
    const subtitles: { [key: number]: string } = {
      1: 'Angaben über Metadaten der Georessource',
      2: 'Angaben über allgemeine Metadaten',
      3: 'Angaben über die Themenhierarchie',
      4: 'Angaben über Zugriffsschutz und Eigentümerschaft',
      5: 'Angaben über den räumlichen Datensatz'
    };
    
    return subtitles[stepNumber] || '';
  }

  /**
   * Check if step is required
   */
  isStepRequired(stepNumber: number): boolean {
    // All steps are required by default
    return true;
  }

  /**
   * Get step validation rules
   */
  getStepValidationRules(stepNumber: number): any {
    const rules: { [key: number]: any } = {
      1: {
        datasetName: { required: true, minLength: 1 },
        georesourceType: { required: true }
      },
      2: {
        description: { required: true, minLength: 10 },
        datasource: { required: true, minLength: 5 },
        contact: { required: true, minLength: 5 },
        updateInterval: { required: true },
        lastUpdate: { required: true, type: 'date' }
      },
      3: {
        topicReference: { required: true }
      },
      4: {
        ownerOrganization: { required: true }
      },
      5: {
        converter: { required: true },
        datasourceType: { required: true },
        georesourceDataSourceIdProperty: { required: true },
        georesourceDataSourceNameProperty: { required: true }
      }
    };
    
    return rules[stepNumber] || {};
  }
}
