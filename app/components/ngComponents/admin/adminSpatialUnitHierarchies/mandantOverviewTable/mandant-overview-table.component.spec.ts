import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

import {
  MandantOverviewRow,
  MandantOverviewTableComponent,
} from './mandant-overview-table.component';

describe('MandantOverviewTableComponent', () => {
  let fixture: ComponentFixture<MandantOverviewTableComponent>;
  let component: MandantOverviewTableComponent;

  const rows: MandantOverviewRow[] = [
    { name: 'Stadt Essen', hierarchyCount: 4, levelCount: 11, sharedLevelCount: 2 },
    { name: 'Kreis Recklinghausen', hierarchyCount: 1, levelCount: 4, sharedLevelCount: 1 },
    { name: 'Stadt Krefeld', hierarchyCount: 1, levelCount: 4, sharedLevelCount: 0 },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MandantOverviewTableComponent, TranslateModule.forRoot()],
    });
    fixture = TestBed.createComponent(MandantOverviewTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('rows', rows);
  });

  /** Texts of the cells in the row at `rowIndex`, whitespace collapsed. */
  function cells(rowIndex: number): string[] {
    return fixture.debugElement
      .queryAll(By.css('tbody tr'))
      [rowIndex].queryAll(By.css('th, td'))
      .map((el) => el.nativeElement.textContent.replace(/\s+/g, ' ').trim());
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders one row per tenant, with its initials and its numbers', () => {
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('tbody tr'))).toHaveLength(3);
    expect(cells(0)[0]).toBe('ESStadt Essen');
    expect(cells(0).slice(1, 3)).toEqual(['4', '11']);
    expect(cells(1)[0]).toBe('REKreis Recklinghausen');
  });

  it('counts the shared levels in words, singular and plural apart', () => {
    fixture.detectChanges();

    expect(cells(0)[3]).toContain('MANDANT_OVERVIEW.SHARED');
    expect(cells(1)[3]).toContain('MANDANT_OVERVIEW.SHARED_ONE');
  });

  it('shows a dash instead of a zero where no level is shared', () => {
    fixture.detectChanges();

    // The dash is decorative; the wording behind it is what a screen reader reads.
    expect(cells(2)[3]).toContain('–');
    expect(cells(2)[3]).toContain('MANDANT_OVERVIEW.SHARED_NONE');
  });

  it('emits the tenant of the row whose open button was pressed', () => {
    fixture.detectChanges();

    const opened: string[] = [];
    component.openMandant.subscribe((name) => opened.push(name));

    fixture.debugElement.queryAll(By.css('.action-cell button'))[1].nativeElement.click();

    expect(opened).toEqual(['Kreis Recklinghausen']);
  });

  it('renders no row at all for an empty list', () => {
    fixture.componentRef.setInput('rows', []);
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('tbody tr'))).toHaveLength(0);
  });
});
