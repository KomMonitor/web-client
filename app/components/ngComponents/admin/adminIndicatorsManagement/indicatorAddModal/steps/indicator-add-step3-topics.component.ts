import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { AdminTopicsManagementComponent } from '../../../adminTopicsManagement/admin-topics-management.component';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';

@Component({
  selector: 'app-indicator-add-step3-topics',
  templateUrl: './indicator-add-step3-topics.component.html',
  styleUrls: ['../indicator-add-form.shared.scss'],
  imports: [CommonModule, FormsModule, NgbCollapseModule, AdminTopicsManagementComponent],
  standalone: true,
})
export class IndicatorAddStep3TopicsComponent {
  protected state = inject(IndicatorAddFormStateService);
  protected accessControlService = inject(AccessControlService);

  // View-only collapse state of the embedded topic catalog box.
  isIndicatorAddTopicsCollapse = true;
}
