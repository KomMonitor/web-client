import { TestBed } from '@angular/core/testing';

import { TopicMetadataStoreService } from './topic-metadata-store.service';

describe('TopicMetadataStoreService', () => {
  let service: TopicMetadataStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TopicMetadataStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('setTopics stores the given topics array', () => {
    const topics = [{ topicId: 't1' }, { topicId: 't2' }];
    service.setTopics(topics);
    expect(service.availableTopics).toBe(topics);
  });
});
