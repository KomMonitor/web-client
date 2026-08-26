import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { AdminTopicsManagementComponent } from '../../../adminTopicsManagement/admin-topics-management.component';
import { TopicHierarchyFormComponent } from '../../../adminShared/topicHierarchyForm/topic-hierarchy-form.component';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';

@Component({
  selector: 'app-indicator-add-step3-topics',
  templateUrl: './indicator-add-step3-topics.component.html',
  styleUrls: ['../indicator-add-form.shared.scss'],
  imports: [
    TranslateModule,
    CommonModule,
    NgbCollapseModule,
    AdminTopicsManagementComponent,
    TopicHierarchyFormComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorAddStep3TopicsComponent {
  protected state = inject(IndicatorAddFormStateService);
  private cdr = inject(ChangeDetectorRef);

  // Re-render this OnPush view whenever the shared form-state service reports
  // an async bulk rewrite of its plain fields (see stateRevision docs).
  private readonly stateSync = effect(() => {
    this.state.stateRevision();
    this.cdr.markForCheck();
  });

  protected accessControlService = inject(AccessControlService);

  // View-only collapse state of the embedded topic catalog box.
  isIndicatorAddTopicsCollapse = true;
}
