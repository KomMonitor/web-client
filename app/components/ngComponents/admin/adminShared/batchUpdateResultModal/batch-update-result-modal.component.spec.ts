import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import type { BatchUpdateRowResult } from 'services/batch-update-service/batch-update.model';
import { BatchUpdateResultModalComponent } from './batch-update-result-modal.component';

/**
 * A leaf component whose whole purpose is what it renders, so this fixture is
 * rendered. Without a translation loader ngx-translate echoes the key back,
 * which is what the assertions rely on.
 */
describe('BatchUpdateResultModalComponent', () => {
  let fixture: ComponentFixture<BatchUpdateResultModalComponent>;
  let component: BatchUpdateResultModalComponent;

  const rows = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('tbody tr'));

  function render(
    results: BatchUpdateRowResult[],
    resourceType: 'indicator' | 'georesource' = 'indicator'
  ) {
    component.resourceType = resourceType;
    component.results = results;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchUpdateResultModalComponent, TranslateModule.forRoot()],
      providers: [{ provide: NgbActiveModal, useValue: { close: jest.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchUpdateResultModalComponent);
    component = fixture.componentInstance;
  });

  it('renders one row per result with its status', () => {
    render([
      { label: 'Bevölkerung', resourceId: 'a', status: 'success', message: '' },
      { label: 'Fläche', resourceId: 'b', status: 'error', message: 'line 3 broken' },
    ]);

    expect(rows()).toHaveLength(2);
    expect(rows()[0].textContent).toContain('Bevölkerung');
    expect(rows()[0].querySelector('.bg-success')).not.toBeNull();
    expect(rows()[1].querySelector('.bg-danger')).not.toBeNull();
  });

  it('puts the server detail into a collapsible block as text', () => {
    render([{ label: 'Fläche', resourceId: 'b', status: 'error', message: '<b>boom</b>' }]);

    const detail = rows()[0].querySelector('details pre')!;
    // Interpolated, not assigned to innerHTML: the markup stays visible text.
    expect(detail.textContent).toBe('<b>boom</b>');
    expect(detail.querySelector('b')).toBeNull();
  });

  it('translates a message key instead of printing it', () => {
    render([
      {
        label: 'Fläche',
        resourceId: 'b',
        status: 'error',
        message: '',
        messageKey: 'ADMIN_INDICATORS.BATCH_MODAL.ROW_METADATA_MISSING',
      },
    ]);

    expect(rows()[0].textContent).toContain('ADMIN_INDICATORS.BATCH_MODAL.ROW_METADATA_MISSING');
    expect(rows()[0].querySelector('details')).toBeNull();
  });

  it('shows no detail block for a successful row', () => {
    render([{ label: 'Bevölkerung', resourceId: 'a', status: 'success', message: '' }]);

    expect(rows()[0].querySelector('details')).toBeNull();
  });

  it('summarises the run', () => {
    render([
      { label: 'A', resourceId: 'a', status: 'success', message: '' },
      { label: 'B', resourceId: 'b', status: 'error', message: 'x' },
    ]);

    expect(component.summary()).toEqual({ total: 2, success: 1, error: 1 });
  });

  it('warns that a mixed run stays partially applied', () => {
    render([
      { label: 'A', resourceId: 'a', status: 'success', message: '' },
      { label: 'B', resourceId: 'b', status: 'error', message: 'x' },
    ]);

    expect(component.partiallyApplied()).toBe(true);
    expect(fixture.nativeElement.querySelector('.alert-warning')).not.toBeNull();
  });

  it('does not warn when every row succeeded or every row failed', () => {
    render([{ label: 'A', resourceId: 'a', status: 'success', message: '' }]);
    expect(component.partiallyApplied()).toBe(false);

    render([{ label: 'B', resourceId: 'b', status: 'error', message: 'x' }]);
    expect(component.partiallyApplied()).toBe(false);
  });

  it('labels the first column by resource type', () => {
    render([], 'georesource');
    expect(component.resourceLabelKey()).toBe('ADMIN_SHARED_UI.BATCH_UPDATE.RESOURCE_GEORESOURCE');

    render([], 'indicator');
    expect(component.resourceLabelKey()).toBe('ADMIN_SHARED_UI.BATCH_UPDATE.RESOURCE_INDICATOR');
  });

  it('renders an empty-state row for an empty result list', () => {
    render([]);

    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain('NO_ROWS');
  });

  it('tolerates a null result list', () => {
    component.results = null;
    fixture.detectChanges();

    expect(component.rows()).toEqual([]);
  });
});
