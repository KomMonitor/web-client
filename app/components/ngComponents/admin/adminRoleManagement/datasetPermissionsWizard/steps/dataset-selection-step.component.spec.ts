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
import { DatasetSelectionStepComponent } from './dataset-selection-step.component';

/** Step 1 on the real wizard state, with the stores faked. */

const OWNER = 'owner';
const TENANT_OF = { owner: 'm', a: 'm' };

const DATASETS: Partial<OwnerDatasetSources> = {
  indicators: [
    indicatorSource('i1', OWNER, [], { s1: [], s2: [] }, 'Arbeitslose'),
    indicatorSource('i2', OWNER, [], { s1: [] }, 'Bevölkerung'),
  ],
  georesources: [georesourceSource('g1', OWNER, [], 'Schulen')],
};

describe('DatasetSelectionStepComponent', () => {
  let fixture: ComponentFixture<DatasetSelectionStepComponent>;
  let state: DatasetPermissionsWizardStateService;

  function setUp(sources: Partial<OwnerDatasetSources>): void {
    const testBed = wizardStateTestBed(sources, TENANT_OF);
    TestBed.configureTestingModule({
      imports: [DatasetSelectionStepComponent, TranslateModule.forRoot()],
      providers: [DatasetPermissionsWizardStateService, ...testBed.providers],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('spec', {
      ADMIN_DATASET_PERMISSIONS: {
        SELECTION: {
          INTRO: 'Datensätze von {{owner}}.',
          COUNT: '{{selected}} von {{total}}',
          KIND_COUNT: '{{selected}}/{{total}}',
          SPATIAL_UNITS_ONE: '1 Ebene',
          SPATIAL_UNITS_MANY: '{{count}} Ebenen',
          EMPTY: '{{owner}} hat nichts.',
        },
        PUBLIC: { ALL: 'öffentlich', SOME: 'teils öffentlich' },
      },
    });
    translate.use('spec');

    state = TestBed.inject(DatasetPermissionsWizardStateService);
    state.start(OWNER);
    fixture = TestBed.createComponent(DatasetSelectionStepComponent);
    fixture.componentRef.setInput('ownerName', 'Umweltamt');
    fixture.detectChanges();
  }

  const host = () => fixture.nativeElement as HTMLElement;
  const group = (kind: string) => host().querySelector(`[data-kind="${kind}"]`) as HTMLElement;
  const groupBox = (kind: string) =>
    group(kind).querySelector('.kind-header input') as HTMLInputElement;
  const groupCount = (kind: string) =>
    group(kind).querySelector('.kind-count')!.textContent!.trim();
  const intro = () =>
    host().querySelector('.selection-intro')!.textContent!.replace(/\s+/g, ' ').trim();
  const rows = (kind: string) =>
    Array.from(group(kind).querySelectorAll<HTMLElement>('.dataset-row'));

  function click(element: HTMLElement): void {
    element.click();
    fixture.detectChanges();
  }

  it('names the owner and counts the selection, all selected at first', () => {
    setUp(DATASETS);
    expect(intro()).toBe('Datensätze von Umweltamt. 3 von 3');
    expect(groupCount('indicator')).toBe('2/2');
    expect(groupBox('indicator').checked).toBe(true);
  });

  it('starts with every group collapsed', () => {
    setUp(DATASETS);
    expect(host().querySelectorAll('.dataset-row')).toHaveLength(0);
    expect(
      Array.from(host().querySelectorAll('.kind-toggle'), (b) => b.getAttribute('aria-expanded'))
    ).toEqual(['false', 'false', 'false']);
  });

  it('lists the datasets of an opened group, indicators with their spatial units', () => {
    setUp(DATASETS);
    click(group('indicator').querySelector('.kind-toggle')!);

    const text = (row: HTMLElement, selector: string) =>
      row.querySelector(selector)!.textContent!.trim();
    expect(
      rows('indicator').map((row) => [text(row, '.form-check-label'), text(row, '.dataset-meta')])
    ).toEqual([
      ['Arbeitslose', '2 Ebenen'],
      ['Bevölkerung', '1 Ebene'],
    ]);
    expect(rows('georesource')).toHaveLength(0);
  });

  it('marks a group as partly selected once one of its datasets is deselected', () => {
    setUp(DATASETS);
    click(group('indicator').querySelector('.kind-toggle')!);
    click(rows('indicator')[0].querySelector('input')!);

    expect(groupBox('indicator').indeterminate).toBe(true);
    expect(groupCount('indicator')).toBe('1/2');
    expect(intro()).toBe('Datensätze von Umweltamt. 2 von 3');
  });

  it('selects the whole group from partly selected, and clears it from all selected', () => {
    setUp(DATASETS);
    state.setSelected('indicator:i1', false);
    fixture.detectChanges();

    click(groupBox('indicator'));
    expect(state.selectionState('indicator')).toBe('all');

    click(groupBox('indicator'));
    expect(state.selectionState('indicator')).toBe('none');
    expect(groupBox('indicator').checked).toBe(false);
  });

  it('disables an empty group and shows the indicator hint only for indicators', () => {
    setUp(DATASETS);
    expect(groupBox('spatialUnit').disabled).toBe(true);
    expect(group('indicator').querySelector('.kind-hint')).not.toBeNull();
    expect(group('georesource').querySelector('.kind-hint')).toBeNull();
  });

  it('says so when the owner has no datasets', () => {
    setUp({ spatialUnits: [spatialUnitSource('s1', 'a', [])] });
    expect(host().querySelector('.selection-empty')!.textContent!.trim()).toBe(
      'Umweltamt hat nichts.'
    );
    expect(host().querySelector('.list-group')).toBeNull();
  });

  it('marks public and partly public datasets', () => {
    const [i1, i2] = DATASETS.indicators!;
    setUp({
      ...DATASETS,
      indicators: [
        { ...i1, isPublic: true },
        {
          ...i2,
          isPublic: true,
          applicableSpatialUnits: i2.applicableSpatialUnits.map((u) => ({ ...u, isPublic: true })),
        },
      ],
    });
    click(group('indicator').querySelector('.kind-toggle')!);
    click(group('georesource').querySelector('.kind-toggle')!);

    const badge = (row: HTMLElement) => row.querySelector('.public-badge')?.textContent!.trim();
    expect(rows('indicator').map(badge)).toEqual(['teils öffentlich', 'öffentlich']);
    expect(rows('georesource').map(badge)).toEqual([undefined]);
  });
});
