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

  /**
   * A reload that fails in a later task, as HttpClient does. A synchronous or
   * microtask failure would reject before the native `await` in the state
   * attaches its handler — jest runs async/await natively, unlike the app
   * build — and zone.js would report that through NgZone as an uncaught error.
   */
  const failLater = () =>
    new Promise<void>((_, reject) => setTimeout(() => reject(new Error('offline'))));

  /** Lets the native promise chain behind a click run to its end. */
  const settle = () => new Promise((resolve) => setTimeout(resolve));

  beforeEach(async () => {
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
    // Opening reloads the current rights; let that finish.
    await fixture.whenStable();
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

  it('covers the steps while the current rights are reloaded', async () => {
    const overlay = () => fixture.debugElement.query(By.css('app-loading-overlay .overlay'));
    let finish!: () => void;
    testBed.bootstrap.reloadDatasetMetadata.mockReturnValueOnce(
      new Promise<void>((resolve) => (finish = resolve))
    );

    const reloading = fixture.componentInstance.reload();
    fixture.detectChanges();
    expect(overlay()).not.toBeNull();

    finish();
    await reloading;
    fixture.detectChanges();
    expect(overlay()).toBeNull();
  });

  it('warns while the current rights could not be loaded and offers to retry', async () => {
    const notice = () => fixture.debugElement.query(By.css('.wizard-steps .load-failed'));
    expect(notice()).toBeNull();

    testBed.bootstrap.reloadDatasetMetadata.mockImplementationOnce(failLater);
    await fixture.componentInstance.reload();
    fixture.detectChanges();
    expect(notice()).not.toBeNull();

    (notice().query(By.css('.reload')).nativeElement as HTMLElement).click();
    await settle();
    fixture.detectChanges();
    expect(notice()).toBeNull();
    expect(testBed.bootstrap.reloadDatasetMetadata).toHaveBeenCalledTimes(3);
  });

  it('goes from the review step to step 2 for datasets a dialog decision did not see', () => {
    const state = fixture.debugElement.injector.get(DatasetPermissionsWizardStateService);
    testBed.georesources.update((list) => [...list, georesourceSource('g2', 'ou-1', [])]);
    state.setSelected('georesource:g2', false);
    state.applyDraft('ou-2', { 'georesources:g1': { viewer: true, editor: false } });
    state.setSelected('georesource:g2', true);
    fixture.componentInstance.stepper.currentStep = 3;
    fixture.detectChanges();

    const toRights = fixture.debugElement.query(By.css('.added-since-dialog-notice .to-rights'));
    (toRights.nativeElement as HTMLElement).click();
    fixture.detectChanges();

    expect(visibleSections()).toEqual([1]);
    expect(
      fixture.debugElement.query(
        By.css('app-rights-step tr[data-group="ou-2"] .added-since-dialog')
      )
    ).not.toBeNull();
  });

  it('dismisses on cancel and on the close button', () => {
    clickFooter('ADMIN_SHARED.CANCEL');
    (fixture.debugElement.query(By.css('.btn-close')).nativeElement as HTMLElement).click();

    expect(activeModal.dismiss).toHaveBeenCalledTimes(2);
  });

  describe('with decisions that would be lost', () => {
    const closeButton = () =>
      fixture.debugElement.query(By.css('.btn-close')).nativeElement as HTMLElement;
    const question = () => fixture.debugElement.query(By.css('.modal-footer .cancel-question'));

    beforeEach(() => {
      fixture.debugElement.injector
        .get(DatasetPermissionsWizardStateService)
        .setAction('ou-2', 'viewer', 'grant');
      fixture.detectChanges();
    });

    it('asks before cancel discards them, and keeps editing on request', () => {
      clickFooter('ADMIN_SHARED.CANCEL');
      expect(activeModal.dismiss).not.toHaveBeenCalled();
      expect(question()).not.toBeNull();
      expect(footerLabels()).toEqual([
        'ADMIN_DATASET_PERMISSIONS.KEEP_EDITING',
        'ADMIN_DATASET_PERMISSIONS.DISCARD',
      ]);

      clickFooter('ADMIN_DATASET_PERMISSIONS.KEEP_EDITING');
      expect(question()).toBeNull();
      expect(footerLabels()).toContain('ADMIN_SHARED.CANCEL');
      expect(activeModal.dismiss).not.toHaveBeenCalled();
    });

    it('closes once the question is answered with discard', () => {
      closeButton().click();
      fixture.detectChanges();
      expect(question()).not.toBeNull();

      clickFooter('ADMIN_DATASET_PERMISSIONS.DISCARD');
      expect(activeModal.dismiss).toHaveBeenCalledTimes(1);
    });
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

    /**
     * Waits until a running transfer has finished. Its chain — reload, request,
     * reload — runs on native promises and timers, which `whenStable` does not
     * reliably wait for under load.
     */
    async function transferSettled(): Promise<void> {
      for (let i = 0; i < 50 && state().saving(); i++) {
        await settle();
      }
      await settle();
      fixture.detectChanges();
    }

    async function clickTransfer(): Promise<void> {
      clickFooter(TRANSFER);
      await transferSettled();
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
      // Announced, and the focus moves there as the transfer button is gone.
      expect(query('.transfer-done')!.getAttribute('role')).toBe('status');
      expect(document.activeElement).toBe(query('.transfer-done .done-title'));

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

      // Kept until closed, as it explains why nothing was stored.
      expect(notifications.showError).toHaveBeenCalledWith('Fehler: kaputt', { autohide: false });
      expect(query('.transfer-done')).toBeUndefined();
      expect(visibleSections()).toEqual([2]);
      expect(state().decisions()['ou-2']).toEqual({ viewer: 'grant', editor: 'keep' });
      expect(footerLabels()).toContain(TRANSFER);
    });

    it('holds the transfer back when the rights changed since the review', async () => {
      // Another admin granted ou-2 read access meanwhile, so nothing is left to change.
      testBed.bootstrap.reloadDatasetMetadata.mockImplementationOnce(async () =>
        testBed.georesources.update((list) =>
          list.map((g) => ({ ...g, permissions: ['ou-2-viewer'] }))
        )
      );
      decideAndReview();
      await clickTransfer();

      expect(testBed.adminRoleManagement.patchDatasetPermissions).not.toHaveBeenCalled();
      expect(query('.wizard-steps .changed-meanwhile')).toBeDefined();
      expect(query('.transfer-done')).toBeUndefined();
      expect(visibleSections()).toEqual([2]);
      expect(footerLabels()).not.toContain(TRANSFER);
      expect(notifications.showError).not.toHaveBeenCalled();
    });

    it('sends nothing and warns when the current rights cannot be loaded before sending', async () => {
      testBed.bootstrap.reloadDatasetMetadata.mockImplementationOnce(failLater);
      decideAndReview();
      await clickTransfer();

      expect(testBed.adminRoleManagement.patchDatasetPermissions).not.toHaveBeenCalled();
      expect(query('.wizard-steps .load-failed')).toBeDefined();
      expect(query('.transfer-done')).toBeUndefined();
      expect(footerLabels()).toContain(TRANSFER);
    });

    it('warns instead of offering a further transfer when the datasets could not be reloaded', async () => {
      testBed.bootstrap.reloadDatasetMetadata
        .mockResolvedValueOnce(undefined)
        .mockImplementationOnce(failLater);
      decideAndReview();
      await clickTransfer();

      expect(doneTitle()).toBe('Ein Datensatz');
      expect(query('.transfer-done .done-stale')).toBeDefined();
      expect(query('.transfer-done .restart')).toBeUndefined();
      expect(notifications.showError).not.toHaveBeenCalled();

      query('.transfer-done .done-stale .reload')!.click();
      await settle();
      fixture.detectChanges();
      expect(query('.transfer-done .done-stale')).toBeUndefined();
      expect(query('.transfer-done .restart')).toBeDefined();
    });

    it('locks the dialog while the transfer is under way', async () => {
      const response = new Subject<void>();
      testBed.adminRoleManagement.patchDatasetPermissions.mockReturnValue(response);
      decideAndReview();
      clickFooter(TRANSFER);

      expect(footerButtons().map((button) => button.disabled)).toEqual([true, true, true]);
      expect((query('.btn-close') as HTMLButtonElement).disabled).toBe(true);
      expect(query('app-loading-overlay .overlay')).toBeDefined();

      // The request goes out once the reload before it has settled.
      await settle();
      expect(testBed.adminRoleManagement.patchDatasetPermissions).toHaveBeenCalled();
      response.next();
      response.complete();
      await transferSettled();
      expect(doneTitle()).toBe('Ein Datensatz');
      expect((query('.btn-close') as HTMLButtonElement).disabled).toBe(false);
    });
  });
});
