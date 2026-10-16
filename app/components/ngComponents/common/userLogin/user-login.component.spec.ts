import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { AccessControlService } from 'services/access-control-service/access-control.service';
import { AuthService } from 'services/auth-service/auth.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';

import { UserLoginComponent } from './user-login.component';

/**
 * Guards the login-state handoff between Keycloak, the metadata bootstrap and
 * this component:
 * - The login state comes from AuthService, not from the metadata load, so the
 *   popover is right while the metadata loads, and when the component is
 *   created after the load has finished (map application -> /administration
 *   does not refetch, so no further COMPLETE arrives).
 * - The completion handler used to reset
 *   accessControlService.currentKeycloakLoginRoles, which was correct in the
 *   AngularJS original (it ran *before* the metadata fetch repopulated them)
 *   but is not here: it wiped the roles the fetch had just applied and left
 *   every check*Permission() false — the whole admin area went read-only for a
 *   realm admin.
 * The template is replaced, following the other component specs.
 */

const ADMIN_ROLE = 'kommonitor-creator';

describe('UserLoginComponent', () => {
  let accessControlService: AccessControlService;
  let metadataLoading$: BehaviorSubject<MetadataLoadingState>;

  const createComponent = (): UserLoginComponent => {
    const fixture: ComponentFixture<UserLoginComponent> =
      TestBed.createComponent(UserLoginComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  beforeEach(async () => {
    metadataLoading$ = new BehaviorSubject<MetadataLoadingState>(MetadataLoadingState.INPROGRESS);

    await TestBed.configureTestingModule({
      imports: [UserLoginComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => true,
            getTokenParsed: () => ({ preferred_username: 'someone', email: 'token@example.org' }),
          },
        },
        {
          provide: MetadataBootstrapService,
          useValue: {
            metadataLoading$: metadataLoading$.asObservable(),
            currentKeycloakUser: { username: 'someone', email: 'someone@example.org' },
          },
        },
        {
          provide: EnvConfigService,
          useValue: { enableKeycloakSecurity: true, keycloakKomMonitorAdminRoleName: ADMIN_ROLE },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(UserLoginComponent, { set: { template: '' } })
      .compileComponents();

    accessControlService = TestBed.inject(AccessControlService);
  });

  it('keeps the login roles the metadata fetch applied', () => {
    createComponent();
    accessControlService.currentKeycloakLoginRoles = [ADMIN_ROLE, 'offline_access'];

    metadataLoading$.next(MetadataLoadingState.COMPLETE);

    expect(accessControlService.currentKeycloakLoginRoles).toEqual([ADMIN_ROLE, 'offline_access']);
    expect(accessControlService.checkCreatePermission()).toBe(true);
  });

  it('shows the user from the token while the metadata is still loading', () => {
    const component = createComponent();

    expect(component.authenticated).toBe(true);
    expect(component.currentKeycloakUser).toEqual(
      expect.objectContaining({ username: 'someone', email: 'token@example.org' })
    );
  });

  it('replaces the token user with the loaded profile on metadata completion', () => {
    const component = createComponent();

    metadataLoading$.next(MetadataLoadingState.COMPLETE);

    expect(component.currentKeycloakUser).toEqual({
      username: 'someone',
      email: 'someone@example.org',
    });
  });

  it('applies profile and roles when created after the metadata load completed', () => {
    accessControlService.currentKomMonitorLoginRoleNames = ['org-a.unit-resources-creator'];
    metadataLoading$.next(MetadataLoadingState.COMPLETE);

    const component = createComponent();

    expect(component.authenticated).toBe(true);
    expect(component.currentKeycloakUser.email).toBe('someone@example.org');
    expect(component.userRoleInformation).toEqual({ 'org-a': ['unit-resources-creator'] });
  });

  it('splits organization roles at the last dot and lists the admin role on its own', () => {
    accessControlService.currentKomMonitorLoginRoleNames = [
      ADMIN_ROLE,
      'Amt 61.2.unit-resources-creator',
      'Amt 61.2.client-users-creator',
    ];
    const component = createComponent();

    metadataLoading$.next(MetadataLoadingState.COMPLETE);

    expect(component.userRoleInformation).toEqual({
      [ADMIN_ROLE]: [],
      'Amt 61.2': ['unit-resources-creator', 'client-users-creator'],
    });
  });
});

describe('AccessControlService.applyLoginStateFromToken', () => {
  let service: AccessControlService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EnvConfigService,
          useValue: { keycloakKomMonitorAdminRoleName: ADMIN_ROLE },
        },
      ],
    });
    service = TestBed.inject(AccessControlService);
  });

  it('clears the admin flag together with the roles', () => {
    service.applyLoginStateFromToken({ realm_access: { roles: [ADMIN_ROLE] } });
    expect(service.isRealmAdmin).toBe(true);

    service.applyLoginStateFromToken(undefined);

    expect(service.currentKeycloakLoginRoles).toEqual([]);
    expect(service.isRealmAdmin).toBe(false);
    expect(service.checkAdminPermission()).toBe(false);
  });
});
