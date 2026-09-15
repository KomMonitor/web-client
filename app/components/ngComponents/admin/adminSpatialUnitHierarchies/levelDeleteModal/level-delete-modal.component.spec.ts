import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

import { LevelDeleteModalComponent } from './level-delete-modal.component';

describe('LevelDeleteModalComponent', () => {
  let fixture: ComponentFixture<LevelDeleteModalComponent>;
  let component: LevelDeleteModalComponent;
  let activeModal: NgbActiveModal;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LevelDeleteModalComponent, TranslateModule.forRoot()],
      providers: [NgbActiveModal],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(LevelDeleteModalComponent);
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);
    component.level = {
      id: 'level-1',
      name: 'Wahlbezirke Essen',
      datasource: 'Amt für Statistik',
      mandant: 'Stadt Essen',
    };
    fixture.detectChanges();
  });

  it('names the level and where its data comes from', () => {
    const cells = fixture.debugElement
      .queryAll(By.css('tbody td'))
      .map((el) => el.nativeElement.textContent.trim());

    expect(cells).toEqual(['Wahlbezirke Essen', 'Amt für Statistik']);
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
