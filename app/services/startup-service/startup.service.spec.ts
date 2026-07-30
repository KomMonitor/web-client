import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { StartupService } from './startup.service';

describe('StartupService', () => {
  let service: StartupService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StartupService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    document.body.innerHTML = '';
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('shows an error notice and rejects when the bootstrap config fetch fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    global.fetch = jest.fn().mockRejectedValue(new TypeError('network error'));

    await expect(service.initApp()).rejects.toThrow('network error');
    expect(document.body.textContent).toContain('KomMonitor konnte nicht gestartet werden');
  });

  it('falls back to the local env_backup.js when the remote app config script fails', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const scriptsBefore = document.head.querySelectorAll('script').length;

    const loadPromise: Promise<void> = (service as any).loadAppConfigScript(
      'http://config-server/env.js'
    );
    const remoteScript = document.head.querySelectorAll('script')[scriptsBefore];
    expect(remoteScript.getAttribute('src')).toBe('http://config-server/env.js');
    remoteScript.dispatchEvent(new Event('error'));
    await Promise.resolve();

    const fallbackScript = document.head.querySelectorAll('script')[scriptsBefore + 1];
    expect(fallbackScript.getAttribute('src')).toBe('./config/env_backup.js');
    fallbackScript.dispatchEvent(new Event('load'));
    await expect(loadPromise).resolves.toBeUndefined();
  });

  it('shows an error notice and rejects when the bootstrap config returns a non-ok status', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 } as Response);

    await expect(service.initApp()).rejects.toThrow('Unexpected HTTP status 404');
    expect(document.body.textContent).toContain('KomMonitor konnte nicht gestartet werden');
  });
});
