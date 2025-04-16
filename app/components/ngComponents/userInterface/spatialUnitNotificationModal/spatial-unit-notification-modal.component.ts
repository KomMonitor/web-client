import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SafeHtmlPipe } from 'pipes/safe-html.pipe';

@Component({
  selector: 'spatial-unit-notification-modal',
  standalone: true,
  templateUrl: './spatial-unit-notification-modal.component.html',
  styleUrls: ['./spatial-unit-notification-modal.component.css'],
  imports: [CommonModule, SafeHtmlPipe]
})
export class SpatialUnitNotificationModalComponent implements OnInit {

  activeModal = inject(NgbActiveModal);
  isHideNotification = false;
  spatialUnitNotificationModalTitle;
  spatialUnitNotificationModalMessage

  ngOnInit(): void {
    this.spatialUnitNotificationModalTitle = window.__env.spatialUnitNotificationTitle;
    this.spatialUnitNotificationModalMessage = window.__env.spatialUnitNotificationMessage;
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
