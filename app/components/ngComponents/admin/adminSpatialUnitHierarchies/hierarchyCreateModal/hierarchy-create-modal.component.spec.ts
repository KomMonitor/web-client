import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { AccessControlService } from 'services/access-control-service/access-control.service';

import { levelFixture } from '../hierarchy.fixture';
import { HierarchyCreateModalComponent } from './hierarchy-create-modal.component';

/**
 * The levels the page hands in — across all tenants, as the dialog gets them.
 * A local fixture on purpose: these tests are about the dialog, not about which
 * levels the instance happens to carry.
 *
 * Two tenants' worth, because the dialog offers only those of the tenant its
 * form names. `OWN_*` belongs to the tenant the user is in, which is the one
 * preselected when the caller names none.
 */
const OWN_NAMES = ['Kreis RE', 'Städte Kreis RE', 'Stadtteile Kreis RE', 'Quartiere Kreis RE'];
const OTHER_NAMES = ['Stadtbezirke Essen', 'Stadtteile Essen'];
const OWN_LEVELS = OWN_NAMES.map((name) => levelFixture(name, 'Kreis Recklinghausen'));
const OTHER_LEVELS = OTHER_NAMES.map((name) => levelFixture(name, 'Stadt Essen'));
const LEVELS = [...OWN_LEVELS, ...OTHER_LEVELS];

/** Two tenants, so the tenant field can be exercised as a select. */
const MANDANTS = [
  { organizationalUnitId: 'ou-1', name: 'Stadt Essen', mandant: true },
  { organizationalUnitId: 'ou-2', name: 'Kreis Recklinghausen', mandant: true },
  { organizationalUnitId: 'ou-3', name: 'Umweltamt', mandant: false },
];

