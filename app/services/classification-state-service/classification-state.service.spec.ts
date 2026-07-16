import { TestBed } from '@angular/core/testing';
import $ from 'jquery';
import { ClassificationStateService } from './classification-state.service';

describe('ClassificationStateService', () => {
  let service: ClassificationStateService;

  beforeEach(() => {
    (window as any).jQuery = $;
    (window as any).$ = $;

    TestBed.configureTestingModule({});
    service = TestBed.inject(ClassificationStateService);
  });

  it('exposes signal-backed accessor properties', () => {
    service.classifyMethod = 'equal_interval';
    service.numClasses = 5;
    service.isCustomComputation = true;

    expect(service.classifyMethod).toBe('equal_interval');
    expect(service.numClasses).toBe(5);
    expect(service.isCustomComputation).toBe(true);
  });

  it('counts features per color and resets the counters', () => {
    service.incrementFeaturesPerColor('#ff0000');
    service.incrementFeaturesPerColor('#ff0000');
    service.incrementFeaturesPerColor('#00ff00');
    service.featuresPerZero = 3;

    expect(service.featuresPerColorMap.get('#ff0000')).toBe(2);
    expect(service.featuresPerColorMap.get('#00ff00')).toBe(1);

    service.resetFeatureCounters();

    expect(service.featuresPerColorMap.size).toBe(0);
    expect(service.featuresPerZero).toBe(0);
    expect(service.featuresPerNoData).toBe(0);
  });

  it('backs up and restores the brew objects', () => {
    service.defaultBrew = { breaks: [0, 5, 10], colors: ['#a', '#b'] };
    service.manualBrew = { breaks: [1, 2] };

    service.backupCurrentBrewObjects_forMainMapIndicator();

    service.defaultBrew = { breaks: [99] };
    service.manualBrew = undefined;

    service.resetCurrentBrewObjects_forMainMapIndicator();

    expect(service.defaultBrew.breaks).toEqual([0, 5, 10]);
    expect(service.manualBrew.breaks).toEqual([1, 2]);
  });
});
