import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

/** Minimal stand-in for the keycloak-js adapter the service keeps privately. */
function fakeAdapter(overrides: Record<string, unknown>) {
  return {
    token: undefined,
    authenticated: false,
    updateToken: jest.fn().mockResolvedValue(false),
    login: jest.fn(),
    ...overrides,
  };
}

function useAdapter(service: AuthService, adapter: unknown): void {
  (service as unknown as { auth: unknown }).auth = adapter;
}

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('ensureValidToken', () => {
    it('returns undefined without an adapter', async () => {
      await expect(service.ensureValidToken()).resolves.toBeUndefined();
    });

    // KomMonitor starts without a login: `check-sso` leaves an adapter behind
    // that carries no token. Refreshing it would fail and redirect an anonymous
    // visitor to the login screen.
    it('does not refresh or redirect when nobody is logged in', async () => {
      const adapter = fakeAdapter({});
      useAdapter(service, adapter);

      await expect(service.ensureValidToken()).resolves.toBeUndefined();
      expect(adapter.updateToken).not.toHaveBeenCalled();
      expect(adapter.login).not.toHaveBeenCalled();
    });

    it('returns the refreshed token of a logged-in user', async () => {
      const adapter = fakeAdapter({ token: 'token-1', authenticated: true });
      adapter.updateToken = jest.fn().mockImplementation(async () => {
        adapter.token = 'token-2';
        return true;
      });
      useAdapter(service, adapter);

      await expect(service.ensureValidToken()).resolves.toBe('token-2');
      expect(adapter.updateToken).toHaveBeenCalledWith(30);
    });

    it('redirects to the login when an existing session cannot be refreshed', async () => {
      const adapter = fakeAdapter({
        token: 'expired',
        authenticated: true,
        updateToken: jest.fn().mockRejectedValue(new Error('refresh failed')),
      });
      useAdapter(service, adapter);

      await expect(service.ensureValidToken()).resolves.toBeUndefined();
      expect(adapter.login).toHaveBeenCalled();
    });
  });
});
