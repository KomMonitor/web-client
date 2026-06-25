import { TestBed } from '@angular/core/testing';
import { AdminLoginStateService } from './admin-login-state.service';

describe('AdminLoginStateService', () => {
  let service: AdminLoginStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminLoginStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('holds the admin login state', () => {
    service.adminUserName = 'admin';
    service.adminPassword = 'secret';
    service.adminIsLoggedIn = true;
    expect(service.adminUserName).toBe('admin');
    expect(service.adminPassword).toBe('secret');
    expect(service.adminIsLoggedIn).toBe(true);
  });
});
