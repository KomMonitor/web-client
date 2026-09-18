import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { JobErrorBoxComponent } from './job-error-box.component';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';

describe('JobErrorBoxComponent', () => {
  let fixture: ComponentFixture<JobErrorBoxComponent>;

  const TEXTS = {
    ADMIN_SCRIPTS: {
      JOB_ERRORS: {
        MISSING_TIMESTAMP: {
          SHORT: 'Zeitstempel fehlt',
          LONG: "Zeitstempel fehlen für {{resourceType}} '{{datasetName}}'.",
        },
        MISSING_SPATIAL_UNIT_FEATURE: {
          SHORT: 'Raumeinheitsfeature fehlt',
          LONG: "Raumeinheitsfeatures fehlen für {{resourceType}} '{{datasetName}}'.",
        },
        PROCESSING_ERROR: {
          SHORT: 'Fehler bei der Prozessierung',
          LONG: "Fehler beim Prozessieren von {{resourceType}} '{{datasetName}}'.",
        },
        DATA_MANAGEMENT_API_ERROR: {
          SHORT: 'Fehler beim Aufrufen der API',
          LONG: "Fehler beim Aufrufen der API für {{resourceType}} '{{datasetName}}'.",
        },
        UNKNOWN: { LONG: 'Unbekannter Fehlertyp.' },
        RESOURCE_TYPE: { INDICATOR: 'Indikator', GEORESOURCE: 'Georessource' },
        UNKNOWN_DATASET: 'unbekannt',
      },
    },
  };

  const setError = (error: any) => {
    fixture = TestBed.createComponent(JobErrorBoxComponent);
    fixture.componentInstance.error = error;
    fixture.detectChanges();
    return fixture.componentInstance as any;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [JobErrorBoxComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: IndicatorMetadataStoreService,
          useValue: {
            getIndicatorMetadataById: (id: string) =>
              id === 'ind-1' ? { indicatorName: 'Bevölkerung' } : undefined,
          },
        },
        {
          provide: GeoresourceMetadataStoreService,
          useValue: {
            getGeoresourceMetadataById: (id: string) =>
              id === 'geo-1' ? { datasetName: 'Spielplätze' } : undefined,
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('de', TEXTS);
    translate.use('de');
  });

  it('names an indicator error with the indicator name', () => {
    const component = setError({
      type: 'PROCESSING_ERROR',
      affectedDatasetId: 'ind-1',
      affectedResourceType: 'INDICATOR',
    });

    expect(component.shortDescription()).toBe('Fehler bei der Prozessierung');
    expect(component.longDescription()).toBe(
      "Fehler beim Prozessieren von Indikator 'Bevölkerung'."
    );
  });

  it('resolves a georesource error against the georesource store', () => {
    const component = setError({
      type: 'PROCESSING_ERROR',
      affectedDatasetId: 'geo-1',
      // Master compares this case-insensitively, so mixed case must work.
      affectedResourceType: 'Georesource',
    });

    expect(component.longDescription()).toBe(
      "Fehler beim Prozessieren von Georessource 'Spielplätze'."
    );
  });

  it('falls back to a placeholder for a dataset that no longer exists', () => {
    const component = setError({
      type: 'PROCESSING_ERROR',
      affectedDatasetId: 'gone',
      affectedResourceType: 'indicator',
    });

    expect(component.longDescription()).toBe("Fehler beim Prozessieren von Indikator 'unbekannt'.");
  });

  it('lists the affected timestamps, sorted', () => {
    const component = setError({
      type: 'MISSING_TIMESTAMP',
      affectedDatasetId: 'ind-1',
      affectedResourceType: 'indicator',
      affectedTimestamps: ['2026-03-01', '2025-01-01'],
    });

    expect(component.shortDescription()).toBe('Zeitstempel fehlt');
    expect(component.affectedEntries()).toEqual(['2025-01-01', '2026-03-01']);
  });

  it('lists the affected spatial unit features', () => {
    const component = setError({
      type: 'MISSING_SPATIAL_UNIT_FEATURE',
      affectedDatasetId: 'ind-1',
      affectedResourceType: 'indicator',
      affectedSpatialUnitFeatures: ['feature-b', 'feature-a'],
    });

    expect(component.affectedEntries()).toEqual(['feature-a', 'feature-b']);
  });

  it('shows no detail list for the error types that carry none', () => {
    const component = setError({
      type: 'PROCESSING_ERROR',
      affectedDatasetId: 'ind-1',
      affectedResourceType: 'indicator',
    });

    expect(component.affectedEntries()).toEqual([]);
  });

  /**
   * The process descriptions declare upper-case types, master used camelCase,
   * and no payload has settled which one the API emits — so both have to land
   * on the same text instead of falling into the unknown branch.
   */
  it('understands the camelCase spelling master assumed as well', () => {
    const component = setError({
      type: 'missingTimestamp',
      affectedDatasetId: 'ind-1',
      affectedResourceType: 'indicator',
      affectedTimestamps: ['2026-01-01'],
    });

    expect(component.shortDescription()).toBe('Zeitstempel fehlt');
    expect(component.affectedEntries()).toEqual(['2026-01-01']);
  });

  it("maps the API's one-word DATAMANAGEMENT_API_ERROR onto the translation key", () => {
    const component = setError({
      type: 'DATAMANAGEMENT_API_ERROR',
      affectedDatasetId: 'ind-1',
      affectedResourceType: 'INDICATOR',
    });

    expect(component.shortDescription()).toBe('Fehler beim Aufrufen der API');
  });

  it("shows the server's error text, the only detail an unmapped type carries", () => {
    const component = setError({
      type: 'somethingNew',
      affectedDatasetId: 'ind-1',
      affectedResourceType: 'INDICATOR',
      errorMessage: 'connection reset by peer',
    });

    expect(component.errorMessage()).toBe('connection reset by peer');
    expect(component.longDescription()).toBe('Unbekannter Fehlertyp.');
  });

  it('shows an unmapped error type verbatim rather than an empty box', () => {
    const component = setError({
      type: 'somethingNew',
      affectedDatasetId: 'ind-1',
      affectedResourceType: 'indicator',
    });

    expect(component.shortDescription()).toBe('somethingNew');
    expect(component.longDescription()).toBe('Unbekannter Fehlertyp.');
  });
});
