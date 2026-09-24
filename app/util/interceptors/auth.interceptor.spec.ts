import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from 'services/auth-service/auth.service';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let ensureValidToken: jest.Mock;

  beforeEach(() => {
    ensureValidToken = jest.fn().mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { ensureValidToken } },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('attaches the token of a logged-in user', async () => {
    ensureValidToken.mockResolvedValue('token-1');

    http.get('https://example.org/management/indicators').subscribe();
    await Promise.resolve();

    const request = httpMock.expectOne('https://example.org/management/indicators');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-1');
    request.flush({});
  });

  // An anonymous visitor has no token; the request still has to go out, so the
  // backend can answer 401 and the caller can handle it.
  it('sends the request unchanged when there is no token', async () => {
    http.get('https://example.org/processes-api/schedules').subscribe();
    await Promise.resolve();

    const request = httpMock.expectOne('https://example.org/processes-api/schedules');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({ error: 'missing_authorization' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('skips public urls without asking for a token', () => {
    http.get('https://example.org/public/indicators').subscribe();

    httpMock.expectOne('https://example.org/public/indicators').flush({});
    expect(ensureValidToken).not.toHaveBeenCalled();
  });
});
