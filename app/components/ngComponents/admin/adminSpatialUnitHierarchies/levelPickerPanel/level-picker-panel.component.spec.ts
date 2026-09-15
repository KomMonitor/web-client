import { NO_ERRORS_SCHEMA, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { DemoChainEntry, DemoHierarchy, nest } from '../hierarchy-demo.model';
import { LevelPickerPanelComponent } from './level-picker-panel.component';

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

function hierarchy(names: string[]): DemoHierarchy {
  const chain = signal<readonly DemoChainEntry[]>(
    names.map((name, index) => ({ id: `id-${index}`, name }))
  );
  const levels = computed(() => nest(chain()));
  return {
    id: 'h',
    name: signal('Testhierarchie'),
    description: signal(''),
    mandant: signal(''),
    chain,
    levels,
    levelCount: computed(() => chain().length),
    open: signal(true),
    expandedIds: signal<ReadonlySet<string>>(new Set(chain().map((entry) => entry.id))),
  };
}

describe('LevelPickerPanelComponent', () => {
  let fixture: ComponentFixture<LevelPickerPanelComponent>;
  let component: LevelPickerPanelComponent;
  let modalService: NgbModal;
  let demo: DemoHierarchy;
  let done: number;
  let registered: unknown[];

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
    registered = [];
    fixture.componentRef.setInput('hierarchy', demo);
    fixture.componentRef.setInput('gap', { parent: null, index: 0 });
    fixture.componentRef.setInput('registryNames', LEVELS);
    component.done.subscribe(() => (done += 1));
    component.registered.subscribe((result) => registered.push(result));
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

  it('adds the preselected level at the gap and closes', () => {
    fixture.debugElement.query(By.css('.btn-primary')).nativeElement.click();

    expect(demo.chain().map((entry) => entry.name)).toEqual([LEVELS[1], LEVELS[0]]);
    expect(done).toBe(1);
  });

  it('adds the level the user picked', () => {
    const select: HTMLSelectElement = fixture.debugElement.query(By.css('select')).nativeElement;
    select.value = LEVELS[3];
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.btn-primary')).nativeElement.click();

    expect(demo.chain()[0].name).toBe(LEVELS[3]);
  });

  it('closes without a change on cancel', () => {
    const before = demo.chain();

    fixture.debugElement.query(By.css('.picker-cancel')).nativeElement.click();

    expect(demo.chain()).toBe(before);
    expect(done).toBe(1);
  });

  /**
   * Lets a dialog's result reach the panel. The handlers await it through
   * `AdminModalService`; a macrotask runs that whole promise chain out, where
   * `whenStable` would depend on how many hops it has.
   */
  const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve));

  it('inserts the name the register modal resolves with', async () => {
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
    expect(demo.chain()[0].name).toBe('Frei erfundene Ebene');
    // The page has to learn about it, otherwise the level exists in this chain only.
    expect(registered).toEqual([{ name: 'Frei erfundene Ebene', datasource: 'Eigene Erhebung' }]);
    expect(done).toBe(1);
  });

  it('stays open when the register modal is dismissed', async () => {
    jest.spyOn(modalService, 'open').mockReturnValue({
      componentInstance: {},
      result: Promise.reject(new Error('cancel')),
    } as never);
    const before = demo.chain();

    fixture.debugElement.query(By.css('.btn-outline-primary')).nativeElement.click();
    await settle();

    expect(demo.chain()).toBe(before);
    expect(registered).toEqual([]);
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
