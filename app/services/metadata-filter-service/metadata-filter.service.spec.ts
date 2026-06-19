import { TestBed } from "@angular/core/testing";

import { MetadataFilterService } from "./metadata-filter.service";
import { IndicatorMetadataStoreService } from "services/indicator-metadata-store-service/indicator-metadata-store.service";
import { TopicMetadataStoreService } from "services/topic-metadata-store-service/topic-metadata-store.service";
import { ProcessScriptMetadataStoreService } from "services/process-script-metadata-store-service/process-script-metadata-store.service";
import { GeoresourceMetadataStoreService } from "services/georesource-metadata-store-service/georesource-metadata-store.service";
import { TopicHierarchyStoreService } from "services/topic-hierarchy-store-service/topic-hierarchy-store.service";

describe("MetadataFilterService", () => {
  let service: MetadataFilterService;
  let hierarchy: {
    buildTopicIndicatorHierarchy: jest.Mock;
    buildHeadlineIndicatorHierarchy: jest.Mock;
    buildComputationIndicatorHierarchy: jest.Mock;
  };

  beforeEach(() => {
    hierarchy = {
      buildTopicIndicatorHierarchy: jest.fn(),
      buildHeadlineIndicatorHierarchy: jest.fn(),
      buildComputationIndicatorHierarchy: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: IndicatorMetadataStoreService,
          useValue: {
            displayableIndicators: [
              { indicatorName: "Arbeitslosenquote" },
              { indicatorName: "Bevölkerung" },
            ],
            isDisplayableIndicator: (item: any) => item.keep === true,
          },
        },
        { provide: TopicMetadataStoreService, useValue: { availableTopics: [] } },
        { provide: ProcessScriptMetadataStoreService, useValue: { availableProcessScripts: [] } },
        { provide: GeoresourceMetadataStoreService, useValue: { getAvailableIndiWmsDatasets: () => [] } },
        { provide: TopicHierarchyStoreService, useValue: hierarchy },
      ],
    });
    service = TestBed.inject(MetadataFilterService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("onChangeIndicatorKeywordFilter sets the keyword-filtered list and triggers the 3 hierarchy builds", () => {
    service.onChangeIndicatorKeywordFilter("arbeit");
    expect(service.displayableIndicators_keywordFiltered).toEqual([
      { indicatorName: "Arbeitslosenquote" },
    ]);
    expect(hierarchy.buildTopicIndicatorHierarchy).toHaveBeenCalled();
    expect(hierarchy.buildHeadlineIndicatorHierarchy).toHaveBeenCalled();
    expect(hierarchy.buildComputationIndicatorHierarchy).toHaveBeenCalled();
  });

  it("onChangeIndicatorKeywordFilter without a filter copies the full displayable list", () => {
    service.onChangeIndicatorKeywordFilter("");
    expect(service.displayableIndicators_keywordFiltered.length).toBe(2);
  });

  it("filterIndicators returns a predicate delegating to isDisplayableIndicator", () => {
    const pred = service.filterIndicators();
    expect(pred({ keep: true })).toBe(true);
    expect(pred({ keep: false })).toBe(false);
  });
});
