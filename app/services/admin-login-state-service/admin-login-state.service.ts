import { Injectable } from '@angular/core';

/**
 * Holds the legacy admin (basic-auth) login state shared between the user-login
 * component, the user-interface shell and the admin route guard: the entered
 * credentials and whether an admin is currently logged in. Extracted from
 * DataExchangeService (Prio 7 god-service split, B-Rest cluster "admin login").
 */
@Injectable({
  providedIn: 'root',
})
export class AdminLoginStateService {
  adminUserName: any;
  adminPassword: any;
  adminIsLoggedIn: any;
}
