import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IndicatorAddFormStateService } from '../indicator-add-form-state.service';
import { RoleManagementGridComponent } from '../../../adminShared/roleManagementPanel/role-management-grid.component';

@Component({
  selector: 'app-indicator-add-step7-access',
  templateUrl: './indicator-add-step7-access.component.html',
  styleUrls: ['../indicator-add-form.shared.scss', './indicator-add-step7-access.component.scss'],
  imports: [
    TranslateModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RoleManagementGridComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorAddStep7AccessComponent implements AfterViewInit, OnDestroy {
  protected state = inject(IndicatorAddFormStateService);

  @ViewChild(RoleManagementGridComponent) roleGrid?: RoleManagementGridComponent;

  // The wizard creates/destroys the step components while navigating, so the
  // grid registers with the shared form-state service: on attach it is seeded
  // with the harvested selection, on destroy the selection is harvested back.
  ngAfterViewInit(): void {
    if (this.roleGrid) {
      this.state.attachRoleGrid(this.roleGrid);
    }
  }

  ngOnDestroy(): void {
    if (this.roleGrid) {
      this.state.detachRoleGrid(this.roleGrid);
    }
  }
}
