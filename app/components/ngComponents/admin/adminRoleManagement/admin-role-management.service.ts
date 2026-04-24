import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  AccessControlMetadata,
  KommonitorDataExchangeService,
} from "services/adminSpatialUnit/kommonitor-data-exchange.service";
import { KeycloakHelperService } from "services/keycloak-helper-service/keycloak-helper.service";
import { Observable, of, from, throwError } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";

export interface RoleAuthoritiesResponse {
  authorityRoles: Array<{ organizationalUnitId: string; adminRoles: string[] }>;
}

export interface RoleDelegatesResponse {
  roleDelegates: Array<{ organizationalUnitId: string; adminRoles: string[] }>;
}

export interface RoleDelegatePutEntry {
  organizationalUnitId: string;
  organizationalUnitName: string;
  keycloakId?: string;
  adminRoles: string[];
}

@Injectable({ providedIn: "root" })
export class AdminRoleManagementService {
  private baseUrl =
    this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI;

  constructor(
    private http: HttpClient,
    private kommonitorDataExchangeService: KommonitorDataExchangeService,
    private keycloakHelperService: KeycloakHelperService,
  ) {}

  deleteOrganizationalUnit(dataset: AccessControlMetadata): Observable<{
    dataset: AccessControlMetadata;
    success: boolean;
    error?: string;
  }> {
    return this.http
      .delete(
        `${this.baseUrl}/organizationalUnits/${dataset.organizationalUnitId}`,
      )
      .pipe(
        switchMap(() =>
          from(this.keycloakHelperService.deleteRoles(dataset.name)).pipe(
            // Keycloak errors are non-blocking — still treat as success
            map(() => ({ dataset, success: true })),
            catchError(() => of({ dataset, success: true })),
          ),
        ),
        catchError((error) => {
          const msg = error?.error?.message || JSON.stringify(error);
          return of({ dataset, success: false, error: msg });
        }),
      );
  }

  addOrganizationalUnit(
    postBody: any,
    parentOrganizationalUnit: AccessControlMetadata | null,
    roleDelegatesPutBody: any[],
  ): Observable<{ created?: AccessControlMetadata }> {
    return this.http.post(`${this.baseUrl}/organizationalUnits`, postBody).pipe(
      // after creation, refresh access control metadata
      map(() =>
        this.kommonitorDataExchangeService.accessControl.find(
          (entry) => entry.name === postBody.name,
        ),
      ),
      switchMap((created) => {
        if (!created) {
          return of({ created: undefined });
        }

        // create group in Keycloak
        return from(
          this.keycloakHelperService.postNewGroup(
            {
              ...created,
              name: postBody.name,
              mandant: !!postBody.mandant,
              parentId: postBody.parentId,
            },
            parentOrganizationalUnit,
          ),
        ).pipe(
          switchMap(() => {
            // if created has id and we have role delegates to set, PUT them
            if (
              created.organizationalUnitId &&
              roleDelegatesPutBody.length > 0
            ) {
              return this.http
                .put(
                  `${this.baseUrl}/organizationalUnits/${created.organizationalUnitId}/role-delegates`,
                  roleDelegatesPutBody,
                )
                .pipe(
                  switchMap(() =>
                    from(this.keycloakHelperService.fetchAndSetKeycloakRoles()),
                  ),
                  map(() => ({ created })),
                  catchError((err) => throwError(err)),
                );
            }

            // otherwise still refresh roles in Keycloak
            return from(
              this.keycloakHelperService.fetchAndSetKeycloakRoles(),
            ).pipe(map(() => ({ created })));
          }),
        );
      }),
      catchError((error) => throwError(error)),
    );
  }

  editOrganizationalUnit(
    currentDataset: AccessControlMetadata,
    oldName: string,
  ): Observable<{
    success: boolean;
    keycloakErrorMessagePart?: string;
    errorMessagePart?: string;
  }> {
    const putBody: Partial<AccessControlMetadata> = {
      name: currentDataset.name,
      description: currentDataset.description,
      contact: currentDataset.contact,
      keycloakId: currentDataset.keycloakId,
      mandant: currentDataset.mandant,
    };

    return this.http
      .put(
        `${this.baseUrl}/organizationalUnits/${currentDataset.organizationalUnitId}`,
        putBody,
      )
      .pipe(
        switchMap(() =>
          from(
            this.keycloakHelperService
              .renameExistingRoles(oldName, currentDataset.name, currentDataset)
              .then(() => this.keycloakHelperService.fetchAndSetKeycloakRoles())
              .then(() => ({ success: true }))
              .catch((err) => ({
                success: true,
                keycloakErrorMessagePart: this.kommonitorDataExchangeService.syntaxHighlightJSON(
                  err?.error || err,
                ),
              })),
          ),
        ),
        catchError((error) => {
          const msg = this.kommonitorDataExchangeService.syntaxHighlightJSON(
            error?.error || error,
          );
          return of({ success: false, errorMessagePart: msg });
        }),
      );
  }

  getAuthorityRoles(
    organizationalUnitId: string,
  ): Observable<RoleAuthoritiesResponse> {
    return this.http.get<RoleAuthoritiesResponse>(
      `${this.baseUrl}/organizationalUnits/${organizationalUnitId}/role-authorities`,
    );
  }

  getDelegatedRoles(
    organizationalUnitId: string,
  ): Observable<RoleDelegatesResponse> {
    return this.http.get<RoleDelegatesResponse>(
      `${this.baseUrl}/organizationalUnits/${organizationalUnitId}/role-delegates`,
    );
  }

  updateDelegatedRoles(
    organizationalUnitId: string,
    body: RoleDelegatePutEntry[],
  ): Observable<{ success: boolean; errorMessagePart?: string }> {
    return this.http
      .put(
        `${this.baseUrl}/organizationalUnits/${organizationalUnitId}/role-delegates`,
        body,
      )
      .pipe(
        map(() => ({ success: true })),
        catchError((error) => {
          const msg = this.kommonitorDataExchangeService.syntaxHighlightJSON(
            error?.error || error,
          );
          return of({ success: false, errorMessagePart: msg });
        }),
      );
  }
}
