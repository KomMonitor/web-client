import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';

interface AccordionItem {
  /** Translation key of the box title (resolved via the translate pipe in the template). */
  title: string;
  /** Translation key of the HTML content (resolved via the translate pipe, bound with innerHTML). */
  content: string;
  expanded?: boolean;
  nestedItems?: AccordionItem[];
}

@Component({
  selector: 'app-admin-role-explanation',
  templateUrl: './admin-role-explanation.component.html',
  styleUrls: ['./admin-role-explanation.component.scss'],
  imports: [ExpandableBoxComponent, AdminContentViewComponent, TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRoleExplanationComponent {
  items: AccordionItem[] = [
    {
      title: 'ADMIN_ROLES.EXPLANATION.TENANT.TITLE',
      content: 'ADMIN_ROLES.EXPLANATION.TENANT.CONTENT',
    },
    {
      title: 'ADMIN_ROLES.EXPLANATION.CREATE_TENANT.TITLE',
      content: 'ADMIN_ROLES.EXPLANATION.CREATE_TENANT.CONTENT',
    },
    {
      title: 'ADMIN_ROLES.EXPLANATION.SUBGROUPS.TITLE',
      content: 'ADMIN_ROLES.EXPLANATION.SUBGROUPS.CONTENT',
    },
    {
      title: 'ADMIN_ROLES.EXPLANATION.CREATE_SUBGROUPS.TITLE',
      content: 'ADMIN_ROLES.EXPLANATION.CREATE_SUBGROUPS.CONTENT',
    },
    {
      title: 'ADMIN_ROLES.EXPLANATION.OWNERSHIP.TITLE',
      content: 'ADMIN_ROLES.EXPLANATION.OWNERSHIP.CONTENT',
    },
    {
      title: 'ADMIN_ROLES.EXPLANATION.CHANGE_OWNERSHIP.TITLE',
      content: 'ADMIN_ROLES.EXPLANATION.CHANGE_OWNERSHIP.CONTENT',
    },
    {
      title: 'ADMIN_ROLES.EXPLANATION.GROUP_SHARING.TITLE',
      content: 'ADMIN_ROLES.EXPLANATION.GROUP_SHARING.CONTENT',
    },
    {
      title: 'ADMIN_ROLES.EXPLANATION.PUBLIC_SHARING.TITLE',
      content: 'ADMIN_ROLES.EXPLANATION.PUBLIC_SHARING.CONTENT',
    },
    {
      title: 'ADMIN_ROLES.EXPLANATION.INDICATOR_SHARING.TITLE',
      content: 'ADMIN_ROLES.EXPLANATION.INDICATOR_SHARING.CONTENT',
      nestedItems: [
        {
          title: 'ADMIN_ROLES.EXPLANATION.INDICATOR_SHARING.SCENARIO_PRIVATE.TITLE',
          content: 'ADMIN_ROLES.EXPLANATION.INDICATOR_SHARING.SCENARIO_PRIVATE.CONTENT',
        },
        {
          title: 'ADMIN_ROLES.EXPLANATION.INDICATOR_SHARING.SCENARIO_PARTIAL.TITLE',
          content: 'ADMIN_ROLES.EXPLANATION.INDICATOR_SHARING.SCENARIO_PARTIAL.CONTENT',
        },
        {
          title: 'ADMIN_ROLES.EXPLANATION.INDICATOR_SHARING.SCENARIO_PUBLIC.TITLE',
          content: 'ADMIN_ROLES.EXPLANATION.INDICATOR_SHARING.SCENARIO_PUBLIC.CONTENT',
        },
      ],
    },
  ];
}
