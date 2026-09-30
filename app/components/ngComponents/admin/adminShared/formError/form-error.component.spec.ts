import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { fileRequiredForFileDatasource } from '../validators/admin-validators';
import { FormErrorComponent } from './form-error.component';

/**
 * `<app-form-error>` is a leaf component whose whole purpose is what it
 * renders, so unlike the heavy admin modal specs this one does render the
 * fixture. Without a translation loader ngx-translate echoes the key back,
 * which is exactly what we want to assert on.
 */
@Component({
  standalone: true,
  imports: [FormErrorComponent],
  template: `
    <app-form-error
      [control]="control"
      [for]="fieldId"
      [showWhen]="showWhen"
      [keyOverride]="keyOverride"
      [revealWith]="revealWith"
    />
  `,
})
class HostComponent {
  control: AbstractControl | null = new FormControl('', Validators.required);
  fieldId = 'su-metadata-name';
  showWhen: 'touched' | 'always' = 'touched';
  keyOverride = '';
  revealWith: AbstractControl | null = null;
}

describe('FormErrorComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const messageEl = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('.help-block.with-errors');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders nothing while the control is untouched and pristine', () => {
    expect(messageEl()).toBeNull();
  });

  it('renders nothing for a valid control', () => {
    host.control!.setValue('Quartiere');
    host.control!.markAsTouched();
    fixture.detectChanges();

    expect(messageEl()).toBeNull();
  });

  it('renders the mapped message once the control is touched', () => {
    host.control!.markAsTouched();
    fixture.detectChanges();

    expect(messageEl()!.textContent!.trim()).toBe('ADMIN_SHARED_UI.VALIDATION.REQUIRED');
  });

  it('re-renders when the control state changes without any input rebinding', () => {
    host.control!.markAsTouched();
    fixture.detectChanges();
    expect(messageEl()).not.toBeNull();

    host.control!.setValue('Quartiere');
    fixture.detectChanges();

    expect(messageEl()).toBeNull();
  });

  it('exposes the message for aria-describedby and screen readers', () => {
    host.control!.markAsTouched();
    fixture.detectChanges();

    const element = messageEl()!;
    expect(element.getAttribute('id')).toBe('su-metadata-name-error');
    expect(element.getAttribute('role')).toBe('alert');
  });

  it('renders immediately with showWhen="always"', () => {
    host.showWhen = 'always';
    fixture.detectChanges();

    expect(messageEl()).not.toBeNull();
  });

  it('uses keyOverride instead of the mapped key', () => {
    host.keyOverride = 'ADMIN_SPATIAL_UNITS.METADATA_STEP.NAME_INVALID';
    host.control!.markAsTouched();
    fixture.detectChanges();

    expect(messageEl()!.textContent!.trim()).toBe('ADMIN_SPATIAL_UNITS.METADATA_STEP.NAME_INVALID');
  });

  it('tolerates a null control', () => {
    host.control = null;
    fixture.detectChanges();

    expect(messageEl()).toBeNull();
  });

  it('follows the control when it is swapped out', () => {
    const other = new FormControl('', Validators.required);
    other.markAsTouched();

    host.control = other;
    fixture.detectChanges();

    expect(messageEl()).not.toBeNull();
  });

  describe('with revealWith', () => {
    let group: FormGroup<{
      datasourceType: FormControl<{ type: string } | null>;
      selectedFile: FormControl<File | null>;
    }>;

    beforeEach(() => {
      group = new FormGroup(
        {
          datasourceType: new FormControl<{ type: string } | null>(null),
          selectedFile: new FormControl<File | null>(null),
        },
        { validators: fileRequiredForFileDatasource('datasourceType') }
      );
      host.control = group;
      host.revealWith = group.controls.selectedFile;
      fixture.detectChanges();
    });

    it('stays hidden while only the host group is dirty and touched', () => {
      group.controls.datasourceType.setValue({ type: 'FILE' });
      group.controls.datasourceType.markAsDirty();
      group.controls.datasourceType.markAsTouched();
      fixture.detectChanges();

      expect(group.hasError('fileRequired')).toBe(true);
      expect(messageEl()).toBeNull();
    });

    it('appears once the whole form is marked as touched', () => {
      group.controls.datasourceType.setValue({ type: 'FILE' });
      group.markAllAsTouched();
      fixture.detectChanges();

      expect(messageEl()!.textContent!.trim()).toBe('ADMIN_SHARED_UI.VALIDATION.FILE_REQUIRED');
    });
  });
});
