import { TestBed } from '@angular/core/testing';

import { MetadataExportService } from './metadata-export.service';
import { PdfExportService } from 'services/pdf-export-service/pdf-export.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';

describe('MetadataExportService', () => {
  let service: MetadataExportService;
  let pdfExportSpy: {
    dateToTS: jest.Mock;
    downloadMetadataPDF_georesource: jest.Mock;
  };
  const topics = [{ topicId: 't1' }];

  beforeEach(() => {
    pdfExportSpy = {
      dateToTS: jest.fn().mockReturnValue(12345),
      downloadMetadataPDF_georesource: jest.fn().mockResolvedValue('pdf'),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: PdfExportService, useValue: pdfExportSpy },
        { provide: TopicMetadataStoreService, useValue: { availableTopics: topics } },
        { provide: SpatialUnitMetadataStoreService, useValue: { availableSpatialUnits: [] } },
        { provide: SelectionStateService, useValue: { selectedIndicator: undefined } },
      ],
    });
    service = TestBed.inject(MetadataExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('dateToTS forwards to PdfExportService', () => {
    expect(service.dateToTS('2024-01-01')).toBe(12345);
    expect(pdfExportSpy.dateToTS).toHaveBeenCalledWith('2024-01-01');
  });

  it('downloadMetadataPDF_georesource forwards metadata + availableTopics from the store', async () => {
    const meta = { id: 'g1' };
    await service.downloadMetadataPDF_georesource(meta);
    expect(pdfExportSpy.downloadMetadataPDF_georesource).toHaveBeenCalledWith(meta, topics);
  });
});
