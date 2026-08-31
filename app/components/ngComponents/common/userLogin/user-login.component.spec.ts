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
 * Guards the login-state handoff between the metadata bootstrap and this
 * component. checkAuthentication() used to reset
 * accessControlService.currentKeycloakLoginRoles, which was correct in the
 * AngularJS original (it ran *before* the metadata fetch repopulated them) but
 * is not here: this component reacts to metadata loading COMPLETE, so the reset
 * wiped the roles the fetch had just applied and left every check*Permission()
 * false — the whole admin area went read-only for a realm admin.
 * The template is replaced, following the other component specs.
 */

const ADMIN_ROLE = 'kommonitor-creator';

describe('UserLoginComponent', () => {
  let component: UserLoginComponent;
  let fixture: ComponentFixture<UserLoginComponent>;
  let accessControlService: AccessControlService;
  let metadataLoading$: BehaviorSubject<MetadataLoadingState>;

  beforeEach(async () => {
    metadataLoading$ = new BehaviorSubject<MetadataLoadingState>(MetadataLoadingState.INPROGRESS);

    await TestBed.configureTestingModule({
      imports: [UserLoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: () => true } },
        {
          provide: MetadataBootstrapService,
          useValue: {
            metadataLoading$: metadataLoading$.asObservable(),
            currentKeycloakUser: { email: 'someone@example.org' },
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
    fixture = TestBed.createComponent(UserLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps the login roles the metadata fetch applied', () => {
    accessControlService.currentKeycloakLoginRoles = [ADMIN_ROLE, 'offline_access'];

    metadataLoading$.next(MetadataLoadingState.COMPLETE);

    expect(accessControlService.currentKeycloakLoginRoles).toEqual([ADMIN_ROLE, 'offline_access']);
    expect(accessControlService.checkCreatePermission()).toBe(true);
  });

  it('picks up the authentication state on metadata completion', () => {
    metadataLoading$.next(MetadataLoadingState.COMPLETE);

    expect(component.authenticated).toBe(true);
    expect(component.currentKeycloakUser).toEqual({ email: 'someone@example.org' });
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
