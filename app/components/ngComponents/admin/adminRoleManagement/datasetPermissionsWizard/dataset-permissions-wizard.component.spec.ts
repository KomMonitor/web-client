import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccessControlService } from 'services/access-control-service/access-control.service';

import { DatasetPermissionsWizardComponent } from './dataset-permissions-wizard.component';
import { DatasetPermissionsWizardStateService } from './dataset-permissions-wizard-state.service';

/**
 * The dialog frame only: title, stepper and footer. The state behind it is a
 * fake here; it is tested in `dataset-permissions-wizard-state.service.spec`.
 */
describe('DatasetPermissionsWizardComponent', () => {
  let fixture: ComponentFixture<DatasetPermissionsWizardComponent>;
  let state: { ownerId: ReturnType<typeof signal<string | null>>; start: jest.Mock };
  let activeModal: { dismiss: jest.Mock };

  beforeEach(() => {
    const ownerId = signal<string | null>(null);
    state = { ownerId, start: jest.fn((id: string) => ownerId.set(id)) };
    activeModal = { dismiss: jest.fn() };

    TestBed.configureTestingModule({
      imports: [DatasetPermissionsWizardComponent, TranslateModule.forRoot()],
      providers: [
        { provide: NgbActiveModal, useValue: activeModal },
        {
          provide: AccessControlService,
          useValue: {
            getAccessControlById: (id: string) =>
              id === 'ou-1' ? { organizationalUnitId: 'ou-1', name: 'Umweltamt' } : null,
          },
        },
      ],
    });
    TestBed.overrideComponent(DatasetPermissionsWizardComponent, {
      set: { providers: [{ provide: DatasetPermissionsWizardStateService, useValue: state }] },
    });

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('spec', {
      ADMIN_DATASET_PERMISSIONS: { TITLE: 'Rechte von {{owner}}' },
    });
    translate.use('spec');

    fixture = TestBed.createComponent(DatasetPermissionsWizardComponent);
    fixture.componentInstance.ownerId = 'ou-1';
    fixture.detectChanges();
  });

  function footerButtons(): HTMLButtonElement[] {
    return fixture.debugElement
      .queryAll(By.css('.modal-footer button'))
      .map((el) => el.nativeElement);
  }

  function footerLabels(): string[] {
    return footerButtons().map((button) => button.textContent!.trim());
  }

  function visibleSections(): number[] {
    return fixture.debugElement
      .queryAll(By.css('.modal-body > section'))
      .map((el, index) => ((el.nativeElement as HTMLElement).style.display === 'none' ? -1 : index))
      .filter((index) => index >= 0);
  }

  function clickFooter(label: string): void {
    footerButtons()
      .find((button) => button.textContent!.trim() === label)!
      .click();
    fixture.detectChanges();
  }

  it('starts the run for the owner it was opened with and names it in the title', () => {
    expect(state.start).toHaveBeenCalledWith('ou-1');
    const title = fixture.debugElement.query(By.css('.modal-title')).nativeElement as HTMLElement;
    expect(title.textContent!.trim()).toBe('Rechte von Umweltamt');
  });

  it('offers next on the first step, back and next in the middle, back on the last', () => {
    expect(footerLabels()).toEqual(['ADMIN_SHARED.CANCEL', 'ADMIN_SHARED_UI.STEP.NEXT']);
    expect(visibleSections()).toEqual([0]);

    clickFooter('ADMIN_SHARED_UI.STEP.NEXT');
    expect(footerLabels()).toEqual([
      'ADMIN_SHARED.CANCEL',
      'ADMIN_SHARED_UI.STEP.PREVIOUS',
      'ADMIN_SHARED_UI.STEP.NEXT',
    ]);
    expect(visibleSections()).toEqual([1]);

    clickFooter('ADMIN_SHARED_UI.STEP.NEXT');
    expect(footerLabels()).toEqual(['ADMIN_SHARED.CANCEL', 'ADMIN_SHARED_UI.STEP.PREVIOUS']);
    expect(visibleSections()).toEqual([2]);

    clickFooter('ADMIN_SHARED_UI.STEP.PREVIOUS');
    expect(visibleSections()).toEqual([1]);
  });

  it('jumps to any step through its bubble', () => {
    const bubbles = fixture.debugElement.queryAll(By.css('.stepper-step'));
    expect(bubbles).toHaveLength(3);

    (bubbles[2].nativeElement as HTMLElement).click();
    fixture.detectChanges();

    expect(visibleSections()).toEqual([2]);
  });

  it('dismisses on cancel and on the close button', () => {
    clickFooter('ADMIN_SHARED.CANCEL');
    (fixture.debugElement.query(By.css('.btn-close')).nativeElement as HTMLElement).click();

    expect(activeModal.dismiss).toHaveBeenCalledTimes(2);
  });
});
