import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { NotificationService } from '../../common/notification/notification.service';
import { AdminSpatialUnitHierarchiesComponent } from './admin-spatial-unit-hierarchies.component';

describe('AdminSpatialUnitHierarchiesComponent', () => {
  let component: AdminSpatialUnitHierarchiesComponent;
  let fixture: ComponentFixture<AdminSpatialUnitHierarchiesComponent>;
  let notificationService: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminSpatialUnitHierarchiesComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(AdminSpatialUnitHierarchiesComponent);
    component = fixture.componentInstance;
    notificationService = TestBed.inject(NotificationService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders one collapsible section per demo hierarchy', () => {
    fixture.detectChanges();

    const titles = fixture.debugElement
      .queryAll(By.css('app-collapsible-section .section-title'))
      .map((el) => el.nativeElement.textContent.trim());

    expect(titles).toEqual(['Verwaltungsgliederung', 'Sozialraum-Gliederung']);
  });

  it('starts with only the first hierarchy expanded', () => {
    fixture.detectChanges();

    const expanded = fixture.debugElement
      .queryAll(By.css('app-collapsible-section .section-toggle'))
      .map((el) => el.nativeElement.getAttribute('aria-expanded'));

    expect(expanded).toEqual(['true', 'false']);
  });

  it('writes the toggled state back into the hierarchy signal', () => {
    fixture.detectChanges();

    fixture.debugElement
      .queryAll(By.css('app-collapsible-section .section-toggle'))[0]
      .nativeElement.click();
    fixture.detectChanges();

    expect(component.hierarchies[0].open()).toBe(false);
  });

  it('only shows the id chips once the toggle is on', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.section-id')).length).toBe(0);

    component.showIds.set(true);
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.section-id')).length).toBe(2);
  });

  it('notifies when a projected header action is clicked', () => {
    const show = jest.spyOn(notificationService, 'show');
    fixture.detectChanges();

    const actions = fixture.debugElement.queryAll(By.css('.section-actions button'));
    expect(actions.length).toBe(4);
    expect(actions.every((el) => el.nativeElement.disabled)).toBe(false);

    actions[0].nativeElement.click();

    expect(show).toHaveBeenCalledTimes(1);
    // No translations are loaded in the test, so the pipe echoes the key back.
    expect(show.mock.calls[0][0]).toContain('ACTION_CLICKED');
  });
});
