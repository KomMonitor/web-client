import { Component, Input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MODAL_CONFIRM, MODAL_FORM } from 'util/modal-presets';

import { AdminModalService } from './admin-modal.service';

@Component({ selector: 'app-test-dialog', template: '', standalone: true })
class TestDialogComponent {
  @Input() name = '';
  @Input() count = 0;
  init(): void {
    this.count = 42;
  }
}

describe('AdminModalService', () => {
  let service: AdminModalService;
  let modal: TestDialogComponent;
  let open: jest.Mock;

  function settleWith(result: Promise<unknown>): void {
    open.mockReturnValue({ componentInstance: modal, result });
  }

  beforeEach(() => {
    modal = new TestDialogComponent();
    open = jest.fn();
    TestBed.configureTestingModule({ providers: [{ provide: NgbModal, useValue: { open } }] });
    service = TestBed.inject(AdminModalService);
  });

  describe('open', () => {
    it('opens the component with the given preset', async () => {
      settleWith(Promise.resolve());
      await service.open(TestDialogComponent, MODAL_FORM);
      expect(open).toHaveBeenCalledWith(TestDialogComponent, MODAL_FORM);
    });

    it('assigns the input values before the dialog renders', async () => {
      settleWith(Promise.resolve());
      await service.open(TestDialogComponent, MODAL_FORM, { name: 'Stadtteile', count: 3 });
      expect(modal.name).toBe('Stadtteile');
      expect(modal.count).toBe(3);
    });

    it('hands the instance to a setup callback', async () => {
      settleWith(Promise.resolve());
      await service.open(TestDialogComponent, MODAL_FORM, (dialog) => dialog.init());
      expect(modal.count).toBe(42);
    });

    it('resolves with the value the dialog closed with', async () => {
      settleWith(Promise.resolve({ name: 'Bezirke' }));
      await expect(service.open(TestDialogComponent, MODAL_FORM)).resolves.toEqual({
        name: 'Bezirke',
      });
    });

    it('resolves with undefined when the dialog is dismissed', async () => {
      settleWith(Promise.reject('cancel'));
      await expect(service.open(TestDialogComponent, MODAL_FORM)).resolves.toBeUndefined();
    });
  });

  describe('confirm', () => {
    it('opens the dialog as a confirmation', async () => {
      settleWith(Promise.resolve(true));
      await service.confirm(TestDialogComponent, { name: 'Bezirke' });
      expect(open).toHaveBeenCalledWith(TestDialogComponent, MODAL_CONFIRM);
      expect(modal.name).toBe('Bezirke');
    });

    it('resolves true when the dialog closes with true', async () => {
      settleWith(Promise.resolve(true));
      await expect(service.confirm(TestDialogComponent)).resolves.toBe(true);
    });

    it('resolves false when the dialog closes with anything else', async () => {
      settleWith(Promise.resolve(false));
      await expect(service.confirm(TestDialogComponent)).resolves.toBe(false);
    });

    it('resolves false when the dialog is dismissed', async () => {
      settleWith(Promise.reject('cancel'));
      await expect(service.confirm(TestDialogComponent)).resolves.toBe(false);
    });
  });
});
