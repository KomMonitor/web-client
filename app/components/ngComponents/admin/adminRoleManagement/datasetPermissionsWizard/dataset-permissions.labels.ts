import { DatasetKind } from './dataset-permissions.model';

/** Translation keys of the dataset kinds, shared by the wizard's steps and dialogs. */
export const KIND_LABELS: Record<DatasetKind, string> = {
  indicator: 'ADMIN_DATASET_PERMISSIONS.SELECTION.KINDS.INDICATOR',
  georesource: 'ADMIN_DATASET_PERMISSIONS.SELECTION.KINDS.GEORESOURCE',
  spatialUnit: 'ADMIN_DATASET_PERMISSIONS.SELECTION.KINDS.SPATIAL_UNIT',
};
