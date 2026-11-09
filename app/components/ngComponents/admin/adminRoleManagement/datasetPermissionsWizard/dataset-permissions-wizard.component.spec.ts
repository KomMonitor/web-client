import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, mergeMap, throwError, timer } from 'rxjs';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
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
  let notifications: { showError: jest.Mock };

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
    notifications = { showError: jest.fn() };

    TestBed.configureTestingModule({
      imports: [DatasetPermissionsWizardComponent, TranslateModule.forRoot()],
      providers: [
        { provide: NgbActiveModal, useValue: activeModal },
        { provide: NotificationService, useValue: notifications },
        ...testBed.providers,
      ],
    });

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('spec', {
      ADMIN_DATASET_PERMISSIONS: {
        TITLE: 'Rechte von {{owner}}',
        SAVE_FAILED: 'Fehler: {{message}}',
        DONE: { TITLE_ONE: 'Ein Datensatz', TITLE_MANY: '{{count}} Datensätze' },
      },
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

  describe('transfer', () => {
    const TRANSFER = 'ADMIN_DATASET_PERMISSIONS.TRANSFER';
    const state = () => fixture.debugElement.injector.get(DatasetPermissionsWizardStateService);
    const query = (selector: string) =>
      fixture.debugElement.query(By.css(selector))?.nativeElement as HTMLElement | undefined;
    const doneTitle = () => query('.transfer-done .done-title')?.textContent!.trim();

    /** Grants ou-2 read access and goes to the review step. */
    function decideAndReview(): void {
      state().setAction('ou-2', 'viewer', 'grant');
      fixture.componentInstance.stepper.currentStep = 3;
      fixture.detectChanges();
    }

    async function clickTransfer(): Promise<void> {
      clickFooter(TRANSFER);
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('is offered on the last step only, and only with changes', () => {
      fixture.componentInstance.stepper.currentStep = 3;
      fixture.detectChanges();
      expect(footerLabels()).not.toContain(TRANSFER);

      state().setAction('ou-2', 'viewer', 'grant');
      fixture.detectChanges();
      expect(footerLabels()).toEqual([
        'ADMIN_SHARED.CANCEL',
        'ADMIN_SHARED_UI.STEP.PREVIOUS',
        TRANSFER,
      ]);

      clickFooter('ADMIN_SHARED_UI.STEP.PREVIOUS');
      expect(footerLabels()).not.toContain(TRANSFER);
    });

    it('sends the patch and then shows on how many datasets the rights were transferred', async () => {
      decideAndReview();
      const body = state().patch();
      await clickTransfer();

      expect(testBed.adminRoleManagement.patchDatasetPermissions).toHaveBeenCalledWith(body);
      expect(doneTitle()).toBe('Ein Datensatz');
      expect(query('.wizard-steps')!.hidden).toBe(true);
      expect(footerLabels()).toEqual(['ADMIN_SHARED.CLOSE']);
      expect(query('.transfer-done .restart')).toBeDefined();

      clickFooter('ADMIN_SHARED.CLOSE');
      expect(activeModal.dismiss).toHaveBeenCalled();
    });

    it('starts over from the first step with the selection kept and nothing decided', async () => {
      testBed.georesources.update((list) => [
        ...list,
        georesourceSource('g2', 'ou-1', []),
        georesourceSource('g3', 'ou-1', []),
      ]);
      state().setSelected('georesource:g3', false);
      decideAndReview();
      await clickTransfer();
      expect(doneTitle()).toBe('2 Datensätze');

      query('.transfer-done .restart')!.click();
      fixture.detectChanges();

      expect(query('.transfer-done')).toBeUndefined();
      expect(query('.wizard-steps')!.hidden).toBe(false);
      expect(visibleSections()).toEqual([0]);
      expect(state().decisions()).toEqual({});
      expect(state().isSelected('georesource:g3')).toBe(false);
      expect(state().selectionCount()).toEqual({ selected: 2, total: 3 });
    });

    it('reports a failed transfer and keeps the dialog and the decisions as they were', async () => {
      // Fails in a later task, as HttpClient does. A synchronous or microtask
      // failure would reject before the native `await` in save() attaches its
      // handler — jest runs async/await natively, unlike the app build — and
      // zone.js would report that through NgZone as an uncaught error.
      testBed.adminRoleManagement.patchDatasetPermissions.mockReturnValue(
        timer(0).pipe(mergeMap(() => throwError(() => ({ error: { message: 'kaputt' } }))))
      );
      decideAndReview();
      await clickTransfer();

      expect(notifications.showError).toHaveBeenCalledWith('Fehler: kaputt');
      expect(query('.transfer-done')).toBeUndefined();
      expect(visibleSections()).toEqual([2]);
      expect(state().decisions()['ou-2']).toEqual({ viewer: 'grant', editor: 'keep' });
      expect(footerLabels()).toContain(TRANSFER);
    });

    it('warns instead of offering a further transfer when the datasets could not be reloaded', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      testBed.bootstrap.fetchGeoresourcesMetadata.mockRejectedValue(new Error('offline'));
      decideAndReview();
      await clickTransfer();

      expect(doneTitle()).toBe('Ein Datensatz');
      expect(query('.transfer-done .done-stale')).toBeDefined();
      expect(query('.transfer-done .restart')).toBeUndefined();
      expect(notifications.showError).not.toHaveBeenCalled();
    });

    it('locks the dialog while the transfer is under way', async () => {
      const response = new Subject<void>();
      testBed.adminRoleManagement.patchDatasetPermissions.mockReturnValue(response);
      decideAndReview();
      clickFooter(TRANSFER);

      expect(footerButtons().map((button) => button.disabled)).toEqual([true, true, true]);
      expect((query('.btn-close') as HTMLButtonElement).disabled).toBe(true);
      expect(query('app-loading-overlay .overlay')).toBeDefined();

      response.next();
      response.complete();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(doneTitle()).toBe('Ein Datensatz');
      expect((query('.btn-close') as HTMLButtonElement).disabled).toBe(false);
    });
  });
});
