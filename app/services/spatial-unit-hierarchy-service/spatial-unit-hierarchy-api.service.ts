import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  SpatialUnitHierarchyInputType,
  SpatialUnitHierarchyMemberInputType,
  SpatialUnitHierarchyMembershipInputType,
  SpatialUnitHierarchyOverviewType,
  SpatialUnitHierarchyPOSTInputType,
  SpatialUnitOverviewType,
} from 'models/data-management-api';
import { firstValueFrom } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/**
 * Access to the spatial unit hierarchies of the Data Management API — the
 * chains that order spatial unit levels from the coarsest to the finest.
 *
 * Reads resolve empty instead of throwing: KomMonitor starts without a login,
 * and these endpoints need a token, so a 401 must not take a page down. Writes
 * rethrow, because the caller applies them optimistically and has to roll back.
 *
 * What the deployed backend actually does with these payloads is recorded in
 * `documentation/RAUMEINHEITSHIERARCHIEN_BEFUNDE.md`; the notes below point at
 * the findings that shape this interface.
 */
@Injectable({
  providedIn: 'root',
})
export class SpatialUnitHierarchyApiService {
  private readonly http = inject(HttpClient);
  private readonly envConfigService = inject(EnvConfigService);

  private get baseUrl(): string {
    return `${this.envConfigService.baseUrlToKomMonitorDataAPI}/spatial-unit-hierarchies`;
  }

  private get spatialUnitsUrl(): string {
    return `${this.envConfigService.baseUrlToKomMonitorDataAPI}/spatial-units`;
  }

  /** Every hierarchy of the tenants the user may see; empty on error. */
  async getHierarchies(): Promise<SpatialUnitHierarchyOverviewType[]> {
    try {
      return (
        (await firstValueFrom(this.http.get<SpatialUnitHierarchyOverviewType[]>(this.baseUrl))) ??
        []
      );
    } catch {
      return [];
    }
  }

  /** One hierarchy including its ordered members; null on error. */
  async getHierarchy(hierarchyId: string): Promise<SpatialUnitHierarchyOverviewType | null> {
    try {
      return await firstValueFrom(
        this.http.get<SpatialUnitHierarchyOverviewType>(`${this.baseUrl}/${hierarchyId}`)
      );
    } catch {
      return null;
    }
  }

  /**
   * Creates a hierarchy, optionally with its whole member chain in one request.
   * Answers 201 with the created record, so the caller can insert it without
   * fetching again.
   */
  async createHierarchy(
    body: SpatialUnitHierarchyPOSTInputType
  ): Promise<SpatialUnitHierarchyOverviewType> {
    return await firstValueFrom(
      this.http.post<SpatialUnitHierarchyOverviewType>(this.baseUrl, body)
    );
  }

  /**
   * Replaces the metadata of a hierarchy. This is a **full** replace: leaving
   * `isPublic` out of the body sets it to `false` rather than keeping it, so
   * callers always send `name`, `mandantId` and `isPublic` together.
   */
  async updateHierarchy(
    hierarchyId: string,
    body: SpatialUnitHierarchyInputType
  ): Promise<SpatialUnitHierarchyOverviewType> {
    return await firstValueFrom(
      this.http.put<SpatialUnitHierarchyOverviewType>(`${this.baseUrl}/${hierarchyId}`, body)
    );
  }

  /** Drops a hierarchy. Its members survive and fall back to "unassigned". */
  async deleteHierarchy(hierarchyId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${hierarchyId}`));
  }

  /**
   * Replaces the full ordered member list of a hierarchy — the one operation
   * behind inserting, reordering and removing a level.
   *
   * Build the list with {@link toOrderedMembers}: the backend orders by
   * `hierarchyLevel` and ignores the array order, so the position has to be in
   * the value.
   */
  async updateMembers(
    hierarchyId: string,
    members: readonly SpatialUnitHierarchyMemberInputType[]
  ): Promise<SpatialUnitHierarchyOverviewType> {
    return await firstValueFrom(
      this.http.put<SpatialUnitHierarchyOverviewType>(`${this.baseUrl}/${hierarchyId}/members`, [
        ...members,
      ])
    );
  }

  /**
   * The same relation from the other side: replaces the full set of hierarchy
   * memberships of one spatial unit. This is how a dataset's placement is
   * written where no `hierarchies` field exists on the payload — the metadata
   * PATCH of a spatial unit has none.
   */
  async updateMemberships(
    spatialUnitId: string,
    memberships: readonly SpatialUnitHierarchyMembershipInputType[]
  ): Promise<SpatialUnitOverviewType> {
    return await firstValueFrom(
      this.http.put<SpatialUnitOverviewType>(
        `${this.spatialUnitsUrl}/${spatialUnitId}/hierarchies`,
        [...memberships]
      )
    );
  }
}

/**
 * Turns a chain of spatial unit ids, coarsest first, into the member list the
 * API expects.
 *
 * The index *is* the `hierarchyLevel`. That is not cosmetic: the backend sorts
 * the members by that value and pays no attention to the order of the array,
 * then renumbers them densely from 0. Sending the index keeps both in step, so
 * the normalization changes nothing.
 */
export function toOrderedMembers(
  spatialUnitIds: readonly string[]
): SpatialUnitHierarchyMemberInputType[] {
  return spatialUnitIds.map((spatialUnitId, index) => ({
    spatialUnitId,
    hierarchyLevel: index,
  }));
}

/**
 * The membership list to send for a spatial unit whose hierarchy was picked in
 * the **edit** modal, where the choice is the hierarchy alone.
 *
 * The add wizard takes another route: it assigns several hierarchies at once
 * and places the new level by its neighbours, which is what the POST expects —
 * see `membershipsForRows` next to that dialog. The two wire shapes are not
 * interchangeable; this one is for `PUT /spatial-units/{id}/hierarchies`.
 *
 * The position follows from the choice, and deliberately so: keeping the
 * hierarchy keeps the level the dataset already has, switching to another one
 * appends it as the finest level there, and picking none clears the list. The
 * client therefore never sends a level that another member already occupies —
 * what the backend does with a collision is not documented, and does not have
 * to be. Reordering within a chain is the hierarchy admin page's job.
 */
export function placementFor(
  selectedHierarchyId: string,
  currentMemberships: readonly { hierarchyId?: string; hierarchyLevel?: number }[],
  hierarchies: readonly SpatialUnitHierarchyOverviewType[]
): SpatialUnitHierarchyMembershipInputType[] {
  if (!selectedHierarchyId) {
    return [];
  }

  const existing = currentMemberships.find(
    (membership) => membership.hierarchyId === selectedHierarchyId
  );
  if (existing) {
    return [{ hierarchyId: selectedHierarchyId, hierarchyLevel: existing.hierarchyLevel ?? 0 }];
  }

  const target = hierarchies.find((entry) => entry.hierarchyId === selectedHierarchyId);
  return [{ hierarchyId: selectedHierarchyId, hierarchyLevel: target?.members?.length ?? 0 }];
}
