import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { UserInterfaceComponent } from './user-interface.component';

describe('UserInterfaceComponent', () => {
  let component: UserInterfaceComponent;
  let fixture: ComponentFixture<UserInterfaceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // app-user-login renders the translate pipe, which needs a TranslateStore.
      imports: [UserInterfaceComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(UserInterfaceComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
