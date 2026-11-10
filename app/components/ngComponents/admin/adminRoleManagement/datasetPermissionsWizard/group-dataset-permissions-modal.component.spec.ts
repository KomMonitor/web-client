import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import {
  GroupDecision,
  PermissionDataset,
  RightsDraft,
  datasetsOfOwner,
  initialDraft,
} from './dataset-permissions.model';
import { georesourceSource, group, indicatorSource, sources } from './dataset-permissions.fixture';
import { GroupDatasetPermissionsModalComponent } from './group-dataset-permissions-modal.component';

const OWNER = 'owner';
const a = group('a');

/**
 * Group a reads timeseries s1 of i1, edits i0 (an indicator without
 * timeseries, so read access as well), and has nothing on g1, which is public.
 */
const DATASETS: PermissionDataset[] = datasetsOfOwner(
  OWNER,
  sources({
    indicators: [
      indicatorSource('i1', OWNER, [], { s1: ['a-viewer'], s2: [] }, 'Arbeitslose'),
      indicatorSource('i0', OWNER, ['a-editor'], {}, 'Bevölkerung'),
    ],
    georesources: [{ ...georesourceSource('g1', OWNER, [], 'Schulen'), isPublic: true }],
  })
);

describe('GroupDatasetPermissionsModalComponent', () => {
  let fixture: ComponentFixture<GroupDatasetPermissionsModalComponent>;
  let activeModal: { close: jest.Mock; dismiss: jest.Mock };

  function setUp(decision?: GroupDecision): void {
    activeModal = { close: jest.fn(), dismiss: jest.fn() };
    TestBed.configureTestingModule({
      imports: [GroupDatasetPermissionsModalComponent, TranslateModule.forRoot()],
      providers: [{ provide: NgbActiveModal, useValue: activeModal }],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('spec', {
      ADMIN_DATASET_PERMISSIONS: {
        SELECTION: { SPATIAL_UNITS_MANY: '{{count}} Ebenen' },
        PUBLIC: { ALL: 'öffentlich', SOME: 'teils öffentlich' },
        GROUP_DIALOG: {
          TITLE: 'Rechte von {{group}}',
          VIEWER: 'Lesen',
          EDITOR: 'Editieren',
          TOGGLE_LABEL: '{{level}}: {{name}}',
          DEVIATIONS_ONE: '1 Abweichung',
          DEVIATIONS_MANY: '{{count}} Abweichungen',
        },
      },
    });
    translate.use('spec');

    fixture = TestBed.createComponent(GroupDatasetPermissionsModalComponent);
    Object.assign(fixture.componentInstance, {
      group: a,
      datasets: DATASETS,
      initialDraft: initialDraft(a, DATASETS, decision),
    });
    fixture.detectChanges();
  }

  const host = () => fixture.nativeElement as HTMLElement;
  const text = (element: Element | null) => element!.textContent!.replace(/\s+/g, ' ').trim();
  const kindRow = (kind: string) =>
    host().querySelector(`tbody[data-kind="${kind}"] .kind-row`) as HTMLElement;
  const row = (selector: string) => host().querySelector(selector) as HTMLElement;
  /** The viewer and editor checkboxes of a row. */
  const boxes = (rowElement: HTMLElement) =>
    Array.from(rowElement.querySelectorAll<HTMLInputElement>('input[type=checkbox]'));
  const states = (rowElement: HTMLElement) =>
    boxes(rowElement).map((box) => (box.indeterminate ? 'some' : box.checked ? 'all' : 'none'));
  const dots = (rowElement: HTMLElement) =>
    Array.from(rowElement.querySelectorAll('.matrix-cell .deviation-dot'), (dot) =>
      dot.classList.contains('visible')
    );
  const deviationCount = () => host().querySelector('.deviation-count');
  const lastDraft = (): RightsDraft => activeModal.close.mock.calls.at(-1)![0];

  function click(element: Element): void {
    (element as HTMLElement).click();
    fixture.detectChanges();
  }

  it('names the group and lists only kinds with datasets, collapsed', () => {
    setUp();
    expect(text(host().querySelector('.modal-title'))).toBe('Rechte von a');
    expect(
      Array.from(host().querySelectorAll('tbody'), (body) => body.getAttribute('data-kind'))
    ).toEqual(['indicator', 'georesource']);
    expect(host().querySelectorAll('.dataset-row')).toHaveLength(0);
    expect(host().querySelector('tbody[data-kind="indicator"] .hint-row')).not.toBeNull();
    expect(host().querySelector('tbody[data-kind="georesource"] .hint-row')).toBeNull();
  });

  it('shows per kind whether all, some or none of its slots have a right', () => {
    setUp();
    expect(states(kindRow('indicator'))).toEqual(['some', 'some']);
    expect(states(kindRow('georesource'))).toEqual(['none', 'none']);
    expect(dots(kindRow('indicator'))).toEqual([false, false]);
    expect(deviationCount()).toBeNull();
  });

  it('sets a right on every slot of a kind, edit along with read, and marks the change', () => {
    setUp();
    click(boxes(kindRow('indicator'))[1]);

    expect(states(kindRow('indicator'))).toEqual(['all', 'all']);
    expect(dots(kindRow('indicator'))).toEqual([true, true]);
    // i1: edit on the indicator and, along with it, read on s2; i0 had both already.
    expect(text(deviationCount())).toBe('2 Abweichungen');

    click(boxes(kindRow('indicator'))[1]);
    expect(states(kindRow('indicator'))).toEqual(['all', 'none']);
  });

  it('opens an indicator into one row per spatial unit, and edits them one by one', () => {
    setUp();
    click(kindRow('indicator').querySelector('.row-toggle')!);
    const indicator = row('[data-dataset="indicator:i1"]');
    expect(text(indicator.querySelector('.row-toggle .row-name'))).toBe('Arbeitslose');
    expect(text(indicator.querySelector('.row-meta'))).toBe('2 Ebenen');
    expect(row('[data-dataset="indicator:i0"]').querySelector('.row-toggle')).toBeNull();

    click(indicator.querySelector('.row-toggle')!);
    const s2 = row('[data-slot="indicatorspatialunits:i1:s2"]');
    expect(text(s2.querySelector('th'))).toBe('level s2');
    expect(boxes(s2)[0].getAttribute('aria-label')).toBe('Lesen: Arbeitslose – level s2');

    // Edit holds for the whole indicator: a spatial unit row offers read only.
    expect(boxes(s2)).toHaveLength(1);
    expect(s2.querySelector('.whole-indicator')).not.toBeNull();

    click(boxes(s2)[0]);
    expect(states(s2)).toEqual(['all']);
    // The edit column only holds the placeholder, which never lights up.
    expect(dots(s2)).toEqual([true, false]);
    expect(states(row('[data-dataset="indicator:i1"]'))).toEqual(['all', 'none']);
    expect(text(deviationCount())).toBe('1 Abweichung');
  });

  it('edits an indicator as a whole, with read on every spatial unit', () => {
    setUp();
    click(kindRow('indicator').querySelector('.row-toggle')!);
    const indicator = row('[data-dataset="indicator:i1"]');
    click(indicator.querySelector('.row-toggle')!);
    const s1 = row('[data-slot="indicatorspatialunits:i1:s1"]');
    const s2 = row('[data-slot="indicatorspatialunits:i1:s2"]');

    click(boxes(indicator)[1]);
    expect(states(indicator)).toEqual(['all', 'all']);
    expect([states(s1), states(s2)]).toEqual([['all'], ['all']]);

    // Read off on one spatial unit takes edit on the indicator away.
    click(boxes(s1)[0]);
    expect(states(indicator)).toEqual(['some', 'none']);
    expect(states(s2)).toEqual(['all']);
  });

  it('opens with the decision of the group table and resets to the current rights', () => {
    setUp({ viewer: 'grant', editor: 'keep' });
    expect(states(kindRow('georesource'))).toEqual(['all', 'none']);
    expect(dots(kindRow('georesource'))).toEqual([true, false]);

    click(host().querySelector('.modal-footer .reset')!);
    expect(states(kindRow('georesource'))).toEqual(['none', 'none']);
    expect(deviationCount()).toBeNull();

    click(host().querySelector('.modal-footer .apply')!);
    expect(lastDraft()).toEqual({
      'indicators:i1': { viewer: false, editor: false },
      'indicatorspatialunits:i1:s1': { viewer: true, editor: false },
      'indicatorspatialunits:i1:s2': { viewer: false, editor: false },
      'indicators:i0': { viewer: true, editor: true },
      'georesources:g1': { viewer: false, editor: false },
    });
  });

  it('closes with the edited draft on apply', () => {
    setUp();
    click(boxes(kindRow('georesource'))[0]);
    click(host().querySelector('.modal-footer .apply')!);

    expect(activeModal.close).toHaveBeenCalledTimes(1);
    expect(lastDraft()['georesources:g1']).toEqual({ viewer: true, editor: false });
    expect(activeModal.dismiss).not.toHaveBeenCalled();
  });

  it('is dismissed by cancel and by the close button', () => {
    setUp();
    click(host().querySelector('.modal-footer .btn-outline-secondary.me-auto')!);
    click(host().querySelector('.btn-close')!);
    expect(activeModal.dismiss).toHaveBeenCalledTimes(2);
    expect(activeModal.close).not.toHaveBeenCalled();
  });

  it('marks a public dataset', () => {
    setUp();
    click(kindRow('georesource').querySelector('.row-toggle')!);
    click(kindRow('indicator').querySelector('.row-toggle')!);
    const badge = (selector: string) =>
      row(selector).querySelector('.public-badge')?.textContent!.trim();
    expect(badge('[data-dataset="georesource:g1"]')).toBe('öffentlich');
    expect(badge('[data-dataset="indicator:i1"]')).toBeUndefined();
  });
});