describe('HierarchyCreateModalComponent', () => {
  let fixture: ComponentFixture<HierarchyCreateModalComponent>;
  let component: HierarchyCreateModalComponent;
  let activeModal: NgbActiveModal;

  /** Applies the inputs ng-bootstrap would set, then runs the first change detection. */
  function render(inputs: Partial<HierarchyCreateModalComponent> = {}): void {
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

  /** The ids the level select offers. */
  function optionIds(): string[] {
    return fixture.debugElement
      .queryAll(By.css('.chain-add option'))
      .map((el) => el.nativeElement.value);
  }

  function configure(accessControl: unknown[], ownUnits: unknown[] = []): void {
    TestBed.configureTestingModule({
      imports: [HierarchyCreateModalComponent, TranslateModule.forRoot()],
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
    fixture = TestBed.createComponent(HierarchyCreateModalComponent);
    component = fixture.componentInstance;
    activeModal = TestBed.inject(NgbActiveModal);
  }

  describe('with the tenant left to choose', () => {
    beforeEach(() => {
      configure(MANDANTS, [MANDANTS[1]]);
      render({ existingNames: ['Verwaltungsgliederung'] });
    });

    it('requires a name, but no chain', () => {
      expect(component.form.controls.name.invalid).toBe(true);
      expect(submitButton().disabled).toBe(true);

      component.form.controls.name.setValue('Sozialraum-Gliederung');
      fixture.detectChanges();

      // The API takes a hierarchy without members, so the metadata is enough —
      // the levels can be hung in on the page afterwards.
      expect(submitButton().disabled).toBe(false);
    });

    it('closes with an empty chain where none was assembled', () => {
      const close = jest.spyOn(activeModal, 'close');
      component.form.controls.name.setValue('Sozialraum-Gliederung');

      component.submit();

      expect(close.mock.calls[0][0]).toMatchObject({ name: 'Sozialraum-Gliederung', levels: [] });
    });

    it('rejects a name that is already taken, ignoring case and padding', () => {
      component.form.controls.name.setValue('  verwaltungsgliederung ');

      expect(component.form.controls.name.hasError('uniqueName')).toBe(true);
    });

    it('preselects the tenant the user belongs to', () => {
      expect(component.mandants).toEqual(['Stadt Essen', 'Kreis Recklinghausen']);
      expect(component.form.controls.mandant.value).toBe('Kreis Recklinghausen');
    });

    it('offers only the levels of the tenant the form names', () => {
      // A hierarchy may hold levels of its own tenant alone; the API answers
      // 400 for anything else, so the other tenant's levels are not on offer.
      expect(optionIds()).toEqual(OWN_LEVELS.map((level) => level.id));
      expect(optionIds()).not.toContain(OTHER_LEVELS[0].id);
    });

    it('empties the chain when the tenant changes, and offers the new one instead', () => {
      addLevelButton().click();
      fixture.detectChanges();
      expect(chainNames()).toEqual([OWN_NAMES[0]]);

      component.form.controls.mandant.setValue('Stadt Essen');
      fixture.detectChanges();

      // The levels picked so far belong to the tenant that was left behind.
      expect(chainNames()).toEqual([]);
      expect(optionIds()).toEqual(OTHER_LEVELS.map((level) => level.id));
      expect(submitButton().disabled).toBe(true);
    });

    it('appends picked levels to the chain and drops them from the options', () => {
      addLevelButton().click();
      addLevelButton().click();
      fixture.detectChanges();

      expect(chainNames()).toEqual([OWN_NAMES[0], OWN_NAMES[1]]);
      expect(component.levels()).toEqual([
        { id: OWN_LEVELS[0].id, name: OWN_LEVELS[0].name },
        { id: OWN_LEVELS[1].id, name: OWN_LEVELS[1].name },
      ]);

      const options = fixture.debugElement
        .queryAll(By.css('.chain-add option'))
        .map((el) => el.nativeElement.value);
      expect(options).not.toContain(OWN_LEVELS[0].id);
      expect(options).toHaveLength(OWN_LEVELS.length - 2);
    });

    it('removes a level from the chain again', () => {
      addLevelButton().click();
      addLevelButton().click();
      fixture.detectChanges();

      fixture.debugElement.queryAll(By.css('.chain-remove'))[0].nativeElement.click();
      fixture.detectChanges();

      expect(chainNames()).toEqual([OWN_NAMES[1]]);
    });

    it('marks the levels other hierarchies already use', () => {
      Object.assign(component, { levelUsage: { [OWN_LEVELS[0].id]: 2 } });
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
      component.form.controls.isPublic.setValue(true);
      addLevelButton().click();
      fixture.detectChanges();

      component.submit();

      expect(close).toHaveBeenCalledWith({
        name: 'Sozialraum-Gliederung',
        mandant: 'Kreis Recklinghausen',
        isPublic: true,
        levels: [{ id: OWN_LEVELS[0].id, name: OWN_LEVELS[0].name }],
      });
    });

    it('starts out non-public', () => {
      const close = jest.spyOn(activeModal, 'close');
      component.form.controls.name.setValue('Sozialraum-Gliederung');
      addLevelButton().click();
      fixture.detectChanges();

      component.submit();

      expect(close.mock.calls[0][0]).toMatchObject({ isPublic: false });
    });

    it('does not close while the name is missing', () => {
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

  describe('with a tenant given', () => {
    beforeEach(() => {
      // The user's own tenant is Kreis Recklinghausen, the caller names another
      // one: the dialog was opened from the view of that other tenant.
      configure(MANDANTS, [MANDANTS[1]]);
      render({ presetMandant: 'Stadt Essen' });
    });

    it('shows the given tenant but does not let it be changed', () => {
      const field = fixture.debugElement.query(By.css('#hierarchy-mandant-input'));
      expect(field.nativeElement.tagName).toBe('INPUT');
      expect(field.nativeElement.disabled).toBe(true);
      expect(field.nativeElement.value).toBe('Stadt Essen');
    });

    it("builds the chain from that tenant's levels", () => {
      expect(component.form.controls.mandant.value).toBe('Stadt Essen');
      expect(optionIds()).toEqual(OTHER_LEVELS.map((level) => level.id));
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

      // Nothing to pick still leaves a hierarchy worth creating: it takes its
      // levels once they are registered.
      component.form.controls.name.setValue('Sozialraum-Gliederung');
      fixture.detectChanges();
      expect(submitButton().disabled).toBe(false);
    });
  });

  describe('without tenants', () => {
    beforeEach(() => {
      configure([]);
      render();
    });

    it('still offers every level where no tenant narrows the choice', () => {
      // Without Keycloak the instance knows no tenants, so the tenant of the
      // form is empty — the filter must not turn that into an empty list.
      expect(optionIds()).toEqual(LEVELS.map((level) => level.id));
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

  /** The green confirm button of the footer. */
  function submitButton(): HTMLButtonElement {
    return fixture.debugElement.query(By.css('.modal-footer .btn-success')).nativeElement;
  }
});
