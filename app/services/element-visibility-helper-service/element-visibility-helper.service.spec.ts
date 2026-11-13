import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from 'services/auth-service/auth.service';

import { ElementVisibilityHelperService } from './element-visibility-helper.service';

describe('ElementVisibilityHelperService', () => {
  let service: ElementVisibilityHelperService;
  let previousControlsConfig: unknown;

  beforeEach(() => {
    previousControlsConfig = (window as any).__env.controlsConfig;
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ElementVisibilityHelperService);
    jest.spyOn(TestBed.inject(AuthService), 'isAuthenticated').mockReturnValue(false);
  });

  afterEach(() => {
    (window as any).__env.controlsConfig = previousControlsConfig;
    jest.restoreAllMocks();
  });

  function visibilityFor(controlsConfig: unknown[]) {
    (window as any).__env.controlsConfig = controlsConfig;
    service.initElementVisibility();
    return service.elementVisibility;
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('layer panel button (mapLayers)', () => {
    it('is shown when the controls config does not mention it', () => {
      expect(visibilityFor([{ id: 'indicatorConfig', groups: [] }])['mapLayers']).toBe(true);
    });

    it('follows its entry when there is one', () => {
      expect(visibilityFor([{ id: 'mapLayers', groups: [] }])['mapLayers']).toBe(true);
      expect(visibilityFor([{ id: 'mapLayers', restricted: true, groups: [] }])['mapLayers']).toBe(
        false
      );
    });

    it('leaves other controls without an entry hidden', () => {
      expect(visibilityFor([])['poi']).toBeUndefined();
    });
  });
});
