import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { createHierarchy } from '../hierarchy-demo.data';
import { SpatialUnitHierarchy } from '../hierarchy.model';
import { LevelPick, LevelPickerPanelComponent } from './level-picker-panel.component';

/**
 * The registry the page hands in. A local fixture: the panel offers what it is
 * given, which demo levels exist is none of its business.
 */
const LEVELS = [
  'Stadt Essen',
  'Stadtbezirke Essen',
  'Stadtteile Essen',
  'Sozialräume Essen',
  'Quartiere Essen',
];

function hierarchy(names: string[]): SpatialUnitHierarchy {
  return createHierarchy({ id: 'h', name: 'Testhierarchie', levels: names, open: true });
}

describe('LevelPickerPanelComponent', () => {
  let fixture: ComponentFixture<LevelPickerPanelComponent>;
  let component: LevelPickerPanelComponent;
  let modalService: NgbModal;
  let demo: SpatialUnitHierarchy;
  let done: number;
  let picked: LevelPick[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LevelPickerPanelComponent, TranslateModule.forRoot()],
      providers: [provideNoopAnimations()],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(LevelPickerPanelComponent);
    component = fixture.componentInstance;
    modalService = TestBed.inject(NgbModal);

    demo = hierarchy([LEVELS[0]]);
    done = 0;
    picked = [];
    fixture.componentRef.setInput('hierarchy', demo);
    fixture.componentRef.setInput('registryNames', LEVELS);
    component.done.subscribe(() => (done += 1));
    component.picked.subscribe((pick) => picked.push(pick));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('offers only the levels not yet in the chain', () => {
    const options = fixture.debugElement
      .queryAll(By.css('option'))
      .map((el) => el.nativeElement.value);

    expect(options).not.toContain(LEVELS[0]);
    expect(options).toEqual(LEVELS.slice(1));
  });

  it('picks the preselected level and closes', () => {
    const before = demo.chain();

    fixture.debugElement.query(By.css('.btn-primary')).nativeElement.click();

    expect(picked).toEqual([{ name: LEVELS[1] }]);
    expect(done).toBe(1);
    // Inserting is the page's job; the panel leaves the chain alone.
    expect(demo.chain()).toBe(before);
  });

  it('picks the level the user selected', () => {
    const select: HTMLSelectElement = fixture.debugElement.query(By.css('select')).nativeElement;
    select.value = LEVELS[3];
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.btn-primary')).nativeElement.click();

    expect(picked).toEqual([{ name: LEVELS[3] }]);
  });

  it('closes without a pick on cancel', () => {
    fixture.debugElement.query(By.css('.picker-cancel')).nativeElement.click();

    expect(picked).toEqual([]);
    expect(done).toBe(1);
  });

  /**
   * Lets a dialog's result reach the panel. The handlers await it through
   * `AdminModalService`; a macrotask runs that whole promise chain out, where
   * `whenStable` would depend on how many hops it has.
   */
  const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve));

  it('picks the level the register modal resolves with', async () => {
    const componentInstance: Record<string, unknown> = {};
    const open = jest.spyOn(modalService, 'open').mockReturnValue({
      componentInstance,
      result: Promise.resolve({ name: 'Frei erfundene Ebene', datasource: 'Eigene Erhebung' }),
    } as never);

    fixture.debugElement.query(By.css('.btn-outline-primary')).nativeElement.click();
    await settle();

    expect(open).toHaveBeenCalledTimes(1);
    // Checked against the whole registry, not only against this one chain.
    expect(componentInstance['existingNames']).toEqual(LEVELS);
    // The registration travels along: the registry has to take the new level in,
    // otherwise it would exist in this chain only.
    expect(picked).toEqual([
      {
        name: 'Frei erfundene Ebene',
        registration: { name: 'Frei erfundene Ebene', datasource: 'Eigene Erhebung' },
      },
    ]);
    expect(done).toBe(1);
  });

  it('stays open when the register modal is dismissed', async () => {
    jest.spyOn(modalService, 'open').mockReturnValue({
      componentInstance: {},
      result: Promise.reject(new Error('cancel')),
    } as never);

    fixture.debugElement.query(By.css('.btn-outline-primary')).nativeElement.click();
    await settle();

    expect(picked).toEqual([]);
    expect(done).toBe(0);
  });

  it('falls back to registering when the chain holds every registered level', () => {
    fixture.componentRef.setInput('hierarchy', hierarchy([...LEVELS]));
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('select'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.btn-primary'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.btn-outline-primary'))).not.toBeNull();
  });
});
