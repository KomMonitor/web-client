import { TestBed } from '@angular/core/testing';

import { ProcessScriptMetadataStoreService } from './process-script-metadata-store.service';

describe('ProcessScriptMetadataStoreService', () => {
  let service: ProcessScriptMetadataStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProcessScriptMetadataStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('setProcessScripts populates the array and the id map', () => {
    service.setProcessScripts([{ scriptId: 'p1' }, { scriptId: 'p2' }]);
    expect(service.availableProcessScripts.length).toBe(2);
    expect(service.availableProcessScripts_map.get('p1')).toEqual({ scriptId: 'p1' });
  });
});
