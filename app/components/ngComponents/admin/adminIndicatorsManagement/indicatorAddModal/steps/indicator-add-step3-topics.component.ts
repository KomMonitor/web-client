import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
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
    ExpandableBoxComponent,
    AdminTopicsManagementComponent,
    TopicHierarchyFormComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorAddStep3TopicsComponent {
  protected state = inject(IndicatorAddFormStateService);

  protected accessControlService = inject(AccessControlService);
}
