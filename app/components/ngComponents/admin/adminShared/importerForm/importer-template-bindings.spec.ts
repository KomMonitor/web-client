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
 * element.
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
  });
});
