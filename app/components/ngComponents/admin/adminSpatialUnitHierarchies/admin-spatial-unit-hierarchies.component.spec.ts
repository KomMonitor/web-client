import { NO_ERRORS_SCHEMA } from '@angular/core';
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
    notificationService = TestBed.inject(NotificationService);
    modalService = TestBed.inject(NgbModal);

    // The seed data spans several tenants for the tenant panel; every test
    // about a single chain works on the first hierarchy alone. The panel's own
    // tests put the full seed back.
    component.hierarchies.update((entries) => entries.slice(0, 1));
  });

  /** Stands in for the dialog: it resolves with `result` and records its inputs. */
  function stubModal(result: Promise<unknown>): Record<string, unknown> {
    const componentInstance: Record<string, unknown> = {};
    jest.spyOn(modalService, 'open').mockReturnValue({ componentInstance, result } as never);
    return componentInstance;
  }

  /** The descriptions rendered inside the hierarchy sections. */
  function descriptions(): string[] {
    return fixture.debugElement
      .queryAll(By.css('.hierarchy-description'))
      .map((el) => el.nativeElement.textContent.trim());
  }

  /** The titles of the rendered hierarchy sections. */
  function sectionTitles(): string[] {
    return fixture.debugElement
      .queryAll(By.css('app-collapsible-section .section-title'))
      .map((el) => el.nativeElement.textContent.trim());
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders one collapsible section per demo hierarchy', () => {
    fixture.detectChanges();

    const titles = fixture.debugElement
      .queryAll(By.css('app-collapsible-section .section-title'))
      .map((el) => el.nativeElement.textContent.trim());

    expect(titles).toEqual(['Verwaltungsgliederung']);
  });

  it('starts with the hierarchy expanded', () => {
    fixture.detectChanges();

    const expanded = fixture.debugElement
      .queryAll(By.css('app-collapsible-section .section-toggle'))
      .map((el) => el.nativeElement.getAttribute('aria-expanded'));

    expect(expanded).toEqual(['true']);
  });

  it('writes the toggled state back into the hierarchy signal', () => {
    fixture.detectChanges();

    fixture.debugElement
      .queryAll(By.css('app-collapsible-section .section-toggle'))[0]
      .nativeElement.click();
    fixture.detectChanges();

    expect(component.hierarchies()[0].open()).toBe(false);
  });

  it('only shows the id chips once the toggle is on', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.section-id')).length).toBe(0);

    component.showIds.set(true);
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.section-id')).length).toBe(1);
  });

  it('renders the full level chain of the hierarchy', () => {
    fixture.detectChanges();

    const names = fixture.debugElement
      .queryAll(By.css('.level-name'))
      .map((el) => el.nativeElement.textContent.trim());

    expect(names).toEqual([
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

  it('keeps a level expanded after it was moved', () => {
    fixture.detectChanges();

    const before = [...component.hierarchies()[0].expandedIds()].sort();

    moveButton(fixture, 1, 'down').click();
    fixture.detectChanges();

    // Ids travel with the level, so moving one does not collapse the chain.
    expect([...component.hierarchies()[0].expandedIds()].sort()).toEqual(before);
    expect(fixture.debugElement.queryAll(By.css('.level-name')).length).toBe(5);
  });

  it('shows the nested structure as JSON and keeps it in sync with the chain', () => {
    fixture.detectChanges();

    const json = () =>
      JSON.parse(fixture.debugElement.query(By.css('.json-view pre')).nativeElement.textContent);

    const names = (node: { name: string; children: unknown[] }): string[] => [
      node.name,
      ...(node.children as { name: string; children: unknown[] }[]).flatMap(names),
    ];

    expect(json()).toHaveLength(1);
    expect(names(json()[0])).toEqual([
      'Stadt Essen',
      'Stadtbezirke Essen',
      'Stadtteile Essen',
      'Stadtviertel Essen',
      'Baublöcke Essen',
    ]);

    moveButton(fixture, 1, 'down').click();
    fixture.detectChanges();

    expect(names(json()[0])).toEqual([
      'Stadt Essen',
      'Stadtteile Essen',
      'Stadtbezirke Essen',
      'Stadtviertel Essen',
      'Baublöcke Essen',
    ]);
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

  it('forgets the expansion entry of a removed level', () => {
    fixture.detectChanges();

    const removedId = component.hierarchies()[0].chain()[1].id;
    expect([...component.hierarchies()[0].expandedIds()]).toContain(removedId);

    removeButton(fixture, 1).click();
    fixture.detectChanges();

    expect([...component.hierarchies()[0].expandedIds()]).not.toContain(removedId);
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

  it('opens the picker panel in place of the clicked gap', () => {
    fixture.detectChanges();

    const gapsBefore = fixture.debugElement.queryAll(By.css('.tree-insert')).length;
    fixture.debugElement.queryAll(By.css('.tree-insert'))[0].nativeElement.click();
    fixture.detectChanges();

    expect(component.hierarchies()[0].openGap()).toEqual({ parent: null, index: 0 });
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

    expect(component.hierarchies()[0].openGap()).toBeNull();
    expect(fixture.debugElement.query(By.css('app-level-picker-panel'))).toBeNull();
  });

  it('notifies when a row action inside the tree is clicked', () => {
    const show = jest.spyOn(notificationService, 'show');
    fixture.detectChanges();

    const rowButton = fixture.debugElement.query(By.css('.tree-row .btn-warning'));
    rowButton.nativeElement.click();

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
    await fixture.whenStable();
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
    await fixture.whenStable();
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

    const actions = fixture.debugElement.queryAll(By.css('.section-actions button'));
    expect(actions.length).toBe(2);

    const inputs = stubModal(
      Promise.resolve({
        name: 'Verwaltung',
        description: 'Neue Beschreibung.',
        mandant: 'Stadt Essen',
      })
    );
    actions[0].nativeElement.click();
    await fixture.whenStable();
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
    fixture.debugElement.queryAll(By.css('.section-actions button'))[1].nativeElement.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(sectionTitles()).toEqual([]);
    expect(show.mock.calls[0][0]).toContain('DELETED');
  });

  it('keeps the hierarchy when the confirmation is dismissed', async () => {
    fixture.detectChanges();

    stubModal(Promise.reject('cancel'));
    fixture.debugElement.queryAll(By.css('.section-actions button'))[1].nativeElement.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(sectionTitles()).toEqual(['Verwaltungsgliederung']);
  });
  describe('tenant panel', () => {
    beforeEach(() => {
      component.hierarchies.set(createDemoHierarchies());
    });

    /** The tenant entries of the open dropdown menu, label plus count. */
    function menuEntries(): string[] {
      return fixture.debugElement
        .queryAll(By.css('app-mandant-panel .mandant-item'))
        .map((el) => el.nativeElement.textContent.replace(/\s+/g, ' ').trim());
    }

    function openMenu(): void {
      fixture.debugElement.query(By.css('app-mandant-panel .mandant-field')).nativeElement.click();
      fixture.detectChanges();
    }

    it('lists every tenant of the data with the number of its hierarchies', () => {
      fixture.detectChanges();

      expect(component.mandants()).toEqual([
        { name: 'Stadt Essen', hierarchyCount: 2 },
        { name: 'Stadt Bochum', hierarchyCount: 1 },
        { name: 'Kreis Recklinghausen', hierarchyCount: 2 },
        { name: 'Stadt Krefeld', hierarchyCount: 1 },
      ]);
    });

    it('starts in the overview and shows the hierarchies of every tenant', () => {
      fixture.detectChanges();

      expect(component.selectedMandant()).toBe('');
      expect(sectionTitles()).toHaveLength(6);
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
      fixture.detectChanges();
      openMenu();

      // Third entry: the overview, then Essen, then Bochum.
      fixture.debugElement
        .queryAll(By.css('app-mandant-panel .mandant-item'))[2]
        .nativeElement.click();
      fixture.detectChanges();

      expect(component.selectedMandant()).toBe('Stadt Bochum');
      expect(sectionTitles()).toEqual(['Verwaltungsgliederung Bochum']);
    });

    it('states how many hierarchies the list shows', () => {
      fixture.detectChanges();

      const summary = () =>
        fixture.debugElement
          .query(By.css('app-mandant-panel .mandant-summary'))
          .nativeElement.textContent.trim();

      // Translations are not loaded here, so the pipe echoes key and params.
      expect(summary()).toContain('MANDANT_PANEL.COUNT_ALL');

      component.selectedMandant.set('Stadt Krefeld');
      fixture.detectChanges();

      expect(summary()).toContain('MANDANT_PANEL.COUNT_ONE');
    });

    it('names the owning tenant in the section meta only while showing all of them', () => {
      fixture.detectChanges();

      const metaTexts = () =>
        fixture.debugElement
          .queryAll(By.css('app-collapsible-section .section-meta'))
          .map((el) => el.nativeElement.textContent.trim());

      expect(metaTexts()[2]).toContain('Stadt Bochum');

      component.selectedMandant.set('Stadt Bochum');
      fixture.detectChanges();

      expect(metaTexts()[0]).not.toContain('Stadt Bochum');
    });

    it('explains an empty list instead of rendering nothing', () => {
      // The tenant a user works in can well be one whose hierarchies are all gone.
      component.hierarchies.update((entries) =>
        entries.filter((entry) => entry.mandant() !== 'Stadt Bochum')
      );
      component.selectedMandant.set('Stadt Bochum');
      fixture.detectChanges();

      expect(sectionTitles()).toEqual([]);
      expect(fixture.debugElement.query(By.css('.hierarchies-empty'))).not.toBeNull();
    });

    it('prefills the create dialog with the tenant on screen', async () => {
      component.selectedMandant.set('Stadt Krefeld');
      fixture.detectChanges();

      const inputs = stubModal(Promise.reject('cancel'));
      fixture.debugElement.query(By.css('.view-controls .btn-success')).nativeElement.click();
      await fixture.whenStable();

      expect(inputs['currentMandant']).toBe('Stadt Krefeld');
    });

    it('follows a new hierarchy into the tenant the dialog gave it', async () => {
      component.selectedMandant.set('Stadt Krefeld');
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
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.selectedMandant()).toBe('Stadt Bochum');
      expect(sectionTitles()).toEqual(['Verwaltungsgliederung Bochum', 'Schulplanung Bochum']);
    });
  });
});
