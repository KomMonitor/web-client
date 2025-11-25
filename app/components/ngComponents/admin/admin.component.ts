import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit{

  selectedResourceType = 'spatialUnits';

  activeItemBackupId = "adminDashboardNavItem";

  userRoleInformation = {};
  userGroupInformation:any[] = [];

  constructor(
    private router: Router,
    protected dataExchangeService: DataExchangeService
  ) {}

  switchToMapApplication() {
    this.router.navigate(['']);
  }

  ngOnInit(): void {
      
    // if(! this.dataExchangeService.enableKeycloakSecurity){
    // 	  this.checkAuthorizationOnStartup_withoutKeycloak();
    // }
    this.dataExchangeService.fetchAllMetadata();

    setTimeout(() => {
      this.prepUserInformation();
    }, 1000);
  }

  prepUserInformation() {

    if(this.dataExchangeService.currentKomMonitorLoginRoleNames.length>0) {
      this.dataExchangeService.currentKomMonitorLoginRoleNames.forEach(roles => {
        
        let key = roles.split('.')[0];
        let role = roles.split('.')[1];

        if(!this.userRoleInformation.hasOwnProperty(key)) {
          this.userRoleInformation[key] = [];
        }
        
        this.userRoleInformation[key].push(role);

      });
    }

    if(this.dataExchangeService.currentKeycloakLoginGroups.length>0) {
      this.dataExchangeService.currentKeycloakLoginGroups.forEach((group, index) => {

        let parts = group.split('/');
        this.userGroupInformation[index] = [];

        parts.forEach(part => {
          if(part.length>0)
            this.userGroupInformation[index].push(part);
        });
      });
    }
  }

  onClickGeodataAdminPanel(idOfNavBarItem){
    this.activeItemBackupId = idOfNavBarItem;
    $('.sidebar-menu li').removeClass("active");

    document.getElementById('adminGeodataWrapperNavItem')?.setAttribute("class", "active");
  };

  onClickConfigAdminPanel(idOfNavBarItem){
    this.activeItemBackupId = idOfNavBarItem;
    $('.sidebar-menu li').removeClass("active");

    document.getElementById('adminConfigWrapperNavItem')?.setAttribute("class", "active");
  };

  onClickOtherAdminPanel(idOfNavBarItem){
    this.activeItemBackupId = idOfNavBarItem;
    $('#adminGeodataWrapperNavItem ul li').removeClass("active");
    $('#adminConfigWrapperNavItem ul li').removeClass("active");
  };

  onClickGeodataWrapperItem(){

    // $('#adminGeodataWrapperNavItem').toggleClass("active");

    setTimeout(() => {
      if(this.activeItemBackupId != 'adminSpatialUnitsNavItem' && this.activeItemBackupId != 'adminGeoresourcesNavItem' && this.activeItemBackupId != 'adminIndicatorsNavItem'){
        // $('#adminGeodataWrapperNavItem').toggleClass("active");
        $('#'+this.activeItemBackupId).addClass("active");
      }
    }, 40);
  };

  onClickConfigWrapperItem(){

    // $('#adminGeodataWrapperNavItem').toggleClass("active");

    setTimeout(() => {
      if(this.activeItemBackupId != 'adminAppConfigNavItem' && this.activeItemBackupId != 'adminKeycloakConfigNavItem' && this.activeItemBackupId != 'adminControlsConfigNavItem'){
        // $('#adminGeodataWrapperNavItem').toggleClass("active");
        $('#'+this.activeItemBackupId).addClass("active");
      }
    }, 40);
  };								
}
