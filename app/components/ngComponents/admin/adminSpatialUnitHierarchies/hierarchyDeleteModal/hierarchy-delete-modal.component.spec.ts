import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

import { createHierarchy } from '../hierarchy-demo.data';
import { HierarchyDeleteModalComponent } from './hierarchy-delete-modal.component';

describe('HierarchyDeleteModalComponent', () => {
  let fixture: ComponentFixture<HierarchyDeleteModalComponent>;
  let component: HierarchyDeleteModalComponent;
  let activeModal: NgbActiveModal;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HierarchyDeleteModalComponent, TranslateModule.forRoot()],
      providers: [NgbActiveModal],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(HierarchyDeleteModalComponent);
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);
    component.hierarchy = createHierarchy({
      id: 'h-1',
      name: 'Schulplanung',
      levels: ['Stadt Essen', 'Schulregionen Essen'],
      open: true,
    });
    fixture.detectChanges();
  });

  it('names the hierarchy and its level count', () => {
    const cells = fixture.debugElement
      .queryAll(By.css('tbody td'))
      .map((el) => el.nativeElement.textContent.trim());

    expect(cells).toEqual(['Schulplanung', '2']);
  });

  it('closes with the confirmation', () => {
    const close = jest.spyOn(activeModal, 'close');

    component.confirm();

    expect(close).toHaveBeenCalledWith(true);
  });

  it('dismisses on cancel', () => {
    const dismiss = jest.spyOn(activeModal, 'dismiss');

    component.cancel();

    expect(dismiss).toHaveBeenCalledWith('cancel');
  });
});
