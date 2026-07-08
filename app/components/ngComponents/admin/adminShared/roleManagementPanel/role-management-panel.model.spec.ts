import {
  collectCreatorRightOrganizations,
  collectSelectedRoleIds,
  ownerDefaultPermissionIds,
} from './role-management-panel.model';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';

function unit(
  id: string,
  name: string,
  children: string[] = [],
  permissions: AccessControlMetadata['permissions'] = []
): AccessControlMetadata {
  return { organizationalUnitId: id, name, children, permissions };
}

describe('role-management-panel.model', () => {
  describe('collectCreatorRightOrganizations', () => {
    const accessControl: AccessControlMetadata[] = [
      unit('1', 'stadt', ['2', '3']),
      unit('2', 'amt-a'),
      unit('3', 'amt-b', ['4']),
      unit('4', 'referat'),
      unit('5', 'andere'),
    ];

    it('returns units with unit-resources-creator rights', () => {
      const result = collectCreatorRightOrganizations(
        ['amt-a.unit-resources-creator'],
        accessControl
      );
      expect(result.map((r) => r.name)).toEqual(['amt-a']);
    });

    it('expands client-resources-creator to the whole child subtree', () => {
      const result = collectCreatorRightOrganizations(
        ['stadt.client-resources-creator'],
        accessControl
      );
      expect(result.map((r) => r.name).sort()).toEqual(['amt-a', 'amt-b', 'referat']);
    });

    it('does not loop on cyclic organisation hierarchies', () => {
      const cyclic: AccessControlMetadata[] = [unit('1', 'a', ['2']), unit('2', 'b', ['1'])];
      const result = collectCreatorRightOrganizations(['a.client-resources-creator'], cyclic);
      expect(result.map((r) => r.name).sort()).toEqual(['a', 'b']);
    });

    it('returns an empty list without roles or access control', () => {
      expect(collectCreatorRightOrganizations([], accessControl)).toEqual([]);
      expect(collectCreatorRightOrganizations(['stadt.client-resources-creator'], [])).toEqual([]);
    });
  });

  describe('ownerDefaultPermissionIds', () => {
    const accessControl: AccessControlMetadata[] = [
      unit(
        '1',
        'stadt',
        [],
        [
          { permissionId: 'p-view', permissionLevel: 'viewer' },
          { permissionId: 'p-edit', permissionLevel: 'editor' },
          { permissionId: 'p-create', permissionLevel: 'creator' },
        ]
      ),
    ];

    it('returns viewer and editor permission ids of the unit', () => {
      expect(ownerDefaultPermissionIds(accessControl, '1').sort()).toEqual(['p-edit', 'p-view']);
    });

    it('returns an empty list for unknown units', () => {
      expect(ownerDefaultPermissionIds(accessControl, 'nope')).toEqual([]);
    });
  });

  describe('collectSelectedRoleIds', () => {
    it('collects checked permission ids without duplicates', () => {
      const rows: AccessControlMetadata[] = [
        unit(
          '1',
          'a',
          [],
          [
            { permissionId: 'p1', permissionLevel: 'viewer', isChecked: true },
            { permissionId: 'p2', permissionLevel: 'editor', isChecked: false },
          ]
        ),
        unit('2', 'b', [], [{ permissionId: 'p1', permissionLevel: 'viewer', isChecked: true }]),
      ];
      expect(collectSelectedRoleIds(rows)).toEqual(['p1']);
    });

    it('tolerates rows without permissions', () => {
      expect(
        collectSelectedRoleIds([{ organizationalUnitId: '1', name: 'x' } as AccessControlMetadata])
      ).toEqual([]);
    });
  });
});
