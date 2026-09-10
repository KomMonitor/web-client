import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormControlAriaDirective } from './form-control-aria.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, FormControlAriaDirective],
  template: `<input [formControl]="control" appAria="su-metadata-name" />`,
})
class HostComponent {
  control = new FormControl('', Validators.required);
}

describe('FormControlAriaDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const input = (): HTMLInputElement => fixture.nativeElement.querySelector('input');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sets the field id on the host element', () => {
    expect(input().getAttribute('id')).toBe('su-metadata-name');
  });

  it('stays silent while the control is untouched and pristine', () => {
    expect(input().getAttribute('aria-invalid')).toBeNull();
    expect(input().getAttribute('aria-describedby')).toBeNull();
  });

  it('points at the error message once the control is touched and invalid', () => {
    host.control.markAsTouched();
    fixture.detectChanges();

    expect(input().getAttribute('aria-invalid')).toBe('true');
    expect(input().getAttribute('aria-describedby')).toBe('su-metadata-name-error');
  });

  it('clears the attributes again when the control becomes valid', () => {
    host.control.markAsTouched();
    fixture.detectChanges();

    host.control.setValue('Quartiere');
    fixture.detectChanges();

    expect(input().getAttribute('aria-invalid')).toBeNull();
    expect(input().getAttribute('aria-describedby')).toBeNull();
  });
});
