import { TestBed } from '@angular/core/testing';

import { MetadataExportService } from './metadata-export.service';
import { PdfExportService } from 'services/pdf-export-service/pdf-export.service';

describe('MetadataExportService', () => {
  let service: MetadataExportService;
  let pdfExportSpy: {
    dateToTS: jest.Mock;
    downloadMetadataPDF_georesource: jest.Mock;
  };

  beforeEach(() => {
    pdfExportSpy = {
      dateToTS: jest.fn().mockReturnValue(12345),
      downloadMetadataPDF_georesource: jest.fn().mockResolvedValue('pdf'),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: PdfExportService, useValue: pdfExportSpy }],
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

  it('downloadMetadataPDF_georesource forwards metadata + availableTopics', async () => {
    const meta = { id: 'g1' };
    const topics = [{ topicId: 't1' }];
    await service.downloadMetadataPDF_georesource(meta, topics);
    expect(pdfExportSpy.downloadMetadataPDF_georesource).toHaveBeenCalledWith(meta, topics);
  });
});
