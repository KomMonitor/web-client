import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { KommonitorRoleKeycloakHelperService } from 'services/adminRoleUnit/kommonitor-role-keycloak-helper.service';

@Component({
  selector: 'role-edit-metadata-modal-new',
  templateUrl: './role-edit-metadata-modal.component.html',
  styleUrls: ['./role-edit-metadata-modal.component.css']
})
export class RoleEditMetadataModalComponent implements OnInit, OnDestroy {

  loadingData: boolean = false;

  current: any = {};
  old: any = { name: undefined };

  parentOrganizationalUnit: any = null;

  nameInvalid: boolean = false;

  // Alerts/messages
  successMessagePart: string | undefined = undefined;
  errorMessagePart: string | undefined = undefined;
  keycloakErrorMessagePart: string | undefined = undefined;

  showSuccessAlert: boolean = false;
  showErrorAlert: boolean = false;
  showKeycloakSuccessAlert: boolean = false;
  showKeycloakErrorAlert: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private http: HttpClient,
    public kommonitorDataExchangeService: KommonitorDataExchangeService,
    public keycloakHelper: KommonitorRoleKeycloakHelperService
  ) {}

  ngOnInit(): void {
    // If parent passed data via componentInstance, ensure validation state is set
    if (this.current && this.current.organizationalUnitId) {
      this.resetRoleEditMetadataForm();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  // Initialization now happens via parent setting componentInstance fields

  checkRoleName(): void {
    this.nameInvalid = false;
    const accessControl = this.kommonitorDataExchangeService.accessControl || [];
    accessControl.forEach((ou: any) => {
      if (ou.name === this.current.name && ou.organizationalUnitId !== this.current.organizationalUnitId) {
        this.nameInvalid = true;
      }
    });
  }

  resetRoleEditMetadataForm(): void {
    this.successMessagePart = undefined;
    this.errorMessagePart = undefined;
    this.keycloakErrorMessagePart = undefined;

    this.showSuccessAlert = false;
    this.showErrorAlert = false;
    this.showKeycloakSuccessAlert = false;
    this.showKeycloakErrorAlert = false;

    // Trigger name validation state
    setTimeout(() => this.checkRoleName(), 0);
  }

  async editRoleMetadata(): Promise<void> {
    const putBody = {
      name: this.current.name,
      description: this.current.description,
      contact: this.current.contact,
      mandant: (this.current && typeof this.current.mandant === 'boolean') ? this.current.mandant : false
    };

    this.loadingData = true;
    this.showSuccessAlert = false;
    this.showErrorAlert = false;
    this.showKeycloakSuccessAlert = false;
    this.showKeycloakErrorAlert = false;
    this.errorMessagePart = undefined;
    this.keycloakErrorMessagePart = undefined;

    try {
      const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/organizationalUnits/${this.current.organizationalUnitId}`;
      await this.http.put(url, putBody).toPromise();

      this.successMessagePart = this.current.name;
      this.showSuccessAlert = true;

      // Attempt to rename in Keycloak (best-effort)
      try {
        await this.keycloakHelper.renameExistingRoles(this.old.name, this.current.name);
        this.old.name = this.current.name; // keep in sync
        await this.keycloakHelper.fetchAndSetKeycloakRoles();
        this.showKeycloakSuccessAlert = true;
      } catch (error: any) {
        this.keycloakErrorMessagePart = error && error.data
          ? this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data)
          : this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
        this.showKeycloakErrorAlert = true;
      }

      this.loadingData = false;

      // Close after a short delay to let user see success
      setTimeout(() => this.activeModal.close('success'), 1500);
    } catch (error: any) {
      if (error && error.error) {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.error);
      } else {
        this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
      }
      this.showErrorAlert = true;
      this.loadingData = false;
    }
  }

  hideSuccessAlert(): void { this.showSuccessAlert = false; }
  hideErrorAlert(): void { this.showErrorAlert = false; }
  hideKeycloakSuccessAlert(): void { this.showKeycloakSuccessAlert = false; }
  hideKeycloakErrorAlert(): void { this.showKeycloakErrorAlert = false; }

  canSubmit(): boolean {
    return !!this.current?.name && !!this.current?.description && !!this.current?.contact && !this.nameInvalid;
  }
}



