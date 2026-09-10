import { FormControl, FormGroup, Validators } from '@angular/forms';

/**
 * Shared "Zugriffsschutz und Eigentümerschaft" step of the resource add
 * wizards: the owning organization and the public-read flag. The role grid
 * itself stays an imperative AG-Grid read through `@ViewChild`.
 *
 * The owner is required only when Keycloak security is enabled — with it off
 * the whole step is hidden, and a mandatory control would keep the submit
 * button disabled forever.
 */
export type SecurityStepGroup = FormGroup<{
  ownerOrganization: FormControl<string>;
  isPublic: FormControl<boolean>;
}>;

export function buildSecurityStepForm(options: { withSecurity: boolean }): SecurityStepGroup {
  return new FormGroup({
    ownerOrganization: new FormControl('', {
      nonNullable: true,
      validators: options.withSecurity ? [Validators.required] : [],
    }),
    isPublic: new FormControl(false, { nonNullable: true }),
  });
}
