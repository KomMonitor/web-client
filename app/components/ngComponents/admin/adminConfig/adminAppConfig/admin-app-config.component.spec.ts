import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';

import { AdminAppConfigComponent } from './admin-app-config.component';

describe('AdminAppConfigComponent', () => {
  let component: AdminAppConfigComponent;
  let fixture: ComponentFixture<AdminAppConfigComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminAppConfigComponent, TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(AdminAppConfigComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('CodeMirror host elements', () => {
    // The editors used to be looked up with document.getElementById, which also
    // matched the identically-named elements of the controls-config twin. These
    // are now view queries — but the component's content sits in an
    // <ng-template> that admin-content-view renders through an outlet, so the
    // refs only resolve after the first change detection (never with
    // { static: true }). That is exactly what these tests pin down.
    it('does not resolve the refs before the first change detection', () => {
      expect(component.appConfigEditor).toBeUndefined();
      expect(component.templateCodeMirrorElement).toBeUndefined();
      expect(component.currentCodeMirrorElement).toBeUndefined();
      expect(component.newCodeMirrorElement).toBeUndefined();
    });

    it('resolves all four refs after rendering', () => {
      fixture.detectChanges();

      expect(component.appConfigEditor?.nativeElement?.tagName).toBe('TEXTAREA');
      expect(component.templateCodeMirrorElement?.nativeElement?.id).toBe('templateCodeMirror');
      expect(component.currentCodeMirrorElement?.nativeElement?.id).toBe('currentCodeMirror');
      expect(component.newCodeMirrorElement?.nativeElement?.id).toBe('newCodeMirror');
    });

    it('bails out of initCodeEditor instead of throwing when the view is not rendered yet', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      expect(() => component.initCodeEditor()).not.toThrow();
      expect(consoleError).toHaveBeenCalledWith('Could not find appConfigEditor element');
    });
  });

  afterEach(() => {
    // init() fires the template fetch from ngOnInit; drain it so the mock is clean
    httpMock.match('./config/env_backup.js').forEach((request) => request.flush(''));
  });
});
