import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Keeps the texts of the layer panel from drifting apart: German and English
 * must have the same keys and placeholders, and no text may be empty.
 */

interface Tree {
  [key: string]: string | Tree;
}

const I18N = join(__dirname, '../../../../assets/i18n');

function texts(language: string): Record<string, string> {
  const tree: Tree = JSON.parse(readFileSync(join(I18N, `${language}.json`), 'utf8'));
  const block = tree['MAP_LAYERS'];
  if (!block || typeof block !== 'object') {
    throw new Error('No translation block MAP_LAYERS');
  }
  return flatten(block, 'MAP_LAYERS');
}

function flatten(tree: Tree, prefix: string): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((all, [key, value]) => {
    const path = `${prefix}.${key}`;
    return typeof value === 'string'
      ? { ...all, [path]: value }
      : { ...all, ...flatten(value, path) };
  }, {});
}

const placeholders = (text: string) =>
  [...text.matchAll(/{{\s*(\w+)\s*}}/g)]
    .map((match) => match[1])
    .sort()
    .join(',');

describe('map layer panel translations', () => {
  const german = texts('de');
  const english = texts('en');

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
