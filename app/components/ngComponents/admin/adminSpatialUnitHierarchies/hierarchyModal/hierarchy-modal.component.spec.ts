import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { AccessControlService } from 'services/access-control-service/access-control.service';

import { HierarchyModalComponent } from './hierarchy-modal.component';

/**
 * The registry the page hands in. A local fixture on purpose: these tests are
 * about the dialog, not about which levels the demo seed happens to carry.
 */
const LEVELS = ['Stadt Essen', 'Stadtbezirke Essen', 'Stadtteile Essen', 'Quartiere Essen'];

/** Two tenants, so the tenant field can be exercised as a select. */
const MANDANTS = [
  { organizationalUnitId: 'ou-1', name: 'Stadt Essen', mandant: true },
  { organizationalUnitId: 'ou-2', name: 'Kreis Recklinghausen', mandant: true },
  { organizationalUnitId: 'ou-3', name: 'Umweltamt', mandant: false },
];

describe('HierarchyModalComponent', () => {
  let fixture: ComponentFixture<HierarchyModalComponent>;
  let component: HierarchyModalComponent;
  let activeModal: NgbActiveModal;

  /** Applies the inputs ng-bootstrap would set, then runs the first change detection. */
  function render(inputs: Partial<HierarchyModalComponent> = {}): void {
    Object.assign(component, { registeredLevels: LEVELS, ...inputs });
    fixture.detectChanges();
  }

  /** The level names of the chain rows, top to bottom. */
  function chainNames(): string[] {
    return fixture.debugElement
      .queryAll(By.css('.chain-name'))
      .map((el) => el.nativeElement.textContent.trim());
  }

  function addLevelButton(): HTMLButtonElement {
    return fixture.debugElement.query(By.css('.chain-add .btn')).nativeElement;
  }

  function configure(accessControl: unknown[], ownUnits: unknown[] = []): void {
    TestBed.configureTestingModule({
      imports: [HierarchyModalComponent, TranslateModule.forRoot()],
      providers: [
        provideNoopAnimations(),
        NgbActiveModal,
        {
          provide: AccessControlService,
          useValue: {
            accessControl,
            currentKomMonitorLoginOrganizationalUnits: ownUnits,
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(HierarchyModalComponent);
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);
  }

  describe('create mode', () => {
    beforeEach(() => {
      configure(MANDANTS, [MANDANTS[1]]);
      render({ existingNames: ['Verwaltungsgliederung'] });
    });

    it('requires a name and a chain', () => {
      expect(component.form.controls.name.invalid).toBe(true);

      component.form.controls.name.setValue('Sozialraum-Gliederung');
      fixture.detectChanges();

      // The metadata is complete, but an empty chain still blocks the submit.
      expect(component.form.valid).toBe(true);
      expect(submitButton().disabled).toBe(true);

      addLevelButton().click();
      fixture.detectChanges();

      expect(submitButton().disabled).toBe(false);
    });

    it('rejects a name that is already taken, ignoring case and padding', () => {
      component.form.controls.name.setValue('  verwaltungsgliederung ');

      expect(component.form.controls.name.hasError('uniqueName')).toBe(true);
    });

    it('preselects the tenant the user belongs to', () => {
      expect(component.mandants).toEqual(['Stadt Essen', 'Kreis Recklinghausen']);
      expect(component.form.controls.mandant.value).toBe('Kreis Recklinghausen');
    });

    it('appends picked levels to the chain and drops them from the options', () => {
      addLevelButton().click();
      addLevelButton().click();
      fixture.detectChanges();

      expect(chainNames()).toEqual([LEVELS[0], LEVELS[1]]);
      expect(component.levels()).toEqual([LEVELS[0], LEVELS[1]]);

      const options = fixture.debugElement
        .queryAll(By.css('.chain-add option'))
        .map((el) => el.nativeElement.value);
      expect(options).not.toContain(LEVELS[0]);
      expect(options).toHaveLength(LEVELS.length - 2);
    });

    it('removes a level from the chain again', () => {
      addLevelButton().click();
      addLevelButton().click();
      fixture.detectChanges();

      fixture.debugElement.queryAll(By.css('.chain-remove'))[0].nativeElement.click();
      fixture.detectChanges();

      expect(chainNames()).toEqual([LEVELS[1]]);
    });

    it('marks the levels other hierarchies already use', () => {
      Object.assign(component, { levelUsage: { [LEVELS[0]]: 2 } });
      addLevelButton().click();
      fixture.detectChanges();

      const badges = fixture.debugElement.queryAll(By.css('.chain-usage'));
      expect(badges).toHaveLength(1);
      // No translations are loaded in the test, so the pipe echoes the key back.
      expect(badges[0].nativeElement.textContent).toContain('USED_MANY');
    });

    it('closes with the trimmed metadata and the assembled chain', () => {
      const close = jest.spyOn(activeModal, 'close');
      component.form.controls.name.setValue('  Sozialraum-Gliederung  ');
      component.form.controls.description.setValue('  Für die Sozialberichterstattung.  ');
      addLevelButton().click();
      fixture.detectChanges();

      component.submit();

      expect(close).toHaveBeenCalledWith({
        name: 'Sozialraum-Gliederung',
        description: 'Für die Sozialberichterstattung.',
        mandant: 'Kreis Recklinghausen',
        levels: [LEVELS[0]],
      });
    });

    it('treats the description as optional', () => {
      const close = jest.spyOn(activeModal, 'close');
      component.form.controls.name.setValue('Sozialraum-Gliederung');
      addLevelButton().click();
      fixture.detectChanges();

      component.submit();

      expect(close.mock.calls[0][0]).toMatchObject({ description: '' });
    });

    it('does not close while name or chain are missing', () => {
      const close = jest.spyOn(activeModal, 'close');

      component.submit();

      expect(close).not.toHaveBeenCalled();
      expect(component.form.controls.name.touched).toBe(true);
    });

    it('dismisses on cancel', () => {
      const dismiss = jest.spyOn(activeModal, 'dismiss');

      component.cancel();

      expect(dismiss).toHaveBeenCalledWith('cancel');
    });
  });

  describe('without registered levels', () => {
    beforeEach(() => {
      configure(MANDANTS, [MANDANTS[0]]);
    });

    it('offers no chain at all and keeps the submit disabled', () => {
      render({ registeredLevels: [] });

      expect(fixture.debugElement.query(By.css('.chain-empty'))).not.toBeNull();
      expect(fixture.debugElement.query(By.css('.chain-add'))).toBeNull();
      expect(submitButton().disabled).toBe(true);
    });
  });

  describe('without tenants', () => {
    beforeEach(() => {
      configure([]);
      render();
    });

    it('does not block the submit on a tenant nobody can pick', () => {
      component.form.controls.name.setValue('Sozialraum-Gliederung');
      fixture.detectChanges();
      addLevelButton().click();
      fixture.detectChanges();

      expect(component.form.controls.mandant.value).toBe('');
      expect(submitButton().disabled).toBe(false);
    });
  });

  describe('edit mode', () => {
    beforeEach(() => {
      configure(MANDANTS);
      render({
        mode: 'edit',
        existingNames: ['Verwaltungsgliederung', 'Schulplanung'],
        currentName: 'Verwaltungsgliederung',
        currentDescription: 'Amtliche Gliederung.',
        currentMandant: 'Stadt Essen',
      });
    });

    it('prefills the metadata and accepts it unchanged', () => {
      expect(component.form.controls.name.value).toBe('Verwaltungsgliederung');
      expect(component.form.controls.description.value).toBe('Amtliche Gliederung.');
      expect(component.form.controls.mandant.value).toBe('Stadt Essen');
      expect(submitButton().disabled).toBe(false);
    });

    it('leaves the chain out of it entirely', () => {
      expect(fixture.debugElement.query(By.css('.chain-panel'))).toBeNull();
    });

    it('still rejects the name of another hierarchy', () => {
      component.form.controls.name.setValue('Schulplanung');

      expect(component.form.controls.name.hasError('uniqueName')).toBe(true);
    });

    it('closes with the metadata alone', () => {
      const close = jest.spyOn(activeModal, 'close');
      component.form.controls.name.setValue('Verwaltung');
      component.form.controls.description.setValue('Neue Beschreibung.');

      component.submit();

      expect(close).toHaveBeenCalledWith({
        name: 'Verwaltung',
        description: 'Neue Beschreibung.',
        mandant: 'Stadt Essen',
      });
    });
  });

  /** The green confirm button of the footer. */
  function submitButton(): HTMLButtonElement {
    return fixture.debugElement.query(By.css('.modal-footer .btn-success')).nativeElement;
  }
});
