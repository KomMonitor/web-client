import { TestBed } from '@angular/core/testing';
import { ICellRendererParams } from 'ag-grid-community';

import { HtmlCellRendererComponent } from './html-cell-renderer.component';
import { HOSTILE_PAYLOAD } from 'testing/ag-grid-cell.testing';

describe('HtmlCellRendererComponent', () => {
  const render = (value: unknown) => {
    const fixture = TestBed.createComponent(HtmlCellRendererComponent);
    fixture.componentInstance.agInit({ value } as ICellRendererParams);
    fixture.detectChanges();
    return fixture;
  };

  it('keeps formatting markup', () => {
    const fixture = render('Sum of <b>all</b><br/>households');

    const html: HTMLElement = fixture.nativeElement;
    expect(html.querySelector('b')!.textContent).toBe('all');
    expect(html.querySelector('br')).not.toBeNull();
  });

  it('strips event handlers and scripts', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const fixture = render(`${HOSTILE_PAYLOAD}<script>window.__xss=1</script>`);

    const html: HTMLElement = fixture.nativeElement;
    expect(html.querySelector('[onerror], script')).toBeNull();
    // Angular reports what its sanitizer removed.
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('sanitizing HTML stripped'));
    warn.mockRestore();
  });

  it('renders nothing for a missing value', () => {
    const fixture = render(undefined);

    expect(fixture.nativeElement.textContent).toBe('');
  });

  it('follows a refreshed value', () => {
    const fixture = render('<b>old</b>');

    expect(fixture.componentInstance.refresh({ value: '<i>new</i>' } as ICellRendererParams)).toBe(
      true
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('i').textContent).toBe('new');
    expect(fixture.nativeElement.querySelector('b')).toBeNull();
  });
});
