import { TestBed } from '@angular/core/testing';

import { PdfExportService } from './pdf-export.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { TopicHierarchyService } from 'services/topic-hierarchy-service/topic-hierarchy.service';

describe('PdfExportService', () => {
  let service: PdfExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: EnvConfigService, useValue: {} },
        { provide: TopicHierarchyService, useValue: {} },
      ],
    });
    service = TestBed.inject(PdfExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * The demo data contains `null` entries in an indicator's `referencedIndicators` /
   * `referencedGeoresources` arrays; without filtering them out, building the metadata PDF
   * throws (`can't access property "...", item is null`) instead of skipping the gap.
   */
  describe('_buildLinkedItemsString', () => {
    const build = (items: any[]) =>
      service['_buildLinkedItemsString'](
        items,
        'referencedIndicatorName',
        'referencedIndicatorDescription'
      );

    it('returns "-" for an empty or missing list', () => {
      expect(build(undefined)).toBe('-');
      expect(build([])).toBe('-');
    });

    it('skips null entries instead of throwing', () => {
      const result = build([
        null,
        { referencedIndicatorName: 'Bevölkerung', referencedIndicatorDescription: 'desc' },
      ]);

      expect(result).toBe('Bevölkerung - \n   desc');
    });
  });
});
