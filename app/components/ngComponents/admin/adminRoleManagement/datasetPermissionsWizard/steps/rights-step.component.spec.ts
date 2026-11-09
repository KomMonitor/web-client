import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminModalService } from 'components/ngComponents/admin/adminShared/modal/admin-modal.service';
import { MODAL_FORM } from 'util/modal-presets';

import { DatasetPermissionsWizardStateService } from '../dataset-permissions-wizard-state.service';
import { OwnerDatasetSources, RightsDraft } from '../dataset-permissions.model';
import {
  georesourceSource,
  indicatorSource,
  orgUnit,
  spatialUnitSource,
} from '../dataset-permissions.fixture';
import {
  WizardStateTestBed,
  wizardStateTestBed,
} from '../dataset-permissions-wizard-state.testing';
import { GroupDatasetPermissionsModalComponent } from '../group-dataset-permissions-modal.component';
import { RightsStepComponent } from './rights-step.component';

/** Step 2 on the real wizard state, with the stores faked. */

const OWNER = 'owner';
const TENANT_OF = { owner: 'm', a: 'm', b: 'm', other: 'x' };

/**
 * Group a reads i1 (one timeseries by its editor id, which implies reading)
 * and g1, and edits only half of i1. Group b edits g1. Nobody has su1.
 */
const DATASETS: Partial<OwnerDatasetSources> = {
  indicators: [indicatorSource('i1', OWNER, [], { s1: ['a-editor'], s2: ['a-viewer'] })],
  georesources: [georesourceSource('g1', OWNER, ['a-viewer', 'b-editor'])],
  spatialUnits: [spatialUnitSource('su1', OWNER, [])],
};

