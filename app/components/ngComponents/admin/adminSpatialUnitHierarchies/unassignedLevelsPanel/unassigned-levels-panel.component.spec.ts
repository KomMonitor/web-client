import { NO_ERRORS_SCHEMA, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { DemoChainEntry, DemoHierarchy, RegisteredLevel, nest } from '../hierarchy-demo.model';
import {
  LevelAssignment,
  UnassignedLevelsPanelComponent,
} from './unassigned-levels-panel.component';

function hierarchy(id: string, name: string): DemoHierarchy {
  const chain = signal<readonly DemoChainEntry[]>([{ id: `${id}-0`, name: 'Stadt Essen' }]);
  return {
    id,
    name: signal(name),
    description: signal(''),
    mandant: signal('Stadt Essen'),
    chain,
    levels: computed(() => nest(chain())),
    levelCount: computed(() => chain().length),
    open: signal(true),
    expandedIds: signal<ReadonlySet<string>>(new Set()),
    openGap: signal(null),
  };
}

function level(name: string, datasource = 'Amt für Statistik'): RegisteredLevel {
  return { id: `id-${name}`, name, datasource, mandant: 'Stadt Essen' };
}

describe('UnassignedLevelsPanelComponent', () => {
  let fixture: ComponentFixture<UnassignedLevelsPanelComponent>;
  let component: UnassignedLevelsPanelComponent;
  let assigned: LevelAssignment[];
  let removed: RegisteredLevel[];
  let registered: number;

  const LEVELS = [level('Wahlbezirke Essen'), level('Postleitzahlgebiete Essen', '')];
  const HIERARCHIES = [hierarchy('h-1', 'Verwaltungsgliederung'), hierarchy('h-2', 'Schulbezirke')];

  function render(
    levels: readonly RegisteredLevel[] = LEVELS,
    hierarchies: readonly DemoHierarchy[] = HIERARCHIES
  ): void {
    fixture.componentRef.setInput('levels', levels);
    fixture.componentRef.setInput('hierarchies', hierarchies);
    fixture.detectChanges();
  }

  function rows() {
    return fixture.debugElement.queryAll(By.css('.unassigned-row'));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UnassignedLevelsPanelComponent, TranslateModule.forRoot()],
      providers: [provideNoopAnimations()],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(UnassignedLevelsPanelComponent);
    component = fixture.componentInstance;
    assigned = [];
    removed = [];
    registered = 0;
    component.assign.subscribe((event) => assigned.push(event));
    component.remove.subscribe((event) => removed.push(event));
    component.register.subscribe(() => (registered += 1));
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

  it('reports the level to delete', () => {
    render();

    rows()[1].query(By.css('.btn-outline-danger')).nativeElement.click();

    expect(removed).toEqual([LEVELS[1]]);
  });

  it('reports the request to register a level', () => {
    render();

    fixture.debugElement.query(By.css('.section-actions button')).nativeElement.click();

    expect(registered).toBe(1);
  });
});
