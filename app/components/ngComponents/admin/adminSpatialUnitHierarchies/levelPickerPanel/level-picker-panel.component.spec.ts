import { NO_ERRORS_SCHEMA, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { AVAILABLE_LEVELS } from '../hierarchy-demo.data';
import { DemoChainEntry, DemoHierarchy, nest } from '../hierarchy-demo.model';
import { LevelPickerPanelComponent } from './level-picker-panel.component';

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LevelPickerPanelComponent, TranslateModule.forRoot()],
      providers: [provideNoopAnimations()],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(LevelPickerPanelComponent);
    component = fixture.componentInstance;
    modalService = TestBed.inject(NgbModal);

    demo = hierarchy(['Stadt Essen', AVAILABLE_LEVELS[0]]);
    done = 0;
    fixture.componentRef.setInput('hierarchy', demo);
    fixture.componentRef.setInput('gap', { parent: null, index: 0 });
    component.done.subscribe(() => (done += 1));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('offers only the levels not yet in the chain', () => {
    const options = fixture.debugElement
      .queryAll(By.css('option'))
      .map((el) => el.nativeElement.value);

    expect(options).not.toContain(AVAILABLE_LEVELS[0]);
    expect(options).toEqual(AVAILABLE_LEVELS.slice(1));
  });

  it('adds the preselected level at the gap and closes', () => {
    fixture.debugElement.query(By.css('.btn-primary')).nativeElement.click();

    expect(demo.chain().map((entry) => entry.name)).toEqual([
      AVAILABLE_LEVELS[1],
      'Stadt Essen',
      AVAILABLE_LEVELS[0],
    ]);
    expect(done).toBe(1);
  });

  it('adds the level the user picked', () => {
    const select: HTMLSelectElement = fixture.debugElement.query(By.css('select')).nativeElement;
    select.value = AVAILABLE_LEVELS[3];
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.btn-primary')).nativeElement.click();

    expect(demo.chain()[0].name).toBe(AVAILABLE_LEVELS[3]);
  });

  it('closes without a change on cancel', () => {
    const before = demo.chain();

    fixture.debugElement.query(By.css('.picker-cancel')).nativeElement.click();

    expect(demo.chain()).toBe(before);
    expect(done).toBe(1);
  });

  it('inserts the name the register modal resolves with', async () => {
    const open = jest.spyOn(modalService, 'open').mockReturnValue({
      componentInstance: {},
      result: Promise.resolve('Frei erfundene Ebene'),
    } as never);

    fixture.debugElement.query(By.css('.btn-outline-primary')).nativeElement.click();
    await fixture.whenStable();

    expect(open).toHaveBeenCalledTimes(1);
    expect(demo.chain()[0].name).toBe('Frei erfundene Ebene');
    expect(done).toBe(1);
  });

  it('stays open when the register modal is dismissed', async () => {
    jest.spyOn(modalService, 'open').mockReturnValue({
      componentInstance: {},
      result: Promise.reject(new Error('cancel')),
    } as never);
    const before = demo.chain();

    fixture.debugElement.query(By.css('.btn-outline-primary')).nativeElement.click();
    await fixture.whenStable();

    expect(demo.chain()).toBe(before);
    expect(done).toBe(0);
  });

  it('falls back to registering when the pool is exhausted', () => {
    fixture.componentRef.setInput('hierarchy', hierarchy([...AVAILABLE_LEVELS]));
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('select'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.btn-primary'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.btn-outline-primary'))).not.toBeNull();
  });
});
