import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { ReportingService } from 'services/reporting-service/reporting.service';
import { ReportingModalComponent } from '../reporting-modal.component';

@Component({
  selector: 'app-reporting-progress-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reporting-progress-banner.component.html',
  styleUrls: ['./reporting-progress-banner.component.scss'],
})
export class ReportingProgressBannerComponent {
  protected reportingService = inject(ReportingService);
  private broadcastService = inject(BroadcastService);
  private modalService = inject(NgbModal);

  onAbortClicked() {
    this.broadcastService.broadcast(BroadcastMessage.AbortReportGeneration);
  }

  onOpenReportingModalClicked() {
    this.modalService.open(ReportingModalComponent, {
      windowClass: 'modal-holder',
      centered: true,
    });
  }
}
