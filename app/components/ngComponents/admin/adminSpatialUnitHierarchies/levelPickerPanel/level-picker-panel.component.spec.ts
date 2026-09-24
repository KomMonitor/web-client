import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { hierarchyFixture, levelFixture } from '../hierarchy.fixture';
import { HierarchyChainEntry, RegisteredLevel, SpatialUnitHierarchy } from '../hierarchy.model';
import { LevelPickerPanelComponent } from './level-picker-panel.component';

/**
 * The levels the page hands in. A local fixture: the panel offers what it is
 * given, which levels the instance holds is none of its business.
 */
const NAMES = [
  'Stadt Essen',
  'Stadtbezirke Essen',
  'Stadtteile Essen',
  'Sozialräume Essen',
  'Quartiere Essen',
];
const LEVELS: RegisteredLevel[] = NAMES.map((name) => levelFixture(name, 'Stadt Essen'));

function hierarchy(names: string[]): SpatialUnitHierarchy {
  return hierarchyFixture('Testhierarchie', 'Stadt Essen', names);
}

describe('LevelPickerPanelComponent', () => {
  let fixture: ComponentFixture<LevelPickerPanelComponent>;
  let component: LevelPickerPanelComponent;
  let chain: SpatialUnitHierarchy;
  let done: number;
  let picked: HierarchyChainEntry[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LevelPickerPanelComponent, TranslateModule.forRoot()],
      providers: [provideNoopAnimations()],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(LevelPickerPanelComponent);
    component = fixture.componentInstance;

    chain = hierarchy([NAMES[0]]);
    done = 0;
    picked = [];
    fixture.componentRef.setInput('hierarchy', chain);
    fixture.componentRef.setInput('registryLevels', LEVELS);
    component.done.subscribe(() => (done += 1));
    component.picked.subscribe((pick) => picked.push(pick));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('offers only the levels not yet in the chain, by id', () => {
    const options = fixture.debugElement
      .queryAll(By.css('option'))
      .map((el) => el.nativeElement.value);

    expect(options).not.toContain(LEVELS[0].id);
    expect(options).toEqual(LEVELS.slice(1).map((level) => level.id));
  });

  it('picks the preselected level and closes', () => {
    const before = chain.chain();

    fixture.debugElement.query(By.css('.btn-primary')).nativeElement.click();

    expect(picked).toEqual([{ id: LEVELS[1].id, name: LEVELS[1].name }]);
    expect(done).toBe(1);
    // Inserting is the page's job; the panel leaves the chain alone.
    expect(chain.chain()).toBe(before);
  });

  it('picks the level the user selected', () => {
    const select: HTMLSelectElement = fixture.debugElement.query(By.css('select')).nativeElement;
    select.value = LEVELS[3].id;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.btn-primary')).nativeElement.click();

    expect(picked).toEqual([{ id: LEVELS[3].id, name: LEVELS[3].name }]);
  });

  it('closes without a pick on cancel', () => {
    fixture.debugElement.query(By.css('.picker-cancel')).nativeElement.click();

    expect(picked).toEqual([]);
    expect(done).toBe(1);
  });

  it('says so when the chain already holds every level of the tenant', () => {
    fixture.componentRef.setInput('hierarchy', hierarchy([...NAMES]));
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('select'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.btn-primary'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.picker-empty'))).not.toBeNull();
  });
});
