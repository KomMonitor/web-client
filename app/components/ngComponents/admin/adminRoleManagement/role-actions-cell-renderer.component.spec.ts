import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';

import {
  RoleActionsCellRendererComponent,
  RoleActionsCellRendererParams,
} from './role-actions-cell-renderer.component';

const GROUP: AccessControlMetadata = {
  organizationalUnitId: 'ou-1',
  name: 'Umweltamt',
  permissions: [],
};

describe('RoleActionsCellRendererComponent', () => {
  let fixture: ComponentFixture<RoleActionsCellRendererComponent>;
  let calls: {
    editMetadata: jest.Mock;
    editRights: jest.Mock;
    delete: jest.Mock;
    datasetPermissions: jest.Mock;
  };

  function params(
    canManage: boolean,
    data = GROUP,
    canEditDatasetPermissions = false
  ): RoleActionsCellRendererParams {
    return {
      data,
      onEditMetadata: calls.editMetadata,
      onEditGroupRights: calls.editRights,
      onDelete: calls.delete,
      onEditDatasetPermissions: calls.datasetPermissions,
      canManage: () => canManage,
      canEditDatasetPermissions: () => canEditDatasetPermissions,
    } as never;
  }

  function buttons(): HTMLButtonElement[] {
    return fixture.debugElement.queryAll(By.css('button')).map((el) => el.nativeElement);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RoleActionsCellRendererComponent, TranslateModule.forRoot()],
    });
    fixture = TestBed.createComponent(RoleActionsCellRendererComponent);
    calls = {
      editMetadata: jest.fn(),
      editRights: jest.fn(),
      delete: jest.fn(),
      datasetPermissions: jest.fn(),
    };
  });

  it('rests all three actions on a group the user may not manage, and says why', () => {
    fixture.componentInstance.agInit(params(false));
    fixture.detectChanges();

    expect(buttons()).toHaveLength(3);
    for (const button of buttons()) {
      expect(button.disabled).toBe(true);
      expect(button.title).toContain('FORBIDDEN_TITLE');
    }
  });

  it('offers all three on a group the user may manage', () => {
    fixture.componentInstance.agInit(params(true));
    fixture.detectChanges();

    expect(buttons().every((button) => !button.disabled)).toBe(true);
    expect(buttons().map((button) => button.title)).toEqual([
      'ADMIN_SHARED_UI.GRID.EDIT_METADATA_TITLE',
      'ADMIN_ROLES.GRID.EDIT_GROUP_RIGHTS_TITLE',
      'ADMIN_ROLES.GRID.DELETE_TITLE',
    ]);

    buttons().forEach((button) => button.click());
    expect(calls.editMetadata).toHaveBeenCalledWith(GROUP);
    expect(calls.editRights).toHaveBeenCalledWith(GROUP);
    expect(calls.delete).toHaveBeenCalledWith(GROUP);
  });

  it('follows the row when ag-Grid reuses the cell', () => {
    fixture.componentInstance.agInit(params(true));
    fixture.detectChanges();

    fixture.componentInstance.refresh(params(false, { ...GROUP, name: 'Bauamt' }));
    fixture.detectChanges();

    expect(buttons().every((button) => button.disabled)).toBe(true);
  });

  it('leaves the dataset permissions button out for users without the right', () => {
    fixture.componentInstance.agInit(params(true, GROUP, false));
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.fa-database'))).toBeNull();
  });

  it('offers the dataset permissions button between group rights and delete', () => {
    fixture.componentInstance.agInit(params(true, GROUP, true));
    fixture.detectChanges();

    expect(buttons().map((button) => button.title)).toEqual([
      'ADMIN_SHARED_UI.GRID.EDIT_METADATA_TITLE',
      'ADMIN_ROLES.GRID.EDIT_GROUP_RIGHTS_TITLE',
      'ADMIN_DATASET_PERMISSIONS.BUTTON_TITLE',
      'ADMIN_ROLES.GRID.DELETE_TITLE',
    ]);

    buttons()[2].click();
    expect(calls.datasetPermissions).toHaveBeenCalledWith(GROUP);
  });

  it('shows the dataset permissions button even where the group cannot be managed', () => {
    fixture.componentInstance.agInit(params(false, GROUP, true));
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('.fa-database')).parent!.nativeElement;
    expect(button.disabled).toBe(false);
  });
});
