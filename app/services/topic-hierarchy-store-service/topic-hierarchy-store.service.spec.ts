import { TestBed } from "@angular/core/testing";

import { TopicHierarchyStoreService } from "./topic-hierarchy-store.service";
import { TopicHierarchyService } from "services/topic-hierarchy-service/topic-hierarchy.service";

describe("TopicHierarchyStoreService", () => {
  let service: TopicHierarchyStoreService;
  let topicHierarchySpy: {
    buildHeadlineIndicatorHierarchy: jest.Mock;
    buildTopicGeoresourceHierarchy: jest.Mock;
    getTopicHierarchyForTopicId: jest.Mock;
  };

  beforeEach(() => {
    topicHierarchySpy = {
      buildHeadlineIndicatorHierarchy: jest.fn().mockReturnValue([{ id: "h1" }]),
      buildTopicGeoresourceHierarchy: jest
        .fn()
        .mockReturnValue({ hierarchy: [{ id: "g1" }], unmappedEntries: { x: 1 } }),
      getTopicHierarchyForTopicId: jest.fn().mockReturnValue({ id: "t1" }),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: TopicHierarchyService, useValue: topicHierarchySpy },
      ],
    });
    service = TestBed.inject(TopicHierarchyStoreService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("buildHeadlineIndicatorHierarchy stores the delegated result", () => {
    service.buildHeadlineIndicatorHierarchy([], []);
    expect(service.headlineIndicatorHierarchy).toEqual([{ id: "h1" }]);
  });

  it("buildTopicGeoresourceHierarchy splits hierarchy + unmappedEntries into fields", () => {
    service.buildTopicGeoresourceHierarchy([], [], [], [], "unmapped");
    expect(service.topicGeoresourceHierarchy).toEqual([{ id: "g1" }]);
    expect(service.topicGeoresourceHierarchy_unmappedEntries).toEqual({ x: 1 });
  });

  it("getTopicHierarchyForTopicId forwards to TopicHierarchyService", () => {
    expect(service.getTopicHierarchyForTopicId([], "ref")).toEqual({ id: "t1" });
    expect(topicHierarchySpy.getTopicHierarchyForTopicId).toHaveBeenCalledWith([], "ref");
  });
});
