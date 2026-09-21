/** One member (= spatial unit) of a resolved hierarchy, as returned by the hierarchy-members endpoint. */
export interface SpatialUnitHierarchyMemberType {
  hierarchyLevel: number;
  nextLowerSpatialUnitId: string | null;
  nextUpperSpatialUnitId: string | null;
  spatialUnitId: string;
  spatialUnitLevel: string;
}

/** Response of GET .../spatial-unit-hierarchies/{hierarchyId}. */
export interface SpatialUnitHierarchyMembersType {
  hierarchyId: string;
  isPublic: boolean;
  mandantId: string;
  members: SpatialUnitHierarchyMemberType[];
  name: string;
}

/** One entry of GET .../spatial-unit-hierarchies (the list of all available hierarchies, without members). */
export type SpatialUnitHierarchyOverviewType = Omit<SpatialUnitHierarchyMembersType, 'members'>;
