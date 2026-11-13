import type {
  LayerGroupDef,
  LayerTreeNode,
} from 'services/map-layer-registry-service/map-layer.model';

import { isGroupShown } from './layer-tree.util';

const node = (count: number, whenEmpty?: LayerGroupDef['whenEmpty']): LayerTreeNode => ({
  group: { id: 'g', i18nKey: 'G', whenEmpty },
  children: [],
  entries: [],
  count,
});

describe('isGroupShown', () => {
  it('leaves out only empty groups that ask to be hidden', () => {
    expect(isGroupShown(node(0, 'hide'))).toBe(false);
    expect(isGroupShown(node(0, 'hint'))).toBe(true);
    expect(isGroupShown(node(0))).toBe(true);
    expect(isGroupShown(node(2, 'hide'))).toBe(true);
  });
});
