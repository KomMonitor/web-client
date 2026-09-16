import { DebugElement, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { NotificationService } from '../../common/notification/notification.service';
import { AdminSpatialUnitHierarchiesComponent } from './admin-spatial-unit-hierarchies.component';
import { createDemoHierarchies } from './hierarchy-demo.data';
import { HierarchyStoreService } from './hierarchy-store.service';
import { UnassignedLevelsPanelComponent } from './unassignedLevelsPanel/unassigned-levels-panel.component';
import { chainPosition } from './hierarchy.model';

/**
 * What the page itself does: render the tree, drive the dialogs, and say what
 * happened. A test belongs here when it asserts on the rendered page, on what a
 * dialog was handed, or on what the user was told.
 *
 * The state behind it lives in `HierarchyStoreService` and is tested there,
 * without a fixture — as are the pure functions under it, in `hierarchy.model`
 * and `hierarchy-selectors`.
 */

/** The remove button of the row at `rowIndex`. */
function removeButton(fixture: ComponentFixture<unknown>, rowIndex: number): HTMLButtonElement {
  const row = fixture.debugElement.queryAll(By.css('.tree-row'))[rowIndex];
  return row.query(By.css('.btn-outline-danger')).nativeElement;
}

/** The level names of the rendered chain, coarsest first. */
function levelNames(fixture: ComponentFixture<unknown>): string[] {
  return fixture.debugElement
    .queryAll(By.css('.level-name'))
    .map((el) => el.nativeElement.textContent.trim());
}

/** The up/down button of the row at `rowIndex` (0-based across all rendered rows). */
function moveButton(
  fixture: ComponentFixture<unknown>,
  rowIndex: number,
  direction: 'up' | 'down'
): HTMLButtonElement {
  const row = fixture.debugElement.queryAll(By.css('.tree-row'))[rowIndex];
  const buttons = row.queryAll(By.css('.level-move'));
  return buttons[direction === 'up' ? 0 : 1].nativeElement;
}

describe('AdminSpatialUnitHierarchiesComponent', () => {
  let component: AdminSpatialUnitHierarchiesComponent;
  let fixture: ComponentFixture<AdminSpatialUnitHierarchiesComponent>;
  let store: HierarchyStoreService;
  let notificationService: NotificationService;
  let modalService: NgbModal;

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
    // The store is provided by the component, so it comes out of its own
    // injector rather than the TestBed root.
    store = fixture.debugElement.injector.get(HierarchyStoreService);
    notificationService = TestBed.inject(NotificationService);
    modalService = TestBed.inject(NgbModal);

    // The seed data spans several tenants for the tenant panel; every test
    // about a single chain works on the first hierarchy alone. The panel's own
    // tests put the full seed back.
    store.hierarchies.update((entries) => entries.slice(0, 1));
    // Its tenant, not the overview: across all tenants the page shows the
    // overview table instead of the hierarchies. The tenant tests select again.
    store.selectedMandant.set('Stadt Essen');
  });

  /**
   * Lets a dialog's result reach the page. The handlers await it through
   * `AdminModalService`; a macrotask runs that whole promise chain out, where
   * `whenStable` would depend on how many hops it has.
   */
  const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve));

  /** Stands in for the dialog: it resolves with `result` and records its inputs. */
  function stubModal(result: Promise<unknown>): Record<string, unknown> {
    const componentInstance: Record<string, unknown> = {};
    jest.spyOn(modalService, 'open').mockReturnValue({ componentInstance, result } as never);
    return componentInstance;
  }

  /** The unassigned-levels section; only rendered when there is something in it. */
  function panel(): UnassignedLevelsPanelComponent {
    return fixture.debugElement.query(By.css('app-unassigned-levels-panel')).componentInstance;
  }

  /** The descriptions rendered inside the hierarchy sections. */
  function descriptions(): string[] {
    return fixture.debugElement
      .queryAll(By.css('.hierarchy-description'))
      .map((el) => el.nativeElement.textContent.trim());
  }

  /** The toggle buttons of the rendered hierarchy sections. */
  function sectionToggles(): HTMLButtonElement[] {
    return fixture.debugElement
      .queryAll(By.css('.hierarchy-section .section-toggle'))
      .map((el) => el.nativeElement);
  }

  /** `aria-expanded` of every rendered hierarchy section, in order. */
  function expandedStates(): (string | null)[] {
    return sectionToggles().map((el) => el.getAttribute('aria-expanded'));
  }

  /** The titles of the rendered hierarchy sections. */
  function sectionTitles(): string[] {
    return fixture.debugElement
      .queryAll(By.css('.hierarchy-section .section-title'))
      .map((el) => el.nativeElement.textContent.trim());
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders one collapsible section per demo hierarchy', () => {
    fixture.detectChanges();

    expect(sectionTitles()).toEqual(['Verwaltungsgliederung']);
  });

  it('starts with the hierarchy expanded', () => {
    fixture.detectChanges();

    expect(expandedStates()).toEqual(['true']);
  });

  it('writes the toggled state back into the hierarchy signal', () => {
    fixture.detectChanges();

    sectionToggles()[0].click();
    fixture.detectChanges();

    expect(store.hierarchies()[0].open()).toBe(false);
  });

  it('only shows the id chips once the toggle is on', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.hierarchy-section .section-id')).length).toBe(0);

    component.showIds.set(true);
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.hierarchy-section .section-id')).length).toBe(1);
  });

  it('renders the full level chain of the hierarchy', () => {
    fixture.detectChanges();

    expect(levelNames(fixture)).toEqual([
      'Stadt Essen',
      'Stadtbezirke Essen',
      'Stadtteile Essen',
      'Stadtviertel Essen',
      'Baublöcke Essen',
    ]);
  });

  it('indents the chain one step per level and caps it', () => {
    fixture.detectChanges();

    // Row indent mode: the whole row box moves in, border included.
    const indents = fixture.debugElement
      .queryAll(By.css('.tree-row'))
      .slice(0, 5)
      .map((el) => el.nativeElement.style.marginLeft);

    expect(indents).toEqual(['0px', '20px', '40px', '60px', '80px']);
  });

  it('moves a level one step along the chain', () => {
    fixture.detectChanges();

    const chainNames = () =>
      fixture.debugElement
        .queryAll(By.css('.level-name'))
        .slice(0, 5)
        .map((el) => el.nativeElement.textContent.trim());

    // Second row: push 'Stadtbezirke Essen' down one hierarchy level.
    moveButton(fixture, 1, 'down').click();
    fixture.detectChanges();

    expect(chainNames()).toEqual([
      'Stadt Essen',
      'Stadtteile Essen',
      'Stadtbezirke Essen',
      'Stadtviertel Essen',
      'Baublöcke Essen',
    ]);

    // And back up again.
    moveButton(fixture, 2, 'up').click();
    fixture.detectChanges();

    expect(chainNames()).toEqual([
      'Stadt Essen',
      'Stadtbezirke Essen',
      'Stadtteile Essen',
      'Stadtviertel Essen',
      'Baublöcke Essen',
    ]);
  });

  it('disables the move buttons at the ends of a chain', () => {
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('.tree-row')).slice(0, 5);
    const moveButtons = rows.map((row) =>
      row.queryAll(By.css('.level-move')).map((el) => el.nativeElement.disabled)
    );

    expect(moveButtons[0]).toEqual([true, false]);
    expect(moveButtons[1]).toEqual([false, false]);
    expect(moveButtons[4]).toEqual([false, true]);
  });

  it('removes a level and closes the chain around it', () => {
    const show = jest.spyOn(notificationService, 'show');
    fixture.detectChanges();

    removeButton(fixture, 1).click();
    fixture.detectChanges();

    expect(levelNames(fixture)).toEqual([
      'Stadt Essen',
      'Stadtteile Essen',
      'Stadtviertel Essen',
      'Baublöcke Essen',
    ]);
    expect(show).toHaveBeenCalledTimes(1);
    expect(show.mock.calls[0][0]).toContain('REMOVED');
  });

  it('keeps the last remaining level', () => {
    fixture.detectChanges();

    // Peel the chain down to a single level.
    for (let remaining = 5; remaining > 1; remaining--) {
      removeButton(fixture, 0).click();
      fixture.detectChanges();
    }

    expect(levelNames(fixture)).toEqual(['Baublöcke Essen']);
    expect(removeButton(fixture, 0).disabled).toBe(true);
  });

  it('offers no drag handles, since a chain has no siblings to reorder', () => {
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.tree-drag-handle'))).toHaveLength(0);
  });

  it('offers exactly one insert line per distinct chain position', () => {
    fixture.detectChanges();

    // Five levels means six positions: above each level, plus one at the end.
    // A trailing gap per nesting level would duplicate all but the outermost.
    expect(fixture.debugElement.queryAll(By.css('.tree-insert')).length).toBe(6);
  });

  it('offers the last insert line where it can be reached — after the deepest level', () => {
    fixture.detectChanges();

    const hierarchy = store.hierarchies()[0];
    const lines = fixture.debugElement.queryAll(By.css('.tree-insert'));
    const last = lines[lines.length - 1].nativeElement as HTMLElement;

    // Not inside the folded-away children area of the deepest level: that area
    // has no caret, so a line in there could never be clicked.
    expect(last.closest('.tree-children:not(.show)')).toBeNull();

    last.click();
    fixture.detectChanges();

    expect(chainPosition(hierarchy, hierarchy.openGap()!)).toBe(hierarchy.chain().length);
  });

  it('steps the insert lines in one level at a time, the last one included', () => {
    fixture.detectChanges();

    const indents = fixture.debugElement
      .queryAll(By.css('.tree-insert'))
      .map((line) => (line.nativeElement as HTMLElement).style.marginLeft);

    // One step per level, and the appending line below the deepest level keeps
    // the rhythm instead of repeating its indent.
    expect(indents).toEqual(['0px', '20px', '40px', '60px', '80px', '100px']);
  });

  it('appends a level when the picker is used on the last insert line', () => {
    const show = jest.spyOn(notificationService, 'show');
    fixture.detectChanges();

    const hierarchy = store.hierarchies()[0];
    const lines = fixture.debugElement.queryAll(By.css('.tree-insert'));
    (lines[lines.length - 1].nativeElement as HTMLElement).click();
    fixture.detectChanges();

    const panel = fixture.debugElement.query(By.css('app-level-picker-panel'));
    panel.componentInstance.addExisting();
    fixture.detectChanges();

    expect(levelNames(fixture)).toEqual([
      'Stadt Essen',
      'Stadtbezirke Essen',
      'Stadtteile Essen',
      'Stadtviertel Essen',
      'Baublöcke Essen',
      'Sozialräume Essen',
    ]);
    expect(hierarchy.openGap()).toBeNull();
    // The page reports the insertion, not the panel.
    expect(show).toHaveBeenCalledTimes(1);
    expect(show.mock.calls[0][0]).toContain('INSERTED');
  });

  it('registers a level the picker registered and inserts it at the gap', () => {
    fixture.detectChanges();

    const hierarchy = store.hierarchies()[0];
    fixture.debugElement.queryAll(By.css('.tree-insert'))[0].nativeElement.click();
    fixture.detectChanges();

    const panel = fixture.debugElement.query(By.css('app-level-picker-panel'));
    panel.componentInstance.picked.emit({
      name: 'Wahlkreise Essen',
      registration: { name: 'Wahlkreise Essen', datasource: 'Amt für Statistik' },
    });
    fixture.detectChanges();

    expect(hierarchy.chain()[0].name).toBe('Wahlkreise Essen');
    // Under the hierarchy's tenant, so the level is on offer wherever it belongs.
    expect(store.levelRegistry().at(-1)).toEqual({
      id: expect.any(String),
      name: 'Wahlkreise Essen',
      datasource: 'Amt für Statistik',
      mandant: hierarchy.mandant(),
    });
  });

  it('opens the picker panel in place of the clicked gap', () => {
    fixture.detectChanges();

    const gapsBefore = fixture.debugElement.queryAll(By.css('.tree-insert')).length;
    fixture.debugElement.queryAll(By.css('.tree-insert'))[0].nativeElement.click();
    fixture.detectChanges();

    expect(store.hierarchies()[0].openGap()).toEqual({ parent: null, index: 0 });
    expect(fixture.debugElement.query(By.css('app-level-picker-panel'))).not.toBeNull();
    // The clicked line is gone, every other gap is still a line.
    expect(fixture.debugElement.queryAll(By.css('.tree-insert')).length).toBe(gapsBefore - 1);
  });

  it('closes the panel again when it reports done', () => {
    fixture.detectChanges();
    fixture.debugElement.queryAll(By.css('.tree-insert'))[0].nativeElement.click();
    fixture.detectChanges();

    fixture.debugElement.query(By.css('app-level-picker-panel')).componentInstance.done.emit();
    fixture.detectChanges();

    expect(store.hierarchies()[0].openGap()).toBeNull();
    expect(fixture.debugElement.query(By.css('app-level-picker-panel'))).toBeNull();
  });

  it('shows the unassigned section below the hierarchies, but not in the overview', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('app-unassigned-levels-panel'))).not.toBeNull();

    store.selectMandant('');
    fixture.detectChanges();

    // Across all tenants the page shows the tenant table instead of any list.
    expect(fixture.debugElement.query(By.css('app-unassigned-levels-panel'))).toBeNull();
  });

  it('hides the section for a tenant that has nothing unassigned', () => {
    store.levelRegistry.set([]);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('app-unassigned-levels-panel'))).toBeNull();
  });

  it('appends an assigned level to the end of the chosen chain', () => {
    const show = jest.spyOn(notificationService, 'show');
    fixture.detectChanges();
    const hierarchy = store.hierarchies()[0];
    const level = store.unassignedLevels()[0];

    panel().assign.emit({ level, hierarchy });
    fixture.detectChanges();

    expect(hierarchy.chain().at(-1)?.name).toBe(level.name);
    expect(levelNames(fixture).at(-1)).toBe(level.name);
    // And it is gone from the section, because a chain carries it now.
    expect(store.unassignedLevels().map((entry) => entry.name)).not.toContain(level.name);
    expect(show).toHaveBeenCalled();
  });

  it('takes a registered level into the registry of the tenant on screen', async () => {
    fixture.detectChanges();
    stubModal(Promise.resolve({ name: 'Wahlkreise Essen', datasource: 'Amt für Statistik' }));

    panel().register.emit();
    await settle();
    fixture.detectChanges();

    expect(store.levelRegistry().at(-1)).toEqual({
      id: expect.any(String),
      name: 'Wahlkreise Essen',
      datasource: 'Amt für Statistik',
      mandant: 'Stadt Essen',
    });
    expect(store.unassignedLevels().map((entry) => entry.name)).toContain('Wahlkreise Essen');
  });

  it('deletes a level once the confirmation agrees', async () => {
    fixture.detectChanges();
    const level = store.unassignedLevels()[0];
    stubModal(Promise.resolve(true));

    panel().remove.emit(level);
    await settle();
    fixture.detectChanges();

    expect(store.levelRegistry()).not.toContain(level);
  });

  it('keeps the level when the confirmation is dismissed', async () => {
    fixture.detectChanges();
    const level = store.unassignedLevels()[0];
    stubModal(Promise.resolve(false));

    panel().remove.emit(level);
    await settle();
    fixture.detectChanges();

    expect(store.levelRegistry()).toContain(level);
  });

  // The metadata button is scaffold until the page reads real spatial units; it
  // reports the click and says as much. Both places that offer it lead here.
  it('reports the metadata button of a level in the chain', () => {
    const show = jest.spyOn(notificationService, 'show');
    fixture.detectChanges();

    const rowButton = fixture.debugElement.query(By.css('.tree-row .btn-warning'));
    rowButton.nativeElement.click();

    expect(show).toHaveBeenCalledTimes(1);
    expect(show.mock.calls[0][0]).toContain('ACTION_CLICKED');
  });

  it('reports the metadata button of an unassigned level', () => {
    const show = jest.spyOn(notificationService, 'show');
    fixture.detectChanges();

    panel().metadata.emit(store.unassignedLevels()[0]);

    expect(show).toHaveBeenCalledTimes(1);
    expect(show.mock.calls[0][0]).toContain('ACTION_CLICKED');
  });

  it('appends the hierarchy the create dialog returns', async () => {
    const show = jest.spyOn(notificationService, 'show');
    fixture.detectChanges();

    const inputs = stubModal(
      Promise.resolve({
        name: 'Schulplanung',
        description: 'Ebenen der Schulplanung.',
        mandant: 'Stadt Essen',
        levels: ['Stadt Essen', 'Schulregionen Essen'],
      })
    );
    fixture.debugElement.query(By.css('.view-controls .btn-success')).nativeElement.click();
    await settle();
    fixture.detectChanges();

    expect(inputs['mode']).toBe('create');
    expect(inputs['existingNames']).toEqual(['Verwaltungsgliederung']);
    // Every level of the seeded hierarchy is in use exactly once.
    expect(inputs['levelUsage']).toMatchObject({ 'Stadt Essen': 1, 'Baublöcke Essen': 1 });
    expect(sectionTitles()).toEqual(['Verwaltungsgliederung', 'Schulplanung']);
    expect(descriptions()).toEqual([
      'Amtliche Gliederung der Stadt Essen von der Gesamtstadt bis hinunter zum Baublock.',
      'Ebenen der Schulplanung.',
    ]);
    // The new hierarchy carries exactly the chain the dialog assembled.
    expect(levelNames(fixture)).toEqual([
      'Stadt Essen',
      'Stadtbezirke Essen',
      'Stadtteile Essen',
      'Stadtviertel Essen',
      'Baublöcke Essen',
      'Stadt Essen',
      'Schulregionen Essen',
    ]);
    expect(show).toHaveBeenCalledTimes(1);
    // No translations are loaded in the test, so the pipe echoes the key back.
    expect(show.mock.calls[0][0]).toContain('CREATED');
  });

  it('adds nothing when the create dialog is dismissed', async () => {
    const show = jest.spyOn(notificationService, 'show');
    fixture.detectChanges();

    stubModal(Promise.reject('cancel'));
    fixture.debugElement.query(By.css('.view-controls .btn-success')).nativeElement.click();
    await settle();
    fixture.detectChanges();

    expect(sectionTitles()).toEqual(['Verwaltungsgliederung']);
    expect(show).not.toHaveBeenCalled();
  });

  it('renders the description of a hierarchy above its chain', () => {
    fixture.detectChanges();

    expect(descriptions()).toEqual([
      'Amtliche Gliederung der Stadt Essen von der Gesamtstadt bis hinunter zum Baublock.',
    ]);
  });

  it('edits name and description without touching the chain', async () => {
    const show = jest.spyOn(notificationService, 'show');
    fixture.detectChanges();

    const actions = fixture.debugElement.queryAll(
      By.css('.hierarchy-section .section-actions button')
    );
    expect(actions.length).toBe(2);

    const inputs = stubModal(
      Promise.resolve({
        name: 'Verwaltung',
        description: 'Neue Beschreibung.',
        mandant: 'Stadt Essen',
      })
    );
    actions[0].nativeElement.click();
    await settle();
    fixture.detectChanges();

    expect(inputs['mode']).toBe('edit');
    expect(inputs['currentName']).toBe('Verwaltungsgliederung');
    expect(inputs['currentDescription']).toContain('Amtliche Gliederung');
    expect(inputs['currentMandant']).toBe('Stadt Essen');
    expect(sectionTitles()).toEqual(['Verwaltung']);
    expect(descriptions()).toEqual(['Neue Beschreibung.']);
    expect(levelNames(fixture)).toHaveLength(5);
    expect(show.mock.calls[0][0]).toContain('UPDATED');
  });

  it('deletes a hierarchy once the confirmation agrees', async () => {
    const show = jest.spyOn(notificationService, 'show');
    fixture.detectChanges();

    stubModal(Promise.resolve(true));
    fixture.debugElement
      .queryAll(By.css('.hierarchy-section .section-actions button'))[1]
      .nativeElement.click();
    await settle();
    fixture.detectChanges();

    expect(sectionTitles()).toEqual([]);
    expect(show.mock.calls[0][0]).toContain('DELETED');
  });

  it('keeps the hierarchy when the confirmation is dismissed', async () => {
    fixture.detectChanges();

    stubModal(Promise.reject('cancel'));
    fixture.debugElement
      .queryAll(By.css('.hierarchy-section .section-actions button'))[1]
      .nativeElement.click();
    await settle();
    fixture.detectChanges();

    expect(sectionTitles()).toEqual(['Verwaltungsgliederung']);
  });
  describe('tenant panel', () => {
    beforeEach(() => {
      store.hierarchies.set(createDemoHierarchies());
    });

    /** The tenant entries of the open dropdown menu, label plus count. */
    function menuEntries(): string[] {
      return fixture.debugElement
        .queryAll(By.css('app-mandant-panel .mandant-item'))
        .map((el) => el.nativeElement.textContent.replace(/\s+/g, ' ').trim());
    }

    /** The overview table as text: tenant, hierarchies, levels, shared levels. */
    function overviewRows(): string[][] {
      const text = (el: DebugElement) => el.nativeElement.textContent.replace(/\s+/g, ' ').trim();
      return fixture.debugElement
        .queryAll(By.css('app-mandant-overview-table tbody tr'))
        .map((row) => [
          text(row.query(By.css('.mandant-name'))),
          ...row.queryAll(By.css('.number-cell')).map(text),
          text(row.query(By.css('.shared-cell'))),
        ]);
    }

    /** The open button of the overview row at `rowIndex`. */
    function openButton(rowIndex: number): HTMLButtonElement {
      return fixture.debugElement.queryAll(
        By.css('app-mandant-overview-table .action-cell button')
      )[rowIndex].nativeElement;
    }

    function openMenu(): void {
      fixture.debugElement.query(By.css('app-mandant-panel .mandant-field')).nativeElement.click();
      fixture.detectChanges();
    }

    it('starts in the overview, which summarizes the tenants instead of listing hierarchies', () => {
      store.selectedMandant.set('');
      fixture.detectChanges();

      expect(sectionTitles()).toEqual([]);
      // Translations are not loaded here, so the pipe echoes the key; a tenant
      // without shared levels shows a dash plus its screen reader wording.
      const key = 'ADMIN_SPATIAL_UNIT_HIERARCHIES.MANDANT_OVERVIEW.';
      expect(overviewRows()).toEqual([
        ['Stadt Essen', '2', '7', `${key}SHARED`],
        ['Stadt Bochum', '1', '3', `– ${key}SHARED_NONE`],
        ['Kreis Recklinghausen', '2', '6', `${key}SHARED_ONE`],
        ['Stadt Krefeld', '1', '3', `– ${key}SHARED_NONE`],
      ]);
    });

    it('opens a tenant from its overview row', () => {
      store.selectMandant('');
      fixture.detectChanges();

      openButton(1).click();
      fixture.detectChanges();

      expect(store.selectedMandant()).toBe('Stadt Bochum');
      expect(fixture.debugElement.query(By.css('app-mandant-overview-table'))).toBeNull();
      expect(sectionTitles()).toEqual(['Verwaltungsgliederung Bochum']);
    });

    it('offers the overview and one entry per tenant, each with its badge', () => {
      fixture.detectChanges();
      openMenu();

      expect(menuEntries()[0]).toContain('MANDANT_PANEL.ALL');
      expect(menuEntries()).toHaveLength(5);
      expect(
        fixture.debugElement
          .queryAll(By.css('app-mandant-panel .mandant-item .mandant-badge'))
          .map((el) => el.nativeElement.textContent.trim())
      ).toEqual(['\u2022', 'ES', 'BO', 'RE', 'KR']);
    });

    it('filters the list down to the tenant picked in the dropdown', () => {
      store.selectedMandant.set('');
      fixture.detectChanges();
      openMenu();

      // Third entry: the overview, then Essen, then Bochum.
      fixture.debugElement
        .queryAll(By.css('app-mandant-panel .mandant-item'))[2]
        .nativeElement.click();
      fixture.detectChanges();

      expect(store.selectedMandant()).toBe('Stadt Bochum');
      expect(sectionTitles()).toEqual(['Verwaltungsgliederung Bochum']);
    });

    it('lists the hierarchies again as soon as a tenant is picked', () => {
      store.selectedMandant.set('');
      fixture.detectChanges();

      expect(sectionTitles()).toEqual([]);

      store.selectedMandant.set('Kreis Recklinghausen');
      fixture.detectChanges();

      expect(sectionTitles()).toEqual([
        'Kreisgliederung Recklinghausen',
        'Rastergliederung Recklinghausen',
      ]);
    });

    it('states how many hierarchies the list shows', () => {
      fixture.detectChanges();

      const summary = () =>
        fixture.debugElement
          .query(By.css('app-mandant-panel .mandant-summary'))
          .nativeElement.textContent.trim();

      // Translations are not loaded here, so the pipe echoes key and params.
      store.selectedMandant.set('');
      fixture.detectChanges();
      expect(summary()).toContain('MANDANT_PANEL.COUNT_ALL');

      store.selectedMandant.set('Stadt Krefeld');
      fixture.detectChanges();

      expect(summary()).toContain('MANDANT_PANEL.COUNT_ONE');
    });

    it("leaves the tenant out of the section meta — the list is one tenant's", () => {
      store.selectedMandant.set('Stadt Bochum');
      fixture.detectChanges();

      const meta = fixture.debugElement.query(By.css('.hierarchy-section .section-meta'));

      expect(meta.nativeElement.textContent).toContain('LEVEL_COUNT');
      expect(meta.nativeElement.textContent).not.toContain('Stadt Bochum');
    });

    it('offers the tenants of the data in the dialog where Keycloak names none', async () => {
      fixture.detectChanges();

      const inputs = stubModal(Promise.reject('cancel'));
      fixture.debugElement.query(By.css('.view-controls .btn-success')).nativeElement.click();
      await settle();

      expect(inputs['knownMandants']).toEqual([
        'Stadt Essen',
        'Stadt Bochum',
        'Kreis Recklinghausen',
        'Stadt Krefeld',
      ]);
    });

    it('explains an empty list instead of rendering nothing', () => {
      // The tenant a user works in can well be one whose hierarchies are all gone.
      store.hierarchies.update((entries) =>
        entries.filter((entry) => entry.mandant() !== 'Stadt Bochum')
      );
      store.selectedMandant.set('Stadt Bochum');
      fixture.detectChanges();

      expect(sectionTitles()).toEqual([]);
      expect(fixture.debugElement.query(By.css('.hierarchies-empty'))).not.toBeNull();
    });

    it('prefills the create dialog with the tenant on screen', async () => {
      store.selectedMandant.set('Stadt Krefeld');
      fixture.detectChanges();

      const inputs = stubModal(Promise.reject('cancel'));
      fixture.debugElement.query(By.css('.view-controls .btn-success')).nativeElement.click();
      await settle();

      expect(inputs['currentMandant']).toBe('Stadt Krefeld');
    });

    it('follows a new hierarchy into the tenant the dialog gave it', async () => {
      store.selectedMandant.set('Stadt Krefeld');
      fixture.detectChanges();

      stubModal(
        Promise.resolve({
          name: 'Schulplanung Bochum',
          description: '',
          mandant: 'Stadt Bochum',
          levels: ['Stadt Bochum'],
        })
      );
      fixture.debugElement.query(By.css('.view-controls .btn-success')).nativeElement.click();
      await settle();
      fixture.detectChanges();

      expect(store.selectedMandant()).toBe('Stadt Bochum');
      expect(sectionTitles()).toEqual(['Verwaltungsgliederung Bochum', 'Schulplanung Bochum']);
    });
  });
});
