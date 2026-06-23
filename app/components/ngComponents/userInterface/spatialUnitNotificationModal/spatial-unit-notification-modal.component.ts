import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SafeHtmlPipe } from 'pipes/safe-html.pipe';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

@Component({
  selector: 'spatial-unit-notification-modal',
  standalone: true,
  templateUrl: './spatial-unit-notification-modal.component.html',
  styleUrls: ['./spatial-unit-notification-modal.component.scss'],
  imports: [CommonModule, SafeHtmlPipe]
})
export class SpatialUnitNotificationModalComponent implements OnInit {

  activeModal = inject(NgbActiveModal);
  envConfigService = inject(EnvConfigService);
  isHideNotification = false;
  protected spatialUnitNotificationModalTitle = this.envConfigService.spatialUnitNotificationTitle;
  protected spatialUnitNotificationModalMessage = this.envConfigService.spatialUnitNotificationMessage;

  ngOnInit(): void {
    if (!(localStorage.getItem("hideKomMonitorSpatialUnitNotification") === "true")) {
      this.isHideNotification = false;
    }
    else {
      this.isHideNotification = true;
      $("#changeHideSpatialUnitNotificationInput").prop('checked', true);
    }
  }

  onChangeHideSpatialUnitNotification() {
    if (this.isHideNotification) {
      localStorage.setItem("hideKomMonitorSpatialUnitNotification", "true");
    }
    else {
      localStorage.setItem("hideKomMonitorSpatialUnitNotification", "false");
    }
  };

  changeHideSpatialUnitNotificationInput() {
      if (this.isHideNotification) {
        this.isHideNotification = false;
      }
      else {
          this.isHideNotification = true;
      }
      this.onChangeHideSpatialUnitNotification();
  }
}
