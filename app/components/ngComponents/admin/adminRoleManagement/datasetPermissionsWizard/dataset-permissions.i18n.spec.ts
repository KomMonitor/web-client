import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Keeps the wizard's translations from drifting apart: German and English
 * must have the same keys and the same placeholders, and no text may be
 * empty. Whether the code uses exactly these keys was checked once
 * (2026-11-09); that is no spec, since some keys are built at runtime.
 */

interface Tree {
  [key: string]: string | Tree;
}

const I18N = join(__dirname, '../../../../../assets/i18n');
const BLOCKS = ['ADMIN_DATASET_PERMISSIONS', 'ADMIN_ROLES.EXPLANATION.DATASET_PERMISSIONS'];

function load(language: string): Tree {
  return JSON.parse(readFileSync(join(I18N, `${language}.json`), 'utf8'));
}

/** The texts below `path`, keyed by their full dotted key. */
function texts(tree: Tree, path: string): Record<string, string> {
  let node: string | Tree | undefined = tree;
  for (const key of path.split('.')) {
    node = typeof node === 'object' ? node[key] : undefined;
  }
  if (!node || typeof node !== 'object') {
    throw new Error(`No translation block ${path}`);
  }
  return flatten(node, path);
}

function flatten(tree: Tree, prefix: string): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((all, [key, value]) => {
    const path = `${prefix}.${key}`;
    return typeof value === 'string'
      ? { ...all, [path]: value }
      : { ...all, ...flatten(value, path) };
  }, {});
}

function placeholders(text: string): string {
  return [...text.matchAll(/{{\s*(\w+)\s*}}/g)]
    .map((match) => match[1])
    .sort()
    .join(',');
}

describe('dataset-permissions translations', () => {
  const de = load('de');
  const en = load('en');

  describe.each(BLOCKS)('%s', (path) => {
    const german = texts(de, path);
    const english = texts(en, path);

    it('has the same keys in German and English', () => {
      expect(Object.keys(english).sort()).toEqual(Object.keys(german).sort());
    });

    it('uses the same placeholders in both languages', () => {
      const mismatches = Object.keys(german).filter(
        (key) => key in english && placeholders(german[key]) !== placeholders(english[key])
      );
      expect(mismatches).toEqual([]);
    });

    it('has no empty text', () => {
      const empty = [...Object.entries(german), ...Object.entries(english)]
        .filter(([, text]) => !text.trim())
        .map(([key]) => key);
      expect(empty).toEqual([]);
    });
  });
});
