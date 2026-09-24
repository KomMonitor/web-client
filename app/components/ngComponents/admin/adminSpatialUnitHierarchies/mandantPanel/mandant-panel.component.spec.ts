import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

import { MandantPanelComponent, mandantInitials } from './mandant-panel.component';

describe('MandantPanelComponent', () => {
  let fixture: ComponentFixture<MandantPanelComponent>;
  let component: MandantPanelComponent;

  const mandants = [
    { name: 'Stadt Essen', hierarchyCount: 4 },
    { name: 'Kreis Recklinghausen', hierarchyCount: 1 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MandantPanelComponent, TranslateModule.forRoot()],
    });
    fixture = TestBed.createComponent(MandantPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mandants', mandants);
    fixture.componentRef.setInput('canSwitch', true);
    fixture.componentRef.setInput('hierarchyCount', 5);
  });

  /** The summary next to the picker, whitespace collapsed. */
  function summary(): string {
    return fixture.debugElement
      .query(By.css('.mandant-summary'))
      .nativeElement.textContent.replace(/\s+/g, ' ')
      .trim();
  }

  /** Texts of the dropdown entries, whitespace collapsed. */
  function items(): string[] {
    return fixture.debugElement
      .queryAll(By.css('.mandant-item'))
      .map((el) => el.nativeElement.textContent.replace(/\s+/g, ' ').trim());
  }

  describe('mandantInitials', () => {
    it('takes the two letters of the name, not of the legal form', () => {
      expect(mandantInitials('Stadt Essen')).toBe('ES');
      expect(mandantInitials('Kreis Recklinghausen')).toBe('RE');
      expect(mandantInitials('Stadt Krefeld')).toBe('KR');
    });

    it('copes with a single word and with stray whitespace', () => {
      expect(mandantInitials('Bochum')).toBe('BO');
      expect(mandantInitials('  Stadt   Essen ')).toBe('ES');
      expect(mandantInitials('')).toBe('');
    });
  });

  it('shows the overview while no tenant is chosen', () => {
    fixture.detectChanges();

    const field = fixture.debugElement.query(By.css('.mandant-field')).nativeElement;
    expect(field.textContent).toContain('MANDANT_PANEL.ALL');
  });

  it('counts the hierarchies of the chosen tenant, the overview across all', () => {
    fixture.detectChanges();
    // No tenant chosen: the summary spans every tenant the panel lists.
    expect(summary()).toContain('MANDANT_PANEL.COUNT_ALL');

    fixture.componentRef.setInput('selected', 'Stadt Essen');
    fixture.detectChanges();

    expect(summary()).toContain('MANDANT_PANEL.COUNT');
    expect(summary()).not.toContain('COUNT_ALL');
  });

  it('puts a single hierarchy in the singular', () => {
    fixture.componentRef.setInput('selected', 'Stadt Essen');
    fixture.componentRef.setInput('hierarchyCount', 1);
    fixture.detectChanges();

    expect(summary()).toContain('MANDANT_PANEL.COUNT_ONE');
  });

  it('shows the chosen tenant with its badge', () => {
    fixture.componentRef.setInput('selected', 'Kreis Recklinghausen');
    fixture.detectChanges();

    const field = fixture.debugElement.query(By.css('.mandant-field')).nativeElement;
    expect(field.textContent).toContain('Kreis Recklinghausen');
    expect(field.querySelector('.mandant-badge').textContent.trim()).toBe('RE');
  });

  it('lists the overview and every tenant with its count, singular included', () => {
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.mandant-field')).nativeElement.click();
    fixture.detectChanges();

    expect(items()[0]).toContain('MANDANT_PANEL.MANDANT_COUNT');
    expect(items()[1]).toContain('Stadt Essen');
    expect(items()[1]).toContain('MANDANT_PANEL.HIERARCHY_COUNT');
    expect(items()[2]).toContain('MANDANT_PANEL.HIERARCHY_COUNT_ONE');
  });

  it('writes the clicked tenant into the bound signal', () => {
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.mandant-field')).nativeElement.click();
    fixture.detectChanges();

    fixture.debugElement.queryAll(By.css('.mandant-item'))[1].nativeElement.click();

    expect(component.selected()).toBe('Stadt Essen');
  });

  it('marks the entry that is on screen', () => {
    fixture.componentRef.setInput('selected', 'Stadt Essen');
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.mandant-field')).nativeElement.click();
    fixture.detectChanges();

    const selected = fixture.debugElement.queryAll(By.css('.mandant-item.is-selected'));
    expect(selected).toHaveLength(1);
    expect(selected[0].nativeElement.textContent).toContain('Stadt Essen');
  });

  it('states the single tenant instead of offering a choice of one', () => {
    fixture.componentRef.setInput('mandants', [mandants[0]]);
    fixture.componentRef.setInput('canSwitch', false);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.mandant-field.static'))).not.toBeNull();
    expect(fixture.debugElement.queryAll(By.css('.mandant-item'))).toHaveLength(0);
    expect(
      fixture.debugElement.query(By.css('.mandant-field')).nativeElement.textContent
    ).toContain('Stadt Essen');
  });

  it('says so when no tenant is known at all', () => {
    fixture.componentRef.setInput('mandants', []);
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('.mandant-field')).nativeElement.textContent
    ).toContain('MANDANT_PANEL.NONE');
  });
});
