import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { AuthService } from 'services/auth-service/auth.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { Location } from '@angular/common';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { MapViewportStateService } from 'services/map-viewport-state-service/map-viewport-state.service';

@Injectable({
  providedIn: 'root',
})
export class ShareHelperService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private selectionState = inject(SelectionStateService);
  private location = inject(Location);
  private envConfigService = inject(EnvConfigService);
  private mapViewportState = inject(MapViewportStateService);

  queryParamMap = new Map();
  currentShareLink = '';

  paramName_sharing = 'share';
  paramName_loginRequired = 'login';
  paramName_indicatorId = 'ind';
  paramName_spatialUnitName = 'spu';
  paramName_hierarchyId = 'hierarchy';
  paramName_zoomLevel = 'zoom';
  paramName_latitude = 'lat';
  paramName_longitude = 'lon';

  /**
   * Applies the "ind"/"spu"/"hierarchy"/"lat"/"lon"/"zoom" query params of a shared link (if
   * present) to EnvConfigService's "initial..." fields, which the initial-selection code (data
   * setup, legend hierarchy filter, map viewport) reads once metadata has loaded. Must run
   * before that initial selection happens - called from UserInterfaceComponent.ngOnInit.
   */
  init() {
    const queryParams = this.route.snapshot.queryParamMap;

    // No need to parse sharing params if sharing is not true
    if (queryParams.get(this.paramName_sharing) !== 'true') {
      return;
    }

    this.applyQueryParams(queryParams);

    // if login required then route to login page with same link as redirect URL
    if (
      queryParams.get(this.paramName_loginRequired) === 'true' &&
      this.envConfigService.enableKeycloakSecurity &&
      !this.authService.isAuthenticated()
    ) {
      this.authService.login({ redirectUri: window.location.href });
    }
  }

  applyQueryParams(queryParams: ParamMap) {
    if (queryParams.has(this.paramName_indicatorId)) {
      this.envConfigService.initialIndicatorId = queryParams.get(this.paramName_indicatorId);
    }
    if (queryParams.has(this.paramName_spatialUnitName)) {
      this.envConfigService.initialSpatialUnitName = queryParams.get(
        this.paramName_spatialUnitName
      );
    }
    if (queryParams.has(this.paramName_hierarchyId)) {
      this.envConfigService.initialHierarchyId = queryParams.get(this.paramName_hierarchyId);
    }
    if (queryParams.has(this.paramName_latitude)) {
      this.envConfigService.initialLatitude = queryParams.get(this.paramName_latitude);
    }
    if (queryParams.has(this.paramName_longitude)) {
      this.envConfigService.initialLongitude = queryParams.get(this.paramName_longitude);
    }
    if (queryParams.has(this.paramName_zoomLevel)) {
      this.envConfigService.initialZoomLevel = queryParams.get(this.paramName_zoomLevel);
    }
  }

  generateCurrentShareLink(selectedHierarchyId?: string) {
    this.currentShareLink = '';

    this.setShareLinkParam_mapExtent();
    this.setShareLinkParam_currentIndicatorId();
    this.setShareLinkParam_currentSpatialUnitName();
    this.setShareLinkParam_currentHierarchyId(selectedHierarchyId);

    // regerenate the share link from all current parameters
    this.currentShareLink = this.generateFullUrl();

    if (this.currentShareLink.includes('?')) {
      this.currentShareLink = this.currentShareLink.split('?')[0];
    }

    this.currentShareLink += '?';
    this.currentShareLink += this.paramName_sharing + '=true';

    this.queryParamMap.forEach((value, key) => {
      this.currentShareLink += '&' + key + '=' + value;
    });
  }

  generateFullUrl(): string {
    const origin = window.location.origin;
    const path = this.location.path();

    return `${origin}/${path}`;
  }

  setShareLinkParam(paramName, value) {
    this.queryParamMap.set(paramName, value);
  }

  setShareLinkParam_currentIndicatorId() {
    this.setShareLinkParam(
      this.paramName_indicatorId,
      this.selectionState.selectedIndicator.indicatorId
    );

    if (this.selectionState.selectedIndicator.permissions.length > 0) {
      this.setShareLinkParam(this.paramName_loginRequired, 'true');
    } else {
      for (const spatialUnit of this.selectionState.selectedIndicator.applicableSpatialUnits) {
        if (
          spatialUnit.spatialUnitName == this.selectionState.selectedSpatialUnit.spatialUnitLevel
        ) {
          if (spatialUnit.permissions.length > 0) {
            this.setShareLinkParam(this.paramName_loginRequired, 'true');
          }
        }
      }
    }
  }

  setShareLinkParam_currentSpatialUnitName() {
    this.setShareLinkParam(
      this.paramName_spatialUnitName,
      this.selectionState.selectedSpatialUnit.spatialUnitLevel
    );
    if (this.selectionState.selectedSpatialUnit.permissions.length > 0) {
      this.setShareLinkParam(this.paramName_loginRequired, 'true');
    }
  }

  setShareLinkParam_currentHierarchyId(hierarchyId: string | undefined) {
    if (hierarchyId) {
      this.setShareLinkParam(this.paramName_hierarchyId, hierarchyId);
    } else {
      // no hierarchy filter active - don't carry a stale one over from a previous call
      this.queryParamMap.delete(this.paramName_hierarchyId);
    }
  }

  setShareLinkParam_mapExtent() {
    this.setShareLinkParam(this.paramName_latitude, this.mapViewportState.currentLatitude);
    this.setShareLinkParam(this.paramName_longitude, this.mapViewportState.currentLongitude);
    this.setShareLinkParam(this.paramName_zoomLevel, this.mapViewportState.currentZoomLevel);
    this.envConfigService.centerMapInitially = false;
  }
}
