import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { IndicatorValueService } from "./indicator-value.service";

describe("IndicatorValueService", () => {
  let service: IndicatorValueService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(IndicatorValueService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("indicatorValueIsNoData flags NaN/null/undefined as NoData", () => {
    expect(service.indicatorValueIsNoData(NaN)).toBe(true);
    expect(service.indicatorValueIsNoData(null)).toBe(true);
    expect(service.indicatorValueIsNoData(undefined)).toBe(true);
    expect(service.indicatorValueIsNoData(0)).toBe(false);
    expect(service.indicatorValueIsNoData(42)).toBe(false);
  });

  it("getIndicatorValue_asNumber rounds to the given precision and returns NoData for missing values", () => {
    expect(service.getIndicatorValue_asNumber(1.23456, 2)).toBe(1.23);
    expect(service.getIndicatorValue_asNumber(null, 2)).toBe("NoData");
    // a tiny positive value that would round to 0 keeps its original value
    expect(service.getIndicatorValue_asNumber(0.0001, 2)).toBe(0.0001);
  });

  it("getIndicatorValue_asFixedPrecisionNumber uses a dot separator without thousands grouping", () => {
    expect(service.getIndicatorValue_asFixedPrecisionNumber(1234.5, 1)).toBe("1234.5");
  });

  it("formatIndicatorNameForLabel wraps words at the given max chars per line", () => {
    const result = service.formatIndicatorNameForLabel("eins zwei drei", 6);
    expect(result.split("\n").length).toBeGreaterThan(1);
  });

  it("createDualListInputArray maps category/name/id from the given properties", () => {
    const input = [{ label: "A", key: "1" }, { label: "B", key: "2" }];
    const result = service.createDualListInputArray(input, "label", "key");
    expect(result).toEqual([
      { category: "A", name: "A", id: "1" },
      { category: "B", name: "B", id: "2" },
    ]);
  });

  it("createDualListInputArray omits id when no idProperty is given", () => {
    const result = service.createDualListInputArray([{ label: "A" }], "label", undefined);
    expect(result).toEqual([{ category: "A", name: "A" }]);
  });

  it("syntaxHighlightJSON wraps tokens in classed spans", () => {
    const html = service.syntaxHighlightJSON({ a: 1 });
    expect(html).toContain('<span class="key">');
    expect(html).toContain('<span class="number">');
  });
});
