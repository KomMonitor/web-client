import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { LevelRegisterModalComponent } from './level-register-modal.component';

describe('LevelRegisterModalComponent', () => {
  let fixture: ComponentFixture<LevelRegisterModalComponent>;
  let component: LevelRegisterModalComponent;
  let activeModal: NgbActiveModal;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LevelRegisterModalComponent, TranslateModule.forRoot()],
      providers: [NgbActiveModal],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(LevelRegisterModalComponent);
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);
    component.existingNames = ['Stadt Essen'];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('requires a name', () => {
    expect(component.form.invalid).toBe(true);

    component.form.controls.name.setValue('Neue Ebene');
    expect(component.form.valid).toBe(true);
  });

  it('rejects a name that is already taken, ignoring case and padding', () => {
    component.form.controls.name.setValue('  stadt essen ');

    expect(component.form.controls.name.hasError('uniqueName')).toBe(true);
  });

  it('closes with the trimmed name', () => {
    const close = jest.spyOn(activeModal, 'close');
    component.form.controls.name.setValue('  Neue Ebene  ');

    component.submit();

    expect(close).toHaveBeenCalledWith('Neue Ebene');
  });

  it('does not close while the form is invalid', () => {
    const close = jest.spyOn(activeModal, 'close');

    component.submit();

    expect(close).not.toHaveBeenCalled();
    expect(component.form.controls.name.touched).toBe(true);
  });

  it('dismisses on cancel', () => {
    const dismiss = jest.spyOn(activeModal, 'dismiss');

    component.cancel();

    expect(dismiss).toHaveBeenCalledWith('cancel');
  });
});
