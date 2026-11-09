import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MetadataLoadingState } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';

import { DatasetPermissionsWizardComponent } from './dataset-permissions-wizard.component';
import { DatasetPermissionsWizardStateService } from './dataset-permissions-wizard-state.service';
import { georesourceSource } from './dataset-permissions.fixture';
import { WizardStateTestBed, wizardStateTestBed } from './dataset-permissions-wizard-state.testing';

/**
 * The dialog frame: title, stepper, footer and the loading overlay. It runs on
 * the real state with the stores faked; what the steps show is tested in
 * their own specs.
 */
describe('DatasetPermissionsWizardComponent', () => {
  let fixture: ComponentFixture<DatasetPermissionsWizardComponent>;
  let testBed: WizardStateTestBed;
  let activeModal: { dismiss: jest.Mock };

  beforeEach(() => {
    testBed = wizardStateTestBed(
      { georesources: [georesourceSource('g1', 'ou-1', [])] },
      { 'ou-1': 'm', 'ou-2': 'm' }
    );
    testBed.accessControl.update((units) =>
      units.map((unit) =>
        unit.organizationalUnitId === 'ou-1' ? { ...unit, name: 'Umweltamt' } : unit
      )
    );
    activeModal = { dismiss: jest.fn() };

    TestBed.configureTestingModule({
      imports: [DatasetPermissionsWizardComponent, TranslateModule.forRoot()],
      providers: [{ provide: NgbActiveModal, useValue: activeModal }, ...testBed.providers],
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
      .queryAll(By.css('.modal-body section'))
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
    const state = fixture.debugElement.injector.get(DatasetPermissionsWizardStateService);
    expect(state.ownerId()).toBe('ou-1');
    expect(state.selectionCount()).toEqual({ selected: 1, total: 1 });

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

  it('covers the steps while the metadata is still loading', () => {
    const overlay = () => fixture.debugElement.query(By.css('app-loading-overlay .overlay'));
    expect(overlay()).toBeNull();

    testBed.metadataLoading.next(MetadataLoadingState.INPROGRESS);
    fixture.detectChanges();
    expect(overlay()).not.toBeNull();

    testBed.metadataLoading.next(MetadataLoadingState.COMPLETE);
    fixture.detectChanges();
    expect(overlay()).toBeNull();
  });

  it('dismisses on cancel and on the close button', () => {
    clickFooter('ADMIN_SHARED.CANCEL');
    (fixture.debugElement.query(By.css('.btn-close')).nativeElement as HTMLElement).click();

    expect(activeModal.dismiss).toHaveBeenCalledTimes(2);
  });
});
