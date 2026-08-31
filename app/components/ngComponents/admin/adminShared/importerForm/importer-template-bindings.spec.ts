import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guard for the riskiest failure class of the reactive-forms rework: the
 * importer parameter dictionaries are `FormRecord`s and the bounding box is a
 * nested `FormGroup`, so a `formControlName` for one of them only resolves
 * inside the matching `formGroupName`. Without the wrapper Angular throws
 * `Cannot find control with name: …` at runtime — and none of the modal specs
 * render their template, so nothing else catches it.
 *
 * The check is a text scan, not a parser: for every binding it looks at the
 * nearest preceding `formGroupName`, which in these templates is the wrapping
 * element. All five modals now also have a rendered tier
 * (`describe('rendered data step')` / `'rendered batch step'` in their component
 * specs) that proves the same thing by actually throwing. This scan stays as the
 * cheap structural invariant: it covers markup no rendered test happens to
 * exercise, and it names the offending file directly.
 */

const TEMPLATES = [
  'adminSpatialUnitsManagement/spatialUnitAddModal/spatial-unit-add-modal.component.html',
  'adminSpatialUnitsManagement/spatialUnitEditFeaturesModal/spatial-unit-edit-features-modal.component.html',
  'adminGeoresourcesManagement/georesourceAddModal/georesource-add-modal.component.html',
  'adminGeoresourcesManagement/georesourceEditFeaturesModal/georesource-edit-features-modal.component.html',
  'adminIndicatorsManagement/indicatorEditFeaturesModal/indicator-edit-features-modal.component.html',
];

const PARAMETER_RECORDS = ['converterParameters', 'datasourceTypeParameters'];
const BBOX_CORNERS = ['minx', 'miny', 'maxx', 'maxy'];

const readTemplate = (relativePath: string): string =>
  readFileSync(join(__dirname, '..', '..', relativePath), 'utf8');

/** The `formGroupName` in effect at `index`, i.e. the nearest one before it. */
const enclosingGroup = (template: string, index: number): string | undefined => {
  const matches = [...template.slice(0, index).matchAll(/formGroupName="([^"]+)"/g)];
  return matches.at(-1)?.[1];
};

const indicesOf = (template: string, needle: string): number[] => {
  const indices: number[] = [];
  for (let at = template.indexOf(needle); at !== -1; at = template.indexOf(needle, at + 1)) {
    indices.push(at);
  }
  return indices;
};

describe('importer templates bind their runtime-keyed controls inside the right group', () => {
  describe.each(TEMPLATES)('%s', (relativePath) => {
    const template = readTemplate(relativePath);

    it('renders every importer parameter inside a parameter record', () => {
      const bindings = indicesOf(template, '[formControlName]="parameter.name"');
      expect(bindings.length).toBeGreaterThan(0);

      bindings.forEach((index) => {
        expect(PARAMETER_RECORDS).toContain(enclosingGroup(template, index));
      });
    });

    it('renders every bounding box corner inside the bbox group', () => {
      BBOX_CORNERS.forEach((corner) => {
        indicesOf(template, `formControlName="${corner}"`).forEach((index) => {
          expect(enclosingGroup(template, index)).toBe('bbox');
        });
      });
    });

    /**
     * Second failure class, found in the browser: `.multiStepForm fieldset` in
     * app.scss still carries the jQuery-wizard rules
     * `:not(:first-of-type) { display: none }` / `:first-of-type { display: block }`.
     * They outrank the `[hidden]` attribute and any @if, so a step whose fieldset
     * is preceded by a permanently rendered sibling (the security step, which
     * only toggles an inline display) stays invisible however Angular marks it
     * active — the whole importer step rendered as an empty modal body. An inline
     * display on the fieldset itself is what wins; Jest does not load global
     * styles, so no rendered test can catch this.
     */
    it('keeps the importer step visible next to a permanently rendered sibling', () => {
      const at = template.indexOf('formControlName="converter"');
      expect(at).toBeGreaterThan(-1);

      const fieldsetStart = template.lastIndexOf('<fieldset', at);
      expect(fieldsetStart).toBeGreaterThan(-1);
      const tagOf = (start: number) => template.slice(start, template.indexOf('>', start));
      const importerTag = tagOf(fieldsetStart);

      // A sibling that only toggles an inline display stays in the DOM, so the
      // importer fieldset is no longer `:first-of-type` and needs an inline
      // display of its own. Where every step is @if-guarded, the active fieldset
      // is the only one and the stylesheet shows it.
      const hasPersistentSibling = indicesOf(template, '<fieldset')
        .filter((start) => start !== fieldsetStart)
        .some((start) => tagOf(start).includes('[style.display]'));

      expect(importerTag).not.toContain('[hidden]');
      if (hasPersistentSibling) {
        expect(importerTag).toMatch(/\[style\.display\]|style="display:/);
      }
    });
  });
});
