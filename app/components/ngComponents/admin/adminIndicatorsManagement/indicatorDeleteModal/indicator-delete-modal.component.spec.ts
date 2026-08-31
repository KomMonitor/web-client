import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';

import { IndicatorDeleteModalComponent } from './indicator-delete-modal.component';

/**
 * The modal gathers everything that references the indicator before it lets you
 * delete it. The live data carries `null` entries inside `referencedIndicators`,
 * and the loops dereferenced them straight away — the modal threw while opening
 * (`Cannot read properties of null (reading 'referencedIndicatorId')`) and no
 * indicator could be deleted at all.
 */
describe('IndicatorDeleteModalComponent', () => {
  let component: IndicatorDeleteModalComponent;
  let fixture: ComponentFixture<IndicatorDeleteModalComponent>;

  const TARGET = {
    indicatorId: 'ind-1',
    indicatorName: 'Zielindikator',
    referencedIndicators: [null, { referencedIndicatorId: 'ind-2' }],
    referencedGeoresources: [null, { referencedGeoresourceId: 'gr-1' }],
  };

  /** A second indicator that points at the one being deleted — plus a null. */
  const OTHER = {
    indicatorId: 'ind-3',
    indicatorName: 'Verweisender Indikator',
    referencedIndicators: [null, { referencedIndicatorId: 'ind-1' }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndicatorDeleteModalComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NgbActiveModal, useValue: { close: jest.fn(), dismiss: jest.fn() } },
        {
          provide: IndicatorMetadataStoreService,
          useValue: { availableIndicators: [TARGET, OTHER] },
        },
        {
          provide: ProcessScriptMetadataStoreService,
          useValue: { availableProcessScripts: [] },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(IndicatorDeleteModalComponent);
    component = fixture.componentInstance;
    component.selectedIndicatorDataset = TARGET as never;
  });

  it('skips null entries when collecting the indicator references', () => {
    expect(() => component.gatherAffectedIndicatorReferences()).not.toThrow();

    const affected = component.gatherAffectedIndicatorReferences();
    expect(affected).toHaveLength(2);
    expect(affected.every((entry) => !!entry.indicatorReference)).toBe(true);
  });

  it('skips null entries when collecting the georesource references', () => {
    expect(() => component.gatherAffectedGeoresourceReferences()).not.toThrow();

    const affected = component.gatherAffectedGeoresourceReferences();
    expect(affected).toHaveLength(1);
  });
});
