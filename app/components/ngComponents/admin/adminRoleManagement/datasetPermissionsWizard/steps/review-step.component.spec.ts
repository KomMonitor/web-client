import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DatasetPermissionsWizardStateService } from '../dataset-permissions-wizard-state.service';
import { OwnerDatasetSources } from '../dataset-permissions.model';
import {
  georesourceSource,
  indicatorSource,
  spatialUnitSource,
} from '../dataset-permissions.fixture';
import { wizardStateTestBed } from '../dataset-permissions-wizard-state.testing';
import { ReviewStepComponent } from './review-step.component';

/** Step 3 on the real wizard state, with the stores faked. */

const OWNER = 'owner';
const TENANT_OF = { owner: 'm', a: 'm', b: 'm' };

/** Group a has nothing; group b edits g1 and reads su1. i1 has two timeseries. */
const DATASETS: Partial<OwnerDatasetSources> = {
  indicators: [indicatorSource('i1', OWNER, [], { s1: [], s2: [] })],
  georesources: [georesourceSource('g1', OWNER, ['b-editor'])],
  spatialUnits: [spatialUnitSource('su1', OWNER, ['b-viewer'])],
};

describe('ReviewStepComponent', () => {
  let fixture: ComponentFixture<ReviewStepComponent>;
  let state: DatasetPermissionsWizardStateService;

  beforeEach(() => {
    const testBed = wizardStateTestBed(DATASETS, TENANT_OF);
    TestBed.configureTestingModule({
      imports: [ReviewStepComponent, TranslateModule.forRoot()],
      providers: [DatasetPermissionsWizardStateService, ...testBed.providers],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('spec', {
      ADMIN_DATASET_PERMISSIONS: {
        RIGHTS: { ACTIONS: { CUSTOM: 'individuell' } },
        REVIEW: {
          NOTICE: 'Gilt nicht für Neues von {{owner}}.',
          SUMMARY_TITLE: 'Zusammenfassung',
          AFFECTS_ONE: 'betrifft 1 Datensatz',
          AFFECTS_MANY: 'betrifft {{count}} Datensätze',
          EMPTY: 'Keine Änderungen.',
          LEVELS: { VIEWER: 'Leserechte', EDITOR: 'Editierrechte' },
          GAINS_ONE: 'erhält {{level}} an 1 Datensatz',
          GAINS_MANY: 'erhält {{level}} an {{count}} Datensätzen',
          LOSES_ONE: 'verliert {{level}} an 1 Datensatz',
          LOSES_MANY: 'verliert {{level}} an {{count}} Datensätzen',
        },
      },
    });
    translate.use('spec');

    state = TestBed.inject(DatasetPermissionsWizardStateService);
    state.start(OWNER);
    fixture = TestBed.createComponent(ReviewStepComponent);
    fixture.componentRef.setInput('ownerName', 'Umweltamt');
    fixture.detectChanges();
  });

  const host = () => fixture.nativeElement as HTMLElement;
  const text = (element: Element | null) =>
    element ? element.textContent!.replace(/\s+/g, ' ').trim() : null;
  const lines = () =>
    Array.from(host().querySelectorAll('.summary-line'), (line) =>
      text(line.querySelector('span'))
    );
  const count = () => text(host().querySelector('.summary-count'));

  function update(): void {
    fixture.detectChanges();
  }

  it('says that the transfer happens once and not for future datasets of the owner', () => {
    expect(text(host().querySelector('.review-notice'))).toBe(
      'Gilt nicht für Neues von Umweltamt.'
    );
  });

  it('shows no changes, and no count, while nothing is decided', () => {
    expect(text(host().querySelector('.summary-empty'))).toBe('Keine Änderungen.');
    expect(lines()).toEqual([]);
    expect(count()).toBeNull();
  });

  it('lists a grant per group, counting an indicator once however many timeseries it has', () => {
    state.setAction('a', 'viewer', 'grant');
    update();

    expect(lines()).toEqual(['a erhält Leserechte an 3 Datensätzen']);
    expect(host().querySelector('.summary-line')!.getAttribute('data-change')).toBe('add');
    expect(host().querySelector('.summary-line .fa-plus')).not.toBeNull();
    expect(count()).toBe('betrifft 3 Datensätze');
    expect(host().querySelector('.summary-empty')).toBeNull();
  });

  it('lists what a revoke takes along, in singular where it is one dataset', () => {
    state.setAction('b', 'viewer', 'revoke');
    update();

    expect(lines()).toEqual([
      'b verliert Leserechte an 2 Datensätzen',
      'b verliert Editierrechte an 1 Datensatz',
    ]);
    expect(host().querySelectorAll('.summary-line .fa-minus')).toHaveLength(2);
    expect(count()).toBe('betrifft 2 Datensätze');
  });

  it('orders the groups by name and counts each changed dataset once', () => {
    state.setAction('b', 'editor', 'revoke');
    state.setAction('a', 'editor', 'grant');
    update();

    expect(lines()).toEqual([
      'a erhält Leserechte an 3 Datensätzen',
      'a erhält Editierrechte an 3 Datensätzen',
      'b verliert Editierrechte an 1 Datensatz',
    ]);
    expect(count()).toBe('betrifft 3 Datensätze');
  });

  it('marks a change from the per-dataset dialog as custom', () => {
    state.applyDraft('a', {
      ...state.draftFor('a'),
      'georesources:g1': { viewer: true, editor: false },
    });
    update();

    expect(lines()).toEqual(['a erhält Leserechte an 1 Datensatz']);
    expect(text(host().querySelector('.summary-line .custom-badge'))).toBe('individuell');
    expect(count()).toBe('betrifft 1 Datensatz');
  });

  it('leaves out the datasets taken out of the selection', () => {
    state.setAction('a', 'viewer', 'grant');
    state.setKindSelected('indicator', false);
    update();
    expect(lines()).toEqual(['a erhält Leserechte an 2 Datensätzen']);

    state.setKindSelected('georesource', false);
    state.setKindSelected('spatialUnit', false);
    update();
    expect(text(host().querySelector('.summary-empty'))).toBe('Keine Änderungen.');
  });
});
