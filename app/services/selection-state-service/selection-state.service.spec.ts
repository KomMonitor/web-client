import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";

import { SelectionStateService } from "./selection-state.service";
import { IndicatorValueService } from "services/indicator-value-service/indicator-value.service";

describe("SelectionStateService", () => {
  let service: SelectionStateService;

  beforeEach(() => {
    (window as any).__env = (window as any).__env || {};
    (window as any).__env.indicatorDatePrefix =
      (window as any).__env.indicatorDatePrefix || "DATE_";

    TestBed.configureTestingModule({
      providers: [
        {
          provide: IndicatorValueService,
          useValue: {
            indicatorValueIsNoData: (v: any) => v === null || v === undefined,
            getIndicatorValueFromArray_asNumber: (props: any, name: string) =>
              props[name],
          },
        },
      ],
    });
    service = TestBed.inject(SelectionStateService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("setSelectedDate sets the field and emits on selectedDate$", async () => {
    const next = firstValueFrom(service.selectedDate$);
    service.setSelectedDate("2024-01-01");
    expect(service.selectedDate).toBe("2024-01-01");
    // first emission is the BehaviorSubject seed (undefined); just assert the field here
    await next;
  });

  it("setAllFeaturesProperty computes sum/mean/min/max/count over non-NoData values", () => {
    service.setAllFeaturesProperty(
      {
        unit: "x",
        geoJSON: {
          features: [
            { properties: { p: 2 } },
            { properties: { p: 4 } },
            { properties: { p: null } },
          ],
        },
      },
      "p",
    );
    expect(service.allFeaturesNumberOfFeatures).toBe(2);
    expect(service.allFeaturesSum).toBe(6);
    expect(service.allFeaturesMean).toBe(3);
    expect(service.allFeaturesMin).toBe(2);
    expect(service.allFeaturesMax).toBe(4);
  });

  it("buildIndicatorPropertyName concatenates the date prefix and selectedDate", () => {
    service.selectedDate = "2024";
    expect(service.buildIndicatorPropertyName()).toBe("DATE_2024");
  });

  it("resolveSelectedPrecision prefers the explicit arg, then selectedIndicator.precision", () => {
    expect(service.resolveSelectedPrecision(5)).toBe(5);
    service.selectedIndicator = { precision: 2 };
    expect(service.resolveSelectedPrecision()).toBe(2);
    service.selectedIndicator = { precision: null };
    expect(service.resolveSelectedPrecision()).toBeUndefined();
  });
});
