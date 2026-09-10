import { FilterPipe } from './filter.pipe';

/**
 * The pipe replaces the AngularJS `filter:` and is called both ways in the
 * templates: with a search string and — in the indicator edit-features modal —
 * with a predicate function. The predicate form used to throw
 * "searchText.toLowerCase is not a function" on every change detection pass,
 * which broke the whole surrounding view.
 */
describe('FilterPipe', () => {
  const pipe = new FilterPipe();
  const items = [{ datasetName: 'Alpha' }, { datasetName: 'Beta' }];

  it('returns everything without a filter', () => {
    expect(pipe.transform(items, '')).toEqual(items);
  });

  it('filters by search text, case-insensitively', () => {
    expect(pipe.transform(items, 'alp')).toEqual([items[0]]);
  });

  it('filters by a named property', () => {
    expect(pipe.transform(items, 'bet', 'datasetName')).toEqual([items[1]]);
  });

  it('accepts a predicate function', () => {
    expect(pipe.transform(items, (item) => item.datasetName === 'Beta')).toEqual([items[1]]);
  });

  it('survives a missing collection', () => {
    expect(pipe.transform(undefined as unknown as any[], 'x')).toEqual([]);
  });
});
