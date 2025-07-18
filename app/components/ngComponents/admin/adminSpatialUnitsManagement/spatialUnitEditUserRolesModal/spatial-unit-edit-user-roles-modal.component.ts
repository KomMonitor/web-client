import { Component, Inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';

@Component({
  selector: 'spatial-unit-edit-user-roles-modal',
  templateUrl: './spatial-unit-edit-user-roles-modal.component.html',
  styleUrls: ['./spatial-unit-edit-user-roles-modal.component.css']
})
export class SpatialUnitEditUserRolesModalComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('progressbar', { static: true }) progressBar!: ElementRef;

  currentSpatialUnitDataset: any = null;
  roleManagementTableOptions: any = undefined;
  
  successMessagePart: string = '';
  errorMessagePart: string = '';
  
  ownerOrgFilter: string = '';
  ownerOrganization: string = '';
  activeRolesOnly: boolean = true;
  permissions: any[] = [];
  resourcesCreatorRights: any[] = [];
  
  loadingData: boolean = false;
  currentStep: number = 1;
  totalSteps: number = 2;
  
  private subscription: Subscription = new Subscription();

  constructor(
    public activeModal: NgbActiveModal,
    @Inject('kommonitorDataExchangeService') public kommonitorDataExchangeService: any,
    @Inject('kommonitorDataGridHelperService') public kommonitorDataGridHelperService: any,
    @Inject('kommonitorMultiStepFormHelperService') public kommonitorMultiStepFormHelperService: any,
    private broadcastService: BroadcastService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.prepareCreatorList();
    this.resetForm();
    this.setupBroadcastSubscription();
  }

  ngAfterViewInit(): void {
    this.updateProgressBar();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private setupBroadcastSubscription(): void {
    this.subscription.add(
      this.broadcastService.currentBroadcastMsg.subscribe((message: any) => {
        if (message.key === 'availableRolesUpdate') {
          this.refreshRoleManagementTable();
        }
      })
    );
  }

  prepareCreatorList(): void {
    if (this.kommonitorDataExchangeService.currentKomMonitorLoginRoleNames.length > 0) {
      const creatorRights: string[] = [];
      const creatorRightsChildren: string[] = [];
      
      this.kommonitorDataExchangeService.currentKomMonitorLoginRoleNames.forEach((roles: string) => {
        const key = roles.split('.')[0];
        const role = roles.split('.')[1];

        // case unit-resources-creator
        if (role === 'unit-resources-creator' && !this.resourcesCreatorRights.includes(key)) {
          creatorRights.push(key);
        }

        // case client-resources-creator, gather unit-ids first, then fetch all unit-data
        if (role === 'client-resources-creator' && !creatorRightsChildren.includes(key)) {
          creatorRightsChildren.push(key);
        }
      });

      // gather all children
      this.gatherCreatorRightsChildren(creatorRights, creatorRightsChildren);

      this.resourcesCreatorRights = this.kommonitorDataExchangeService.accessControl.filter(
        (elem: any) => creatorRights.includes(elem.name)
      );
    }
  }

  private gatherCreatorRightsChildren(creatorRights: string[], creatorRightsChildren: string[]): void {
    if (creatorRightsChildren.length > 0) {
      this.kommonitorDataExchangeService.accessControl
        .filter((elem: any) => creatorRightsChildren.includes(elem.name))
        .flatMap((res: any) => res.children)
        .forEach((child: any) => {
          this.kommonitorDataExchangeService.accessControl
            .filter((elem: any) => elem.organizationalUnitId === child)
            .forEach((childData: any) => {
              creatorRights.push(childData.name);
              this.gatherCreatorRightsChildren(creatorRights, [childData.name]);
            });
        });
    }
  }

  refreshRoleManagementTable(): void {
    this.permissions = this.currentSpatialUnitDataset ? this.currentSpatialUnitDataset.permissions : [];

    // set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.kommonitorDataExchangeService.accessControl.forEach((item: any) => {
      if (this.currentSpatialUnitDataset) {
        if (item.organizationalUnitId === this.currentSpatialUnitDataset.ownerId) {
          item.datasetOwner = true;
        } else {
          item.datasetOwner = false;
        }
      }
    });

    if (this.permissions.length === 0) {
      this.activeRolesOnly = false;
    }

    let access = this.kommonitorDataExchangeService.accessControl;
    if (this.permissions.length > 0 && this.activeRolesOnly) {
      access = this.kommonitorDataExchangeService.accessControl.filter((unit: any) => {
        return unit.permissions.filter((unitPermission: any) => 
          this.permissions.includes(unitPermission.permissionId)
        ).length > 0;
      });
    }

    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'spatialUnitEditRoleManagementTable',
      this.roleManagementTableOptions,
      access,
      this.permissions,
      true
    );
  }

  onActiveRolesOnlyChange(): void {
    this.refreshRoleManagementTable();
  }

  onChangeOwner(ownerOrganization: string): void {
    this.ownerOrganization = ownerOrganization;
    console.log('Target creator role selected to be ', this.ownerOrganization);
    this.refreshRoles(this.ownerOrganization);
  }

  private refreshRoles(orgUnitId: string): void {
    const permissionIds_ownerUnit = orgUnitId ? 
      this.kommonitorDataExchangeService.getAccessControlById(orgUnitId).permissions
        .filter((permission: any) => permission.permissionLevel === 'viewer' || permission.permissionLevel === 'editor')
        .map((permission: any) => permission.permissionId) : [];

    // set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.kommonitorDataExchangeService.accessControl.forEach((item: any) => {
      if (item.organizationalUnitId === orgUnitId) {
        item.datasetOwner = true;
      } else {
        item.datasetOwner = false;
      }
    });

    this.roleManagementTableOptions = this.kommonitorDataGridHelperService.buildRoleManagementGrid(
      'spatialUnitEditRoleManagementTable',
      this.roleManagementTableOptions,
      this.kommonitorDataExchangeService.accessControl,
      permissionIds_ownerUnit,
      true
    );
  }

  resetForm(): void {
    if (this.currentSpatialUnitDataset) {
      this.ownerOrganization = this.currentSpatialUnitDataset.ownerId;
      this.refreshRoleManagementTable();
    }
    
    this.ownerOrgFilter = '';
    this.successMessagePart = '';
    this.errorMessagePart = '';
    this.currentStep = 1;
    this.updateProgressBar();
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateProgressBar();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgressBar();
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
      this.updateProgressBar();
    }
  }

  private updateProgressBar(): void {
    if (this.progressBar && this.progressBar.nativeElement) {
      const steps = this.progressBar.nativeElement.querySelectorAll('li');
      steps.forEach((step: any, index: number) => {
        if (index < this.currentStep) {
          step.classList.add('active');
        } else {
          step.classList.remove('active');
        }
      });
    }
  }

  async editSpatialUnitUserRoles(): Promise<void> {
    if (this.ownerOrganization && this.ownerOrganization !== this.currentSpatialUnitDataset.ownerId) {
      const confirmMessage = 'Sind Sie sicher, dass Sie den Eigentümerschaft an dieser Resource endgültig und unwiderruflich übertragen und damit abgeben wollen?';
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    await this.putUserRoles();
    await this.putOwnership();
  }

  private async putUserRoles(): Promise<void> {
    try {
      this.loadingData = true;
      this.errorMessagePart = '';

      const putBody = {
        permissions: this.kommonitorDataGridHelperService.getSelectedRoleIds_roleManagementGrid(this.roleManagementTableOptions),
        isPublic: this.currentSpatialUnitDataset.isPublic
      };

      const response = await this.http.put(
        `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/spatial-units/${this.currentSpatialUnitDataset.spatialUnitId}/permissions`,
        putBody,
        { headers: { 'Content-Type': 'application/json' } }
      ).toPromise();

      this.successMessagePart = this.currentSpatialUnitDataset.spatialUnitLevel;
      this.broadcastService.broadcast('refreshSpatialUnitOverviewTable', ['edit', this.currentSpatialUnitDataset.spatialUnitId]);
      
    } catch (error: any) {
      this.errorMessagePart = 'Fehler beim Aktualisieren der Zugriffsrechte. Fehler lautet: \n\n';
      if (error.error) {
        this.errorMessagePart += this.kommonitorDataExchangeService.syntaxHighlightJSON(error.error);
      } else {
        this.errorMessagePart += this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
      }
    } finally {
      this.loadingData = false;
    }
  }

  private async putOwnership(): Promise<void> {
    try {
      this.loadingData = true;
      this.errorMessagePart = '';

      const putBody = {
        ownerId: this.ownerOrganization || this.currentSpatialUnitDataset.ownerId
      };

      const response = await this.http.put(
        `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/spatial-units/${this.currentSpatialUnitDataset.spatialUnitId}/ownership`,
        putBody,
        { headers: { 'Content-Type': 'application/json' } }
      ).toPromise();

      this.successMessagePart = this.currentSpatialUnitDataset.spatialUnitLevel;
      this.broadcastService.broadcast('refreshSpatialUnitOverviewTable', ['edit', this.currentSpatialUnitDataset.spatialUnitId]);
      
    } catch (error: any) {
      this.errorMessagePart = 'Fehler beim Aktualisieren der Eigentümerschaft. Fehler lautet: \n\n';
      if (error.error) {
        this.errorMessagePart += this.kommonitorDataExchangeService.syntaxHighlightJSON(error.error);
      } else {
        this.errorMessagePart += this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
      }
    } finally {
      this.loadingData = false;
    }
  }

  getCurrentOwnerName(): string {
    if (this.currentSpatialUnitDataset && this.currentSpatialUnitDataset.ownerId) {
      const owner = this.kommonitorDataExchangeService.getAccessControlById(this.currentSpatialUnitDataset.ownerId);
      return owner ? owner.name : '';
    }
    return '';
  }

  isOwnershipChanging(): boolean {
    return !!(this.ownerOrganization && this.ownerOrganization !== this.currentSpatialUnitDataset.ownerId);
  }

  getFilteredOrganizations(): any[] {
    if (!this.ownerOrgFilter) {
      return this.kommonitorDataExchangeService.checkAdminPermission() ? 
        this.kommonitorDataExchangeService.accessControl : this.resourcesCreatorRights;
    }
    
    const orgs = this.kommonitorDataExchangeService.checkAdminPermission() ? 
      this.kommonitorDataExchangeService.accessControl : this.resourcesCreatorRights;
    
    return orgs.filter((org: any) => 
      org.name.toLowerCase().includes(this.ownerOrgFilter.toLowerCase())
    );
  }

  hideSuccessAlert(): void {
    this.successMessagePart = '';
  }

  hideErrorAlert(): void {
    this.errorMessagePart = '';
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }
} 