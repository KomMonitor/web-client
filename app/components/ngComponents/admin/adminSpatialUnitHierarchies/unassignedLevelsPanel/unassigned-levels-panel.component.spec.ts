import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { hierarchyFixture } from '../hierarchy.fixture';
import { RegisteredLevel, SpatialUnitHierarchy } from '../hierarchy.model';
import {
  LevelAssignment,
  UnassignedLevelsPanelComponent,
} from './unassigned-levels-panel.component';

function hierarchy(id: string, name: string): SpatialUnitHierarchy {
  const built = hierarchyFixture(name, 'Stadt Essen', ['Stadt Essen']);
  return { ...built, id };
}

function level(name: string, datasource = 'Amt für Statistik', canDelete = true): RegisteredLevel {
  return { id: `id-${name}`, name, datasource, mandant: 'Stadt Essen', canDelete };
}

describe('UnassignedLevelsPanelComponent', () => {
  let fixture: ComponentFixture<UnassignedLevelsPanelComponent>;
  let component: UnassignedLevelsPanelComponent;
  let assigned: LevelAssignment[];

  const LEVELS = [level('Wahlbezirke Essen'), level('Postleitzahlgebiete Essen', '')];
  const HIERARCHIES = [hierarchy('h-1', 'Verwaltungsgliederung'), hierarchy('h-2', 'Schulbezirke')];

  function render(
    levels: readonly RegisteredLevel[] = LEVELS,
    hierarchies: readonly SpatialUnitHierarchy[] = HIERARCHIES
  ): void {
    fixture.componentRef.setInput('levels', levels);
    fixture.componentRef.setInput('hierarchies', hierarchies);
    fixture.detectChanges();
  }

  function rows() {
    return fixture.debugElement.queryAll(By.css('.unassigned-row'));
  }

  /** The delete button of the row at `rowIndex`. */
  function deleteButton(rowIndex: number): HTMLButtonElement {
    return rows()[rowIndex].query(By.css('.btn-outline-danger')).nativeElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UnassignedLevelsPanelComponent, TranslateModule.forRoot()],
      providers: [provideNoopAnimations(), provideRouter([])],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(UnassignedLevelsPanelComponent);
    component = fixture.componentInstance;
    assigned = [];
    component.assign.subscribe((event) => assigned.push(event));
  });

  it('lists one row per level, with its name and data source', () => {
    render();

    expect(rows()).toHaveLength(2);
    expect(rows()[0].query(By.css('.unassigned-name')).nativeElement.textContent.trim()).toBe(
      'Wahlbezirke Essen'
    );
    expect(rows()[0].query(By.css('.unassigned-source')).nativeElement.textContent.trim()).toBe(
      'Amt für Statistik'
    );
    // A level without a source shows none rather than an empty gap.
    expect(rows()[1].query(By.css('.unassigned-source'))).toBeNull();
  });

  it('keeps the ids behind the toggle', () => {
    render();
    expect(fixture.debugElement.query(By.css('.unassigned-id'))).toBeNull();

    fixture.componentRef.setInput('showIds', true);
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.unassigned-id'))).toHaveLength(2);
  });

  it('offers every hierarchy of the tenant as a target', () => {
    render();

    const options = rows()[0]
      .queryAll(By.css('option'))
      .map((el) => el.nativeElement.textContent.trim());

    expect(options).toEqual(['Verwaltungsgliederung', 'Schulbezirke']);
  });

  it('reports the level and the picked hierarchy', () => {
    render();

    const select: HTMLSelectElement = rows()[0].query(By.css('select')).nativeElement;
    select.value = 'h-2';
    rows()[0].query(By.css('.btn-primary')).nativeElement.click();

    expect(assigned).toHaveLength(1);
    expect(assigned[0].level.name).toBe('Wahlbezirke Essen');
    expect(assigned[0].hierarchy.id).toBe('h-2');
  });

  it('assigns to the first hierarchy when the user picks nothing', () => {
    render();

    rows()[0].query(By.css('.btn-primary')).nativeElement.click();

    expect(assigned[0].hierarchy.id).toBe('h-1');
  });

  it('says so instead of offering an assignment when the tenant has no hierarchy', () => {
    render(LEVELS, []);

    expect(fixture.debugElement.query(By.css('select'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.btn-primary'))).toBeNull();
    expect(fixture.debugElement.queryAll(By.css('.unassigned-no-hierarchy'))).toHaveLength(2);
  });

  it('asks for a new level instead of registering one itself', () => {
    const asked: number[] = [];
    component.registerLevel.subscribe(() => asked.push(1));
    render();

    const button = fixture.debugElement.query(By.css('.unassigned-register'));
    expect(button.nativeElement.textContent).toContain('UNASSIGNED.REGISTER');

    button.nativeElement.click();

    // The page owns that wizard: a level exists only with its geometry.
    expect(asked).toHaveLength(1);
  });

  it('reports the level to delete, and deletes nothing itself', () => {
    const deleted: RegisteredLevel[] = [];
    component.deleteLevel.subscribe((level) => deleted.push(level));
    render();

    deleteButton(0).click();

    expect(deleted.map((level) => level.name)).toEqual(['Wahlbezirke Essen']);
  });

  it('rests the delete button on a level the user does not own', () => {
    const deleted: RegisteredLevel[] = [];
    component.deleteLevel.subscribe((level) => deleted.push(level));
    render([level('Wahlbezirke Essen', 'Amt für Statistik', false)]);

    expect(deleteButton(0).disabled).toBe(true);
    expect(deleteButton(0).title).toContain('DELETE_FORBIDDEN');

    deleteButton(0).click();

    expect(deleted).toEqual([]);
  });
});
