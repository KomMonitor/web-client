import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { KeycloakHelperService } from './keycloak-helper.service';

describe('KeycloakHelperService', () => {
  let service: KeycloakHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(KeycloakHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
