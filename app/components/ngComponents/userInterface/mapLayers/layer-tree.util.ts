import type { LayerTreeNode } from 'services/map-layer-registry-service/map-layer.model';

/**
 * Whether the panel shows a group: an empty one is left out only when its
 * catalogue entry says so (`whenEmpty: 'hide'`, the sub groups); others show
 * a hint where their layers come from instead.
 */
export function isGroupShown(node: LayerTreeNode): boolean {
  return node.count > 0 || node.group.whenEmpty !== 'hide';
}
