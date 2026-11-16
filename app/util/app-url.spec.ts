import { appUrl } from './app-url';

describe('appUrl', () => {
  afterEach(() => document.head.querySelector('base')?.remove());

  // Regression: logos were resolved against location.pathname, which on a deep
  // link such as /v6/ui/administration/groups points below the app's root.
  it('resolves against the <base href>, not the current route', () => {
    const base = document.createElement('base');
    base.href = '/v6/ui/';
    document.head.appendChild(base);
    window.history.pushState({}, '', '/v6/ui/administration/groups');

    expect(appUrl('logos/KM_Logo1.png')).toBe(`${window.location.origin}/v6/ui/logos/KM_Logo1.png`);

    window.history.pushState({}, '', '/');
  });
});
