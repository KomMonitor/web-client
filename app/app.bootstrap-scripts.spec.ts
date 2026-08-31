import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guards the global script list in angular.json.
 *
 * The app loaded `bootstrap.min.js`, which ships without Popper. Bootstrap's
 * tabs survive that, but every dropdown dies with
 * `i.createPopper is not a function` — the three marker dropdowns of the
 * georesource modals (colour, style, symbol colour) simply did not open. The
 * `bundle` build is Bootstrap plus Popper, which is what these components need.
 *
 * No component test can see this: the scripts are a build-time concern and Jest
 * never loads them.
 */
describe('angular.json global scripts', () => {
  const angularJson = JSON.parse(readFileSync(join(__dirname, '..', 'angular.json'), 'utf8'));
  const scripts: string[] =
    angularJson.projects['kommonitor-client'].architect.build.options.scripts;

  it('loads the Bootstrap build that includes Popper', () => {
    const bootstrapScripts = scripts.filter((script) => script.includes('bootstrap'));

    expect(bootstrapScripts).toHaveLength(1);
    expect(bootstrapScripts[0]).toContain('bootstrap.bundle');
  });

  it('still loads jQuery, which the vendored Leaflet plugins expect as a global', () => {
    expect(scripts.some((script) => script.includes('jquery'))).toBe(true);
  });
});