describe('RightsStepComponent', () => {
  let fixture: ComponentFixture<RightsStepComponent>;
  let state: DatasetPermissionsWizardStateService;
  let testBed: WizardStateTestBed;
  let modals: { open: jest.Mock };

  function setUp(
    sources: Partial<OwnerDatasetSources> = DATASETS,
    tenantOf: Record<string, string> = TENANT_OF
  ): void {
    testBed = wizardStateTestBed(sources, tenantOf);
    modals = { open: jest.fn() };
    TestBed.configureTestingModule({
      imports: [RightsStepComponent, TranslateModule.forRoot()],
      providers: [
        DatasetPermissionsWizardStateService,
        ...testBed.providers,
        { provide: AdminModalService, useValue: modals },
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('spec', {
      ADMIN_DATASET_PERMISSIONS: {
        LEVELS: { VIEWER: 'Lesen', EDITOR: 'Editieren' },
        RIGHTS: {
          INTRO_ONE: 'Ein Datensatz.',
          INTRO_MANY: '{{count}} Datensätze.',
          OPEN_HINT: 'Name anklicken.',
          SELECT_LABEL: '{{level}} für {{group}}',
          COVERAGE: '{{count}}/{{total}}',
          COVERAGE_CHANGE: '{{before}} → {{after}}',
          NO_GROUPS: '{{owner}} steht allein.',
          NO_DATASETS: 'Nichts gewählt.',
        },
      },
    });
    translate.use('spec');

    state = TestBed.inject(DatasetPermissionsWizardStateService);
    state.start(OWNER);
    fixture = TestBed.createComponent(RightsStepComponent);
    fixture.componentRef.setInput('ownerName', 'Umweltamt');
    fixture.detectChanges();
  }

  const host = () => fixture.nativeElement as HTMLElement;
  const text = (element: Element | null) => element!.textContent!.replace(/\s+/g, ' ').trim();
  const rowIds = () =>
    Array.from(host().querySelectorAll('tbody tr'), (row) => row.getAttribute('data-group'));
  const cell = (groupId: string, level: string) =>
    host().querySelector(`tr[data-group="${groupId}"] td[data-level="${level}"]`) as HTMLElement;
  const select = (groupId: string, level: string) =>
    cell(groupId, level).querySelector('select') as HTMLSelectElement;
  const coverage = (groupId: string, level: string) =>
    cell(groupId, level).querySelector('.coverage') as HTMLElement;
  const coverages = (groupId: string) => [
    text(coverage(groupId, 'viewer')),
    text(coverage(groupId, 'editor')),
  ];
  const values = (groupId: string) => [
    select(groupId, 'viewer').value,
    select(groupId, 'editor').value,
  ];

  function choose(groupId: string, level: string, value: string): void {
    const element = select(groupId, level);
    element.value = value;
    element.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it("lists the groups of the owner's tenant without the owner, sorted by name", () => {
    setUp();
    expect(rowIds()).toEqual(['a', 'b']);

    testBed.accessControl.set([
      orgUnit('owner'),
      orgUnit('a', { name: 'Zentrale' }),
      orgUnit('b', { name: 'Amt' }),
    ]);
    fixture.detectChanges();
    expect(rowIds()).toEqual(['b', 'a']);
    expect(text(host().querySelector('tr[data-group="a"] th'))).toBe('Zentrale');
  });

  it('starts unchanged, with the current coverage of the selected datasets', () => {
    setUp();
    expect(text(host().querySelector('.rights-intro'))).toBe('3 Datensätze. Name anklicken.');
    expect(values('a')).toEqual(['keep', 'keep']);
    expect(select('a', 'viewer').classList).toContain('action-keep');
    expect(select('a', 'viewer').getAttribute('aria-label')).toBe('Lesen für a');
    expect(coverages('a')).toEqual(['2/3', '0/3']);
    expect(coverages('b')).toEqual(['1/3', '1/3']);
    expect(host().querySelector('.coverage-changed')).toBeNull();
  });

  it('grants read along with edit, and shows the coverage after the transfer', () => {
    setUp();
    choose('a', 'editor', 'grant');

    expect(values('a')).toEqual(['grant', 'grant']);
    expect(select('a', 'viewer').classList).toContain('action-grant');
    expect(coverages('a')).toEqual(['2 → 3', '0 → 3']);
    expect(coverage('a', 'editor').classList).toContain('coverage-changed');
    expect(values('b')).toEqual(['keep', 'keep']);
  });

  it('revokes edit along with read', () => {
    setUp();
    choose('b', 'viewer', 'revoke');

    expect(values('b')).toEqual(['revoke', 'revoke']);
    expect(select('b', 'editor').classList).toContain('action-revoke');
    expect(coverages('b')).toEqual(['1 → 0', '1 → 0']);
  });

  it('counts only the selected datasets, and marks no change where a grant changes nothing', () => {
    setUp();
    state.setSelected('spatialUnit:su1', false);
    fixture.detectChanges();
    expect(text(host().querySelector('.rights-intro'))).toBe('2 Datensätze. Name anklicken.');
    expect(coverages('a')).toEqual(['2/2', '0/2']);

    choose('a', 'viewer', 'grant');
    expect(select('a', 'viewer').value).toBe('grant');
    expect(text(coverage('a', 'viewer'))).toBe('2/2');
    expect(coverage('a', 'viewer').classList).not.toContain('coverage-changed');
  });

  it('shows "custom" only for a level the per-dataset dialog made uneven', () => {
    setUp();
    const customOption = (level: string) =>
      select('a', level).querySelector('option[value="custom"]') as HTMLOptionElement;
    expect(customOption('editor').hidden).toBe(true);

    const draft = { ...state.draftFor('a'), 'georesources:g1': { viewer: true, editor: true } };
    state.applyDraft('a', draft);
    fixture.detectChanges();

    expect(values('a')).toEqual(['keep', 'custom']);
    expect(select('a', 'editor').classList).toContain('action-custom');
    expect(customOption('editor').hidden).toBe(false);
    expect(customOption('editor').disabled).toBe(true);
    expect(customOption('viewer').hidden).toBe(true);
    expect(coverages('a')).toEqual(['2/3', '0 → 1']);
  });

  describe('per-dataset dialog', () => {
    const openButton = (groupId: string) =>
      host().querySelector(`tr[data-group="${groupId}"] .group-link`) as HTMLButtonElement;

    /** Clicks a group's name and waits for the dialog's result to be taken over. */
    async function openAndClose(groupId: string, result: RightsDraft | undefined): Promise<void> {
      modals.open.mockResolvedValue(result);
      openButton(groupId).click();
      await modals.open.mock.results.at(-1)!.value;
      fixture.detectChanges();
    }

    it("opens with the group, the selected datasets and the group's current draft", async () => {
      setUp();
      state.setSelected('spatialUnit:su1', false);
      choose('a', 'viewer', 'grant');
      await openAndClose('a', undefined);

      expect(modals.open).toHaveBeenCalledWith(GroupDatasetPermissionsModalComponent, MODAL_FORM, {
        group: state.groups()[0],
        datasets: state.selectedDatasets(),
        initialDraft: state.draftFor('a'),
      });
      expect(state.selectedDatasets().map((d) => d.id)).toEqual(['i1', 'g1']);
      expect(state.draftFor('a')['georesources:g1']).toEqual({ viewer: true, editor: false });
    });

    it('takes over an uneven result as "custom"', async () => {
      setUp();
      const draft = { ...state.draftFor('a'), 'georesources:g1': { viewer: true, editor: true } };
      await openAndClose('a', draft);

      expect(values('a')).toEqual(['keep', 'custom']);
      expect(text(coverage('a', 'editor'))).toBe('0 → 1');
    });

    it('changes nothing when the dialog is cancelled', async () => {
      setUp();
      choose('b', 'editor', 'grant');
      await openAndClose('b', undefined);

      expect(values('b')).toEqual(['grant', 'grant']);
      expect(state.decisions()['b']).toEqual({ viewer: 'grant', editor: 'grant' });
    });
  });

  it('says so when the tenant has no other group', () => {
    setUp(DATASETS, { owner: 'm', other: 'x' });
    expect(text(host().querySelector('.rights-empty'))).toBe('Umweltamt steht allein.');
    expect(host().querySelector('table')).toBeNull();
  });

  it('says so when no dataset is selected', () => {
    setUp();
    state.setKindSelected('indicator', false);
    state.setKindSelected('georesource', false);
    state.setKindSelected('spatialUnit', false);
    fixture.detectChanges();
    expect(text(host().querySelector('.rights-empty'))).toBe('Nichts gewählt.');
    expect(host().querySelector('table')).toBeNull();
  });
});
