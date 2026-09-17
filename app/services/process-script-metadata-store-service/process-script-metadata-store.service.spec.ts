import { TestBed } from '@angular/core/testing';

import { ProcessScriptMetadataStoreService } from './process-script-metadata-store.service';

describe('ProcessScriptMetadataStoreService', () => {
  let service: ProcessScriptMetadataStoreService;

  const schedule = (scheduleID: string, processID = 'km_indicator_sum') =>
    ({ scheduleID, processID }) as any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProcessScriptMetadataStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('setProcessScripts populates the array and the id map', () => {
    service.setProcessScripts([schedule('s1'), schedule('s2')]);
    expect(service.availableProcessScripts.length).toBe(2);
    expect(service.availableProcessScripts_map.get('s1')).toEqual(schedule('s1'));
  });

  it('keys schedules by scheduleID, so same-process schedules do not collide', () => {
    service.setProcessScripts([
      schedule('s1', 'km_indicator_sum'),
      schedule('s2', 'km_indicator_sum'),
    ]);
    expect(service.availableProcessScripts.length).toBe(2);
  });

  it('replaceSingleProcessScriptMetadata updates an existing schedule in place', () => {
    service.setProcessScripts([schedule('s1'), schedule('s2')]);
    service.replaceSingleProcessScriptMetadata({
      scheduleID: 's1',
      processID: 'km_indicator_multiply',
    } as any);

    expect(service.availableProcessScripts.length).toBe(2);
    expect(service.availableProcessScripts_map.get('s1')?.processID).toBe('km_indicator_multiply');
  });

  it('replaceSingleProcessScriptMetadata adds a schedule that is not in the store yet', () => {
    service.setProcessScripts([schedule('s1')]);
    service.replaceSingleProcessScriptMetadata(schedule('s2'));
    expect(service.availableProcessScripts.length).toBe(2);
  });

  it('deleteSingleProcessScriptMetadata removes by scheduleID', () => {
    service.setProcessScripts([schedule('s1'), schedule('s2')]);
    service.deleteSingleProcessScriptMetadata('s1');
    expect(service.availableProcessScripts.map((s) => s.scheduleID)).toEqual(['s2']);
  });
});
